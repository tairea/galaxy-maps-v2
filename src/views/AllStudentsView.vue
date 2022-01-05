<template>
  <div id="container" class="bg">
    <!-- REVIEW WORK PANEL -->
    <div id="left-section">
      <div id="review-panel">
        <h2 class="review-label">Work ready for review</h2>
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
            style="border: solid 1px red"
          />
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
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

import SubmissionToReview from "../components/SubmissionToReview";
import RequestForHelpTeacherCard from "../components/RequestForHelpTeacherCard";

export default {
  name: "AllStudentView",
  components: {
    SubmissionToReview,
    RequestForHelpTeacherCard,
  },
  props: [],
  async mounted() {
    // bind all courses (so we can filter the ones this teacher created)
    await this.$store.dispatch("bindCoursesByPersonId", this.user.data.id);
    // bind all requests
    this.requestsForHelpLoading = true;
    await this.$store.dispatch(
      "getRequestsForHelpByTeachersId",
      this.user.data.id
    );

    console.log("teachersRequestsForHelp", this.teachersRequestsForHelp);

    // bind all tasks *needs this to get the task names for request.taskId :(

    this.requestsForHelpLoading = false;
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
    };
  },

  methods: {
    // getCoursesByWhoMadeThem(personId) {
    //   return this.courses.filter((course) => {
    //     return course.mappedBy.personId == personId;
    //   });
    // },
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
