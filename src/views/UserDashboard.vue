<template>
  <div id="container" class="bg">
    <!-- PERSON INFO FRAME -->
    <div id="left-section">
      <UserInfo :person="person" />
    </div>
    <div v-if="courses.length === 0" class="top-section">
      <p class="overline noData">
        No data to show. Try creating or exploring a galaxy.
      </p>
    </div>
    <div v-else class="top-section">
      <div v-if="isAdmin" class="student-border">
        <div :class="adminLabel" @click="setView('admin')">Create Admin</div>
      </div>
      <div class="student-border">
        <div :class="studentLabel" @click="setView('student')">
          exploring dashboard
        </div>
      </div>
      <div v-if="isTeacher" class="teacher-border">
        <div :class="teacherLabel" @click="setView('teacher')">
          cohort analytics
        </div>
      </div>
      <v-divider
        class="line"
        style="border-color: var(--v-missionAccent-base)"
      ></v-divider>
    </div>

    <!-- STUDENT MAIN -->
    <template v-if="dashboardView === 'student'">
      <!-- Main section -->
      <div id="main-section">
        <!-- info description -->
        <div class="d-flex align-center mb-4">
          <v-icon left class="circle-border" small color="missionAccent">{{
            mdiInformationVariant
          }}</v-icon>
          <p class="info-description">These are maps you are exploring</p>
        </div>
        <div class="course-progression-wrap">
          <StudentCourseProgression :student="person" />
        </div>
      </div>

      <div id="right-section">
        <StudentActivityTimeline :student="person" />
      </div>
    </template>

    <!-- TEACHER -->
    <template v-else-if="dashboardView === 'teacher'">
      <div id="main-section">
        <!-- info description -->
        <div class="d-flex align-center mb-4">
          <v-icon left class="circle-border" color="missionAccent" small>{{
            mdiInformationVariant
          }}</v-icon>
          <p v-if="isAdmin" class="info-description">
            Because you are an Admin. These are ALL Galaxy Maps and ALL Cohorts
            on the Galaxy Maps platform.
          </p>
          <p v-else class="info-description">
            These are Galaxy Maps you have created and the Cohorts working
            through them.
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
          :isTeacher="true"
          :courses="cohortCourses"
          :students="teachersStudents"
          class="mt-5"
        />
      </div>
    </template>
    <template v-else-if="dashboardView === 'admin'">
      <div id="main-section">
        <div class="d-flex align-center mb-4">
          <v-icon left class="circle-border" color="missionAccent" small>{{
            mdiInformationVariant
          }}</v-icon>
          <p class="info-description">
            Because you are a Galaxy Maps super admin, you can create other
            admins (for Developers only).
          </p>
        </div>
        <CreateAdminDialog />
      </div>
    </template>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters, mapActions, mapMutations } from "vuex";
import { mdiInformationVariant } from "@mdi/js";

import UserInfo from "../components/UserInfo";
import StudentActivityTimeline from "../components/StudentActivityTimeline";
import StudentCourseProgression from "../components/StudentCourseProgression";
import TimeframeFilters from "../components/TimeframeFilters.vue";
import CohortPanelV2 from "../components/CohortPanelV2.vue";
import SubmissionTeacherFrame from "../components/SubmissionTeacherFrame.vue";
import RequestForHelpTeacherFrame from "../components/RequestForHelpTeacherFrame.vue";
import CreateAdminDialog from "../components/CreateAdminDialog";

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
    CreateAdminDialog,
  },
  data() {
    return {
      mdiInformationVariant,
      timeframe: "",
    };
  },
  async mounted() {
    if (this.user.data.admin) {
      this.bindAllCohorts();
      this.setDashboardView("admin");
    } else if (this.isTeacher) {
      this.setDashboardView("teacher");
    } else {
      this.setDashboardView("student");
    }
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
    isAdmin() {
      return this.user.data.admin;
    },
    isStudent() {
      return this.person.assignedCourses?.length;
    },
    isTeacher() {
      return this.teacherCohorts.length;
    },
    isTeacherView() {
      return this.dashboardView === "teacher";
    },
    isStudentView() {
      return this.dashboardView === "student";
    },
    isAdminView() {
      return this.dashboardView === "admin";
    },
    adminLabel() {
      return this.isAdminView ? "active-label" : "inactive-label";
    },
    studentLabel() {
      return this.isStudentView ? "active-label" : "inactive-label";
    },
    teacherLabel() {
      return this.isTeacherView ? "active-label" : "inactive-label";
    },
    teacherCohorts() {
      if (this.isAdmin) return this.cohorts;
      else
        return this.cohorts.filter((cohort) =>
          cohort.teachers?.includes(this.person.id)
        );
    },
    cohortCourses() {
      let courses = [];
      this.teacherCohorts.forEach((cohort) => {
        cohort.courses.forEach((course) => courses.push({ id: course }));
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
    ...mapActions(["getCohortsByPersonId", "bindAllCohorts"]),
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

    .noData {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--v-missionAccent-base);
      margin-right: 20%;
    }
  }

  #left-section {
    width: 15%;
    padding: 100px 50px 100px 20px;
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

.admin-border {
  position: absolute;
  top: 3px;
  left: 360px;
  background-color: var(--v-galaxyAccent-base);
  padding: 0px 20px;
  clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  width: 180px;
  height: 20px;
}

// .admin-label {
//   font-size: 0.8rem;
//   font-weight: 400;
//   text-transform: uppercase;

//   // ribbon label
//   position: relative;
//   top: 1px;
//   left: -19px;
//   height: 20px;
//   width: 178px;
//   background-color: var(--v-missionAccent-base);
//   color: var(--v-background-base);
//   padding: 0px 20px 0px 20px;
//   -webkit-clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
//   clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
//   cursor: pointer;
// }

// .inactive-admin-label {
//   font-size: 0.8rem;
//   font-weight: 400;
//   text-transform: uppercase;
//   position: relative;
//   top: 1px;
//   left: -19px;
//   height: 20px;
//   width: 178px;
//   background-color: var(--v-background-base);
//   color: var(--v-missionAccent-base);
//   padding: 0px 20px 0px 20px;
//   -webkit-clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
//   clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
//   cursor: pointer;
// }
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

.active-label {
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
  -webkit-clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
  cursor: pointer;
}

.inactive-label {
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

// .teacher-label {
//   font-size: 0.8rem;
//   font-weight: 400;
//   text-transform: uppercase;
//   position: relative;
//   top: 1px;
//   left: -19px;
//   height: 20px;
//   width: 178px;
//   background-color: var(--v-missionAccent-base);
//   color: var(--v-background-base);
//   padding: 0px 20px 0px 20px;
//   -webkit-clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
//   clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
//   cursor: pointer;
// }

// .inactive-teacher-label {
//   font-size: 0.8rem;
//   font-weight: 400;
//   text-transform: uppercase;
//   // ribbon label
//   position: relative;
//   top: 1px;
//   left: -19px;
//   height: 20px;
//   width: 178px;
//   background-color: var(--v-background-base);
//   color: var(--v-missionAccent-base);
//   padding: 0px 20px 0px 20px;
//   clip-path: polygon(0 100%, 10% 0, 90% 0, 100% 100%);
//   cursor: pointer;
// }

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
