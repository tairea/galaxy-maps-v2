<!-- Chart.vue -->
<template>
  <div>
    <canvas v-once ref="canvas" style="height: 100%; width: 100%"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import { DateTime } from "luxon";

// Chart.defaults.elements.point.radius = 0;

export default {
  props: {
    chartType: String,
    chartData: Object,
    chartOptions: Object,
    toolTipEnable: Boolean,
    timeframe: Object,
    selectedPersons: Array,
    unselectedPersons: Array,
  },
  computed: {
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  watch: {
    unselectedPersons: {
      handler(newUnselectedPersons) {
        // console.log("this.chart", this.chart);
        for (const person of newUnselectedPersons) {
          const personsName = person.firstName + " " + person.lastName;
          const personsIndexForDataset =
            this.chart.data.labels.indexOf(personsName);
          if (!(personsIndexForDataset < 0))
            this.chart.hide(personsIndexForDataset);
        }
      },
    },
    selectedPersons: {
      handler(newSelectedPersons) {
        for (const person of newSelectedPersons) {
          const personsName = person.firstName + " " + person.lastName;
          const personsIndexForDataset =
            this.chart.data.labels.indexOf(personsName);
          if (!(personsIndexForDataset < 0))
            this.chart.show(personsIndexForDataset);
        }
      },
    },
    timeframe: {
      handler(newTimeframe) {
        this.chartOptions.scales.x.min = newTimeframe.min;
        this.chartOptions.scales.x.max = newTimeframe.max;
        this.chartOptions.scales.x.time.unit = newTimeframe.unit;
        if (newTimeframe.unit == "hour") {
          const titleObj = {
            display: true,
            text: DateTime.fromJSDate(newTimeframe.max).toFormat(
              "ccc dd LLL   "
            ),
          };
          this.chartOptions.scales.x.title = titleObj;
        } else {
          this.chartOptions.scales.x.title = {};
        }

        this.chart.update();
      },
    },
  },
  mounted() {
    let { chartType, chartData, chartOptions } = this;
    if (this.toolTipEnable) {
      chartOptions.plugins["tooltip"] = {
        enabled: false,
        position: "nearest",
        external: (context) => {
          // Tooltip Element
          const { chart, tooltip } = context;
          const tooltipEl = this.getOrCreateTooltip(chart);

          // console.log("tooltipEl", tooltipEl);
          // console.log("tooltip", tooltip);

          // Hide if no tooltip
          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
          }

          // Set Text
          if (tooltip.body) {
            // Get data from tooltip
            const dataPoints = tooltip.dataPoints || [];

            // ===== Create row elements =====
            const divTopRow = document.createElement("div");
            const divMiddleRow = document.createElement("div");
            const divBottomRow = document.createElement("div");

            dataPoints.forEach((dataPoint, i) => {
              const colors = tooltip.labelColors[i];

              // ===== Top Row (Task Context) =====
              divTopRow.innerHTML = `
              <table style="padding: 10px;">
                <tr
                  class="dialog-context-description"
                  style="
                    color: var(--v-missionAccent-base);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    font-weight: 800;
                    margin: 0;
                    font-style: italic;
                  "
                >
                  <td>${dataPoint.raw.type}:</td>
                </tr>
                <tr
                  class="dialog-context-description"
                  style="
                    color: var(--v-baseAccent-base);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    font-weight: 800;
                    margin: 0;
                    font-style: italic;
                  "
                >
                   <td>${dataPoint.raw.title}</td>
                </tr>
              </table>
            `;
              divTopRow.style.borderBottom = `1px solid ${
                this.dark
                  ? this.$vuetify.theme.themes.dark.missionAccent
                  : this.$vuetify.theme.themes.light.missionAccent
              }`;
              divTopRow.style.textAlign = "center";

              // ===== Middle Row (Task Status) =====
              divMiddleRow.style.textAlign = "center";
              divMiddleRow.classList.add("text-overline");
              divMiddleRow.innerHTML = dataPoint.raw.status.toUpperCase();
              divMiddleRow.style.padding = "5px";
              divMiddleRow.style.fontSize = "0.9rem";
              divMiddleRow.style.fontWeight = "800";
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
              divMiddleRow.style.borderBottom = `1px solid ${
                this.dark
                  ? this.$vuetify.theme.themes.dark.missionAccent
                  : this.$vuetify.theme.themes.light.missionAccent
              }`;

              // ===== Bottom Row (Date & Time) =====
              divBottomRow.style.textAlign = "center";
              // divBottomRow.classList.add("text-overline");
              divBottomRow.innerHTML = `
            <p
            class="dialog-context-description"
                      style="color: var(--v-missionAccent-base);
                      text-transform: uppercase;
                      font-size: 0.8rem;
                      margin: 0;
                      font-style: italic;
                      padding: 10px;"

            >${dataPoint.label}</p>
            `;
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
          // tooltipEl.style.padding =
          //   tooltip.options.padding + "px " + tooltip.options.padding + "px";
        },
      };
    }

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
        tooltipEl.style.border = `1px solid ${
          this.dark
            ? this.$vuetify.theme.themes.dark.missionAccent
            : this.$vuetify.theme.themes.light.missionAccent
        }`;
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

<style lang="scss" scoped></style>
