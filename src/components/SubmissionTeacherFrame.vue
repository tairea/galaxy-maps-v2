<template>
  <div id="submission-panel">
    <h2 class="submission-label">Work submitted for review</h2>
    <div v-if="submissions.length > 0">
      <SubmissionTeacherPanel
        v-for="submission in submissions"
        :key="submission.id"
        :submission="submission"
        :isDashboardView="isDashboardView"
        :isTeacher="isTeacher"
      />
    </div>
    <div v-if="!loading && submissions.length == 0">
      <p class="overline pt-4 text-center" style="color: var(--v-cohortAccent-base)">
        NO WORK TO REVIEW
      </p>
    </div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center mt-4">
      <v-btn v-if="loading" :loading="loading" icon color="cohortAccent"></v-btn>
    </div>
  </div>
</template>
<script>
import SubmissionTeacherPanel from "@/components/SubmissionTeacherPanel.vue";
import { dbMixins } from "@/mixins/DbMixins";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "SubmissionTeacherFrame",
  mixins: [dbMixins],
  props: ["courses", "students", "isTeacher"],
  components: {
    SubmissionTeacherPanel,
  },
  data() {
    return {
      loading: false,
      allSubmissions: [],
      unsubscribes: [],
    };
  },
  async mounted() {
    this.loading = true;
    for (const course of this.courses) {
      const unsubscribe = await this.getAllSubmittedWorkByCourseId(course.id || course);
      this.unsubscribes.push(unsubscribe);
    }
    this.loading = false;
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
      const submissions = this.courseSubmissions.filter((submission) =>
        this.students?.some((student) => {
          return student.id
            ? student.id === submission.studentId
            : student === submission.studentId;
        }),
      );
      if (this.isTeacher) {
        submissions.sort((a, b) => {
          if (a.taskSubmissionStatus === b.taskSubmissionStatus) {
            // If the tasks are both in review sort by taskSubmittedForReviewTimestamp
            return (
              b.taskSubmittedForReviewTimestamp.seconds - a.taskSubmittedForReviewTimestamp.seconds
            );
          } else {
            // Otherwise, compare by age
            return a.taskSubmissionStatus == "inreview" ? -1 : 1;
          }
        });
      } else {
        submissions.sort((a, b) => {
          if (a.taskSubmissionStatus === b.taskSubmissionStatus) {
            return (
              b.taskReviewedAndCompletedTimestamp.seconds -
              a.taskReviewedAndCompletedTimestamp.seconds
            );
          } else {
            return a.taskSubmissionStatus == "completed" ? -1 : 1;
          }
        });
      }

      if (this.isCohortView || this.isDashboardView) return submissions;
      else if (this.isGalaxyView) {
        return submissions.filter(
          (submission) => submission.contextCourse.id == this.courses[0].id,
        );
      } else if (this.isSystemView) {
        return submissions.filter(
          (submission) => submission.contextTopic.id == this.currentTopic.id,
        );
      }
      return submissions;
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
