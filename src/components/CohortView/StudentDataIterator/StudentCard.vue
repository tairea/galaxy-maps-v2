<template>
  <div class="student-card" :class="status ? '' : 'not-active'">
    <StudentCardStatus
      :student="student"
      :date="date"
      :status="status"
      class="pl-1"
      @click.native="showStudentDetails(student)"
      @emitUpLastActive="emitUpLastActive($event)"
    />
    <template v-if="!status">
      <span class="overline not-active text-uppercase ma-auto">hasn't signed in yet</span>
    </template>
    <template v-else>
      <StudentXpPoints :student="student" />
      <StudentCardProgress :activities="activities" :student="student" />
      <div class="student-activities-overUnder">
        <div style="height: 100%">
          <StudentActivityTimeline :student="student" studentCard />
          <!-- <StudentCardActivities :student="student" :activities="activities"/> -->
        </div>
      </div>
      <!-- Active Hours & Completed Tasks -->
      <div class="student-actions-overUnder">
        <div class="top-row d-flex flex-column">
          <!-- loading spinner -->
          <div class="d-flex justify-center align-center" v-if="studentTimeDataLoading">
            <v-btn
              :loading="studentTimeDataLoading"
              icon
              color="missionAccent"
              class="d-flex justify-center align-center"
            ></v-btn>
          </div>
          <StudentHours
            v-else
            :timeData="studentTimeData"
            :timeframe="timeframe"
            :courseIds="cohortCourseIds"
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
import StudentCardStatus from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardStatus.vue";
import StudentCardProgress from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardProgress.vue";
import StudentCardActivities from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardActivities.vue";
import StudentHours from "@/components/CohortView/StudentDataIterator/StudentCard/StudentHours.vue";
import StudentCompletedTasks from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCompletedTasks.vue";
import StudentCohorts from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCohorts.vue";
import StudentActions from "@/components/CohortView/StudentDataIterator/StudentCard/StudentActions.vue";
import StudentActivityTimeline from "@/components/Reused/StudentActivityTimeline.vue";
import StudentXpPoints from "@/components/CohortView/StudentDataIterator/StudentCard/StudentXpPoints.vue";

import {
  fetchCohortByCohortId,
  fetchCourseByCourseId,
  fetchStudentCoursesActivityByPersonId,
  fetchStudentCoursesTimeDataByPersonIdStartAtEndAt,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import { mapState } from "pinia";

export default {
  name: "StudentCard",
  components: {
    StudentCardStatus,
    StudentCardActivities,
    StudentCardProgress,
    StudentHours,
    StudentCompletedTasks,
    StudentCohorts,
    StudentActions,
    StudentActivityTimeline,
    StudentXpPoints,
  },
  props: ["student", "timeframe", "date", "cohortCourseIds"],
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
      studentTimeDataLoading: false,
    };
  },
  async mounted() {
    const studentCourses = await fetchStudentCoursesActivityByPersonId(this.student.id);
    this.cohort = await fetchCohortByCohortId(this.currentCohortId);
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
    // this new way gets all course log ins and log offs and calcs times
    this.studentTimeData = await this.getStudentTimeData();
  },
  watch: {
    async timeframe(newVal) {
      this.studentTimeData = await this.getStudentTimeData();
    },
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
      const courseId = this.student.assignedCourses.find((courseId) =>
        this.cohort.courses.includes(courseId),
      );
      this.assignedCourse = await fetchCourseByCourseId(courseId);
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    async getStudentTimeData() {
      this.studentTimeDataLoading = true;
      const courseHours = await fetchStudentCoursesTimeDataByPersonIdStartAtEndAt(
        this.student.id,
        this.timeframe.min.toISOString(),
        this.timeframe.max.toISOString(),
      );
      this.studentTimeDataLoading = false;
      return courseHours;
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
    emitUpLastActive(lastActive) {
      this.$emit("updateStudentsWithLastActive", {
        person: this.student,
        lastActive,
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
    max-width: 15%;
    min-width: 15%;
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
