<template>
  <div class="full-height">
    <network
      ref="network"
      class="full-height"
      :nodes="allNodes"
      :edges="allEdges"
      :options="network.options"
      @zoom="zoom"
      @click="click"
      @hover-node="hoverNode"
    ></network>
  </div>
</template>

<script>
import { Network } from "vue2vis";
import "vue2vis/dist/vue2vis.css";

import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyMap",
  // props: ["nodes",  "edges"],
  components: {
    Network,
  },
  async mounted() {
    // console.log("current course id:", this.course.id);
    await this.$store.dispatch("getAllNodes");
    await this.$store.dispatch("getAllEdges");
    // see available methods
    console.log(this.$refs.network);
    // timeout to give time for nodes to load before refocussing. TODO: loading wheel before timeout
    setTimeout(() => {
      // fit
      console.log("fit");
      this.$refs.network.fit();
      // scale
      console.log("scale");
      var scaleOption = { scale: 0.28 };
      this.$refs.network.moveTo(scaleOption);
    }, 2000);
  },
  computed: {
    ...mapState(["allNodes", "allEdges"]),
  },
  data: () => ({
    active: false,
    network: {
      options: {
        physics: {
          enabled: false,
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
  methods: {
    click(data) {
      // get click location
      const clickedPosition = data.pointer.canvas;
      // get all node locations (returns an object)
      let allNodePositions = this.$refs.network.getPositions();
      // convert object of positions to array of positions
      const allNodePositionsArray = [];
      for (const node in allNodePositions) {
        allNodePositionsArray.push({
          ...allNodePositions[node],
          id: node,
        });
      }
      // calc which node is closes to the click
      let closest = allNodePositionsArray[0];
      let shortestDistance = this.distSquared(
        clickedPosition,
        allNodePositionsArray[0]
      );
      for (let i = 0; i < allNodePositionsArray.length; i++) {
        var d = this.distSquared(clickedPosition, allNodePositionsArray[i]);
        if (d < shortestDistance) {
          closest = allNodePositionsArray[i];
          shortestDistance = d;
          // console.log("new shortestDistance",shortestDistance)
        }
      }
      // console.log("shortestDistance",shortestDistance)
      // console.log("closest",closest)
      const closestNode = this.$refs.network.getNode(closest.id);
      console.log(
        "closest node is " +
          closestNode.label +
          " in group " +
          closestNode.group
      );

      // router to the group's galaxy
    },
    hoverNode(data) {
      console.log("hover",data)
      // const connectedNodes = this.$refs.network.getConnectedNodes(data.node)
      // console.log("connectedNodes",connectedNodes)
      // console.log("BoundingBox", this.$refs.network.getBoundingBox(data.node));
    },
    zoom(data) {
      // console.log("zoom", data);
    },
    distSquared(pt1, pt2) {
      var diffX = pt1.x - pt2.x;
      var diffY = pt1.y - pt2.y;
      return diffX * diffX + diffY * diffY;
    },
  },
};
</script>

<style lang="scss" scoped>
.full-height {
  width: 100%;
  height: 100%;
}
</style>
