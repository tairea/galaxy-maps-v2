<template>
  <div id="container" class="bg">
    <!-- STUDENTS INFO FRAME -->
    <div id="left-section">
      <UserInfo :person="person" />
    </div>
    <div v-if="isStudent && isTeacher" class="top-section">
      <div class="student-border">
        <div :class="studentLabel" @click="setView('student')">
          student dashboard
        </div>
      </div>
      <div class="teacher-border">
        <div :class="teacherLabel" @click="setView('teacher')">
          teacher dashboard
        </div>
      </div>
      <v-divider
        class="line"
        style="border-color: var(--v-missionAccent-base)"
      ></v-divider>
    </div>
    <!-- STUDENT -->
    <template v-if="dashboardView === 'student'">
      <!-- Main section -->
      <div id="main-section">
        <!-- info description -->
        <div class="d-flex align-center mb-4">
          <v-icon left class="circle-border" small color="missionAccent"
            >mdi-information-variant</v-icon
          >
          <p class="info-description">
            These are maps you are completing as a student
          </p>
        </div>
        <div class="course-progression-wrap">
          <StudentCourseProgression :student="person" />
        </div>
      </div>

      <div id="right-section">
        <StudentActivityTimeline :student="person" />
      </div>
    </template>
    <template v-else>
      <div id="main-section">
        <!-- info description -->
        <div class="d-flex align-center mb-4">
          <v-icon left class="circle-border" color="missionAccent" small
            >mdi-information-variant</v-icon
          >
          <p class="info-description">
            These are cohorts & maps you are facilitating as a teacher
          </p>
        </div>
        <div class="timeframe-chips">
          <TimeframeFilters @timeframe="timeframe = $event" :showDate="true" />
        </div>
        <div class="cohort-frame">
          <!-- all teacher cohorts progress -->
          <CohortPanelV2
            v-for="cohort in teacherCohorts"
            :cohort="cohort"
            :key="cohort.id"
            :timeframe="timeframe"
            :dashboardView="true"
            class="mt-0"
          />
        </div>
      </div>

      <div id="right-section">
        <!-- all requests and submissions -->
        <RequestForHelpTeacherFrame
          :isTeacher="true"
          :courses="cohortCourses"
          :students="teachersStudents"
          class="mt-9"
        />
        <SubmissionTeacherFrame
          :courses="cohortCourses"
          :students="teachersStudents"
          class="mt-5"
        />
      </div>
    </template>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters, mapActions, mapMutations } from "vuex";

import UserInfo from "../components/UserInfo";
import StudentActivityTimeline from "../components/StudentActivityTimeline";
import StudentCourseProgression from "../components/StudentCourseProgression";
import TimeframeFilters from "../components/TimeframeFilters.vue";
import CohortPanelV2 from "../components/CohortPanelV2.vue";
import SubmissionTeacherFrame from "../components/SubmissionTeacherFrame.vue";
import RequestForHelpTeacherFrame from "../components/RequestForHelpTeacherFrame.vue";

export default {
  name: "UserDashboard",
  components: {
    UserInfo,
    StudentActivityTimeline,
    StudentCourseProgression,
    TimeframeFilters,
    CohortPanelV2,
    SubmissionTeacherFrame,
    RequestForHelpTeacherFrame,
  },
  data() {
    return {
      timeframe: "",
    };
  },
  async mounted() {
    this.getCohortsByPersonId(this.person);
    if (this.dashboardView === "" && this.person.assignedCourses?.length)
      this.setDashboardView("student");
  },
  computed: {
    ...mapState([
      "user",
      "currentCourseId",
      "currentCourseNodes",
      "person",
      "courses",
      "allTasks",
      "cohorts",
      "dashboardView",
    ]),
    ...mapGetters(["getCourseById", "getCoursesByWhoMadeThem"]),
    isStudent() {
      return this.person.assignedCourses?.length;
    },
    isTeacher() {
      const isTeacher = this.teacherCohorts.length;
      if (!this.isStudent && isTeacher) this.setDashboardView("teacher");
      return isTeacher;
    },
    studentLabel() {
      return this.dashboardView === "student"
        ? "student-label"
        : "inactive-student-label";
    },
    teacherLabel() {
      return this.dashboardView === "teacher"
        ? "teacher-label"
        : "inactive-teacher-label";
    },
    teacherCohorts() {
      return this.cohorts.filter((cohort) => cohort.teacher);
    },
    cohortCourses() {
      let courses = [];
      this.teacherCohorts.forEach((cohort) => {
        cohort.courses.forEach((course) => courses.push(course));
      });
      return courses;
    },
    teachersStudents() {
      let students = [];
      this.teacherCohorts.forEach((cohort) => {
        cohort.students.forEach((course) => students.push(course));
      });
      return students;
    },
  },

  methods: {
    ...mapActions(["getCohortsByPersonId"]),
    ...mapMutations(["setDashboardView"]),
    setView(val) {
      this.setDashboardView(val);
    },
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
}

#container {
  width: 100%;
  display: flex;
  max-height: 100vh;

  .top-section {
    position: absolute;
    width: 80%;
    left: 15%;
    top: 100px;
    margin-left: 50px;
  }

  #left-section {
    width: 15%;
    padding: 100px 50px;
  }

  #main-section {
    width: 60%;
    height: calc(100vh - 100px);
    margin-top: 135px;
    padding: 0px 20px 50px 50px;
    // border: 1px solid red;

    .circle-border {
      border: 1px solid var(--v-missionAccent-base);
      border-radius: 50%;
    }

    .info-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.7rem;
      margin: 0;
      font-style: italic;
    }

    .course-progression-wrap {
      height: 100%;
      overflow-y: scroll;
      overflow-x: hidden;
    }
  }

  #right-section {
    width: 25%;
    margin-top: 140px;
    height: calc(100vh - 200px);
    margin-right: 30px;
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

.student-border {
  position: absolute;
  top: 3px;
  left: 0px;
  background-color: var(--v-missionAccent-base);
  padding: 0px 20px;
  clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  width: 180px;
  height: 20px;
}

.inactive-student-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: relative;
  top: 1px;
  left: -19px;
  height: 20px;
  width: 178px;
  background-color: var(--v-missionAccent-base);
  color: var(--v-background-base);
  padding: 0px 20px 0px 20px;
  -webkit-clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  cursor: pointer;
}

.student-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  position: relative;
  top: 1px;
  left: -19px;
  height: 20px;
  width: 178px;
  background-color: var(--v-background-base);
  color: var(--v-missionAccent-base);
  padding: 0px 20px 0px 20px;
  -webkit-clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  cursor: pointer;
}

.teacher-border {
  position: absolute;
  top: 3px;
  left: 180px;
  background-color: var(--v-missionAccent-base);
  padding: 0px 20px;
  clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  width: 180px;
  height: 20px;
}

.inactive-teacher-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  position: relative;
  top: 1px;
  left: -19px;
  height: 20px;
  width: 178px;
  background-color: var(--v-missionAccent-base);
  color: var(--v-background-base);
  padding: 0px 20px 0px 20px;
  clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  cursor: pointer;
}

.teacher-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: relative;
  top: 1px;
  left: -19px;
  height: 20px;
  width: 178px;
  background-color: var(--v-background-base);
  color: var(--v-missionAccent-base);
  padding: 0px 20px 0px 20px;
  clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  cursor: pointer;
}

.line {
  position: relative;
  top: 23px;
}

.cohort-frame {
  height: 100%;
  overflow: scroll;
  margin-bottom: 10px;
}

.timeframe-chips {
  display: flex;
  justify-content: center;
}
</style>
