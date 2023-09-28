<template>
  <div class="student-card" :class="status ? '' : 'not-active'">
    <StudentCardStatus
      :student="student"
      :date="date"
      :status="status"
      class="pl-1"
      @click.native="showStudentDetails(student)"
    />
    <template v-if="!status">
      <span class="overline not-active text-uppercase ma-auto">hasn't signed in yet</span>
    </template>
    <template v-else>
      <StudentCardProgress :activities="activities" :student="student" />
      <div class="student-activities-overUnder">
        <div style="height: 100%">
          <StudentActivityTimeline :student="student" studentCard />
          <!-- <StudentCardActivities :student="student" :activities="activities"/> -->
        </div>
      </div>
      <!-- Active Hours & Completed Tasks -->
      <div class="student-actions-overUnder">
        <div class="top-row d-flex flex-column" v-if="studentTimeData.length > 0">
          <StudentHours
            :timeData="studentTimeData"
            :timeframe="timeframe"
            @emitUpHours="emitUpHours($event)"
          />
        </div>
        <div v-if="activities.length > 0" class="bottom-row">
          <StudentCompletedTasks
            :taskData="activities"
            :timeframe="timeframe"
            @emitUpTasks="emitUpTasks($event)"
          />
        </div>
      </div>
      <!-- Cohorts & Actions -->
      <div class="student-actions-overUnder">
        <div class="top-row">
          <StudentCohorts :size="20" :student="student" />
        </div>
        <div class="bottom-row">
          <StudentActions :student="student" />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import StudentCardStatus from "@/components/StudentCard/StudentCardStatus.vue";
import StudentCardProgress from "@/components/StudentCard/StudentCardProgress.vue";
import StudentCardActivities from "@/components/StudentCard/StudentCardActivities.vue";
import StudentHours from "@/components/StudentCard/StudentHours.vue";
import StudentCompletedTasks from "@/components/StudentCard/StudentCompletedTasks.vue";
import StudentCohorts from "@/components/StudentCard/StudentCohorts.vue";
import StudentActions from "@/components/StudentCard/StudentActions.vue";
import StudentActivityTimeline from "@/components/StudentActivityTimeline.vue";
import { fetchCohortById, fetchCourseById } from "@/lib/ff";
import { getStudentsCoursesXAPIQuery, getStudentsTimeDataXAPIQuery } from "@/lib/veracityLRS";
import { dbMixins } from "@/mixins/DbMixins";
import useRootStore from "@/store/index";
import { mapState } from "pinia";

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
      cohort: null,
      topic: null,
      task: null,
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
    this.cohort = await fetchCohortById(this.currentCohortId);
    const cohortActivities = studentCourses.filter((a) =>
      this.cohort.courses.some((b) => b === a.course.id),
    );
    this.activities = cohortActivities.map((course) => {
      const currentTopic = course.activities.find((action) => action.type === "Topic");
      const currentTask = course.activities.find((action) => action.type === "Task");
      return {
        ...course,
        currentTopic,
        currentTask,
      };
    });

    // ==== get student activity data from LRS
    let getActivityData = await getStudentsTimeDataXAPIQuery({
      studentsArr: [this.student.id],
    });
    this.studentTimeData = getActivityData;
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId", "userStatus"]),
    status() {
      return this.userStatus[this.student.id];
    },
  },
  methods: {
    showStudentDetails(student) {
      this.$emit("showStudent", student);
    },
    async getAssignedCourse() {
      const courseId = this.student.assignedCourses.find((course) =>
        this.cohort.courses.includes(course),
      );
      this.assignedCourse = await fetchCourseById(courseId);
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
    padding: 2.5px;
  }

  .bottom-row {
    height: 50%;
    padding: 2.5px;
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
