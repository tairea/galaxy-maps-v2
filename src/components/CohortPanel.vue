<template>
  <div class="d-flex flex-column cohort-panel">
    <!-- top row -->
    <div
      class="row-border"
      @click="!studentView ? routeToCohort(cohort) : null"
      :style="!studentView ? 'cursor: pointer;' : ''"
    >
      <div class="d-flex justify-start align-center pa-2">
        <v-img
          v-if="cohort.image.url"
          :src="cohort.image.url"
          max-width="60px"
          max-height="60px"
          class="cohort-image"
        ></v-img>
        <div v-else class="imagePlaceholder">
          {{ first3Letters(cohort.name) }}
        </div>
        <h3 class="ml-4" style="width: 50%">{{ cohort.name }}</h3>
        <div class="d-flex">
          <p class="label">Teachers:</p>
          <div v-if="cohort.teachers">
            <Avatar
              v-for="teacherId in cohort.teachers"
              :key="teacherId.id"
              :size="40"
              :personId="teacherId"
            />
          </div>
          <p v-else class="label" style="font-weight: 800">NO TEACHERS</p>
        </div>
      </div>
    </div>
    <!-- Middle chip row -->
    <div v-if="cohortsCoursesData" class="row-border d-flex justify-end">
      <v-chip
        class="my-2 mx-1 custom-chip"
        color="missionAccent"
        outlined
        x-small
        @click="previous"
      >
        &lt;
      </v-chip>
      <v-chip
        class="my-2 mx-1 custom-chip"
        color="missionAccent"
        outlined
        x-small
        :input-value="chipDayActive"
        filter
        filter-icon="mdi-circle-small"
        @click="timeframeDay"
      >
        Day
      </v-chip>
      <v-chip
        class="my-2 mx-1 custom-chip"
        color="missionAccent"
        outlined
        x-small
        :input-value="chipWeekActive"
        filter
        filter-icon="mdi-circle-small"
        @click="timeframeWeek"
      >
        Week
      </v-chip>
      <v-chip
        class="my-2 mx-1 custom-chip"
        color="missionAccent"
        :input-value="chipFortnightActive"
        filter
        filter-icon="mdi-circle-small"
        outlined
        x-small
        @click="timeframeFortnight"
      >
        Fortnight
      </v-chip>
      <v-chip class="my-2 mx-1 custom-chip" color="missionAccent" outlined x-small @click="next">
        &gt;
      </v-chip>
    </div>
    <!-- Middle student avatars row -->
    <div class="row-border">
      <div v-if="cohort.students" class="d-flex justify-center align-center">
        <Avatar
          v-for="(person, index) in studentsWithData"
          ref="avatar"
          :key="person.id"
          :size="30"
          :personId="person.id"
          class="my-2 mx-1 avatar"
          :colourBorder="true"
          @click.native="clickedPerson(person, index)"
        />
      </div>
      <p v-else class="label text-center pa-4" style="font-weight: 800">NO STUDENT DATA</p>
    </div>
    <!-- Middle Bar chart row -->
    <div>
      <div v-if="cohortActivityData" style="padding: 20px">
        <ActivityBarChart
          :activityData="cohortActivityData"
          :timeframe="timeframe"
          :selectedPersons="selectedPersons"
          :unselectedPersons="unselectedPersons"
        />
      </div>
      <div v-else class="d-flex justify-center align-center" style="padding: 50px 0px">
        <p class="label" style="font-weight: 800">NO COURSE DATA</p>
      </div>
    </div>
    <!-- Bottom chart row -->
    <div>
      <div v-if="cohortsCoursesData" style="padding: 20px">
        <ProgressionLineChart
          v-for="courseData in cohortsCoursesData"
          :key="courseData.id"
          :courseData="courseData"
          :timeframe="timeframe"
          :selectedPersons="selectedPersons"
          :unselectedPersons="unselectedPersons"
        />
      </div>
      <div v-else class="d-flex justify-center align-center" style="padding: 50px 0px">
        <p class="label" style="font-weight: 800">NO COURSE DATA</p>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "@/components/Reused/Avatar.vue";
