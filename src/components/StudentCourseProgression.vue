<template>
  <div v-if="studentCourseDataFromLRS.length">
    <div
      v-for="courseData in studentCourseDataFromLRS"
      :key="courseData.id"
      class="course-frame"
    >
      <v-row>
        <v-col cols="2" class="left-col">
          <h1 class="galaxy-title">
            {{ courseIRIToCourseId(courseData).title }}
          </h1>
          <v-img
            class="galaxy-image"
            :src="courseIRIToCourseId(courseData).image.url"
          ></v-img>
          <!-- <p class="galaxy-description">
            {{ courseIRIToCourseId(courseData).description }}
          </p> -->
        </v-col>
        <v-col cols="6" class="center-col"
          ><Chart
            ref="chart"
            id="chartImage"
            :chartType="chartType"
            :chartData="formatStudentsChartData(courseData)"
            :chartOptions="chartOptions"
            :style="{ width: '100%', height: '200px', padding: '20px' }"
        /></v-col>
        <v-col cols="3" class=""></v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Chart from "@/components/Chart.vue";
import { DateTime } from "luxon";

import {
  queryXAPIStatement,
  getStudentsCoursesXAPIQuery,
} from "../store/veracityLRS";

export default {
  name: "StudentCourseProgression",
  props: [],
  components: {
    Chart,
  },
  mounted() {
    getStudentsCoursesXAPIQuery(this.person);
  },
  computed: {
    ...mapState(["studentCourseDataFromLRS"]),
    ...mapGetters(["person", "getCourseById", "getTopicById"]),
  },
  data() {
    return {
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
                console.log(this.chart._sortedMetasets[0]._dataset.data[index]);

                const tickTaskTitle =
                  this.chart._sortedMetasets[0]._dataset.data[index].taskTitle;

                if (tickTaskTitle) {
                  console.log(
                    "returning tick: " +
                      tickTaskTitle +
                      " for index: " +
                      index +
                      " value: " +
                      value
                  );
                  return tickTaskTitle;
                } else {
                  return value;
                }
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
      },
    };
  },
  methods: {
    courseIRIToCourseId(course) {
      // get course id from iri
      const courseIRI = course._id.course[0];
      const courseId = courseIRI.split("/course/")[1];
      // get course name
      const courseContext = this.getCourseById(courseId);
      return courseContext;
    },
    formatStudentsChartData(courseData) {
      console.log("courseData", courseData);
      let datasets = [];
      // get course id from iri
      const courseIRI = courseData._id.course[0];
      const courseId = courseIRI.split("/course/")[1];

      // get course name
      const courseContext = this.getCourseById(courseId);
      // get a colour based on course name
      const courseColour = this.stringToColour(courseContext.title);

      let courseTaskData = [];
      let taskCount = 0;
      let previousTaskTitle = "";

      // push task data into array
      for (const statement of courseData.statements) {
        // only display points that have topics (eg. not just course started)
        // const isTopic = statement.topic[0].includes("/topic/");
        // if (!isTopic) continue;

        // split context
        const contextSplit = statement.context.split(
          /Course: | > Topic: | > Task: /
        );
        const courseTitle = contextSplit[1];
        const topicTitle = contextSplit[2];
        const taskTitle = contextSplit[3];

        // skip if there is no task (because topic only completed stuffs the order)
        if (!taskTitle) continue;

        // if (taskTitle == previousTaskTitle) taskCount -= 1;

        const taskData = {
          x: statement.timestamp,
          y: taskCount,
          taskStatus: statement.verb.display["en-nz"],
          context: statement.context,
          topic: topicTitle,
          taskTitle: taskTitle,
        };
        courseTaskData.push(taskData);
        previousTaskTitle = taskTitle;
        taskCount++;
      }

      // console.log("courseTaskData:", courseTaskData);

      let studentCourseData = {
        type: "line",
        backgroundColor: courseColour,
        borderColor: courseColour,
        borderRadius: 5,
        borderWidth: 1,
        // data: courseTaskData.flat(),
        data: courseTaskData,
        label: courseContext.title,
        segment: {
          // borderColor: (ctx) => this.getColourBasedOnStatus(ctx, course),
        },
      };

      // push course to datasets
      datasets.push(studentCourseData);

      const datasetsObj = {
        datasets: datasets,
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
  },
};
</script>

<style lang="scss" scoped>
.course-frame {
  width: 80%;
  border: 1px solid var(--v-galaxyAccent-base);
  margin-bottom: 50px;
  margin-left: auto;
  margin-right: auto;
  padding: 12px;

  .left-col {
    padding: 20px;
  }

  .center-col {
    border-left: 1px solid var(--v-galaxyAccent-base);
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
</style>
