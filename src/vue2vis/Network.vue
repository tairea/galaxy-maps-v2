<template>
  <div ref="visualization"></div>
</template>

<script>
import { DataSet, DataView } from "vis-data/esnext";
import { Network } from "vis-network/esnext";
import { mountVisData, translateEvent } from "./utils";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "network",
  props: {
    edges: {
      type: [Array, DataSet, DataView],
      default: () => [],
    },
    nodes: {
      type: [Array, DataSet, DataView],
      default: () => [],
    },
    events: {
      type: Array,
      default: () => [
        "click",
        "doubleClick",
        "oncontext",
        "hold",
        "release",
        "select",
        "selectNode",
        "selectEdge",
        "deselectNode",
        "deselectEdge",
        "dragStart",
        "dragging",
        "dragEnd",
        "hoverNode",
        "blurNode",
        "hoverEdge",
        "blurEdge",
        "zoom",
        "showPopup",
        "hidePopup",
        "startStabilizing",
        "stabilizationProgress",
        "stabilizationIterationsDone",
        "stabilized",
        "resize",
        "initRedraw",
        "beforeDrawing",
        "afterDrawing",
        "animationFinished",
        "configChange",
      ],
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  data: () => ({
    visData: {
      nodes: [],
      edges: [],
    },
    processedNodes: [], // Add this line
    processedEdges: [], // Add this line
  }),
  watch: {
    options: {
      deep: true,
      handler(o) {
        console.log("New options:", JSON.stringify(o, null, 2));
        this.network.setOptions(o);
      },
    },
  },
  created() {
    // This should be a Vue data property, but Vue reactivity kinda bugs Vis.
    // See here for more: https://github.com/almende/vis/issues/2524
    this.network = null;
  },
  mounted() {
    // Remove duplicates before mounting
    // Process nodes and edges without mutating props
    this.processedNodes = this.removeDuplicates(this.nodes, "nodes");
    this.processedEdges = this.removeDuplicates(this.edges, "edges");

    // debugging: check if they have an invalid x or y value. if so, set to 0
    this.processedNodes.forEach((node) => {
      if (
        !("x" in node) ||
        !("y" in node) ||
        node.x == null ||
        node.y == null ||
        isNaN(node.x) ||
        isNaN(node.y)
      ) {
        console.log(
          "Breaking nodes. Possibly no X,Y values go here to fix: /courses/" +
            node.courseId +
            "/map-nodes/" +
            node.id,
        );
        // Update the node with default x and y values
        return { ...node, x: 0, y: 0 };
      }
      return node;
    });

    const nodes = mountVisData(this, "processedNodes");
    const edges = mountVisData(this, "processedEdges");

    this.visData.nodes = nodes;
    this.visData.edges = edges;

    this.network = new Network(this.$refs.visualization, this.visData, this.options);

    this.events.forEach((eventName) =>
      this.network.on(eventName, (props) => this.$emit(translateEvent(eventName), props)),
    );
  },
  beforeDestroy() {
    this.network.destroy();
  },
  methods: {
    removeDuplicates(items, type) {
      const seenIds = new Set();
      const duplicates = [];
      const result = items.filter((item) => {
        if (seenIds.has(item.id)) {
          duplicates.push(item);
          return false; // Remove duplicate
        }
        seenIds.add(item.id);
        return true;
      });

      if (duplicates.length > 0) {
        console.warn(`Found ${duplicates.length} duplicate ${type}:`);
        duplicates.forEach((item) => {
          console.warn(
            `Duplicate ${type.slice(0, -1)} ID: ${item.id}, Course ID: ${item.courseId}`,
          );
        });
      }

      return result;
    },
    destroy() {
      this.network.destroy();
    },
    getNode(id) {
      return this.visData.nodes.get(id);
    },
    getEdge(id) {
      return this.visData.edges.get(id);
    },
    setOptions(options) {
      this.network.setOptions(options);
    },
    on(event, callback) {
      this.network.moveTo(event, callback);
    },
    off(event, callback) {
      this.network.moveTo(event, callback);
    },
    once(event, callback) {
      this.network.moveTo(event, callback);
    },
    canvasToDom(p) {
      return this.network.canvasToDOM(p);
    },
    domToCanvas(p) {
      return this.network.DOMtoCanvas(p);
    },
    redraw() {
      this.network.redraw();
    },
    setSize(w, h) {
      this.network.setSize(w, h);
    },
    cluster(options) {
      this.network.cluster(options);
    },
    clusterByConnection(nodeId, options) {
      this.network.clusterByConnection(nodeId, options);
    },
    clusterByHubsize(hubsize, options) {
      this.network.clusterByHubsize(hubsize, options);
    },
    clusterOutliers(options) {
      this.network.clusterOutliers(options);
    },
    findNode(id) {
      return this.network.findNode(id);
    },
    getClusteredEdges(baseEdgeId) {
      return this.network.clustering.getClusteredEdges(baseEdgeId);
    },
    getBaseEdge(clusteredEdgeId) {
      return this.network.clustering.getBaseEdge(clusteredEdgeId);
    },
    getBaseEdges(clusteredEdgeId) {
      return this.network.clustering.getBaseEdges(clusteredEdgeId);
    },
    updateEdge(startEdgeId, options) {
      this.network.clustering.updateEdge(startEdgeId, options);
    },
    updateClusteredNode(clusteredNodeId, options) {
      this.network.clustering.updateClusteredNode(clusteredNodeId, options);
    },
    isCluster(nodeId) {
      return this.network.isCluster(nodeId);
    },
    getNodesInCluster(clusterNodeId) {
      return this.network.getNodesInCluster(clusterNodeId);
    },
    openCluster(nodeId, options) {
      this.network.openCluster(nodeId, options);
    },
    getSeed() {
      return this.network.getSeed();
    },
    enableEditMode() {
      this.network.enableEditMode();
    },
    disableEditMode() {
      this.network.disableEditMode();
    },
    addNodeMode() {
      this.network.addNodeMode();
    },
    editNode() {
      this.network.editNode();
    },
    addEdgeMode() {
      this.network.addEdgeMode();
    },
    editEdgeMode() {
      this.network.editEdgeMode();
    },
    deleteSelected() {
      this.network.deleteSelected();
    },
    getPositions(nodeIds) {
      return this.network.getPositions(nodeIds);
    },
    storePositions() {
      this.network.storePositions();
    },
    moveNode(nodeId, x, y) {
      this.network.moveNode(nodeId, x, y);
    },
    getBoundingBox(nodeId) {
      return this.network.getBoundingBox(nodeId);
    },
    getConnectedNodes(nodeId, direction) {
      return this.network.getConnectedNodes(nodeId, direction);
    },
    getConnectedEdges(nodeId) {
      return this.network.getConnectedEdges(nodeId);
    },
    startSimulation() {
      this.network.startSimulation();
    },
    stopSimulation() {
      this.network.stopSimulation();
    },
    stabilize(iterations) {
      this.network.stabilize(iterations);
    },
    getSelection() {
      return this.network.getSelection();
    },
    getSelectedNodes() {
      return this.network.getSelectedNodes();
    },
    getSelectedEdges() {
      return this.network.getSelectedEdges();
    },
    getNodeAt(p) {
      return this.network.getNodeAt(p);
    },
    getEdgeAt(p) {
      return this.network.getEdgeAt(p);
    },
    selectNodes(nodeIds, highlightEdges) {
      this.network.selectNodes(nodeIds, highlightEdges);
    },
    selectEdges(edgeIds) {
      this.network.selectEdges(edgeIds);
    },
    setSelection(selection, options) {
      this.network.setSelection(selection, options);
    },
    unselectAll() {
      this.network.unselectAll();
    },
    getScale() {
      return this.network.getScale();
    },
    getViewPosition() {
      return this.network.getViewPosition();
    },
    fit(options) {
      this.network.fit(options);
    },
    focus(nodeId, options) {
      this.network.focus(nodeId, options);
    },
    moveTo(options) {
      this.network.moveTo(options);
    },
    releaseNode() {
      this.network.releaseNode();
    },
    getOptionsFromConfigurator() {
      return this.network.getOptionsFromConfigurator();
    },
  },
};
</script>
