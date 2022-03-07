<template>
  <div :id="isCohortView">
    <h2 class="review-label">Work submitted for review</h2>
    <div v-if="teachersSubmissionsToReview.length > 0">
      <SubmissionTeacherPanel
        v-for="submission in teachersSubmissionsToReview"
        :key="submission.id"
        :submission="submission"
      />
    </div>
    <div v-if="!submissionsLoading && teachersSubmissionsToReview.length == 0">
      <p
        class="overline pt-4 text-center"
        style="color: var(--v-cohortAccent-base)"
      >
        NO WORK TO REVIEW
      </p>
    </div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center mt-4">
      <v-btn
        v-if="submissionsLoading"
        :loading="submissionsLoading"
        icon
        color="cohortAccent"
      ></v-btn>
    </div>
  </div>
</template>
<script>
import SubmissionTeacherPanel from "../components/SubmissionTeacherPanel";
import { mapState } from "vuex";
import { dbMixins, dmMixins } from "../mixins/DbMixins"

export default {
  name: "SubmissionTeacherFrame",
  mixins: [dbMixins],
  components: {
    SubmissionTeacherPanel,
  },
  data() {
    return {
      submissionsLoading: false,
      allSubmissions: [],
    };
  },
  async mounted() {
    this.submissionsLoading = true;

    // bind all submissions
    this.bindSubmissions();
  },
  computed: {
    ...mapState(["teachersSubmissionsToReview", "user"]),
    isCohortView() {
      return this.$route.name == "CohortView"
        ? "cohort-review-panel"
        : "review-panel";
    },
  },
  methods: {
    async bindSubmissions() {
      this.MXbindSubmissions()
      this.submissionsLoading = false;
    },
  },
};
</script>
<style lang="scss" scoped>
#review-panel {
  width: calc(100% - 30px);
  height: 80%;
  border: 1px solid var(--v-cohortAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
}

#cohort-review-panel {
  width: calc(100% - 30px);
  border: 1px solid var(--v-cohortAccent-base);
  margin: 0px 15px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
}

.review-label {
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
</style>
