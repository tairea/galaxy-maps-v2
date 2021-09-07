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

      @zoom="zoom"

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
        interaction:{
          hover:true
        },
      },
    },
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
    this.$refs.network.fit()
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
      this.active = true
      console.log("add node mode")
      this.$emit("setUiMessage", "Click on the map to add a node")
      this.$refs.network.addNodeMode()
    },
    addEdgeMode() {
      this.active = true
      console.log("add edge mode")
      this.$emit("setUiMessage", "Click and drag to connect two nodes")
      this.$refs.network.addEdgeMode()
    },
    addNode(data) {
      if (!this.active) return
      console.log("node added",data)
      const newNodeId = data.properties.items[0]
      const newNode = this.$refs.network.getNode(newNodeId)
      console.log("newNode",newNode)
      this.$emit("add-node",newNode)
    },
    addEdge(data) {
      if (!this.active) return
      console.log("edge add",data);
      this.$emit("setUiMessage", "")
      const newEdgeData = this.$refs.network.getEdge(data.properties.items[0]);
      db.collection("courses")
          .doc(this.currentCourseId)
          .collection("map-edges")
          .doc(newEdgeData.id)
          .set(newEdgeData)
          .then(() => {
            console.log("Edge successfully written!");
          })
          .catch((error) => {
            console.error("Error writing node: ", error);
          });
    },
    click() {
      console.log("click")
      this.$emit("setUiMessage", "")
    },
    dragStart(data) {
      console.log("drag start",data)
    },
    dragging(data) {
      if (!data.nodes[0]) return
      console.log("dragging",data)
      // emit the x y drag coordinates
      this.$emit("drag-coords",data.event.center)
    },
    dragEnd(data) {
      console.log("drag End",data)
    },
    selectNode(data) {
      this.active = true
      console.log("select node:", data)
      if (data.nodes.length == 1) {
        // is type node
        const nodeId = data.nodes[0]
        const selectedNode = this.$refs.network.getNode(nodeId)
        selectedNode.type = "node"
        selectedNode.connectedEdge = data.edges[0]
        selectedNode.DOMx = data.pointer.DOM.x,
        selectedNode.DOMy = data.pointer.DOM.y      
        this.$emit("selected",selectedNode)
      }
    },
    selectEdge(data) {
      this.active = true
      console.log("select edge:", data)
      if (data.edges.length == 1) {
      const edgeId = data.edges[0]
      const selectedEdge =  this.$refs.network.getEdge(edgeId)
        selectedEdge.type = "edge"
        selectedEdge.DOMx = data.pointer.DOM.x,
        selectedEdge.DOMy = data.pointer.DOM.y      
        this.$emit("selected",selectedEdge)
      }
    },
    deselectNode() {
      this.$emit("deselected")
    },
    deselectEdge() {
      this.$emit("deselected")
    },
    removeUnsavedNode() {
      console.log("deleting selected")
      this.$refs.network.deleteSelected()
      this.$emit("deselected")
    },
    zoom(data) {
      console.log("zoom",data)
    }
  },
};
</script>

<style lang="scss">
.full-height {
  width: 100%;
  height: 100%;
}

</style>
