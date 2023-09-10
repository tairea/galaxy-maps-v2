<!-- BarLine.vue -->
<template>
  <div v-if="teachersStudentsProgress.length" class="chart-container d-flex">
    <div
      v-for="studentData in teachersStudentsProgress"
      :key="studentData.studentId"
      class="chartCard"
    >
      <div class="d-flex align-center">
        <v-avatar v-if="studentData.student.image" size="30">
          <img
            v-if="studentData.student.image"
            :src="studentData.student.image.url"
            :alt="studentData.student.firstName"
            style="object-fit: cover"
          />
        </v-avatar>
        <div v-else class="imagePlaceholder">
          {{ first3Letters(studentData.student.firstName) }}
        </div>
        <p class="ml-2 mt-6">
          {{ studentData.student.firstName + " " + studentData.student.lastName }}
        </p>
      </div>
      <Chart
        ref="chart"
        id="chartImage"
        :chartType="chartType"
        :chartData="formatStudentsChartData(studentData)"
        :chartOptions="chartOptions"
        :toolTipEnable="true"
        :style="{ width: '100%', height: '200px' }"
      />
    </div>

    <!-- Legend -->
    <div id="chartLegend" class="overline pa-2" style="color: var(--v-missionAccent-base)">
      <!-- LEGEND: -->
      <v-row>
        <v-col cols="2"> START:</v-col>
        <v-col cols="4">
          <input
            type="date"
            class="date-picker"
            placeholder="dd-mm-yyyy"
            value=""
            min="2022-01-01"
            max="2023-01-01"
            :style="dark ? 'color-scheme: dark' : 'color-scheme: light'"
          />
        </v-col>
        <v-col cols="2">END:</v-col>
        <v-col cols="4"
          ><input
            type="date"
            class="date-picker"
            placeholder="dd-mm-yyyy"
            value=""
            min="2022-01-01"
            max="2023-01-01"
            :style="dark ? 'color-scheme: dark' : 'color-scheme: light'"
        /></v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import Chart from "@/components/Chart.vue";
import useRootStore from "@/store/index";
import "chartjs-adapter-luxon";
import { DateTime } from "luxon";
import { mapState } from "pinia";

