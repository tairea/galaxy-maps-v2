<template>
  <div>
    <section v-if="requests.length">
      <!-- requests for help -->
      <p class="label requests text-uppercase">Requests for help</p>
      <div class="d-flex dots-row">
        <span
          v-for="request in requests"
          :key="request.id"
          class="dot"
          style="background-color: var(--v-galaxyAccent-base)"
          @click="showRequestCard(request)"
        ></span>
      </div>
    </section>
    <section v-if="submissions.length">
      <!-- submissions -->
      <p class="label submissions text-uppercase">Work submissions</p>
      <div class="d-flex dots-row">
        <div
          v-for="submission in submissions"
          :key="submission.id"
          class="dot"
          style="background-color: var(--v-cohortAccent-base)"
          @click="showSubmissionCard(submission)"
        ></div>
      </div>
    </section>
    <section v-if="!submissions.length && !requests.length">
      <p
        class="label text-uppercase"
        style="color: var(--v-missionAccent-base)"
      >
        student actions
      </p>
    </section>
  </div>
</template>
<script>
import { mapState } from "vuex";

export default {
  name: "StudentActions",
  props: ["student"],
  computed: {
    ...mapState(["teachersRequestsForHelp", "teachersSubmissionsToReview"]),
    requests() {
      return this.teachersRequestsForHelp?.filter(
        (request) => request.personId === this.student.id
      );
    },
    submissions() {
      return this.teachersSubmissionsToReview?.filter(
        (submissions) => submissions.studentId === this.student.id
      );
    },
  },
  methods: {
    showRequestCard(request) {
      this.$store.commit("setPanelCard", { type: "request", data: request });
    },
    showSubmissionCard(submission) {
      this.$store.commit("setPanelCard", {
        type: "submission",
        data: submission,
      });
    },
  },
};
</script>
<style scoped lang="scss">
.dot {
  height: 7px;
  width: 7px;
  margin: 2px 5px;
  border-radius: 50%;
  display: inline-block;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}

.dot:hover {
  transform: scale(1.5);
  box-shadow: 0 0 10px var(--v-missionAccent-base);
}

.dots-row {
  position: relative;
  top: -2px;
  min-height: 10px;
}

.label {
  font-size: 0.6rem;
  margin: 1px;
  width: 100%;
  font-weight: bold;
}

.requests {
  color: var(--v-galaxyAccent-base);
}

.submissions {
  position: relative;
  top: -2px;
  color: var(--v-cohortAccent-base);
}

// .grow-n-glow {
//   transform: scale(1.5);
//   box-shadow: 0 0 50px var(--v-missionAccent-base);
// }
</style>
`
