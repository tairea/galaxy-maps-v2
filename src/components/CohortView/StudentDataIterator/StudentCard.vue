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
            :courses="cohortCourses"
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
import { fetchCohortByCohortId, fetchCourseByCourseId } from "@/lib/ff";
import {
  getStudentsCoursesXAPIQuery,
  getStudentsTimeDataXAPIQuery,
  getStudentsCourseTimeDataXAPIQuery,
} from "@/lib/veracityLRS";
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
  props: ["student", "timeframe", "date", "cohortCourses"],
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
    const studentCourses = await getStudentsCoursesXAPIQuery(this.student);
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

    // this is the old way of getting the data. it didnt work because it showed total active on galaxy maps as a whole. not active hours on individual galaxies/courses
    // let getActivityData = await getStudentsTimeDataXAPIQuery({
    //   studentsArr: [this.student.id],
    // });

    // this new way gets all course log ins and log offs and calcs times
    this.studentTimeData = await this.getStudentTimeData();
  },
  watch: {
    async timeframe(newVal) {
      // console.log("timeframe new val", newVal);
      // this.studentTimeData = await this.getStudentTimeData();
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
      const courseId = this.student.assignedCourses.find((course) =>
        this.cohort.courses.includes(course),
      );
      this.assignedCourse = await fetchCourseByCourseId(courseId);
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
    async getStudentTimeData() {
      this.studentTimeDataLoading = true;
      // todo: save this data into a variable
      // todo: pull out the hours spent on the course
      let getActivityData = await getStudentsCourseTimeDataXAPIQuery({
        student: {
          id: this.student.id,
          firstName: this.student.firstName,
          lastName: this.student.lastName,
        },
        min: this.timeframe.min,
        max: this.timeframe.max,
      });
      // console.log("getActivityData NEW LRS QUERY", getActivityData);
      this.studentTimeDataLoading = false;
      return getActivityData;
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
