<!-- Chart.vue -->
<template>
  <div style="position: relative">
    <canvas v-once ref="canvas" style="height: 100%; width: 100%"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from "chart.js";
import { DateTime } from "luxon";

Chart.register(...registerables);

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
        // hide data
        for (const person of newUnselectedPersons) {
          const personsName = person.firstName + " " + person.lastName;
          const personsIndexForDataset = this.chart.data.labels.indexOf(personsName);

          if (!(personsIndexForDataset < 0)) {
            if (this.chartType == "line") {
              // line chart
              this.chart.hide(personsIndexForDataset);
            } else if (this.chartType == "bar") {
              // bar chart
              this.chart.hide(0, personsIndexForDataset);
            }
          }
        }
      },
    },
    selectedPersons: {
      handler(newSelectedPersons) {
        // show data
        for (const person of newSelectedPersons) {
          const personsName = person.firstName + " " + person.lastName;
          const personsIndexForDataset = this.chart.data.labels.indexOf(personsName);

          if (!(personsIndexForDataset < 0)) {
            if (this.chartType == "line") {
              // line chart
              this.chart.show(personsIndexForDataset);
            } else if (this.chartType == "bar") {
              // bar chart
              this.chart.show(0, personsIndexForDataset);
            }
          }
        }
      },
    },
    timeframe: {
      handler(newTimeframe) {
        if (this.chartType !== "bar") {
          this.chartOptions.scales.x.min = newTimeframe.min;
          this.chartOptions.scales.x.max = newTimeframe.max;

          this.chartOptions.scales.x.time.unit = newTimeframe.unit;
          if (newTimeframe.unit == "hour") {
            const titleObj = {
              display: true,
              text: DateTime.fromJSDate(newTimeframe.max).toFormat("ccc dd LLL   "),
            };
            this.chartOptions.scales.x.title = titleObj;
          }
        } else {
        }

        this.chart.update();
      },
    },
    chartData: {
      deep: true,
      handler(newVal) {
        if (this.chartType === "bar") {
          const data = this.chartData.datasets[0].data;
          const labels = this.chartData.labels;
          this.chart.data.datasets[0].data = data;
          this.chart.data.labels = labels;
          this.chart.update();
        }
      },
    },
  },
  mounted() {
    const { chartType, chartData, chartOptions } = this;
    if (this.toolTipEnable) {
      chartOptions.plugins["tooltip"] = {
        enabled: false,
        position: "nearest",
        // External HTML Tooltip disabled because top/left positioning not working properly.
        // To test, change enabled to false and uncomment external function below
        external: (context) => {
          // Tooltip Element
          const { chart, tooltip } = context;
          const tooltipEl = this.getOrCreateTooltip(chart);

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
              if (dataPoint.raw.status) {
                divTopRow.innerHTML = `
              <table style="padding: 10px;width: 100%;">
                <tr

                  style="
                    text-align: center;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    font-weight: 800;
                    margin: 0;

                  "
                >
                <td style="color:white;">${
                  dataPoint.raw.status ? dataPoint.dataset.label : dataPoint.label
                }</td>

                </tr>

              </table>
            `;
                divTopRow.style.borderBottom = `1px solid ${
                  this.dark
                    ? this.$vuetify.theme.themes.dark.missionAccent
                    : this.$vuetify.theme.themes.light.missionAccent
                }`;
                divTopRow.style.textAlign = "center";
                divTopRow.style.paddingTop = "15px";
                divTopRow.style.paddingBottom = "5px";
              }

              // ===== Middle Row (Task Status) =====
              divMiddleRow.style.textAlign = "center";
              // divMiddleRow.classList.add("text-overline");
              // divMiddleRow.classList.add("missionAccent--text");

              // has a status means is data related to a TASK
              if (dataPoint.raw.status) {
                if (dataPoint.raw.status == "Completed") {
                  divMiddleRow.innerHTML = `
                  <tr>
                    <td><p style="color: var(--v-baseAccent-base);margin:0;"> ${dataPoint.raw.status.toUpperCase()}:</p></td>
                  </tr>
                  <tr>
                    <td><p style="font-style: italic;color:white;font-weight: 400;">${
                      dataPoint.raw.title
                    }</p></td>
                  </tr>
                    `;
                } else {
                  divMiddleRow.innerHTML = `
                    <tr>
                      <td  "> ${dataPoint.raw.status.toUpperCase()}:</td>
                    </tr>
                    <tr>
                      <td><p style="font-style: italic;color:white;font-weight: 400;">${
                        dataPoint.raw.title
                      }</p>
                      </td>
                    </tr>
                  `;
                }
              } else {
                const rawValue =
                  typeof dataPoint.raw === "number"
                    ? dataPoint.raw
                    : typeof dataPoint.parsed === "number"
                      ? dataPoint.parsed
                      : parseFloat(dataPoint.formattedValue);
                const hm = this.formatDecimalHours(rawValue);
                divMiddleRow.innerHTML = `
                <tr>
                      <td><p style="color:var(--v-baseAccent-base);margin:0; font-size: 1.8rem; font-weight:800 "> ${hm}</p></td>
                    </tr>
                    <tr>
                      <td><p style="font-style: italic;color:white;font-weight: 400;">HOURS</p>
                      </td>
                    </tr>
                  `;
              }
              divMiddleRow.style.padding = "5px";
              divMiddleRow.style.paddingTop = "10px";
              divMiddleRow.style.fontSize = "0.8rem";
              divMiddleRow.style.fontWeight = "600";
              switch (dataPoint.raw.status) {
                case "Inreview":
                  divMiddleRow.style.color = this.dark
                    ? this.$vuetify.theme.themes.dark.cohortAccent
                    : this.$vuetify.theme.themes.light.cohortAccent;
                  break;
                case "Completed":
                  divMiddleRow.style.color = this.dark
                    ? this.$vuetify.theme.themes.dark.baseAccent
                    : this.$vuetify.theme.themes.light.baseAccent;
                  break;
                case "Started":
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

            // Remove old children
            while (tooltipEl.firstChild) {
              tooltipEl.firstChild.remove();
            }

            // Add new children
            if (divTopRow) {
              tooltipEl.appendChild(divTopRow);
            }
            tooltipEl.appendChild(divMiddleRow);
            tooltipEl.appendChild(divBottomRow);
          }

          // Display, position, and set styles for font
          const { offsetTop, offsetLeft } = chart.canvas;
          tooltipEl.style.opacity = 1;
          tooltipEl.style.left = offsetLeft + tooltip.caretX + "px";
          tooltipEl.style.top = offsetTop + tooltip.caretY + "px";
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
    formatDecimalHours(value) {
      if (value == null || isNaN(value)) return "0H 0M";
      const abs = Math.abs(value);
      const hours = Math.floor(abs);
      let minutes = Math.round((abs - hours) * 60);
      // Handle rounding pushing minutes to 60
      let adjHours = hours;
      if (minutes === 60) {
        adjHours += 1;
        minutes = 0;
      }
      const sign = value < 0 ? "-" : "";
      return `${sign}${adjHours}H ${minutes}M`;
    },
    chartConstructor(chartType, chartData, chartOptions) {
      const chartElement = this.$refs.canvas;
      this.chart = new Chart(chartElement, {
        type: chartType,
        data: chartData,
        options: chartOptions,
      });
    },
    /** @returns {HTMLDivElement} */
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

        chart.canvas.parentNode.appendChild(tooltipEl);
      }

      return tooltipEl;
    },
  },
};
</script>

<style lang="scss" scoped></style>
