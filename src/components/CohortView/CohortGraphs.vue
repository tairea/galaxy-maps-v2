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
          color="missionAccent"
        ></v-btn>
      </div>
      <div v-else-if="cohortsCoursesData.length > 0" style="padding: 20px">
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
        <p class="label text-center" style="font-weight: 800">NO COURSE DATA</p>
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
          color="missionAccent"
          class="d-flex justify-center align-center"
        ></v-btn>
      </div>
      <div v-else-if="cohortActivityData.length > 0" class="pt-0 px-5 pb-4">
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
        <p class="label text-center" style="font-weight: 800">
          NO ACTIVITY DATA
        </p>
      </div>
    </div>

    <!-- Toggle student data -->
    <div class="student-row">
      <!-- loading spinner -->
      <div
        class="d-flex justify-center align-center"
        style="padding: 50px"
        v-if="cohort.students.length == 0"
      >
        <v-btn :loading="true" icon color="missionAccent"></v-btn>
      </div>
      <div
        v-else-if="cohort.students.length > 0"
        class="d-flex justify-center align-center flex-wrap py-2"
      >
        <p class="label text-center mt-4 mb-2">
          Students: <i>(Selected students to only show their data)</i>
        </p>
        <Avatar
          v-for="(person, index) in studentsWithData"
          ref="avatar"
          :key="person.id"
          :size="50"
          :personId="person.id"
          class="my-2 mx-1 avatar"
          :colourBorder="true"
          @click.native="clickedPerson(person, index)"
        />
      </div>
      <p v-else class="label text-center" style="font-weight: 800">
        NO STUDENT DATA
      </p>
    </div>
  </div>
</template>
<script>
import ProgressionLineChart from "@/components/ProgressionLineChart.vue";
import ActivityBarChart from "@/components/ActivityBarChart.vue";
import TimeframeFilters from "@/components/TimeframeFilters.vue";
import Avatar from "@/components/Avatar.vue";
import {
  getCohortsCourseDataXAPIQuery,
  getStudentsTimeDataXAPIQuery,
} from "@/lib/veracityLRS.js";
import { mapGetters } from "vuex";

export default {
  name: "CohortGraphs",
  props: ["cohort"],
  components: {
    ProgressionLineChart,
    ActivityBarChart,
    TimeframeFilters,
    Avatar,
  },
  data() {
    return {
      cohortsCoursesData: [],
      cohortActivityData: [],
      timeframe: {},
      studentsWithData: [],
      selectedIndexs: [],
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
    ...mapGetters(["currentCohort"]),
  },
  methods: {
    clickedPerson(person, index) {
      // get all avatar elements
      const avatarEls = this.$refs.avatar;
      // loop avatar els
      for (var i = 0; i < avatarEls.length; i++) {
        // add index to selected if not already. else remove
        if (i == index && !this.selectedIndexs.includes(index)) {
          this.selectedIndexs.push(index);
          this.selectedPersons.push(person);
        }
        // remove
        else if (i == index && this.selectedIndexs.includes(index)) {
          this.selectedIndexs = this.selectedIndexs.filter(
            (item) => item !== index
          );
          this.selectedPersons = this.selectedPersons.filter(
            (selectedPerson) => selectedPerson.id !== person.id
          );
          this.unselectedPersons.push(person);
        }

        //anyone not in selectedPersons becomes unselected (this is used to hide data in chart)
        this.unselectedPersons = this.diffTwoArraysOfObjects(
          this.studentsWithData,
          this.selectedPersons
        );

        // add dim to all avatar els
        for (var y = 0; y < avatarEls.length; y++) {
          avatarEls[y].$el.classList.add("dim");
        }
        //remove dim for selected avatar els
        for (var x = 0; x < this.selectedIndexs.length; x++) {
          avatarEls[this.selectedIndexs[x]].$el.classList.remove("dim");
        }
      }
    },
    diffTwoArraysOfObjects(array1, array2) {
      return array1.filter((object1) => {
        return !array2.some((object2) => {
          return object1.id === object2.id;
        });
      });
    },
  },
};
</script>
<style scoped>
.label {
  color: var(--v-missionAccent-base);
  font-size: 0.7rem;
  /* margin: 10px; */
  text-transform: uppercase;
  width: 100%;
}
.timeframe-chips {
  display: flex;
  justify-content: center;
}

.dim {
  filter: opacity(30%);
}
</style>
