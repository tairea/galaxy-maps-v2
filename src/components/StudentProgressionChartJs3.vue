<!-- BarLine.vue -->
<template>
  <div class="chart-container">
    <div
      v-for="studentData in studentsProgressionData"
      :key="studentData.id"
      class="chartCard"
    >
      <v-avatar v-if="person" size="30">
        <img
          v-if="person.image"
          :src="person.image.url"
          :alt="person.firstName"
          style="object-fit: cover"
        />
      </v-avatar>
      <Chart
        id="chartImage"
        :chartData="chartData"
        :chartOptions="chartOptions"
        :chartType="chartType"
        :style="{ width: '100%', height: '200px' }"
      />
    </div>

    <!-- Legend -->
    <div
      id="chartLegend"
      class="overline"
      style="color: var(--v-missionAccent-base)"
    >
      LEGEND:
    </div>
  </div>
</template>

<script>
import Chart from "@/components/Chart.vue";
import { mapGetters } from "vuex";

export default {
  props: {
    chartWidth: { default: 500, type: Number },
    chartHeight: { default: 250, type: Number },
  },
  components: {
    Chart,
  },
  computed: {
    ...mapGetters(["person"]),
  },
  data() {
    return {
      studentsProgressionData: [
        {
          studentId: 123,
          firstName: "Ian",
          tasksWorkedOnForThisCourse: [
            {
              taskStatus: "completed",
              timestamp: new Date(2022, 1, 5),
            },
            {
              taskStatus: "inreview",
              timestamp: new Date(2022, 1, 10),
            },
            {
              taskStatus: "active",
              timestamp: new Date(2022, 1, 15),
            },
          ],
        },
        {
          studentId: 456,
          firstName: "Ben",
          tasksWorkedOnForThisCourse: [
            {
              taskStatus: "completed",
              timestamp: new Date(2022, 1, 5),
            },
            {
              taskStatus: "completed",
              timestamp: new Date(2022, 1, 8),
            },
            {
              taskStatus: "active",
              timestamp: new Date(2022, 1, 16),
            },
          ],
        },
      ],
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
            const items =
              chart.options.plugins.legend.labels.generateLabels(chart);

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
                      !chartItem.isDatasetVisible(item.datasetIndex)
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
              textContainer.style.textDecoration = item.hidden
                ? "line-through"
                : "";

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
    // example of line segment logic (use to color line according to taskStatus eg. active/inreview/completed)
    down(ctx, value) {
      console.log("getting segment down logic...");
      return ctx.p0.parsed.y > ctx.p1.parsed.y ? value : undefined;
    },
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
  },
};
</script>

<style lang="scss" scoped>
.chartCard {
  border: 1px solid var(--v-missionAccent-base);
  margin: 10px;
  padding: 10px;
  width: 33%;
  border-radius: 10px;
}
#chartLegend {
  border-top: 1px solid var(--v-missionAccent-base);
  height: auto;
  position: absolute;
  bottom: 0px;
  width: 100%;
}
</style>
