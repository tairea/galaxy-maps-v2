<template>
  <div class="full-height">
    <LoadingSpinner
      v-if="!planets.length && !draggingNodes"
      text="loading galaxy"
    />
    <network
      v-if="nodesToDisplay"
      ref="network"
      class="full-height"
      :nodes="nodesToDisplay"
      :edges="teacher ? currentCourseEdges : currentCourseEdgesWithStatusStyles"
      :options="network.options"
      @nodes-add="addNode"
      @edges-add="addEdge"
      @dragging="dragging"
      @drag-start="dragStart"
      @drag-end="dragEnd"
      @select-node="selectNode"
      @select-edge="selectEdge"
      @deselect-node="deselectNode"
      @deselect-edge="deselectEdge"
      @blur-node="blurNode"
      @animation-finished="animationFinished"
      @before-drawing="beforeDrawing"
      @click="click"
      @double-click="doubleClick"
    ></network>
    <!-- @hover-node="hoverNode" -->

    <!-- Attempt to put systems on top of nodes. need to explore drawing solar systems in canvas -->
    <!-- <div v-for="system in currentCourseNodes" :key="system.id">
      <SolarSystem :topic="getTopicById(system.id)" :coords="getDomCoords(system)" :size="'0.25em'" />
    </div> -->
  </div>
</template>

<script>
import { Network } from "vue2vis";
import { Planet } from "../lib/planet";

import SolarSystem from "../components/SolarSystem";
import LoadingSpinner from "../components/LoadingSpinner";

import { db } from "../store/firestoreConfig";

import "vue2vis/dist/vue2vis.css";