import ProgressionLineChart from "@/components/ProgressionLineChart.vue";
import ActivityBarChart from "@/components/Reused/ActivityBarChart.vue";
import { getCohortsCourseDataXAPIQuery, getStudentsTimeDataXAPIQuery } from "@/lib/veracityLRS";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "CohortPanel",
  props: ["cohort", "cols", "tooltip", "studentView"],
  components: {
    Avatar,
    ProgressionLineChart,
    ActivityBarChart,
  },
  data() {
    return {
      cohortsCoursesData: [],
      cohortActivityData: [],
      timeframe: {
        min: this.previousDays(7),
        max: new Date(),
        unit: "day",
        type: "week",
      }, // by default show past 7 days
      chipActiveType: "week",
      chipDayActive: false,
      chipWeekActive: true,
      chipFortnightActive: false,
      studentsWithData: [],
      selectedIndexs: [],
      selectedPersons: [],
      unselectedPersons: [],
    };
  },

  async mounted() {
    const getCourseData = await getCohortsCourseDataXAPIQuery({
      studentsArr: this.cohort.students,
      coursesArr: this.cohort.courses,
      cohortName: this.cohort.name,
    });
    this.cohortsCoursesData = getCourseData;
    // console.log("this.cohortsCoursesData", this.cohortsCoursesData);
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
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
      );
    }

    // ==== get cohort activity data from LRS
    const getActivityData = await getStudentsTimeDataXAPIQuery({
      studentsArr: this.cohort.students,
    });
    this.cohortActivityData = getActivityData;
    console.log("this.cohortActivityData", this.cohortActivityData);

    // ==== VQL Test
    // const VQL = await VQLXAPIQuery();
  },
  computed: {
    ...mapState(useRootStore, []),
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCohortId"]),
    clickedPerson(person, index) {
      // get all avatar elements
      const avatarEls = this.$refs.avatar;
      // loop avatar els
      for (let i = 0; i < avatarEls.length; i++) {
        // add index to selected if not already. else remove
        if (i == index && !this.selectedIndexs.includes(index)) {
          this.selectedIndexs.push(index);
          this.selectedPersons.push(person);
        }
        // remove
        else if (i == index && this.selectedIndexs.includes(index)) {
          this.selectedIndexs = this.selectedIndexs.filter((item) => item !== index);
          this.selectedPersons = this.selectedPersons.filter(
            (selectedPerson) => selectedPerson.id !== person.id,
          );
          this.unselectedPersons.push(person);
        }

        //anyone not in selectedPersons becomes unselected (this is used to hide data in chart)
        this.unselectedPersons = this.diffTwoArraysOfObjects(
          this.studentsWithData,
          this.selectedPersons,
        );

        // add dim to all avatar els
        for (let y = 0; y < avatarEls.length; y++) {
          avatarEls[y].$el.classList.add("dim");
        }
        //remove dim for selected avatar els
        for (let x = 0; x < this.selectedIndexs.length; x++) {
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
    timeframeFortnight() {
      this.chipActiveType = "fortnight";
      this.chipDayActive = false;
      this.chipWeekActive = false;
      this.chipFortnightActive = true;
      this.timeframe = {
        min: this.previousDays(14),
        max: new Date(),
        unit: "day",
        type: "fortnight",
      };
    },
    timeframeWeek() {
      this.chipActiveType = "week";
      this.chipDayActive = false;
      this.chipFortnightActive = false;
      this.chipWeekActive = true;
      this.timeframe = {
        min: this.previousDays(7),
        max: new Date(),
        unit: "day",
        type: "week",
      };
    },
    timeframeDay() {
      this.chipActiveType = "day";
      this.chipFortnightActive = false;
      this.chipWeekActive = false;
      this.chipDayActive = true;
      this.timeframe = {
        min: this.getStartDay(),
        max: this.getEndDay(),
        unit: "hour",
        type: "day",
      };
    },
    getStartDay() {
      let startDay = new Date().setHours(0);
      startDay = new Date(startDay).setMinutes(0);
      startDay = new Date(startDay);
      return startDay;
    },
    getEndDay() {
      let endDay = new Date().setHours(23);
      endDay = new Date(endDay).setMinutes(59);
      endDay = new Date(endDay);
      return endDay;
    },
    previous() {
      let previousTimeframe = {};
      switch (this.chipActiveType) {
        case "day":
          // change min max by 1 day
          previousTimeframe = {
            min: this.previousDays(1, this.timeframe.min),
            max: this.previousDays(1, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = previousTimeframe;
          break;
        case "week":
          // change min max by 7 day
          previousTimeframe = {
            min: this.previousDays(7, this.timeframe.min),
            max: this.previousDays(7, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = previousTimeframe;
          break;
        case "fortnight":
          // change min max by 14 day
          previousTimeframe = {
            min: this.previousDays(14, this.timeframe.min),
            max: this.previousDays(14, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = previousTimeframe;
          break;
        default:
          break;
      }
    },
    next() {
      let nextTimeframe = {};
      switch (this.chipActiveType) {
        case "day":
          // change min max by 1 day
          nextTimeframe = {
            min: this.nextDays(1, this.timeframe.min),
            max: this.nextDays(1, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = nextTimeframe;
          break;
        case "week":
          // change min max by 7 day
          nextTimeframe = {
            min: this.nextDays(7, this.timeframe.min),
            max: this.nextDays(7, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = nextTimeframe;
          break;
        case "fortnight":
          // change min max by 14 day
          nextTimeframe = {
            min: this.nextDays(14, this.timeframe.min),
            max: this.nextDays(14, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = nextTimeframe;
          break;
        default:
          break;
      }
    },
    previousDays(num, start) {
      const d = start ? new Date(start) : new Date();
      d.setDate(d.getDate() - num);
      return d;
    },
    nextDays(num, start) {
      const d = start ? new Date(start) : new Date();
      d.setDate(d.getDate() + num);
      return d;
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    routeToCohort() {
      console.log("====== ROUTE TO COHORT =======");
      this.setCurrentCohortId(this.cohort.id);
      // console.log('cohort set: ', cohort)
      // route to Galaxy View (passing params as props)
      this.$router.push({
        name: "CohortView",
        params: {
          cohortName: this.camelize(this.cohort.name),
          cohortId: this.cohort.id,
        },
      });
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.cohort-panel {
  border: 1px solid var(--v-missionAccent-base);
  width: 90%;
  margin: auto;
  margin-bottom: 50px;

  .cohort-image {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }

  .imagePlaceholder {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: rgba(200, 200, 200, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .cohort-name {
    text-align: center;
    font-size: 0.65rem !important;
    line-height: 1rem;
    padding-top: 10px;
  }

  .row-border {
    border-bottom: 1px solid var(--v-missionAccent-base);
  }
}

.border-test {
  border: 1px solid red;
}

.label {
  color: var(--v-missionAccent-base);
  font-size: 0.7rem;
  margin: 10px;
  text-transform: uppercase;
}

.custom-chip {
  padding: 10px;
  text-transform: uppercase;
}

.dim {
  filter: opacity(30%);
}
</style>
