<template>
  <div v-if="santisedCourses">
    <div
      v-for="data in santisedCourses"
      :key="data.course.id"
      class="course-frame"
    >
      <v-row>
        <v-col cols="2" class="left-col">
          <h1 class="galaxy-title">
            {{ data.course.title }}
          </h1>
          <v-img
            class="galaxy-image"
            :src="data.course.image.url"
          ></v-img>
          <!-- <p class="galaxy-description">
            {{ course.courseContext.description }}
          </p> -->
        </v-col>
        <v-col cols="6" class="center-col">
          <Chart
            ref="chart"
            id="chartImage"
            :chartType="chartType"
            :chartData="formatStudentsChartData(data)"
            :chartOptions="chartOptions"
            :style="{ width: '100%', height: '200px', padding: '20px' }"
          />
        </v-col>
        <v-col cols="4" class="pa-0">
          <div class="top-row">
            <p class="label">ACTIVE MISSION:</p>
            <ActiveMissions :courseId="data.course.id" />
          </div>
          <div class="bottom-row">
            <!-- <v-progress-circular
              :value="calcTaskCompletedPercentage(data)"
              color="baseAccent"
              size="100"
              width="10"
              :rotate="-90"
              >{{ calcTaskCompletedPercentage(data) + "%" }}
            </v-progress-circular> -->
          </div>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Chart from "@/components/Chart.vue";
import ActiveMissions from "@/components/ActiveMissions.vue";
import { DateTime } from "luxon";
import { dbMixins } from "../mixins/DbMixins";

import {
  getStudentsCoursesXAPIQuery,
  getActiveTaskXAPIQuery,
} from "../lib/veracityLRS";

export default {
  name: "StudentCourseProgression",
  props: [],
  components: {
    Chart,
    ActiveMissions,
  },
  mixins: [dbMixins],
  data() {
    return {
      value: 80,
      santisedCourses: [],
      previousTickTitle: "",
      chartType: "line",
      chartOptions: {
        // interaction: {
        //   mode: "index",
        //   axis: "y",
        // },
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
              // precision: 0,
              callback: function (value, index) {
                // console.log(
                //   this.chart._sortedMetasets[0]._dataset.data[index].taskTitle
                // );
                // const tickTaskTitle =
                //   this.chart._sortedMetasets[0]._dataset.data[index].taskTitle;
                // if (tickTaskTitle) {
                //   console.log(
                //     "returning tick: " +
                //       tickTaskTitle +
                //       " for index: " +
                //       index +
                //       " value: " +
                //       value
                //   );
                //   return tickTaskTitle;
                // } else {
                //   return value;
                // }
                //   console.log(value);
                //   console.log(index);
              },
            },
          },
        },
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
        santisedCourses: []
      },
    };
  }, 
  async mounted() {
    this.santisedCourses = await getStudentsCoursesXAPIQuery(this.person);
  },
  computed: {
    ...mapState(["studentsActiveTasks"]),
    ...mapGetters(["person", "getCourseById", "getTopicById"]),
  },
  methods: {
    formatStudentsChartData(data) {
      // console.log("course", course);
      data.x = data.timeStamp
      data.y = data.index

      // get a colour based on course name
      const courseColour = this.stringToColour(data.course.title);

      let studentCourseData = {
        type: "line",
        backgroundColor: courseColour,
        borderColor: courseColour,
        borderRadius: 5,
        borderWidth: 1,
        // data: courseTaskData.flat(),
        data: data,
        label: data.course.title,
        segment: {
          // borderColor: (ctx) => this.getColourBasedOnStatus(ctx, course),
        },
      };

      const datasetsObj = {
        datasets: [studentCourseData],
      };

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
    calcTaskCompletedPercentage(course) {
      let percentage =
        (course.taskCompletedCount / course.courseContext.taskTotal) * 100;
      return Math.round(percentage);
    },
  },
};
</script>

<style lang="scss" scoped>
.course-frame {
  width: 80%;
  border: 1px solid var(--v-galaxyAccent-base);
  margin-bottom: 30px;
  margin-left: 5%;
  margin-right: auto;
  padding: 12px;

  .left-col {
    padding: 20px;
  }

  .center-col {
    // border-left: 1px solid var(--v-galaxyAccent-base);
    border-right: 1px solid var(--v-galaxyAccent-base);
  }
}

.galaxy-title {
  font-size: 1rem;
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
  // height: 30%;
}

.label {
  color: var(--v-galaxyAccent-base);
  font-size: 0.7rem;
  margin: 10px;
}
</style>