export default {
  props: {
    chartWidth: { default: 500, type: Number },
    chartHeight: { default: 250, type: Number },
  },
  components: {
    Chart,
  },
  computed: {
    ...mapState(useRootStore, ["teachersStudentsProgress","person", "getCourseById"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  mounted() {
    console.log("teachersStudentsProgress");
    console.log(this.teachersStudentsProgress);
  },
  data() {
    return {
      date: new Date(),
      modal: false,
      chartType: "line",
      chartData: {
        // labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            type: "line",
            backgroundColor: this.$vuetify.theme.themes.dark.baseAccent,
            borderColor: this.$vuetify.theme.themes.dark.baseAccent,
            // borderRadius: 3,
            // borderWidth: 1,
            data: [1, 2, 3, 4, 5, 6, 7],
            // hoverBackgroundColor: "rgba(128, 0, 0, 0.5)",
            label: "Web Development",
            // yAxisID: "y",
          },
          {
            type: "line",
            backgroundColor: this.$vuetify.theme.themes.dark.missionAccent,
            borderColor: this.$vuetify.theme.themes.dark.missionAccent,
            // borderRadius: 3,
            // borderWidth: 1,
            data: [1, 1, 2, 3, 3, 5, 3],
            // hoverBackgroundColor: "rgba(128, 0, 0, 0.5)",
            label: "Māori Performing Arts",
            // yAxisID: "y",
            segment: {
              borderColor: (ctx) => this.down(ctx, "rgb(192,75,75)"),
            },
          },
        ],
      },
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
          htmlLegend: {
            // ID of the container to put the legend in
            containerID: "chartLegend",
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              // Luxon format string
              tooltipFormat: "tt DDDD",
            },
            // title: {
            //   display: true,
            //   text: "Date",
            // },
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
      plugins: [
        {
          id: "htmlLegend",
          afterUpdate(chart, args, options) {
            const ul = this.getOrCreateLegendList(chart, options.containerID);

            // Remove old legend items
            while (ul.firstChild) {
              ul.firstChild.remove();
            }

            // Reuse the built-in legendItems generator
            const items = chart.options.plugins.legend.labels.generateLabels(chart);

            items.forEach((item) => {
              const li = document.createElement("li");
              li.style.alignItems = "center";
              li.style.cursor = "pointer";
              li.style.display = "flex";
              li.style.flexDirection = "row";
              li.style.marginLeft = "10px";

              li.onclick = () => {
                const { type } = chart.config;
                if (type === "pie" || type === "doughnut") {
                  // Pie and doughnut charts only have a single dataset and visibility is per item
                  charts.forEach((chartItem) => {
                    chartItem.toggleDataVisibility(item.index);
                    chartItem.update();
                  });
                } else {
                  charts.forEach((chartItem) => {
                    chartItem.setDatasetVisibility(
                      item.datasetIndex,
                      !chartItem.isDatasetVisible(item.datasetIndex),
                    );
                    chartItem.update();
                  });
                }
              };

              // Color box
              const boxSpan = document.createElement("span");
              boxSpan.style.background = item.fillStyle;
              boxSpan.style.borderColor = item.strokeStyle;
              boxSpan.style.borderWidth = item.lineWidth + "px";
              boxSpan.style.display = "inline-block";
              boxSpan.style.height = "20px";
              boxSpan.style.marginRight = "10px";
              boxSpan.style.width = "20px";

              // Text
              const textContainer = document.createElement("p");
              textContainer.style.color = item.fontColor;
              textContainer.style.margin = 0;
              textContainer.style.padding = 0;
              textContainer.style.textDecoration = item.hidden ? "line-through" : "";

              const text = document.createTextNode(item.text);
              textContainer.appendChild(text);

              li.appendChild(boxSpan);
              li.appendChild(textContainer);
              ul.appendChild(li);
            });
          },
        },
      ],
    };
  },
  methods: {
    formatStudentsChartData(studentObj) {
      let datasets = [];

      // loops the students courses
      for (const course of studentObj.studentCoursesData) {
        const courseId = course.courseId;

        // get course name
        const courseContext = this.getCourseById(courseId);

        const courseColour = this.stringToColour(courseContext.title);

        let courseTaskData = [];
        let taskCount = 0;

        // push task data into array
        for (const topic of course.courseTopicData) {
          const taskData = topic.topicTaskData.map((task, index) => {
            if (!task.x) return;
            taskCount++;
            return {
              x: new DateTime.fromSeconds(task.x.seconds),
              y: task.y,
              topic: topic.topicTitle,
              taskStatus: task.taskStatus,
              taskTitle: task.taskTitle,
            };
          });
          courseTaskData.push(taskData);
        }

        // console.log("courseTaskData:", courseTaskData);

        let studentCourseData = {
          type: "line",
          backgroundColor: courseColour,
          borderColor: courseColour,
          borderRadius: 5,
          borderWidth: 1,
          data: courseTaskData.flat(),
          label: courseContext.title,
          segment: {
            borderColor: (ctx) => this.getColourBasedOnStatus(ctx, course),
          },
        };

        // push course to datasets
        datasets.push(studentCourseData);
      }

      const datasetsObj = {
        datasets: datasets,
      };

      return datasetsObj;
    },
    getColourBasedOnStatus(ctx, course) {
      // TODO: dunno why this doesnt work (supposed to change border colour depending on status)

      if (ctx.p0DataIndex >= course.courseTopicData.length) {
        return;
      }
      if (
        course.courseTopicData[ctx.p0DataIndex].topicTaskData &&
        course.courseTopicData[ctx.p0DataIndex].topicTaskData.length > 0
      ) {
        course.courseTopicData[ctx.p0DataIndex].topicTaskData.forEach((taskPoint) => {
          switch (taskPoint.taskStatus) {
            case "inreview":
              // console.log(
              //   taskPoint.taskTitle + " taskPoint is: ",
              //   taskPoint.taskStatus
              // );
              // console.log(
              //   "returning colour:",
              //   this.hexToRgb(this.$vuetify.theme.themes.dark.cohortAccent)
              // );
              return this.hexToRgb(this.$vuetify.theme.themes.dark.cohortAccent);
            case "completed":
              // console.log(
              //   taskPoint.taskTitle + " taskPoint is: ",
              //   taskPoint.taskStatus
              // );
              // console.log(
              //   "returning colour:",
              //   this.hexToRgb(this.$vuetify.theme.themes.dark.baseAccent)
              // );
              return this.hexToRgb(this.$vuetify.theme.themes.dark.baseAccent);
            default:
              return;
          }
        });
      } else {
        return;
      }
    },
    hexToRgb(hex) {
      var c;
      if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split("");
        if (c.length == 3) {
          c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = "0x" + c.join("");
        return "rgb  (" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") + ")";
      }
      throw new Error("Bad Hex");
    },

    // example of line segment logic (use to color line according to taskStatus eg. active/inreview/completed)
    // down(ctx, value) {
    //   console.log("getting segment down logic...");
    //   return ctx.p0.parsed.y > ctx.p1.parsed.y ? value : undefined;
    // },
    // create a listContainer for the legend
    getOrCreateLegendList(chart, id) {
      const legendContainer = document.getElementById(id);
      let listContainer = legendContainer.querySelector("ul");

      if (!listContainer) {
        listContainer = document.createElement("ul");
        listContainer.style.display = "flex";
        listContainer.style.flexDirection = "row";
        listContainer.style.margin = 0;
        listContainer.style.padding = 0;

        legendContainer.appendChild(listContainer);
      }

      return listContainer;
    },
    hashCode(str) {
      let hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    },
    stringToColour(str) {
      return `hsl(${this.hashCode(str) % 360}, 100%, 70%)`;
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
  },
};
</script>

<style lang="scss" scoped>
.chart-container {
  flex-wrap: wrap;
}
.chartCard {
  border: 1px solid var(--v-missionAccent-base);
  margin: 10px;
  padding: 10px;
  width: 100%;
  border-radius: 10px;
}
#chartLegend {
  border-top: 1px solid var(--v-missionAccent-base);
  height: auto;
  // position: absolute;
  // bottom: 0px;
  width: 100%;
}
.imagePlaceholder {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(200, 200, 200, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
}

.date-picker {
  color: var(--v-missionAccent-base);
}
</style>
