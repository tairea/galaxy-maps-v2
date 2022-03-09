<template>
  <div v-if="santisedCourses">
    <div
      v-for="course in santisedCourses"
      :key="course.id"
      class="course-frame"
    >
      <v-row>
        <v-col cols="2" class="left-col">
          <h1 class="galaxy-title">
            {{ course.courseContext.title }}
          </h1>
          <v-img
            class="galaxy-image"
            :src="course.courseContext.image.url"
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
            :chartData="formatStudentsChartData(course)"
            :chartOptions="chartOptions"
            :style="{ width: '100%', height: '200px', padding: '20px' }"
          />
        </v-col>
        <v-col cols="4" class="pa-0">
          <div class="top-row">
            <p class="label">ACTIVE MISSION:</p>
            <ActiveMissions :courseId="course.courseContext.id" />
          </div>
          <div class="bottom-row">
            <v-progress-circular
              :value="calcTaskCompletedPercentage(course)"
              color="baseAccent"
              size="100"
              width="10"
              :rotate="-90"
              >{{ calcTaskCompletedPercentage(course) + "%" }}
            </v-progress-circular>
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
} from "../store/veracityLRS";

export default {
  name: "StudentCourseProgression",
  props: [],
  components: {
    Chart,
    ActiveMissions,
  },
  mixins: [dbMixins],
  async mounted() {
    await getStudentsCoursesXAPIQuery(this.person);
    //get courses from LRS
    this.sanitiseCourseDataFromLRS();

    // await getActiveTaskXAPIQuery(this.person);
  },
  computed: {
    ...mapState(["studentCourseDataFromLRS", "studentsActiveTasks"]),
    ...mapGetters(["person", "getCourseById", "getTopicById"]),
  },
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
      },
    };
  },
  methods: {
    async sanitiseCourseDataFromLRS() {
      // console.log("data from LRS:", this.studentCourseDataFromLRS);

      const santisedCourses = [];

      let taskCompletedCount = 0;

      for (const course of this.studentCourseDataFromLRS) {
        // get course info
        const courseContext = await this.courseIRIToCourseId(course);

        // sanitise statements data
        const courseData = course.statements.map((statement, index) => {
          const contextSplit = statement.context.split(
            /Course: | > Topic: | > Task: /
          );
          const topicTitle = contextSplit[2];
          const taskTitle = contextSplit[3];

          if (statement.description.includes("Completed Task:"))
            taskCompletedCount++;

          const newStatement = {
            x: statement.timestamp,
            y: index,
            taskStatus: statement.verb.display["en-nz"],
            context: statement.context,
            topic: topicTitle,
            taskTitle: taskTitle,
            description: statement.description,
          };
          return newStatement;
        });

        // count number of "Completed Task:..." in description

        const courseObj = {
          courseContext,
          courseData,
          taskCompletedCount,
        };

        this.santisedCourses.push(courseObj);
      }
      console.log("santisedCourses", this.santisedCourses);
    },
    async courseIRIToCourseId(course) {
      // get course id from iri
      const courseIRI = course._id.course[0];
      const courseId = courseIRI.split("/course/")[1];
      // get course name
      const courseContext = await this.getCourseById(courseId);
      return courseContext;
    },

    formatStudentsChartData(course) {
      // console.log("course", course);

      let datasets = [];

      // get a colour based on course name
      const courseColour = this.stringToColour(course.courseContext.title);

      let studentCourseData = {
        type: "line",
        backgroundColor: courseColour,
        borderColor: courseColour,
        borderRadius: 5,
        borderWidth: 1,
        // data: courseTaskData.flat(),
        data: course.courseData,
        label: course.courseContext.title,
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
    async getActiveTask(courseId) {
      // ====== using Firestore data ======
      const activeTasks = await this.$store.dispatch("getPersonsActiveTasks", {
        courseId: courseId,
        personId: this.person.id,
      });

      console.log("returing active tasks:", activeTasks);

      return activeTasks;

      // ====== using XAPI data ======
      // const course = this.studentsActiveTasks.find(
      //   (course) => course._id.course == courseId
      // );

      // const topicId = course.lastStatement.topic;
      // const taskId = course.lastStatement.task;

      // return taskId;

      // const task = await this.$store.dispatch("getTaskByTaskId", {
      //   courseId: courseId,
      //   topicId: course.lastStatement.topic,
      //   taskId: course.lastStatement.task,
      // });
      // const topic = await this.$store.dispatch("getTopicByTopicId", {
      //   courseId: courseId,
      //   topicId: course.lastStatement.topic,
      // });

      // console.log("task:", task);
      // console.log("topic:", topic);

      // return topic.label + " " + task.title;
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
  margin-bottom: 50px;
  margin-left: auto;
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
  height: 30%;
}

.bottom-row {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70%;
}

.label {
  color: var(--v-galaxyAccent-base);
  font-size: 0.7rem;
  margin: 10px;
}
</style>
