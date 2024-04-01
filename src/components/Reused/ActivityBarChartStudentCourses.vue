<template>
  <div class="course-frame">
    <v-row>
      <v-col cols="12" class="d-flex pa-0">
        <h1 class="galaxy-title pt-2 pl-2">{{ student.firstName }}'s HOURS ACTIVE</h1>
        <h1 class="galaxy-title pt-2 pl-2">
          <span style="font-weight: 400; text-transform: none; font-style: italic">
            (Each bar represents a Galaxy Map)</span
          >
        </h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="center-col pa-0">
        <Chart
          v-if="chartData?.labels?.length > 0"
          ref="chart"
          class="chart"
          :chartType="chartType"
          :chartData="chartData"
          :chartOptions="chartOptions"
          :style="{ width: '100%', height: '350px' }"
          :toolTipEnable="true"
          :timeframe="timeframe"
        />
        <div v-else>
          <p class="overline d-flex justify-center align-center ma-6 galaxyAccent--text">
            NO TIME DATA
          </p>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { fetchStudentCoursesTimeDataByPersonIdStartAtEndAt } from "@/lib/ff";
import Chart from "@/components/Reused/Chart.vue";
import useRootStore from "@/store/index";
import { DateTime } from "luxon";

export default {
  name: "ActivityBarChartStudentCourses",
  props: ["activityData", "timeframe", "student"],
  components: {
    Chart,
  },

  data() {
    return {
      value: 80,
      previousTickTitle: "",
      chartData: null,
      chartType: "bar",
      chartOptions: {
        // maintainAspectRatio: false,
        layout: {
          padding: {
            // left: 5,
            // right: 20,
            // top: 15,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        scales: {
          x: {
            type: "category",
            ticks: {
              display: true,
              autoSkip: false,
              maxRotation: 90,
              minRotation: 90,
              font: {
                size: 10,
              },
            },
          },
          // y: {
          //   // ticks: {
          //   //   precision: 0,
          //   // },
          // },
        },
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
      },
    };
  },
  computed: {
    // ...mapState(useRootStore, ["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  mounted() {
    this.formatStudentsChartData(this.activityData);
  },
  watch: {
    timeframe() {
      this.getStudentTimeData();
    },
  },
  methods: {
    async getStudentTimeData() {
      this.studentTimeDataLoading = true;
      const courseHours = await fetchStudentCoursesTimeDataByPersonIdStartAtEndAt(
        this.student.id,
        this.timeframe.min.toISOString(),
        this.timeframe.max.toISOString(),
      );
      this.timeData = courseHours;
      this.studentTimeDataLoading = false;
      // console.log("course HOURS for ", this.student.firstName + ": ", this.timeData);

      this.formatStudentsChartData(courseHours);
    },
    formatStudentsChartData(studentData) {
      const data = [];
      let labels = [];

      // more than one student in a cohort so loop
      for (const courseAndHoursObj of studentData) {
        const course = courseAndHoursObj.course;
        const label = course.title;

        data.push(courseAndHoursObj.hours);
        labels.push(label);
      }

      console.log("LABELS: ", labels);

      // // ==== test 30 students ===
      // for (var x = 0; x < 50; x++) {
      //   const label = names[x];
      //   data.push(Math.random() * 10);
      //   labels.push(label);
      // }

      // merge data and labels into one array for sorting
      const chartData = data.map((value, index) => {
        return {
          data: value,
          label: labels[index],
        };
      });

      // sort dataset by data
      chartData?.sort((a, b) => a.data - b.data);

      const dataset = {
        label: "Hours Online",
        data: chartData.map((item) => item.data),
        backgroundColor: this.dark
          ? this.$vuetify.theme.themes.dark.baseAccent
          : this.$vuetify.theme.themes.light.baseAccent,
        borderColor: this.dark
          ? this.$vuetify.theme.themes.dark.baseAccent
          : this.$vuetify.theme.themes.light.baseAccent,
        categoryPercentage: 1.0,
        barPercentage: 0.7,
        maxBarThickness: 50,
      };

      this.chartData = {
        labels: chartData.map((item) => item.label),
        datasets: [dataset],
      };
    },
    stringToColour(str) {
      return `hsl(${this.hashCode(str) % 360}, 100%, 70%)`;
    },
    hashCode(str) {
      let hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    },
    first3Letters(name) {
      if (!name) return;
      return name.substring(0, 3).toUpperCase();
    },
    barWidth(labels) {
      return 100 / labels.length;
    },
  },
};
</script>

<style lang="scss" scoped>
.course-frame {
  border: 1px solid var(--v-galaxyAccent-base);
  margin-left: auto;
  margin-right: auto;
  padding: 15px;
  border-radius: 5px;
  // margin-bottom: 20px;

  .left-col {
    padding: 20px;
  }
}

.galaxy-title {
  font-size: 0.8rem;
  color: var(--v-galaxyAccent-base) !important;
  font-weight: 600;
  text-transform: uppercase;
  // margin: 20px 0px 5px 0px;
  color: white;
}

.galaxy-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.galaxy-description {
  margin-top: 10px;
  color: var(--v-galaxyAccent-base);
  font-size: 0.9rem;
}

.top-row {
  width: 100%;
  border-bottom: 1px solid var(--v-galaxyAccent-base);
  height: 50%;
}

.bottom-row {
  height: 50%;
}

.label {
  color: var(--v-galaxyAccent-base);
  font-size: 0.7rem;
  margin: 10px;
}

.imagePlaceholder {
  border-radius: 50%;
  background-color: rgba(200, 200, 200, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.6rem;
}
</style>
