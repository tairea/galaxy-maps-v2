<template>
  <div :id="isCohortView">
    <h2 class="help-label">Requests for help</h2>

    <div v-if="teachersRequestsForHelp.length > 0">
      <RequestForHelpTeacherPanel
        v-for="request in teachersRequestsForHelp"
        :key="request.id"
        :request="request"
        @snackbarToggle="snackbarToggleHelp($event)"
      />
    </div>
    <div v-if="!requestsForHelpLoading && teachersRequestsForHelp.length == 0">
      <p
        class="overline pt-4 text-center"
        style="color: var(--v-galaxyAccent-base)"
      >
        NO REQUESTS FOR HELP
      </p>
    </div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center mt-4">
      <v-btn
        v-if="requestsForHelpLoading"
        :loading="requestsForHelpLoading"
        icon
        color="galaxyAccent"
      ></v-btn>
    </div>
    <!-- Request submitted Snackbar -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMsg }}
      <template v-slot:action="{ attrs }">
        <v-btn color="baseAccent" text v-bind="attrs" @click="snackbar = false">
          OK
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script>
import RequestForHelpTeacherPanel from "../components/RequestForHelpTeacherPanel";
import { mapState } from "vuex";

export default {
  name: "RequestForHelpTeacherFrame",
  components: {
    RequestForHelpTeacherPanel,
  },
  data() {
    return {
      submissionsLoading: false,
      requestsForHelpLoading: false,
      allSubmissions: [],
      allRequestsForHelp: [],
      snackbarMsg: "",
      snackbar: false,
    };
  },
  computed: {
    ...mapState(["teachersRequestsForHelp", "user"]),
    isCohortView() {
      return this.$route.name == "CohortView"
        ? "cohort-help-panel"
        : "help-panel";
    },
  },
  async mounted() {
    this.requestsForHelpLoading = true;
    this.submissionsLoading = true;
    // bind all courses (so we can filter the ones this teacher created)
    // await this.$store.dispatch("bindCoursesByPersonId", this.user.data.id);

    // bind all requests
    this.bindRequestsForHelp();
    // bind all submissions
    this.bindSubmissions();

    console.log(
      "teachersSubmissionsToReview",
      this.teachersSubmissionsToReview
    );
    console.log("teachersRequestsForHelp", this.teachersRequestsForHelp);

    // bind all tasks *needs this to get the task names for request.taskId :(
  },
  methods: {
    snackbarToggleHelp(msg) {
      console.log("snackbar toggled...", msg);
      this.snackbarMsg = msg;
      this.snackbar = true;
      this.bindRequestsForHelp();
    },
    snackbarToggleSubmission(msg) {
      console.log("snackbar toggled...", msg);
      this.snackbarMsg = msg;
      this.snackbar = true;
      this.bindSubmissions();
    },
    async bindRequestsForHelp() {
      await this.$store.dispatch(
        "getRequestsForHelpByTeachersId",
        this.user.data.id
      );
      this.requestsForHelpLoading = false;
    },
    async bindSubmissions() {
      await this.$store.dispatch(
        "getAllSubmittedWorkForTeacher",
        this.user.data.id
      );
      this.submissionsLoading = false;
    },
  },
};
</script>
<style scoped lang="scss">
#help-panel {
  width: calc(100% - 30px);
  height: 80%;
  border: 1px solid var(--v-galaxyAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  // z-index: 3;
  overflow-y: scroll;
}

#cohort-help-panel {
  width: calc(100% - 30px);
  border: 1px solid var(--v-galaxyAccent-base);
  margin: 30px 15px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  // z-index: 3;
}

.help-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: 0;
  left: -1px;
  background-color: var(--v-galaxyAccent-base);
  color: var(--v-background-base);
  padding: 0px 20px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
}
</style>
