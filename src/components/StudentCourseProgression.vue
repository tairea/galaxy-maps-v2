<template>
  <div v-if="studentCourseDataFromLRS.length">
    <div v-for="courseData in studentCourseDataFromLRS" :key="courseData.id">
      <Chart
        ref="chart"
        id="chartImage"
        :chartType="chartType"
        :chartData="formatStudentsChartData(courseData)"
        :chartOptions="chartOptions"
        :style="{ width: '100%', height: '200px' }"
      />
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
              // Luxon format string
              tooltipFormat: "tt DDDD",
            },
            ticks: {},
          },
          y: {
            ticks: {
              precision: 0,
              // callback: function (value, index) {
              //   console.log("y tick");
              //   console.log(this.chart._sortedMetasets[0]._dataset.data[index]);
              //   if (this.chart._sortedMetasets[0]._dataset.data[index].topic) {
              //     return this.chart._sortedMetasets[0]._dataset.data[index]
              //       .topic;
              //   } else {
              //     return value;
              //   }
              //   console.log(value);
              //   console.log(index);
              // },
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
    formatStudentsChartData(dataObj) {
      let datasets = [];
      // get course id from iri
      const courseIRI = dataObj._id.course[0];
      const courseId = courseIRI.split("/course/")[1];

      // get course name
      const courseContext = this.getCourseById(courseId);
      // get a colour based on course name
      const courseColour = this.stringToColour(courseContext.title);

      let courseTaskData = [];
      let taskCount = 0;

      // push task data into array
      for (const statement of dataObj.statements) {
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

        taskCount++;
        const taskData = {
          x: statement.timestamp,
          y: taskCount,
          taskStatus: statement.verb.display["en-nz"],
          context: statement.context,
          topic: topicTitle,
          taskTitle: taskTitle,
        };
        courseTaskData.push(taskData);
      }

      console.log("courseTaskData:", courseTaskData);

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

<style lang="scss" scoped></style>
