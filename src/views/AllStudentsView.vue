<template>
  <div id="container" class="bg">
    <!-- REVIEW WORK PANEL -->
    <div id="left-section"></div>

    <!-- STUDENT PROGRESSION PANEL -->
    <div id="main-section">
      <div id="student-panel">
        <h2 class="student-label">All Users</h2>
        <div>
          <v-btn
            v-if="loadingStudents"
            :loading="loadingStudents"
            icon
            color="missionAccent"
          ></v-btn>
          <StudentDataIteratorAdmin v-else class="mt-4" />
        </div>
      </div>
    </div>

    <!-- REQUESTS FOR HELP PANEL -->
    <div class="d-flex flex-column" id="right-section"></div>
  </div>
</template>

<script>
import SubmissionTeacherFrame from "@/components/Reused/SubmissionTeacherFrame.vue";
import RequestForHelpTeacherFrame from "@/components/Reused/RequestForHelpTeacherFrame.vue";
import StudentProgressionChartJs3 from "@/components/AllStudentsView/StudentProgressionChartJs3.vue";
import StudentDataIteratorAdmin from "@/components/AllStudentsView/StudentDataIteratorAdmin.vue";
import useRootStore from "@/store/index";
import { mapState, mapActions } from "pinia";

export default {
  name: "AllStudentView",
  components: {
    SubmissionTeacherFrame,
    RequestForHelpTeacherFrame,
    StudentProgressionChartJs3,
    StudentDataIteratorAdmin,
  },
  props: [],
  async mounted() {
    this.progressLoading = true;
  },
  async mounted() {
    this.loadingStudents = true;
    await this.bindAllPeople();
    this.loadingStudents = false;
  },
  computed: {
    ...mapState(useRootStore, ["user", "people", "person", "personsCourses"]),
  },
  data() {
    return {
      submissionsLoading: false,
      requestsForHelpLoading: false,
      progressLoading: false,
      allSubmissions: [],
      allRequestsForHelp: [],
      loadingStudents: false,
    };
  },

  methods: {
    ...mapActions(useRootStore, ["bindAllPeople"]),
    // async bindStudentTaskProgress() {
    //   await this.getEachStudentsProgressForTeacher(
    //     this.user.data.id
    //   );
    //   this.progressLoading = false;
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
  width: 20%;
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

#student-panel {
  width: calc(100% - 30px);
  height: 80%;
  border: 1px solid var(--v-missionAccent-base);
  margin-top: 30px;

  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
  overflow-y: scroll;

  .student-label {
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

#main-section {
  width: 60%;
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
  width: 20%;
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
