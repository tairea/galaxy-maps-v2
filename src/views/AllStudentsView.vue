<template>
  <div id="container" class="bg">
    <!-- REVIEW WORK PANEL -->
    <div id="left-section">
      <div id="review-panel">
        <h2 class="review-label">Work submitted for review</h2>
        <!-- 
        <div v-if="teachersSubmissionsToReview.length > 0">
          <SubmissionToReview
            v-for="submission in teachersSubmissionsToReview"
            :key="submission.id"
            :submission="submission"
          />
        </div>
        <div class="d-flex justify-center align-center mt-4">
          <v-btn
            v-if="submissionsLoading"
            :loading="submissionsLoading"
            icon
            color="cohortAccent"
          ></v-btn>
        </div> -->

        <div v-if="teachersSubmissionsToReview.length > 0">
          <SubmissionTeacherCard
            v-for="submission in teachersSubmissionsToReview"
            :key="submission.id"
            :submission="submission"
            @snackbarToggle="snackbarToggleSubmission($event)"
          />
        </div>
        <div
          v-if="!submissionsLoading && teachersSubmissionsToReview.length == 0"
        >
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
            v-if="requestsForHelpLoading"
            :loading="requestsForHelpLoading"
            icon
            color="cohortAccent"
          ></v-btn>
        </div>
      </div>
    </div>

    <!-- STUDENT PROGRESSION PANEL -->
    <div id="main-section">
      <div id="progression-panel">
        <h2 class="progression-label">Student progression</h2>
      </div>
    </div>

    <!-- REQUESTS FOR HELP PANEL -->
    <div id="right-section">
      <div id="help-panel">
        <h2 class="help-label">Requests for help</h2>

        <div v-if="teachersRequestsForHelp.length > 0">
          <RequestForHelpTeacherCard
            v-for="request in teachersRequestsForHelp"
            :key="request.id"
            :request="request"
            @snackbarToggle="snackbarToggleHelp($event)"
          />
        </div>
        <div
          v-if="!requestsForHelpLoading && teachersRequestsForHelp.length == 0"
        >
          <p
            class="overline pt-4 text-center"
            style="color: var(--v-missionAccent-base)"
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
            color="missionAccent"
          ></v-btn>
        </div>
      </div>
    </div>

    <!-- Request submitted Snackbar -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMsg }}
      <template v-slot:action="{ attrs }">
        <v-btn color="pink" text v-bind="attrs" @click="snackbar = false">
          OK
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

import SubmissionTeacherCard from "../components/SubmissionTeacherCard";
import RequestForHelpTeacherCard from "../components/RequestForHelpTeacherCard";

export default {
  name: "AllStudentView",
  components: {
    SubmissionTeacherCard,
    RequestForHelpTeacherCard,
  },
  props: [],
  async mounted() {
    this.requestsForHelpLoading = true;
    this.submissionsLoading = true;
    // bind all courses (so we can filter the ones this teacher created)
    await this.$store.dispatch("bindCoursesByPersonId", this.user.data.id);

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
  computed: {
    ...mapState([
      "user",
      "currentCourseId",
      "currentCourseNodes",
      "person",
      "courses",
      "teachersSubmissionsToReview",
      "teachersRequestsForHelp",
      "allTasks",
    ]),
    ...mapGetters([
      "getCourseById",
      "getCohortsInThisCourse",
      "getOrganisationsInThisCourse",
      "getPeopleInThisCourse",
      "getCoursesByWhoMadeThem",
    ]),
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

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
}

#container {
  height: 100vh;
  width: 100%;
  display: flex;
  overflow: hidden;
  margin: 0 !important;
  // border: 1px solid red;
}

#left-section {
  width: 30%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
  overflow: scroll;
  overflow-x: hidden; /* Hide horizontal scrollbar */

  #left-section ::-webkit-scrollbar {
    display: none;
  }

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
  }
}

#main-section {
  width: 40%;
  // margin: 0px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 1;
  // border: 1px solid pink;
  overflow: scroll;
  overflow-x: hidden; /* Hide horizontal scrollbar */

  #main-section ::-webkit-scrollbar {
    display: none;
  }

  #progression-panel {
    width: calc(100% - 30px);
    height: 80%;
    border: 1px solid var(--v-missionAccent-base);
    margin-top: 30px;
    padding: 20px;
    // background: var(--v-baseAccent-base);
    position: relative;
    backdrop-filter: blur(2px);
    z-index: 3;

    .progression-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: absolute;
      top: 0;
      left: -1px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 20px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
    }
  }
}

#right-section {
  width: 30%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  // border: 1px solid red;
  overflow: scroll;
  overflow-x: hidden; /* Hide horizontal scrollbar */

  #right-section ::-webkit-scrollbar {
    display: none;
  }

  #help-panel {
    width: calc(100% - 30px);
    height: 80%;
    border: 1px solid var(--v-missionAccent-base);
    margin-top: 30px;
    padding: 20px;
    // background: var(--v-baseAccent-base);
    position: relative;
    backdrop-filter: blur(2px);
    // z-index: 3;

    .help-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: absolute;
      top: 0;
      left: -1px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 20px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
    }
  }
}

/* width */
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: var(--v-background-base);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--v-missionAccent-base);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}
</style>
