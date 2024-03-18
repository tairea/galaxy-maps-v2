<template>
  <div :id="studentOverview ? 'studentOverview' : 'submission-panel'">
    <h2 v-if="!studentOverview" class="submission-label">
      {{ completedSubmissionsOnly ? "COMPLETED SUBMISSIONS" : "Work submitted for review" }}
    </h2>
    <div v-if="submissions.length > 0">
      <div v-if="dense">
        <SubmissionTeacherPanelDense
          v-for="submission in submissions"
          :key="submission.id"
          :submission="submission"
          :isDashboardView="isDashboardView"
          :isTeacher="isTeacher"
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
    "studentOverview",
    "allStudentsSubmissions",
    "completedSubmissionsOnly",
    "loading",
    "showCourseImage",
    "dense",
  ],
  components: {
    SubmissionTeacherPanel,
    SubmissionTeacherPanelDense,
  },
  watch: {
    courseSubmissions(newVal, oldVal) {
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
        const unsubscribe = await this.getAllSubmittedWorkByCourseId(course.id || course);
        this.unsubscribes.push(unsubscribe);
      }
    }
  },
  destroyed() {
    this.resetTeachersSubmissions();
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
  },
  computed: {
    ...mapState(useRootStore, [
      "courseSubmissions",
      "person",
      "currentCohort",
      "currentTopic",
      "currentTask",
    ]),
    isCohortView() {
      return this.$route.name == "CohortView";
    },
    isDashboardView() {
      return this.$route.name == "Dashboard";
    },
    isGalaxyView() {
      return this.$route.name == "GalaxyView";
    },
    isSystemView() {
      return this.$route.name == "SolarSystemView";
    },
    submissions() {
      let submissions = [];

      // get all student submissions
      if (this.allStudentsSubmissions) {
        submissions = this.allStudentsSubmissions.filter((submission) =>
          this.students?.some((student) => {
            return student.id
              ? student.id === submission.studentId
              : student === submission.studentId;
          }),
        );
      }

      // get all student submissions for this course
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

      // Filter for "inreview" only
      if (this.completedSubmissionsOnly) {
        filteredSubmissions = submissions.filter(
          (submission) => submission.taskSubmissionStatus != "inreview",
        );
      } else {
        filteredSubmissions = submissions.filter(
          (submission) => submission.taskSubmissionStatus === "inreview",
        );
      }

      filteredSubmissions.sort(
        (a, b) =>
          b.taskSubmittedForReviewTimestamp.seconds - a.taskSubmittedForReviewTimestamp.seconds,
      );

      if (this.isCohortView || this.isDashboardView) return filteredSubmissions;
      else if (this.isGalaxyView) {
        return filteredSubmissions.filter(
          (submission) => submission.contextCourse.id == this.courses[0].id,
        );
      } else if (this.isSystemView) {
        return filteredSubmissions.filter(
          (submission) => submission.contextTopic.id == this.currentTopic.id,
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
  overflow-y: scroll;
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
