<template>
  <div v-if="currentCohort.id" id="container" class="bg">
    <div id="left-section">
      <CohortInfo />
      <AssignedInfo assignCourses="true" />
      <BackButton :toPath="'/cohorts'" />
    </div>

    <div id="main-section">
      <div class="people-frame">
        <div class="people-border">
          <div :class="peopleLabel" @click="studentsView = true">
            <span class="pl-3">STUDENTS</span>
          </div>
        </div>
        <div class="graph-border">
          <div
            :class="graphLabel"
            class="text-center"
            @click="studentsView = false"
          >
            <span class="pl-3">OVERVIEW</span>
          </div>
        </div>
        <StudentDataIterator v-if="studentsView" class="mt-4" />
        <CohortGraphs v-else :cohort="currentCohort" />
      </div>
    </div>

    <div v-if="ready" id="right-section">
      <RequestForHelpTeacherFrame
        :isTeacher="teacher"
        :courses="courses"
        :students="currentCohort.students"
        class="ml-4"
      />
      <SubmissionTeacherFrame
        :isTeacher="teacher"
        :courses="courses"
        :students="teacher ? currentCohort.students : [person]"
        class="mt-4 ml-4"
      />
    </div>
  </div>
</template>

<script>
import CohortInfo from "@/components/CohortInfo.vue";
import AssignedInfo from "@/components/AssignedInfo.vue";
import StudentDataIterator from "@/components/StudentDataIterator.vue";
import BackButton from "@/components/BackButton.vue";
import RequestForHelpTeacherFrame from "@/components/RequestForHelpTeacherFrame.vue";
import SubmissionTeacherFrame from "@/components/SubmissionTeacherFrame.vue";
import CohortGraphs from "@/components/CohortView/CohortGraphs.vue";
import { db } from "@/store/firestoreConfig.ts";
import moment from "moment";
import { mapState } from "vuex";

export default {
  name: "CohortView",
  props: ["cohortId"],
  components: {
    CohortInfo,
    AssignedInfo,
    BackButton,
    StudentDataIterator,
    RequestForHelpTeacherFrame,
    SubmissionTeacherFrame,
    CohortGraphs,
  },
  data() {
    return {
      studentsView: true,
    };
  },
  computed: {
    ...mapState(["currentCohort", "person", "userStatus"]),
    ready() {
      return this.cohortId === this.currentCohort.id;
    },
    courses() {
      return this.currentCohort?.courses?.map((course) => {
        return { id: course };
      });
    },
    teacher() {
      return this.currentCohort.teachers.includes(this.person.id);
    },
    peopleLabel() {
      return this.studentsView ? "people-label" : "inactive-people-label";
    },
    graphLabel() {
      return this.studentsView ? "inactive-graph-label" : "graph-label";
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
  width: 55%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  padding-top: 50px;
  transition: all 0.2s ease-in-out;

  .people-frame {
    position: relative;
    width: 100%;
    margin: 30px 20px;
    height: 90%;
    // margin: 30px 20px;
    border: 1px solid var(--v-missionAccent-base);
    overflow: auto;

    .people-border {
      // ribbon label
      position: absolute;
      top: -1px;
      left: -1px;
      background-color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      cursor: pointer;
      width: 120px;
      height: 22px;
    }

    .people-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      -webkit-clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      cursor: pointer;
      width: 116px;
      height: 20px;
    }

    .inactive-people-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-background-base);
      color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      -webkit-clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      cursor: pointer;
      width: 116px;
      height: 20px;
    }
    .graph-border {
      // ribbon label
      position: absolute;
      top: -1px;
      left: 120px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 120px;
      height: 22px;
    }
    .graph-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 120px;
      height: 22px;
    }

    .inactive-graph-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-background-base);
      color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 116px;
      height: 20px;
    }
  }
}

#right-section {
  width: 25%;
  height: 84%;
  padding-top: 50px;
  margin-right: 35px;
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
