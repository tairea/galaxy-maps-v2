<template>
  <div id="container" class="bg">
    <!-- STUDENTS INFO FRAME -->
    <div id="left-section">
      <StudentInfo :person="person" />
    </div>

    <div id="main-section">
      <!-- STUDENTS COURSE PROGRESSOIN FRAME -->
      <!-- TODO: v-for="courseData in studentsCoursesProgressionData" -->
      <div class="course-progression-wrap">
        <StudentCourseProgression :student="person" />
      </div>
    </div>

    <div id="right-section">
      <!-- STUDENTS ACTIVITY FRAME -->

      <StudentActivityTimeline :student="person" />
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
  async mounted() {
    console.log("this.courses from dashboard", this.courses);

    // get all courses topics and tasks
    // this.$store.dispatch("getAllCourseTopicsAndTasks", this.courses);
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
      "getOrganisationsInThisCourse",
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
  width: 100%;
  display: flex;

  #left-section {
    width: 15%;
    padding: 100px 50px;
  }

  #main-section {
    width: 60%;
    height: calc(100vh - 100px);
    margin-top: 100px;
    padding: 0px 50px;
    height: calc(100vh - 200px);
    // border: 1px solid red;

    .course-progression-wrap {
      height: 100%;
      overflow-y: scroll;
      overflow-x: hidden;
    }
  }

  #right-section {
    width: 25%;
    height: calc(100vh - 100px);
    margin-top: 100px;
    height: calc(100vh - 200px);
    // border: 1px solid yellow;
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
