<template>
  <div>
    <div class="timeframe-chips">
      <TimeframeFilters @timeframe="timeframe = $event" />
    </div>
    <!-- Progression Line Charts -->
    <div>
      <!-- loading spinner -->
      <div
        class="d-flex justify-center align-center"
        style="padding: 50px"
        v-if="cohortsCoursesDataLoading"
      >
        <v-btn
          :loading="cohortsCoursesDataLoading"
          icon
          color="galaxyAccent"
        ></v-btn>
      </div>
      <div v-if="cohortsCoursesData.length > 0" style="padding: 20px">
        <ProgressionLineChart
          v-for="courseData in cohortsCoursesData"
          :key="courseData.id"
          :courseData="courseData"
          :timeframe="timeframe"
          :selectedPersons="selectedPersons"
          :unselectedPersons="unselectedPersons"
          class="line-chart"
        />
      </div>
      <div
        v-else
        class="d-flex justify-center align-center"
        style="padding: 50px 0px"
      >
        <p class="label" style="font-weight: 800">NO COURSE DATA</p>
      </div>
    </div>
    <!-- Activity Bar Chart -->
    <div>
      <!-- loading spinner -->
      <div
        class="d-flex justify-center align-center"
        v-if="cohortActivityDataLoading && !(cohortActivityData.length > 0)"
      >
        <v-btn
          :loading="cohortActivityDataLoading"
          icon
          color="baseAccent"
          class="d-flex justify-center align-center"
        ></v-btn>
      </div>
      <div v-if="cohortActivityData.length > 0" class="pt-0 px-5 pb-4" >
        <ActivityBarChart
          :activityData="cohortActivityData"
          :timeframe="timeframe"
          :selectedPersons="selectedPersons"
          :unselectedPersons="unselectedPersons"
        />
      </div>
      <div
        v-else
        class="d-flex justify-center align-center"
        style="padding: 50px 0px"
      >
        <p class="label" style="font-weight: 800">NO ACTIVITY DATA</p>
      </div>
    </div>
  </div>
</template>
<script>
import ProgressionLineChart from "../../components/ProgressionLineChart";
import ActivityBarChart from "../../components/ActivityBarChart";
import TimeframeFilters from "../../components/TimeframeFilters";

import { getCohortsCourseDataXAPIQuery, getStudentsTimeDataXAPIQuery } from "../../lib/veracityLRS";
import { mapGetters } from 'vuex';

export default {
  name: "CohortGraphs",
  components: {
    ProgressionLineChart,
    ActivityBarChart,
    TimeframeFilters
  },
  data() {
    return {
      cohortsCoursesData: [],
      cohortActivityData: [],
      timeframe: {},
      studentsWithData: [],
      // selectedIndexs: [],
      selectedPersons: [],
      unselectedPersons: [],
      cohortsCoursesDataLoading: false,
      cohortActivityDataLoading: false,
    };
  },
  async mounted() {
    this.cohortsCoursesDataLoading = true;
    this.cohortActivityDataLoading = true;
    // ==== get cohort course data from LRS
    const getCourseData = await getCohortsCourseDataXAPIQuery({
      studentsArr: this.currentCohort.students,
      coursesArr: this.currentCohort.courses,
      cohortName: this.currentCohort.name,
    });
    this.cohortsCoursesData = getCourseData;

    // add students with data
    const studentsArr = [];
    if (this.cohortsCoursesData) {
      for (const course of this.cohortsCoursesData) {
        for (const person of course.students) {
          studentsArr.push(person.person);
        }
      }
      // this flattens any duplicates of students (eg. student 1 is in more than one course. but only want to show them once)
      this.studentsWithData = studentsArr.filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      );
    }

    this.cohortsCoursesDataLoading = false;

    // ==== get cohort activity data from LRS
    const getActivityData = await getStudentsTimeDataXAPIQuery({
      studentsArr: this.currentCohort.students,
    });
    this.cohortActivityData = getActivityData;
    this.cohortActivityDataLoading = false;
  },
  computed: {
    ...mapGetters(['currentCohort'])
  }
}
</script>
<style scoped>
.label {
  color: var(--v-missionAccent-base);
  font-size: 0.7rem;
  margin: 10px;
  text-transform: uppercase;
  width: 100%;
}
.timeframe-chips {
display: flex;
justify-content: center;
}
</style>