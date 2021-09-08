<template>
  <div class="full-height" @click="routeToGalaxy(course)">
    <network
      ref="network"
      class="full-height"
      :nodes="allNodes"
      :edges="allEdges"
      :options="network.options"
    ></network>
  </div>
</template>

<script>
import { Network } from "vue2vis";
import "vue2vis/dist/vue2vis.css";

import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyMap",
  props: ["nodes",  "edges"],
  components: {
    Network,
  },
  async mounted() {
		// console.log("current course id:", this.course.id);
		await this.$store.dispatch("getAllNodes");
		await this.$store.dispatch("getAllEdges");
    // await this.$store.dispatch("bindNodes", this.course.id);
    // await this.$store.dispatch("bindEdges", this.course.id);
    // console.log("nodes:", this.currentCourseNodes);
    // console.log("edges:", this.currentCourseEdges);
    console.log(this.$refs.network);
    this.$refs.network.fit();
	},
	  computed: {
    ...mapState([
      "allNodes",
      "allEdges",
    ]),
  },
  data: () => ({
    active: false,
    network: {
      options: {
        physics: {
          enabled: true,
          solver: "repulsion",
          repulsion: {
            nodeDistance: 200, // Put more distance between the nodes.
          },
        },
        edges: {
          length: 50, // Longer edges between nodes.
          smooth: false,
        },
        nodes: {
          shape: "dot",
          size: 7,
          color: {
            border: "grey",
            highlight: {
              border: "black",
              background: "white",
            },
            hover: {
              border: "orange",
              background: "grey",
            },
          },
          font: { color: "white" },
        },
        interaction: {
          hover: true,
          hoverConnectedEdges: false,
        },
      },
    },
  }),
};
</script>

<style lang="scss" scoped>
.full-height {
  width: 100%;
  height: 100%;
}
</style>