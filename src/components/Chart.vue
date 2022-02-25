<!-- Chart.vue -->
<template>
  <div>
    <canvas v-once ref="canvas" style="height: 100%; width: 100%"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// Chart.defaults.elements.point.radius = 0;

export default {
  props: {
    chartType: String,
    chartData: Object,
    chartOptions: Object,
  },
  computed: {
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  mounted() {
    let { chartType, chartData, chartOptions } = this;

    (chartOptions.plugins["tooltip"] = {
      enabled: false,
      position: "nearest",
      external: (context) => {
        // Tooltip Element
        const { chart, tooltip } = context;
        const tooltipEl = this.getOrCreateTooltip(chart);

        console.log("tooltipEl", tooltipEl);
        console.log("tooltip", tooltip);

        // Hide if no tooltip
        if (tooltip.opacity === 0) {
          tooltipEl.style.opacity = 0;
          return;
        }

        // Set Text
        if (tooltip.body) {
          const dataPoints = tooltip.dataPoints || [];

          // const tableHead = document.createElement("thead");
          const divTopRow = document.createElement("div");
          const divMiddleRow = document.createElement("div");
          const divBottomRow = document.createElement("div");
          dataPoints.forEach((dataPoint, i) => {
            const colors = tooltip.labelColors[i];
            // create a table row
            // const divTopRow = document.createElement("div");
            // tr.style.borderWidth = 0;
            // create a table header
            // const th = document.createElement("th");
            // th.style.borderWidth = 0;
            divTopRow.innerHTML = `

            <table>
                    <tr
                      class="dialog-context-description"
                      style="
                        color: var(--v-missionAccent-base);
                        font-size: 0.8rem;
                        font-weight: 800;
                      "
                    >
                      <td>MISSION:</td>
                      <td>${dataPoint.raw.taskTitle}</td>
                    </tr>
                    <tr
                      class="dialog-context-description"
                      style="color: var(--v-missionAccent-base)"
                    >
                      <td>System:</td>
                      <td>${dataPoint.raw.topic}</td>
                    </tr>
                    <tr
                      class="dialog-context-description"
                      style="color: var(--v-galaxyAccent-base)"
                    >
                      <td>Galaxy:</td>
                      <td>${dataPoint.dataset.label}</td>
                    </tr>
                  </table>

            `;

            // divTopRow.classList.add("text-overline");
            divTopRow.style.borderBottom =
              "1px solid " + this.dark
                ? this.$vuetify.theme.themes.dark.missionAccent
                : this.$vuetify.theme.themes.light.missionAccent;

            // const tableBody = document.createElement("tbody");

            // coloured box of line
            // const span = document.createElement("span");
            // span.style.background = colors.backgroundColor;
            // span.style.borderColor = colors.borderColor;
            // span.style.borderWidth = "2px";
            // span.style.marginRight = "10px";
            // span.style.height = "10px";
            // span.style.width = "10px";
            // span.style.display = "inline-block";

            // Middle Row (Task Status)
            divMiddleRow.style.textAlign = "center";
            // divMiddleRow.classList.add("text-overline");
            divMiddleRow.innerHTML = dataPoint.raw.taskStatus;
            switch (dataPoint.raw.taskStatus) {
              case "inreview":
                divMiddleRow.style.color = this.dark
                  ? this.$vuetify.theme.themes.dark.cohortAccent
                  : this.$vuetify.theme.themes.light.cohortAccent;
                break;
              case "completed":
                divMiddleRow.style.color = this.dark
                  ? this.$vuetify.theme.themes.dark.baseAccent
                  : this.$vuetify.theme.themes.light.baseAccent;
                break;
              case "started":
                divMiddleRow.style.color = this.dark
                  ? this.$vuetify.theme.themes.dark.missionAccent
                  : this.$vuetify.theme.themes.light.missionAccent;
                break;
              default:
            }
            divMiddleRow.style.borderBottom =
              "1px solid " + this.dark
                ? this.$vuetify.theme.themes.dark.missionAccent
                : this.$vuetify.theme.themes.light.missionAccent;

            // Bottom (Date & Time)
            divBottomRow.style.textAlign = "center";
            divBottomRow.classList.add("text-overline");
            divBottomRow.innerHTML = dataPoint.label;
          });
          const subDiv = document.getElementById("subDiv");

          // Remove old children
          while (subDiv.firstChild) {
            subDiv.firstChild.remove();
          }

          // Add new children
          subDiv.appendChild(divTopRow);
          subDiv.appendChild(divMiddleRow);
          subDiv.appendChild(divBottomRow);
        }
        const { offsetLeft: positionX, offsetTop: positionY } =
          this.chart.canvas;

        // Display, position, and set styles for font
        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = positionX + tooltip.caretX + "px";
        tooltipEl.style.top = positionY + tooltip.caretY + "px";
        tooltipEl.style.font = tooltip.options.bodyFont.string;
        tooltipEl.style.padding =
          tooltip.options.padding + "px " + tooltip.options.padding + "px";
      },
    }),
      this.chartConstructor(chartType, chartData, chartOptions);

    this.chart.update();
  },
  methods: {
    chartConstructor(chartType, chartData, chartOptions) {
      const chartElement = this.$refs.canvas;
      this.chart = new Chart(chartElement, {
        type: chartType,
        data: chartData,
        options: chartOptions,
      });
    },
    getOrCreateTooltip(chart) {
      let tooltipEl = chart.canvas.parentNode.querySelector("div");

      if (!tooltipEl) {
        tooltipEl = document.createElement("div");

        tooltipEl.style.background = "rgba(0, 0, 0, 0.7)";
        tooltipEl.style.borderRadius = "3px";
        tooltipEl.style.border =
          "1px solid " + this.dark
            ? this.$vuetify.theme.themes.dark.missionAccent
            : this.$vuetify.theme.themes.light.missionAccent;
        tooltipEl.style.color = "white";
        tooltipEl.style.opacity = 1;
        tooltipEl.style.pointerEvents = "none";
        tooltipEl.style.position = "absolute";
        tooltipEl.style.transform = "translate(-50%, 0)";
        tooltipEl.style.transition = "all .1s ease";
        tooltipEl.style.width = "200px";

        const subDiv = document.createElement("div");
        subDiv.setAttribute("id", "subDiv");
        // table.style.margin = "0px";
        tooltipEl.appendChild(subDiv);

        chart.canvas.parentNode.appendChild(tooltipEl);
      }

      return tooltipEl;
    },
  },
};
</script>

<style lang="scss" scoped>
.dialog-context-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.6rem;
  margin: 0;
  font-style: italic;
}
</style>
