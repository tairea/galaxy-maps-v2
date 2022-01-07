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
  methods: {
    chartConstructor(chartType, chartData, chartOptions) {
      const chartElement = this.$refs.canvas;
      const chart = new Chart(chartElement, {
        type: chartType,
        data: chartData,
        options: chartOptions,
      });
    },
  },

  mounted() {
    let { chartType, chartData, chartOptions } = this;
    this.chartConstructor(chartType, chartData, chartOptions);
  },
};
</script>
