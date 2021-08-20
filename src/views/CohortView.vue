<template>
  <div id="container" class="bg">
    <div id="left-section">
      <CohortInfo :cohort="getCohortById(currentCohortId)" />
      <AssignedInfo
        :assignCourses="true"
        :courses="getCoursesInThisCohort(currentCohortId)"
      />
      <BackButton :toPath="'/cohorts'" />
    </div>

    <div id="main-section">
      <div class="people-frame">
        <h2 class="people-label">STUDENTS</h2>
        <!-- <StudentCard v-for="student in getStudentsByCohortId(currentCohortId)" :key="student.id" :student="student" /> -->
       <!-- <StudentDataTable :students="getStudentsByCohortId(currentCohortId)"/> -->
       <StudentDataIterator :students="getStudentsByCohortId(currentCohortId)"/>


      </div>
    </div>

    <div id="right-section">
      <div class="people-right-frame mb-5">
        <h2 class="people-label">ADD STUDENTS</h2>
        <ImportCsv :currentCohortId="currentCohortId" />
      </div>
    </div>
  </div>
</template>

<script>
import CohortInfo from "../components/CohortInfo";
import AssignedInfo from "../components/AssignedInfo";
import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";
import StudentCard from "../components/StudentCard";
import StudentDataTable from "../components/StudentDataTable";
import StudentDataIterator from "../components/StudentDataIterator";
import Galaxy from "../components/Galaxy";
import BackButton from "../components/BackButton";
import ImportCsv from "../components/ImportCsv";

import { mapState, mapGetters } from "vuex";

export default {
  name: "CohortView",
  components: {
    CohortInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    Galaxy,
    BackButton,
    ImportCsv,
    StudentCard,
    StudentDataTable,
    StudentDataIterator
  },
  props: ["cohortId", "cohortName"],
  mounted() {
    this.bindAll();
  },
  data() {
    return {
      cohort: {},
     
    };
  },
  computed: {
    ...mapState(["currentCohortId"]),
    ...mapGetters([
      "getCohortById",
      "getCoursesInThisCohort",
      "getStudentsByCohortId",
    ]),
  },
  methods: {
    bindAll() {
      this.$store.dispatch("bindCourses");
      this.$store.dispatch("bindStudents");
      this.$store.dispatch("bindOrganisations");
    },
  },
};
</script>

<style lang="scss" scoped>
.searchInput >>> .v-text-field__slot input {
  color: var(--v-missionAccent-base);
}

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
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
}

#main-section {
  width: 50%; // change back to 50% when turn right-section back on
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid pink;

  .people-frame {
    position: relative;
    width: 100%;
    margin: 30px 20px;
    height: 90%;
    // margin: 30px 20px;
    border: 1px solid var(--v-missionAccent-base);
    overflow: scroll;

    .people-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: absolute;
      top: -1px;
      left: -1px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
    }
  }
}

#right-section {
  width: 30%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;

  .people-right-frame {
    position: relative;
    width: 100%;
    margin: 30px 20px;
    min-height: 40%;
    // margin: 30px 20px;
    border: 1px solid var(--v-missionAccent-base);

    .people-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: absolute;
      top: -1px;
      left: -1px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
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
