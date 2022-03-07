<template>
  <div id="container" class="bg">
    <!-- STUDENTS INFO FRAME -->
    <div id="left-section">
      <StudentInfo :person="person" />
    </div>

    <div id="main-section">
      <!-- STUDENTS ACTIVITY FRAME -->
      <StudentActivityTimeline />

      <!-- STUDENTS COURSE PROGRESSOIN FRAME -->
      <!-- TODO: v-for="courseData in studentsCoursesProgressionData" -->
      <div>
        <StudentCourseProgression />
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

import StudentInfo from "../components/StudentInfo";
import StudentActivityTimeline from "../components/StudentActivityTimeline";
import StudentCourseProgression from "../components/StudentCourseProgression";

export default {
  name: "StudentDashboard",
  components: {
    StudentInfo,
    StudentActivityTimeline,
    StudentCourseProgression,
  },
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
    return {};
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
  width: 25%;
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
}

#main-section {
  width: 75%;
  // margin: 0px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 1;
  border: 1px solid pink;
  overflow: scroll;
  overflow-x: hidden; /* Hide horizontal scrollbar */

  #main-section ::-webkit-scrollbar {
    display: none;
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
