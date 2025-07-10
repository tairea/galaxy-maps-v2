<template>
  <div id="container" class="bg">
    <LoadingSpinner v-if="isLoadingCohort" text="loading squad" />
    <div id="left-section">
      <CohortInfo v-if="!isLoadingCohort && cohort" :cohort="cohort" />
      <BackButton v-if="!isLoadingCohort" :toPath="'/squads'" />
      <AssignedInfo v-if="!isLoadingCohort && cohort" :cohort="cohort" assignCourses="true" />
    </div>

    <div id="main-section">
      <!-- loading spinner -->
      <div class="d-flex justify-center align-center" v-if="isLoadingCohort">
        <v-btn
          :loading="isLoadingCohort"
          icon
          color="missionAccent"
          class="d-flex justify-center align-center"
        ></v-btn>
      </div>
      <div v-if="cohort" class="people-frame">
        <div class="people-border">
          <div :class="peopleLabel" @click="setStudentsView(true)">
            <span class="pl-3">NAVIGATORS</span>
          </div>
        </div>
        <div class="graph-border">
          <div :class="graphLabel" class="text-center" @click="setStudentsView(false)">
            <span class="pl-3">OVERVIEW</span>
          </div>
        </div>
        <StudentDataIterator
          v-if="studentsView"
          class="mt-4"
          :cohort="cohort"
          @learnerOverviewDialogClosed="refreshComponents"
        />
        <CohortGraphs v-else :cohort="cohort" :cohortsCoursesData="cohortsCoursesData" />
      </div>
    </div>

    <div id="right-section">
      <RequestForHelpTeacherFrame
        v-if="cohort"
        :key="refreshRequests"
        :isTeacher="teacher"
        :courses="courses"
        :students="cohort.students"
      />
      <SubmissionTeacherFrame
        v-if="cohort && teacher"
        :key="refreshSubmissions"
        :isTeacher="teacher"
        :courses="courses"
        :students="cohort.students"
        class="mt-4"
      />
      <!-- Completed Separate -->
      <!-- <p class="baseAccent--text completed-label ma-0 py-6">COMPLETED</p>
      <RequestForHelpTeacherFrame
        :isTeacher="teacher"
        :courses="courses"
        :students="cohort.students"
        :completedRequestsOnly="true"
        class="mt-0"
      />
      <SubmissionTeacherFrame
        v-if="teacher"
        :isTeacher="teacher"
        :courses="courses"
        :students="cohort.students"
        :completedSubmissionsOnly="true"
        class="mt-4"
      /> -->
    </div>
  </div>
</template>

<script>
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import CohortInfo from "@/components/CohortView/CohortInfo.vue";
import AssignedInfo from "@/components/Reused/AssignedInfo.vue";
import StudentDataIterator from "@/components/CohortView/StudentDataIterator.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import RequestForHelpTeacherFrame from "@/components/Reused/RequestForHelpTeacherFrame.vue";
import SubmissionTeacherFrame from "@/components/Reused/SubmissionTeacherFrame.vue";
import CohortGraphs from "@/components/CohortView/CohortGraphs.vue";
import { fetchCohortCoursesActivityByCohortId } from "@/lib/ff";
import useRootStore from "@/store/index";
import useCohortViewStore from "@/store/cohortView";
import { mapActions, mapState } from "pinia";

export default {
  name: "CohortView",
  props: ["cohortId"],
  components: {
    LoadingSpinner,
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
      cohortsCoursesData: [],
      refreshSubmissions: 0, // TODO: Is this needed? is causing duplicate error
      refreshRequests: 0,
    };
  },
  async mounted() {
    await this.loadCohort(this.cohortId);

    // ==== get cohort course data from LRS
    this.cohortsCoursesData = await fetchCohortCoursesActivityByCohortId(this.cohort.id);
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId", "person", "userStatus"]),
    ...mapState(useCohortViewStore, ["studentsView", "isLoadingCohort", "cohort"]),
    ready() {
      return this.cohortId === this.currentCohortId && this.cohort != null;
    },
    courses() {
      return this.cohort?.courses?.map((course) => {
        return { id: course };
      });
    },
    teacher() {
      return this.cohort.teachers.includes(this.person.id);
    },
    peopleLabel() {
      return this.studentsView ? "people-label" : "inactive-people-label";
    },
    graphLabel() {
      return this.studentsView ? "inactive-graph-label" : "graph-label";
    },
  },
  methods: {
    ...mapActions(useCohortViewStore, ["loadCohort", "setStudentsView"]),
    // hack to update TeacherFrames. (this is because LearnerOveriewDashboard uses the same
    // components and when you close the dialog, the cohortview teacher frames are empty. issue#121)
    refreshComponents() {
      this.refreshSubmissions++;
      this.refreshRequests++;
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
  width: 15%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  overflow-y: auto;
  padding: 50px 0px;
  margin-left: 5%;
}

#main-section {
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  padding-top: 50px;
  margin: 0px 5%;
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
  width: 15%;
  height: 84%;
  padding-top: 50px;
  // margin-right: 35px;
  margin-right: 5%;
  overflow-y: auto;

  .completed-label {
    font-weight: 500;
    letter-spacing: 0.05rem;
    font-size: 0.8rem;
    text-align: center;
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
