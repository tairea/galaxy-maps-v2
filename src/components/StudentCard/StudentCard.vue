<template>
  <div class="student-card" :class="status ? '':'not-active'">
    <StudentCardStatus :student="student" :loggedIn="loggedIn" />
    <template v-if="!status" class="second-block">
      <span class="not-active text-uppercase ma-auto">hasn't signed in yet</span>
    </template>
    <template v-else>
      <StudentCardProgress :activities="activities" :student="student"/>
      <div class="student-activities-overUnder">
        <div class="top-row">
          <StudentActivityTimeline :student="student" studentCard/>
          <!-- <StudentCardActivities :student="student" :activities="activities"/> -->
        </div>
        <div class="d-flex flex-row ">
            <v-col class="pa-0">
              <StudentHours />
            </v-col>
            <v-col class="pa-0 second-block">
              <StudentCompletedTasks />
            </v-col>
        </div>
      </div>
      <div class="student-actions-overUnder">
        <div class="top-row">
            <StudentCohorts :student="student"/>
        </div>
        <div>
          <StudentActions />
        </div>
      </div>    
    </template>
  </div>
</template>

<script>
import StudentCardStatus from "./StudentCardStatus"
import StudentCardProgress from "./StudentCardProgress.vue"
import StudentCardActivities from "./StudentCardActivities"
import StudentHours from "./StudentHours.vue"
import StudentCompletedTasks from "./StudentCompletedTasks.vue"
import StudentCohorts from "./StudentCohorts.vue"
import StudentActions from "./StudentActions.vue"
import StudentActivityTimeline from "../StudentActivityTimeline.vue"


import { getStudentsCoursesXAPIQuery } from "../../lib/veracityLRS";
import { mapState, mapGetters } from "vuex";
import { dbMixins } from "../../mixins/DbMixins";
import { getCourseById } from "../../lib/ff";

export default {
  name: "StudentCard",
  mixins: [dbMixins],
  components: {
    StudentCardStatus,
    StudentCardActivities,
    StudentCardProgress,
    StudentHours,
    StudentCompletedTasks,
    StudentCohorts,
    StudentActions,
    StudentActivityTimeline
  },
  props: ["student"],
  data() {
    return {
      topic: "",
      task: "",
      missions: [],
      hours: "",
      work: [],
      help: [],
      assignedCourse: null,
      studetProfile: [],
      activities: [],
    };
  },
  async mounted() {
    const studentCourses = await getStudentsCoursesXAPIQuery(this.student);
    const cohortActivities = studentCourses.filter(a => this.currentCohort.courses.some(b => b === a.course.id))
    this.activities = cohortActivities.map(course => {
      const currentTopic = course.activities.find(action => action.type === "Topic")
      const currentTask = course.activities.find(action => action.type === 'Task')
      return {
        ...course, 
        currentTopic,
        currentTask
      }
    })
  },
  computed: {
    ...mapState(["currentCohort", "userStatus"]),
    ...mapGetters(["getCourseById"]),
    status() {
      return this.userStatus[this.student.id];
    },
    loggedIn() {
      if (!this.status) return "inactive";
      if (this.status.state === "online") {
        return "online";
      } else return this.timePassed();
    },

    // topic () {
    //   const topic = this.courseActivity.courseData.find(course => course.topic.length)
    //   return {
    //     status:
    //   }
    // }
  },
  methods: {
    async getAssignedCourse() {
      const courseId = this.student.assignedCourses?.find((course) =>
        this.currentCohort.courses.includes(course)
      );
      const course = await getCourseById(courseId);
      this.assignedCourse = course;
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    timePassed() {
      var date = Math.round(Date.now() / 1000);
      var delta = date - this.status.last_changed.seconds;

      // calculate (and subtract) whole days
      var days = Math.floor(delta / 86400);

      // calculate (and subtract) whole hours
      var hours = Math.floor(delta / 3600);

      // calculate (and subtract) whole minutes
      var minutes = Math.floor(delta / 60);

      if (minutes < 1) return `just now`;
      if (minutes < 60) return `${minutes}mins`;
      if (hours < 24) return `${hours}hrs`;
      return `${days}days`;
    },
  },
};
</script>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

a {
  color: var(--v-missionAccent-base) !important;
}

.student-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;
  height: 110px;

  .student-activities-overUnder {
    display: flex;
    flex-direction: column;
    width: 40%;
    border-left: 1px dashed var(--v-missionAccent-base);
  }

  .student-actions-overUnder {
    display: flex;
    flex-direction: column;
    width: 20%;
    border-left: 1px dashed var(--v-missionAccent-base);
  }

  .top-row {
    border-bottom: 1px dashed var(--v-missionAccent-base);
    height: 50%;
  }

  .second-block {
    margin: 0px;
    border-left: 1px dashed var(--v-missionAccent-base);
  }
}

.not-active {
  color: grey;
  border-color: grey !important;
}

</style>
