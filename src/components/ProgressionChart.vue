<template>
  <div class="course-frame">
    <v-row>
      <v-col cols="2" class="left-col">
        <h1 class="galaxy-title">
          {{ courseData.course.title }}
        </h1>
        <v-img class="galaxy-image" :src="courseData.course.image.url"></v-img>
        <!-- <p class="galaxy-description">
            {{ course.courseContext.description }}
          </p> -->
      </v-col>
      <v-col cols="10" class="center-col">
        <Chart
          ref="chart"
          id="chartImage"
          :chartType="chartType"
          :chartData="formatStudentsChartData(courseData)"
          :chartOptions="chartOptions"
          :style="{ width: '100%', height: '200px', padding: '20px' }"
          :toolTipEnable="false"
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

export default {
  name: "ProgressionChart",
  props: ["courseData"],
  components: {
    Chart,
  },
  mixins: [dbMixins],
  data() {
    return {
      value: 80,
      previousTickTitle: "",
      chartType: "line",
      chartOptions: {
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
            type: "time",
            time: {
              precision: 0,
              // Luxon format string
              tooltipFormat: "tt DDDD",
              // unit: "day",
              // unit: "hour",
              // displayFormats: {
              //   hour: "(d EEE) h a ",
              //   day: "t EEE d MMM",
              // },
            },
            ticks: {},
          },
          y: {
            ticks: {
              precision: 0,
            },
          },
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
  },
  methods: {
    formatStudentsChartData(courseData) {
      const datasets = [];

      // more than one student per course
      for (const student of courseData.students) {
        const studentColour = this.stringToColour(
          student.person.firstName + student.person.lastName
        );
        const activities = student.activities.map((activity) => {
          return {
            ...activity,
            x: activity.timeStamp,
            y: activity.index,
          };
        });

        let studentData = {
          type: "line",
          backgroundColor: studentColour,
          borderColor: studentColour,
          borderRadius: 2,
          pointRadius: 2,
          borderWidth: 1,
          data: activities,
          label: courseData.course.title,
        };

        datasets.push(studentData);
      }

      const datasetsObj = {
        datasets,
      };

      console.log("datasets: ", datasetsObj);
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
  },
};
</script>

<style lang="scss" scoped>
.course-frame {
  // border: 1px solid var(--v-missionAccent-base);
  margin-bottom: 30px;
  margin-left: auto;
  margin-right: auto;
  padding: 12px;

  .left-col {
    padding: 20px;
  }

  .center-col {
    // border-left: 1px solid var(--v-galaxyAccent-base);
    // border-right: 1px solid var(--v-galaxyAccent-base);
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
  width: 100%;
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
</style>
