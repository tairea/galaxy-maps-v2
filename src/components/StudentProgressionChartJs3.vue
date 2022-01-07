<template>
  <div class="small">
    <line-chart :chart-data="datacollection"></line-chart>
    <button @click="fillData()">Randomize</button>
  </div>
</template>

<script>
import { Graph2d } from "vue2vis";
import LineChart from "./LineChart.js";
// import EditStudentButtonDialog from "../components/EditStudentButtonDialog";

export default {
  name: "StudentProgressionChart",
  components: {
    // EditStudentButtonDialog,
    // Graph2d,
    LineChart,
  },
  props: ["student"],
  mounted() {
    this.fillData();
  },
  data() {
    return {
      datacollection: null,
    };
  },
  methods: {
    fillData() {
      this.datacollection = {
        labels: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        datasets:
          // this.formatDatasetsForChart(this.topicsWithTasks)
          [
            {
              label: "Web development",
              backgroundColor: this.$vuetify.theme.themes.dark.missionAccent,
              data: [1, 2, 3, 4, 5, 6, 4],
              fill: false,
              borderColor: this.$vuetify.theme.themes.dark.missionAccent,
              segment: {
                borderColor: (ctx) => this.down(ctx, "rgb(192,75,75)"),
              },
            },
            {
              label: "Māori performing arts",
              // backgroundColor: "#f87979",
              backgroundColor: this.$vuetify.theme.themes.dark.baseAccent,
              data: [1, 1, 2, 2, 3, 4, 4],
              fill: false,
              borderColor: this.$vuetify.theme.themes.dark.baseAccent,
            },
          ],
      };
    },
    down(ctx, value) {
      console.log("getting segment down logic...");
      return ctx.p0.parsed.y > ctx.p1.parsed.y ? value : undefined;
    },
  },
};
</script>

<style lang="scss">
.graph {
  // width: 33%;
  height: 200px;
  border: 1px solid red;
}
// .vis-background {
//   display: none;
// }
.vis-timeline {
  border: none;
}
.vis-time-axis .vis-grid.vis-minor {
  border-color: transparent !important;
}

.vis-panel.vis-right {
  border: transparent !important;
}

.vis-panel.vis-center {
  border: transparent !important;
}
</style>
