<template>
  <div class="student-card" :class="status ? '' : 'not-active'">
    <StudentCardStatus :student="student" :date="date" :status="status"/>
    <template v-if="!status" class="second-block">
      <span class="overline not-active text-uppercase ma-auto"
        >hasn't signed in yet</span
      >
    </template>
    <template v-else>
      <StudentCardProgress :activities="activities" :student="student" />
      <div class="student-activities-overUnder">
        <div style="height: 100%">
          <StudentActivityTimeline :student="student" studentCard />
          <!-- <StudentCardActivities :student="student" :activities="activities"/> -->
        </div>
      </div>
      <div class="student-actions-overUnder">
        <div
          class="top-row d-flex flex-column"
          v-if="studentTimeData.length > 0"
        >
          <StudentHours
            :timeData="studentTimeData"
            :timeframe="timeframe"
            @emitUpHours="emitUpHours($event)"
          />
        </div>
        <div
          v-if="activities.length > 0"
          class="pa-0 d-flex flex-column"
          style="height: 50%"
        >
          <StudentCompletedTasks
            :taskData="activities"
            :timeframe="timeframe"
            @emitUpTasks="emitUpTasks($event)"
          />
        </div>
      </div>
      <div class="student-actions-overUnder">
        <div class="top-row">
            <StudentCohorts :size="20" :student="student"/>
        </div>
        <div class="bottom-row">
          <StudentActions :student="student"/>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import StudentCardStatus from "./StudentCardStatus";
import StudentCardProgress from "./StudentCardProgress.vue";
import StudentCardActivities from "./StudentCardActivities";
import StudentHours from "./StudentHours.vue";
import StudentCompletedTasks from "./StudentCompletedTasks.vue";
import StudentCohorts from "./StudentCohorts.vue";
import StudentActions from "./StudentActions.vue";
import StudentActivityTimeline from "../StudentActivityTimeline.vue";

import {
  getStudentsCoursesXAPIQuery,
  getStudentsTimeDataXAPIQuery,
} from "../../lib/veracityLRS";
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
    StudentActivityTimeline,
  },
  props: ["student", "timeframe", "date"],
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
      studentTimeData: [],
      // studentTimeDataLoading: false
    };
  },
  async mounted() {
    const studentCourses = await getStudentsCoursesXAPIQuery(this.student);
    const cohortActivities = studentCourses.filter((a) =>
      this.currentCohort.courses.some((b) => b === a.course.id)
    );
    this.activities = cohortActivities.map((course) => {
      const currentTopic = course.activities.find(
        (action) => action.type === "Topic"
      );
      const currentTask = course.activities.find(
        (action) => action.type === "Task"
      );
      return {
        ...course,
        currentTopic,
        currentTask,
      };
    });
    
    // ==== get student activity data from LRS
    const getActivityData = await getStudentsTimeDataXAPIQuery({
      studentsArr: [this.student.id],
    });
    this.studentTimeData = getActivityData;
  },
  computed: {
    ...mapState(["currentCohort", "userStatus"]),
    ...mapGetters(["getCourseById"]),
    status() {
      return this.userStatus[this.student.id];
    },
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
    emitUpHours(hours) {
      this.$emit("updateStudentsWithHours", {
        person: this.student,
        hours,
      });
    },
    emitUpTasks(tasks) {
      this.$emit("updateStudentsWithTasks", {
        person: this.student,
        tasks,
      });
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
  height: 120px;

  .student-activities-overUnder {
    display: flex;
    flex-direction: column;
    width: 40%;
    border-left: 1px dashed var(--v-missionAccent-base);
  }

  .student-actions-overUnder {
    display: flex;
    flex-direction: column;
    max-width: 20%;
    min-width: 20%;
    border-left: 1px dashed var(--v-missionAccent-base);
  }

  .top-row {
    border-bottom: 1px dashed var(--v-missionAccent-base);
    height: 50%;
  }

  .bottom-row {
    height: 50%
  }

  .second-block {
    margin: 0px;
    border-left: 1px dashed var(--v-missionAccent-base);
  }
}

.not-active {
  color: grey;
  // border-color: grey !important;
}
</style>
