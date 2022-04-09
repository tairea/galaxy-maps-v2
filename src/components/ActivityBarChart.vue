<template>
  <div class="course-frame">
    <v-row>
      <v-col cols="12" class="d-flex pa-0">
        <h1 class="galaxy-title pt-2 pl-2">HOURS ACTIVE</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="center-col pa-0">
        <Chart
          v-if="activityData"
          ref="chart"
          class="chart"
          :chartType="chartType"
          :chartData="formatStudentsChartData(activityData)"
          :chartOptions="chartOptions"
          :style="{ width: '100%', height: '200px' }"
          :toolTipEnable="false"
          :timeframe="timeframe"
          :selectedPersons="selectedPersons"
          :unselectedPersons="unselectedPersons"
        />
      </v-col>
      <!-- <v-col cols="4" class="pa-0">
        <div class="top-row">
          <p class="label">MOST ACTIVE:</p>
        </div>
        <div class="bottom-row my-3">
          <p class="label">LEAST ACTIVE:</p>
        </div>
      </v-col> -->
    </v-row>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Chart from "@/components/Chart.vue";
import { DateTime } from "luxon";
import { dbMixins } from "../mixins/DbMixins";
import { colours, names } from "../lib/utils";

export default {
  name: "ActivityBarChart",
  props: ["activityData", "timeframe", "selectedPersons", "unselectedPersons"],
  components: {
    Chart,
  },
  mixins: [dbMixins],

  data() {
    return {
      value: 80,
      previousTickTitle: "",
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
          xAxis: {
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
  async mounted() {},
  computed: {
    // ...mapGetters(["person", "getCourseById", "getTopicById"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    formatStudentsChartData(studentData) {
      // console.log("courseData", courseData);
      const datasets = [];
      const data = [];
      let labels = [];

      // more than one student in a cohort so loop
      for (const [index, student] of studentData.entries()) {
        const person = student.person;

        const label = person.firstName + " " + person.lastName;

        // calc total depending on timeframe.type (eg. fortnight, calculate days totals for that timeframes fortnight)
        const time = 0;
        switch (this.timeframe.type) {
          case "day":
            const dayRes = student.activity.find((day) => {
              const statement = DateTime.fromISO(
                day.dayISOTimestamp
              ).toMillis();
              let timeframe = DateTime.fromJSDate(
                this.timeframe.max
              ).toISODate();
              timeframe = DateTime.fromISO(timeframe).toMillis();
              return statement == timeframe;
            });
            if (dayRes) {
              time = dayRes.minutesActiveTotal;
            }
            break;
          case "week":
            const weekRes = student.activity
              .filter((day) => {
                return (
                  DateTime.fromISO(day.dayISOTimestamp) >
                    DateTime.fromJSDate(this.timeframe.min) &&
                  DateTime.fromISO(day.dayISOTimestamp) <
                    DateTime.fromJSDate(this.timeframe.max)
                );
              })
              .reduce((sum, activity) => sum + activity.minutesActiveTotal, 0);
            // console.log("got week total");
            // console.log(weekRes);
            time = weekRes;
            break;

          case "fortnight":
            const fortnightRes = student.activity
              .filter((day) => {
                return (
                  DateTime.fromISO(day.dayISOTimestamp) >
                    DateTime.fromJSDate(this.timeframe.min) &&
                  DateTime.fromISO(day.dayISOTimestamp) <
                    DateTime.fromJSDate(this.timeframe.max)
                );
              })
              .reduce((sum, activity) => sum + activity.minutesActiveTotal, 0);
            // console.log("got fortnight total");
            // console.log(fortnightRes);
            time = fortnightRes;
            break;
          default:
        }

        // console.log("total minutes for " + this.timeframe.type + " = " + time);

        const dataPointObj = {
          x: label,
          y: time / 60, // minutes to hours
          // y: Math.random(0, 100) * 100,
        };

        labels.push(label);
        data.push(dataPointObj);
      }

      // ==== test 30 students ===
      // for (var x = 0; x < 50; x++) {
      //   const label = names[x];

      //   const dataPointObj = {
      //     x: label,
      //     // y: time / 60, // minutes to hours
      //     y: Math.random() * 10,
      //   };

      //   labels.push(label);
      //   data.push(dataPointObj);
      // }

      let dataset = {
        label: "Hours Online",
        data: data,
        backgroundColor: this.dark
          ? this.$vuetify.theme.themes.dark.baseAccent
          : this.$vuetify.theme.themes.light.baseAccent,
        borderColor: this.dark
          ? this.$vuetify.theme.themes.dark.baseAccent
          : this.$vuetify.theme.themes.light.baseAccent,
        categoryPercentage: 1.0,
        barPercentage: 0.7,
      };

      datasets.push(dataset);
      const datasetsObj = {
        labels,
        datasets,
      };

      // console.log("bar chart datasets: ", datasetsObj);
      return datasetsObj;
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
