<template>
  <div class="full-height">
    <network
      ref="network"
      class="full-height"
      :nodes="currentCourseNodes"
      :edges="currentCourseEdges"
      :options="network.options"
      @nodes-add="addNode"
      @edges-add="addEdge"
      @dragging="dragging"
      @drag-end="dragEnd"
      @select-node="selectNode"
      @select-edge="selectEdge"
      @deselect-node="deselectNode"
      @deselect-edge="deselectEdge"
      @hover-node="hoverNode"
      @blur-node="blurNode"
      @zoom="zoom"
      @animation-finished="animationFinished"
      @before-drawing="beforeDrawing"
    ></network>
  </div>
</template>

<script>
import { Network } from "vue2vis";

import { db } from "../store/firestoreConfig";

import "vue2vis/dist/vue2vis.css";

import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyMap",
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
    // functions to animate:
    currentRadius: 0,
    animateRadius: true, // can disable or enable animation
    updateFrameVar: function() {
      this.intervalid1 = setInterval(() => {
        this.updateFrameTimer();
      }, 60);
    },
    newNodePositions: {},
  }),
  components: {
    Network,
  },
  async mounted() {
    console.log("current course id:", this.currentCourseId);
    await this.$store.dispatch("bindNodes", this.currentCourseId);
    await this.$store.dispatch("bindEdges", this.currentCourseId);
    console.log("nodes:", this.currentCourseNodes);
    // console.log("edges:", this.currentCourseEdges);
    console.log(this.$refs.network);
    this.$refs.network.fit();
  },
  beforeDestroy() {
    clearInterval(this.intervalid1);
  },
  computed: {
    ...mapState([
      "currentCourseId",
      "currentCourseNodes",
      "currentCourseEdges",
    ]),
  },
  methods: {
    addNodeMode() {
      this.active = true;
      console.log("add node mode");
      this.$emit("setUiMessage", "Click on the map to add a node");
      this.$refs.network.addNodeMode();
    },
    addEdgeMode() {
      this.active = true;
      console.log("add edge mode");
      this.$emit("setUiMessage", "Click and drag to connect two nodes");
      this.$refs.network.addEdgeMode();
    },
    addNode(data) {
      if (!this.active) return;
      console.log("node added", data);
      const newNodeId = data.properties.items[0];
      const newNode = this.$refs.network.getNode(newNodeId);
      console.log("newNode", newNode);
      this.$emit("add-node", newNode);
    },
    addEdge(data) {
      if (!this.active) return;
      console.log("edge add", data);
      this.$emit("setUiMessage", "");
      const newEdgeData = this.$refs.network.getEdge(data.properties.items[0]);
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("map-edges")
        .doc(newEdgeData.id)
        .set(newEdgeData)
        .then(() => {
          console.log("Edge successfully written!");
          this.$emit("edgeSaved")
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
    },
    click() {
      console.log("click");
      this.$emit("setUiMessage", "");
    },
    dragStart(data) {
      console.log("drag start", data);
    },
    dragging(data) {
      // if (!data.nodes[0]) return;
      // follow drag coords
      // this.$emit("drag-coords", data.event.center);
    },
    dragEnd(data) {
      if (data.nodes.length < 1) {
        return;
      }
      const nodeId = data.nodes[0];
      const newPosition = this.$refs.network.getPositions(data.nodes[0]);
      const nodes = this.$refs.network.nodes;
      const node = nodes.find((node) => node.id === nodeId);
      console.log("node", node);
      console.log("new position", newPosition);
      // check if coords changed
      if (
        newPosition[nodeId].x !== node.x ||
        newPosition[nodeId].y !== node.y
      ) {
        console.log("node position has changed");
        // flag save new positions button
        this.$emit("nodePositionsChanged");
        //   // commit new positions to newNodePositions
        const newPositionObj = {
          id: nodeId,
          x: newPosition[nodeId].x,
          y: newPosition[nodeId].y,
        };
        this.newNodePositions[nodeId] = newPositionObj;
      }
      // console.log("old node positions", nodes)
      // console.log("new node positions", this.newNodePositions)
    },
    async saveNodePositions() {
      this.$emit("nodePositionsChangeLoading");
      const nodes = this.$refs.network.nodes;
      // spread/or map new positions to nodes
      console.log("current nodes:", nodes);
      console.log("changed nodes:", this.newNodePositions);
      for (const changedNode in this.newNodePositions) {
        const changedNodeObj = this.newNodePositions[changedNode];
        console.log("changed node:", changedNodeObj);
        const node = nodes.find((node) => node.id === changedNodeObj.id);
        if (changedNodeObj.x !== node.x || changedNodeObj.y !== node.y) {
          node.x = changedNodeObj.x;
          node.y = changedNodeObj.y;
          // console.log("updated node:", node);
          // save to firestore db
          await db
            .collection("courses")
            .doc(this.currentCourseId)
            .collection("map-nodes")
            .doc(node.id)
            .set(node)
            .then(() => {
              console.log("Node position successfully updated!");
              // loading button
              // hide button
            })
            .catch((error) => {
              console.error("Error writing node positions: ", error);
            });
        } else {
          return;
        }
        this.$emit("nodePositionsChangeSaved");
      }
    },
    selectNode(data) {
      this.active = true;
      if (data.nodes.length == 1) {
        // is type node
        const nodeId = data.nodes[0];
        this.$refs.network.focus(nodeId, { animation: true });
        const selectedNode = this.$refs.network.getNode(nodeId);
        selectedNode.type = "node";
        selectedNode.connectedEdge = data.edges[0];
        (selectedNode.DOMx = data.pointer.DOM.x),
          (selectedNode.DOMy = data.pointer.DOM.y);
        this.startNodeAnimation();
        this.$emit("selected", selectedNode);
      }
    },
    selectEdge(data) {
      this.active = true;
      if (data.edges.length == 1) {
        const edgeId = data.edges[0];
        const selectedEdge = this.$refs.network.getEdge(edgeId);
        selectedEdge.type = "edge";
        (selectedEdge.DOMx = data.pointer.DOM.x),
          (selectedEdge.DOMy = data.pointer.DOM.y);
        this.$emit("selected", selectedEdge);
      }
    },
    deselectNode() {
      this.$emit("deselected");
      this.stopNodeAnimation();
    },
    deselectEdge() {
      this.$emit("deselected");
    },
    removeUnsavedNode() {
      console.log("deleting selected");
      this.$refs.network.deleteSelected();
      this.$emit("deselected");
    },
    zoom(data) {
      console.log("zoom", data);
    },
    disableEditMode() {
      this.$refs.network.disableEditMode();
    },
    animationFinished(data) {
      // show popup
      const nodeId = this.$refs.network.getSelection().nodes[0];
      const focusedNode = this.$refs.network.getNode(nodeId);
      focusedNode.type = "node";
      this.$emit("centerFocus", focusedNode);
      // console.log("centered position of node is = ", this.$refs.network.canvasToDom(nodeId))
    },
    hoverNode(data) {
      this.stopNodeAnimation();
      const nodeId = data.node;
      const hoveredNode = this.$refs.network.getNode(nodeId);
      hoveredNode.type = "node";
      (hoveredNode.DOMx = data.pointer.DOM.x),
        (hoveredNode.DOMy = data.pointer.DOM.y);
      this.$emit("hovered", hoveredNode);
    },
    blurNode() {
      this.$emit("deselected");
    },
    // Canvas Node Animation
    beforeDrawing(ctx) {
      if (this.animateRadius) {
        // get node to animate on
        const nodeId = this.$refs.network.getSelection().nodes[0];
        const selectedNode = this.$refs.network.getNode(nodeId);
        // check if array of object. if its an object then its the selected node. ifs it an array, means node not yet selected
        if (!Array.isArray(selectedNode)) {
          var colorCircle = "#69A1E2";
          var colorBorder = "rgba(0, 0, 200, 0)";
          ctx.strokeStyle = colorCircle;
          ctx.fillStyle = colorBorder;
          var radius = Math.abs(50 * Math.sin(this.currentRadius + 1 / 50.0));
          ctx.circle(selectedNode.x, selectedNode.y, radius);
          ctx.fill();
          ctx.stroke();
        } else {
          return;
        }
      }
    },
    updateFrameTimer() {
      if (this.animateRadius) {
        this.$refs.network.redraw();
        this.currentRadius += 0.05;
      }
    },
    startNodeAnimation() {
      this.animateRadius = true;
      // start interval
      this.updateFrameVar();
    },
    stopNodeAnimation() {
      this.animateRadius = false;
      clearInterval(this.intervalid1);
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
