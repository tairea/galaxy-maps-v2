<template>
  <div :id="studentOverview ? 'studentOverview' : 'submission-panel'">
    <h2 v-if="!studentOverview" class="submission-label">
      {{ formatLabel }}
    </h2>
    <div v-if="submissions.length > 0">
      <div v-if="dense">
        <SubmissionTeacherPanelDense
          v-for="submission in submissions"
          :key="submission.id"
          :submission="submission"
          :isDashboardView="isDashboardView"
          :isTeacher="isTeacher"
          :isStudent="isStudent"
          :showCourseImage="showCourseImage"
        />
      </div>
      <div v-else>
        <SubmissionTeacherPanel
          v-for="submission in submissions"
          :key="submission.id"
          :submission="submission"
          :isDashboardView="isDashboardView"
          :isTeacher="isTeacher"
          :isStudent="isStudent"
          :showCourseImage="showCourseImage"
        />
      </div>
    </div>
    <div v-if="!loading && submissions.length == 0">
      <p class="overline pt-4 text-center" style="color: var(--v-cohortAccent-base)">
        NO {{ completedSubmissionsOnly ? "COMPLETED SUBMISSIONS" : "SUBMISSIONS TO REVIEW" }}
      </p>
    </div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center mt-4">
      <v-btn v-if="loading" :loading="loading" icon color="cohortAccent"></v-btn>
    </div>
  </div>
</template>
<script>
import SubmissionTeacherPanel from "@/components/Reused/SubmissionTeacherFrame/SubmissionTeacherPanel.vue";
import SubmissionTeacherPanelDense from "@/components/Reused/SubmissionTeacherFrame/SubmissionTeacherPanelDense.vue";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "SubmissionTeacherFrame",
  props: [
    "courses",
    "students",
    "isTeacher",
    "isStudent",
    "studentOverview",
    "allStudentsSubmissions",
    "completedSubmissionsOnly",
    "loading",
    "showCourseImage",
    "dense",
    "yours",
  ],
  components: {
    SubmissionTeacherPanel,
    SubmissionTeacherPanelDense,
  },
  watch: {
    courseSubmissions(newVal, oldVal) {
      console.log("courseSubmissions changed", newVal);
      this.$emit("submissionsChanged");
    },
  },
  data() {
    return {
      allSubmissions: [],
      unsubscribes: [],
    };
  },
  async mounted() {
    if (this.courses) {
      for (const course of this.courses) {
        // console.log("getting submissions for course ", course);
        const unsubscribe = await this.getAllSubmittedWorkByCourseId(course.id || course);
        this.unsubscribes.push(unsubscribe);
      }
      console.log("submissions unsubscribes", this.unsubscribes);
    }
  },
  destroyed() {
    this.resetTeachersSubmissions();
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
  },
  computed: {
    ...mapState(useRootStore, ["courseSubmissions", "person", "currentTopicId"]),
    isCohortView() {
      return this.$route.name === "CohortView";
    },
    isDashboardView() {
      return this.$route.name === "Dashboard";
    },
    isGalaxyView() {
      return this.$route.name === "GalaxyView";
    },
    isSystemView() {
      return this.$route.name === "SolarSystemView";
    },
    formatLabel() {
      if (this.completedSubmissionsOnly) {
        return "COMPLETED SUBMISSIONS";
      } else if (this.yours) {
        return "YOUR WORK SUBMITTED FOR REVIEW";
      } else {
        return "WORK SUBMITTED FOR REVIEW";
      }
    },
    submissions() {
      let submissions = [];

      // For teacher view without course/student filters, show all submissions
      if (this.isTeacher && !this.courses && !this.students) {
        submissions = this.courseSubmissions;
      }
      // For specific student/course views
      else if (this.allStudentsSubmissions) {
        submissions = this.allStudentsSubmissions.filter((submission) =>
          this.students?.some((student) => {
            return student.id
              ? student.id === submission.studentId
              : student === submission.studentId;
          }),
        );
      }
      // For filtered course views
      else if (this.courses) {
        submissions = this.courseSubmissions.filter((submission) =>
          this.students?.some((student) => {
            return student.id
              ? student.id === submission.studentId
              : student === submission.studentId;
          }),
        );
      }

      let filteredSubmissions = [];

      // ================== Filter Submissions ==================
      if (this.completedSubmissionsOnly) {
        filteredSubmissions = submissions.filter(
          (submission) => submission.taskSubmissionStatus !== "inreview",
        );
      } else if (this.isTeacher) {
        filteredSubmissions = submissions.filter(
          (submission) => submission.taskSubmissionStatus === "inreview",
        );
      } else {
        filteredSubmissions = submissions;
      }

      // ================== Sort Submissions ==================
      filteredSubmissions = filteredSubmissions.slice().sort((a, b) => {
        // Define the order of taskSubmissionStatus
        const statusOrder = {
          inreview: 1,
          declined: 2,
          completed: 3,
        };

        // First, compare by taskSubmissionStatus using the defined order
        if (statusOrder[a.taskSubmissionStatus] < statusOrder[b.taskSubmissionStatus]) return -1;
        if (statusOrder[a.taskSubmissionStatus] > statusOrder[b.taskSubmissionStatus]) return 1;

        // If taskSubmissionStatus is the same, compare by taskSubmittedForReviewTimestamp.seconds
        return (
          a.taskSubmittedForReviewTimestamp.seconds - b.taskSubmittedForReviewTimestamp.seconds
        );
      });

      if (this.isCohortView || this.isDashboardView) return filteredSubmissions;
      else if (this.isGalaxyView) {
        return filteredSubmissions.filter(
          (submission) => submission.contextCourse.id === this.courses[0].id,
        );
      } else if (this.isSystemView) {
        return filteredSubmissions.filter(
          (submission) => submission.contextTopic.id === this.currentTopicId,
        );
      }
      return filteredSubmissions;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["getAllSubmittedWorkByCourseId", "resetTeachersSubmissions"]),
  },
};
</script>
<style lang="scss" scoped>
#submission-panel {
  width: 100%;
  border: 1px solid var(--v-cohortAccent-base);
  padding: 20px;
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
  overflow-y: auto;
  max-height: 40%;
  transition: all 0.2s ease-in-out;
}

.studentOverview {
  height: 100% !important;
}

#submission-panel:hover {
  max-height: 50%;
}

.submission-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: 0;
  left: -1px;
  background-color: var(--v-cohortAccent-base);
  color: var(--v-background-base);
  padding: 0px 20px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
}

/* Handle */
*::-webkit-scrollbar-thumb {
  background: var(--v-cohortAccent-base) !important;
}
/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-cohortAccent-base) !important;
}
</style>
