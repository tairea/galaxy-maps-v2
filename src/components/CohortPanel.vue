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
        class="ma-2 custom-chip"
        color="missionAccent"
        outlined
        x-small
        @click="previous"
      >
        <
      </v-chip>
      <v-chip
        class="ma-2 custom-chip"
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
        class="ma-2 custom-chip"
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
        class="ma-2 custom-chip"
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
      <v-chip
        class="ma-2 custom-chip"
        color="missionAccent"
        outlined
        x-small
        @click="next"
      >
        >
      </v-chip>
    </div>
    <div>
      <div v-if="cohortsCoursesData" style="padding: 20px">
        <ProgressionChart
          v-for="courseData in cohortsCoursesData"
          :key="courseData.id"
          :courseData="courseData"
          :timeframe="timeframe"
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
  </div>
</template>

<script>
import { mapActions } from "vuex";
import Avatar from "../components/Avatar";
import ProgressionChart from "../components/ProgressionChart";
import { getCohortsCourseDataXAPIQuery } from "../lib/veracityLRS";

export default {
  name: "CohortPanel",
  props: ["cohort", "cols", "tooltip", "studentView"],
  components: {
    Avatar,
    ProgressionChart,
  },
  data() {
    return {
      cohortsCoursesData: [],
      timeframe: { min: this.previousDays(7), max: new Date(), unit: "day" }, // by default show past 7 days
      chipActiveType: "week",
      chipDayActive: false,
      chipWeekActive: true,
      chipFortnightActive: false,
    };
  },
  computed: {},
  async mounted() {
    const getCourseData = await getCohortsCourseDataXAPIQuery({
      studentsArr: this.cohort.students,
      coursesArr: this.cohort.courses,
      cohortName: this.cohort.name,
    });
    // .then(() => {
    //   console.log("get cohort data from LRS done");
    // });
    this.cohortsCoursesData = getCourseData;
  },
  methods: {
    ...mapActions(["setCurrentCohort"]),
    timeframeFortnight() {
      this.chipActiveType = "fortnight";
      this.chipDayActive = false;
      this.chipWeekActive = false;
      this.chipFortnightActive = true;
      this.timeframe = {
        min: this.previousDays(14),
        max: new Date(),
        unit: "day",
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
      };
    },
    getStartDay() {
      let startDay = new Date().setHours(0);
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
          };
          this.timeframe = previousTimeframe;
          break;
        case "week":
          // change min max by 7 day
          previousTimeframe = {
            min: this.previousDays(7, this.timeframe.min),
            max: this.previousDays(7, this.timeframe.max),
            unit: this.timeframe.unit,
          };
          this.timeframe = previousTimeframe;
          break;
        case "fortnight":
          // change min max by 14 day
          previousTimeframe = {
            min: this.previousDays(14, this.timeframe.min),
            max: this.previousDays(14, this.timeframe.max),
            unit: this.timeframe.unit,
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
          };
          this.timeframe = nextTimeframe;
          break;
        case "week":
          // change min max by 7 day
          nextTimeframe = {
            min: this.nextDays(7, this.timeframe.min),
            max: this.nextDays(7, this.timeframe.max),
            unit: this.timeframe.unit,
          };
          this.timeframe = nextTimeframe;
          break;
        case "fortnight":
          // change min max by 14 day
          nextTimeframe = {
            min: this.nextDays(14, this.timeframe.min),
            max: this.nextDays(14, this.timeframe.max),
            unit: this.timeframe.unit,
          };
          this.timeframe = nextTimeframe;
          break;
        default:
          break;
      }
    },

    previousDays(num, start) {
      if (!start) {
        var d = new Date();
      } else {
        var d = new Date(start);
      }
      d.setDate(d.getDate() - num);
      return d;
    },
    nextDays(num, start) {
      if (!start) {
        var d = new Date();
      } else {
        var d = new Date(start);
      }
      d.setDate(d.getDate() + num);
      return d;
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    async routeToCohort() {
      // this.$store.commit("setCurrentCohort", {})
      await this.setCurrentCohort(this.cohort);
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
</style>
