<template>
  <div id="container" class="bg">
    <!-- REVIEW WORK PANEL -->
    <div id="left-section"></div>

    <!-- STUDENT PROGRESSION PANEL -->
    <div id="main-section">
      <img src="../assets/student-dashboard-mockup.png" />
    </div>

    <!-- REQUESTS FOR HELP PANEL -->
    <div id="right-section"></div>

    <!-- Request submitted Snackbar -->
    <!-- <v-snackbar v-model="snackbar">
      {{ snackbarMsg }}
      <template v-slot:action="{ attrs }">
        <v-btn color="pink" text v-bind="attrs" @click="snackbar = false">
          OK
        </v-btn>
      </template>
    </v-snackbar> -->
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "StudentDashboard",
  components: {},
  props: [],
  async mounted() {},
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
      snackbarMsg: "",
      snackbar: false,
    };
  },

  methods: {},
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
  width: 0%;
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
  width: 100%;
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
}

#right-section {
  width: 0%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  // border: 1px solid red;
  overflow: scroll;
  overflow-x: hidden; /* Hide horizontal scrollbar */
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