import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyMap",
  props: ["teacher"],
  components: {
    Network,
    SolarSystem,
    LoadingSpinner,
  },
  data: () => ({
    loading: true,
    active: false,
    addingNode: false,
    addingEdge: false,
    draggingNodes: false,
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
          color: {
            inherit: "to",
          },
        },
        nodes: {
          shape: "dot",
          size: 7,
          fixed: {
            x: true,
            y: true,
          },
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
        groups: {
          default: {
            shape: "dot",
          },
          completed: {
            shape: "dot",
            color: "#00E676",
          },
          locked: {
            color: "rgba(132,132,132,0.4)", // opaque styling to appear locked
            shape: "dot",
            font: {
              color: "rgba(132,132,132,0.4)", // opaque styling to appear locked
            },
            // opacity: 0.1,
          },
          // unlocked: {
          //   shape: "dot",
          //   color: "#69A1E2",
          // },
          // current: { color: "rgb(0,255,140)" },
          // node status
          // inreview: {
          //   shape: "dot",
          //   color: "#FAF200",
          // },
          // node types
          introduction: {
            shape: "dot",
            // color: "#00E676",
          },
          // tasks: {
          //   // color: { background: "yellow", border: "white" },
          //   // shape: "diamond",
          //   shape: "dot",
          //   color: "#69A1E2",
          // },
          // project: {
          //   shape: "dot",
          //   color: "#E269CF",
          // },
          inactive: {
            shape: "dot",
            color: "#696969",
            font: {
              color: "#696969",
            },
          },
        },
        interaction: {
          hover: true,
          hoverConnectedEdges: false,
          dragNodes: false,
        },
      },
    },
    // functions to animate:
    currentRadius: 0,
    animateRadius: true, // can disable or enable animation
    updateFrameVar: function () {
      this.intervalid1 = setInterval(() => {
        this.updateFrameTimer();
      }, 33);
    },
    newNodePositions: {},
    personsCourseTasks: [],
    courseTasks: [],
    planets: [],
    time: null,
  }),
  async mounted() {
    // var course = this.getCourseById(this.courseId);
    var person = this.person.id;
    // var contentMadeBy = course.contentBy.personId;

    // determine if person logged in and on galaxy view page is a teacher
    // if so, allow them to move the nodes
    // if (this.teacher && this.$route.name == "GalaxyView") {
    //   this.network.options.interaction.dragNodes = true;
    // } else {
    //   this.network.options.interaction.dragNodes = false;
    // }

    await this.$store.dispatch("bindCourseNodes", this.currentCourseId);
    await this.$store.dispatch("bindCourseEdges", this.currentCourseId);
    // bind topics for course creator
    if (this.teacher) {
      await this.$store.dispatch("bindCourseTopics", this.currentCourseId);
    } else {
      // bind topics for student
      await this.$store.dispatch("bindThisPersonsCourseTopics", {
        personId: this.person.id,
        courseId: this.currentCourseId,
      });
    }

    // zoom fit on load
    if (this.$refs.network.nodes.length > 0) {
      setTimeout(() => this.zoomToNodes(this.$refs.network.nodes), 250);
      // set label colours (important if in light mode)
      this.makeGalaxyLabelsColour(
        this.$vuetify.theme.isDark
          ? "#fff"
          : this.$vuetify.theme.themes.light.baseAccent
      );
    }

    console.log("this.network.options", this.network.options);

    this.drawSolarSystems();
  },
  beforeDestroy() {
    this.stopNodeAnimation();
    if (this.$refs.network) {
      this.$refs.network.destroy();
    }
  },
  computed: {
    ...mapGetters([
      "getTopicById",
      "person",
      "getCourseById",
      "getTasksByTopicId",
    ]),
    ...mapState([
      "currentCourseId",
      "currentCourseNodes",
      "currentCourseEdges",
      "personsTopics",
      "personsTopicsTasks",
      "topicsTasks",
    ]),
    nodesToDisplay() {
      if (this.currentCourseNodes.length && this.currentCourseNodes[0]?.id) {
        if (this.addingNode || this.addingEdge) {
          return this.inActiveNodes;
        } else if (!this.teacher) {
          return this.currentCourseNodesWithStatus;
        } else return this.currentCourseNodes;
      }
      return false;
    },
    inActiveNodes() {
      let inActiveNodes = [];
      for (const node of this.currentCourseNodes) {
        inActiveNodes.push({
          ...node,
          // color: this.stringToColour(matchingNode.label),  // Attempt to match node color to System color
          group: "inactive",
        });
      }
      // return nodes with status to network map
      return inActiveNodes;
    },
    currentCourseNodesWithStatus() {
      let nodesWithStatus = [];
      // loop each node
      for (const node of this.currentCourseNodes) {
        // find the topic node with status
        let matchingNode = this.personsTopics.find((x) => {
          return x.id === node.id;
        });
        // push node with status
        nodesWithStatus.push({
          ...node,
          // color: this.stringToColour(matchingNode.label),  // Attempt to match node color to System color
          group: matchingNode?.topicStatus ?? "default",
        });
      }
      // return nodes with status to network map
      return nodesWithStatus;
    },
    currentCourseEdgesWithStatusStyles() {
      let edgesWithStatusStyles = [];
      let hasDashes = false;

      for (const edge of this.currentCourseEdges) {
        // find the topic node with status
        let matchingEdge = this.personsTopics.find((x) => {
          // add dashes to the edge (if topic is locked)
          if (x.topicStatus == "locked") {
            hasDashes = true;
            // hasDashes = [2,2]
          } else {
            hasDashes = false;
          }
          return x.id === edge.to;
        });
        // push node with status
        edgesWithStatusStyles.push({
          ...edge,
          dashes: hasDashes,
        });
      }
      // return nodes with status to network map
      return edgesWithStatusStyles;
    },
  },
  methods: {
    drawSolarSystems() {
      // set up solar system planets
      this.setupSolarSystemPlanets();
      // start animation
      this.startNodeAnimation();
    },
    disableEditMode() {
      this.$refs.network.disableEditMode();
      (this.addingNode = false),
        (this.addingEdge = false),
        (this.active = false);
    },
    disableDragMode() {
      this.draggingNodes = false;
      this.network.options.interaction.dragNodes = false;
      this.planets = [];
    },
    getDomCoords(node) {
      let domCoords = this.$refs.network.canvasToDom({ x: node.x, y: node.y });
      return domCoords;
    },
    doubleClick() {
      if (!this.teacher) {
        return;
      }
      this.addNodeMode();
    },
    addNodeMode() {
      this.active = true;
      this.addingNode = true;
      // this.$emit("setUiMessage", "Click on the map to add a node");
      this.$refs.network.addNodeMode();
    },
    addEdgeMode() {
      this.active = true;
      // this.$emit("setUiMessage", "Click and drag to connect two nodes");
      this.$refs.network.addEdgeMode();
      // disable node hover
      this.addingEdge = true;
    },
    dragNodeMode() {
      // TODO:
      this.draggingNodes = true;
      // stop animations
      this.stopNodeAnimation();
      // clear solar systems
      this.planets = [];
      this.$refs.network.redraw();
      // enable node dragging
      this.network.options.interaction.dragNodes = true;
      //
    },
    addNode(data) {
      if (!this.active) return;
      const newNodeId = data.properties.items[0];
      const selected = this.$refs.network.getSelection();
      if (selected.nodes.length || selected.edges.length) {
        // select the new node accidentally created and delete it
        this.$refs.network.selectNodes([newNodeId]);
        this.$refs.network.deleteSelected();
        return;
      }
      const newNode = this.$refs.network.getNode(newNodeId);
      this.$emit("add-node", newNode);
      this.addingNode = false;
    },
    addEdge(data) {
      this.$emit("setUiMessage", "");
      const newEdgeData = this.$refs.network.getEdge(data.properties.items[0]);
      if (newEdgeData.from === newEdgeData.to) {
        // select the new edge accidentally and delete it
        this.$refs.network.selectEdges([newEdgeData.id]);
        this.$refs.network.deleteSelected();
        return;
      }
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("map-edges")
        .doc(newEdgeData.id)
        .set(newEdgeData)
        .then(() => {
          this.$emit("toggleAddEdgeMode");
          this.addingEdge = false;
          // toggle edge mode again so to stay in edit edge mode (this is so you can continuously add edges)
          this.$emit("toggleAddEdgeMode");
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
    },
    click(data) {
      if (this.addingNode || this.addingEdge) return;
      if (data.edges.length === 0 && data.nodes.length === 0) {
        this.deselectNode();
      }
    },
    dragStart(data) {
      this.deselectNode();
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
      // check if coords changed
      if (
        newPosition[nodeId].x !== node.x ||
        newPosition[nodeId].y !== node.y
      ) {
        // flag save new positions button
        console.log("EMITTING: node positions changed");
        this.$emit("nodePositionsChanged");
        //   // commit new positions to newNodePositions
        const newPositionObj = {
          id: nodeId,
          x: newPosition[nodeId].x,
          y: newPosition[nodeId].y,
        };
        this.newNodePositions[nodeId] = newPositionObj;
      }
    },
    async saveNodePositions() {
      this.$emit("nodePositionsChangeLoading");
      const nodes = this.$refs.network.nodes;
      const newNodes = this.newNodePositions;
      // spread/or map new positions to nodes

      for (const changedNode in newNodes) {
        const changedNodeObj = newNodes[changedNode];
        const node = nodes.find((node) => node.id === changedNodeObj.id);
        // TODO: only saves changes once. not the second time
        if (changedNodeObj.x !== node.x || changedNodeObj.y !== node.y) {
          node.x = changedNodeObj.x;
          node.y = changedNodeObj.y;
          // save to firestore db
          if (node.group) delete node.group;

          await db
            .collection("courses")
            .doc(this.currentCourseId)
            .collection("map-nodes")
            .doc(node.id)
            .set(node)
            .catch((error) => {
              console.error("Error writing node positions: ", error);
            });
        } else {
          this.$emit("nodePositionsChangeSaved");
          return;
        }
        this.$emit("nodePositionsChangeSaved");
      }
      return (this.newNodePositions = {});
    },
    selectNode(data) {
      if (this.addingNode || this.addingEdge) return;
      this.active = true;
      if (data.nodes.length == 1) {
        // is type node
        const nodeId = data.nodes[0];
        this.$refs.network.focus(nodeId, { scale: 1.2, animation: true });
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
      if (this.addingNode || this.addingEdge) return;
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
      this.active = false;
      this.$emit("deselected");
      // this.stopNodeAnimation();
    },
    deselectEdge() {
      this.$emit("deselected");
    },
    removeUnsavedNode() {
      this.active = false;
      this.$refs.network.deleteSelected();
    },
    animationFinished(data) {
      // show popup
      const nodeId = this.$refs.network.getSelection().nodes[0];
      const focusedNode = this.$refs.network.getNode(nodeId);
      focusedNode.type = "node";
      this.$emit("centerFocus", focusedNode);
    },
    hoverNode(data) {
      if (this.addingEdge == true || this.addingNode) return;
      // this.stopNodeAnimation();
      const nodeId = data.node;
      const hoveredNode = this.$refs.network.getNode(nodeId);
      hoveredNode.type = "node";
      (hoveredNode.DOMx = data.pointer.DOM.x),
        (hoveredNode.DOMy = data.pointer.DOM.y);
      this.$emit("hoverNode", hoveredNode);
    },
    blurNode() {
      this.$emit("blurNode");
      if (this.active) return;
      setTimeout(() => {
        this.$emit("deselected");
      }, 1000);
    },
    hashCode(str) {
      let hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    },
    stringToColour(str) {
      if (!str) return;
      return this.hslToHex(this.hashCode(str) % 360, 100, 70);
      // return `hsl(${this.hashCode(str) % 360}, 100%, 70%)`;
    },
    hslToHex(h, s, l) {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, "0"); // convert to Hex and prefix "0" if needed
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    },
    // this controls the fit zoom animation
    zoomToNodes(nodes) {
      // nodes to zoom to
      // get node ids
      var nodeIds = nodes.map((x) => x.id);
      this.$refs.network.fit({
        nodes: nodeIds,
        animation: true,
      });
    },
    makeGalaxyLabelsColour(colour) {
      var options = { ...this.network.options };
      options.nodes.font.color = colour;
      this.$refs.network.setOptions(options);
      this.$refs.network.fit();
    },
    async bindCourseTasks() {
      if (!this.teacher) {
        this.personsCourseTasks = await this.getPersonsCourseTasks({
          personId: this.person.id,
          courseId: this.currentCourseId,
        });
      } else {
        this.courseTasks = await this.getCourseTasks({
          courseId: this.currentCourseId,
        });
      }
    },
    async setupSolarSystemPlanets() {
      // get all tasks
      await this.bindCourseTasks();

      let tasks = [];
      if (!this.teacher) {
        tasks = this.personsCourseTasks;
      } else {
        tasks = this.courseTasks;
      }

      // get node ids
      const nodeIds = this.$refs.network.nodes.map(({ id }) => id);
      // get node xy positions
      const nodePositionMap = this.$refs.network.getPositions(nodeIds);

      // loop nodes/topics
      Object.entries(nodePositionMap).forEach(
        async ([topicId, topicPosition]) => {
          const topicsTasks = tasks.filter((task) => task.topicId == topicId);

          for (let i = 1; i <= topicsTasks.length; i++) {
            this.planets.push(
              new Planet(
                topicPosition.x,
                topicPosition.y,
                2, // planet size
                "white", // planet colour
                6.28 / 5, // planet speed (6.28 radians in a circle. so 6.28 is full circle in 1 second. divide by something to slow it down)
                20 * i // planet orbit size
              )
            );
          }
        }
      );
    },
    beforeDrawing(ctx) {
      // get delta
      const oldTime = this.time;
      this.time = new Date();
      let delta;
      if (oldTime == null) {
        delta = 1;
      } else {
        delta = (this.time.getTime() - oldTime.getTime()) / 1000;
      }
      // update planets orbits
      for (const planet of this.planets) {
        planet.update(ctx, delta);
      }
    },
    updateFrameTimer() {
      if (this.$refs.network) {
        this.$refs.network.redraw();
      }
    },
    startNodeAnimation() {
      // start interval
      this.updateFrameVar();
    },
    stopNodeAnimation() {
      clearInterval(this.intervalid1);
    },
    async getPersonsCourseTasks(payload) {
      const personsCourseTopics = await db
        .collection("people")
        .doc(payload.personId)
        .collection(payload.courseId)
        .get();

      const tasksArr = [];
      for (const topic of personsCourseTopics.docs) {
        if (topic.data().topicStatus !== "locked") {
          const tasks = await db
            .collection("people")
            .doc(payload.personId)
            .collection(payload.courseId)
            .doc(topic.id)
            .collection("tasks")
            .get();

          for (const task of tasks.docs) {
            tasksArr.push({ topicId: topic.id, task: task.data() });
          }
        }
      }
      // console.log("tasksArr", tasksArr)
      return tasksArr;
    },
    async getCourseTasks(payload) {
      const courseTopics = await db
        .collection("courses")
        .doc(payload.courseId)
        .collection("topics")
        .get();

      const tasksArr = [];
      for (const topic of courseTopics.docs) {
        const tasks = await db
          .collection("courses")
          .doc(payload.courseId)
          .collection("topics")
          .doc(topic.id)
          .collection("tasks")
          .get();

        for (const task of tasks.docs) {
          tasksArr.push({ topicId: topic.id, task: task.data() });
        }
      }
      // console.log("tasksArr", tasksArr)
      return tasksArr;
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
