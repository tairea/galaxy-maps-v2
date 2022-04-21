<template>
  <div v-if="currentCohort.id" id="container" class="bg">
    <div id="left-section">
      <CohortInfo />
      <AssignedInfo assignCourses="true" />
      <BackButton :toPath="{path: '/base/cohorts'}" />
    </div>

    <div id="main-section">
      <div class="people-frame">
        <h2 class="people-label" @click="studentsView = true">STUDENTS</h2>
        <div class="graph-label text-center" @click="studentsView = false"><span class="pl-4">OVERVIEW</span></div>
        <StudentDataIterator v-if="studentsView" class="mt-4"/>
        <CohortGraphs v-else/>
      </div>
    </div>

    <div id="right-section">
      <RequestForHelpTeacherFrame :isTeacher="teacher" :courses="courses" class="ml-4"/>
      <SubmissionTeacherFrame v-if="teacher" :courses="courses" class="mt-4"/> 
    </div>
  </div>
</template>

<script>
import CohortInfo from "../components/CohortInfo";
import AssignedInfo from "../components/AssignedInfo";
import StudentDataIterator from "../components/StudentDataIterator";
import BackButton from "../components/BackButton";
import RequestForHelpTeacherFrame from "../components/RequestForHelpTeacherFrame";
import SubmissionTeacherFrame from "../components/SubmissionTeacherFrame";
import CohortGraphs from "../components/CohortView/CohortGraphs"

import { mapState } from "vuex"

export default {
  name: "CohortView",
  components: {
    CohortInfo,
    AssignedInfo,
    BackButton,
    StudentDataIterator,
    RequestForHelpTeacherFrame,
    SubmissionTeacherFrame,
    CohortGraphs
  },
  data () {
    return {
      studentsView: true
    }
  },
  computed: {
    ...mapState(['currentCohort']),
    courses() {
      return this.currentCohort?.courses?.map((course) => {return { id: course }})
    },
    teacher() {
      return this.currentCohort.teacher
    }
  }
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
}

#left-section {
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  overflow-y: scroll;
  padding: 50px 20px;
}

#main-section {
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  padding-top: 50px;
  transition: all .2s ease-in-out;

  .people-frame {
    position: relative;
    width: 100%;
    margin: 30px 20px;
    height: 90%;
    // margin: 30px 20px;
    border: 1px solid var(--v-missionAccent-base);
    overflow: auto;

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
      cursor: pointer;
    }
    .graph-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: absolute;
      top: -1px;
      left: 100px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
    }
  }
}

#right-section {
  width: 30%;
  height: 100%;
  padding-top: 50px;

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
      position: fixed;
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
  width: 1px;
}

/* Track */
::-webkit-scrollbar-track {
  background: var(--v-background-base);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--v-background-base);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--v-background-base);
}
</style>
