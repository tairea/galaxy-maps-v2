<template>
  <div class="full-height">
    <LoadingSpinner v-if="loading" text="loading galaxy" />
    <!-- loading = !planets.length && !draggingNodes -->
    <network
      v-if="nodesToDisplay"
      ref="network"
      class="full-height"
      :nodes="nodesToDisplay"
      :edges="edgesToDisplay"
      :options="network.options"
      @hook:updated="networkUpdated"
      @nodes-add="addNode"
      @edges-add="addEdge"
      @dragging="dragging"
      @drag-start="dragStart"
      @drag-end="dragEnd"
      @select-edge="selectEdge"
      @deselect-node="deselectNode"
      @deselect-edge="deselectEdge"
      @animation-finished="animationFinished"
      @before-drawing="beforeDrawing"
      @after-drawing="afterDrawing"
      @click="click2"
      @double-click="doubleClick"
    ></network>
    <!-- @hover-node="hoverNode" 
          @select-node="selectNode"
                @blur-node="blurNode"
    -->
  </div>
</template>

<script>
import SolarSystem from "@/components/Reused/SolarSystem.vue";
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import { fetchCourseByCourseId } from "@/lib/ff";
import { Planet } from "@/lib/planet";
import { Star } from "@/lib/star";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import Network from "@/vue2vis/Network.vue";
import "vis-network/styles/vis-network.css";
import { mapActions, mapState } from "pinia";

export default {
  name: "GalaxyMap",
  props: ["course", "showMissions"],
  components: {
    Network,
    SolarSystem,
    LoadingSpinner,
  },
  data: () => ({
    loading: true,
    needsCentering: false,
    active: false,
    addingNode: false,
    addingEdge: false,
    processingEdge: false, // Add this flag to prevent recursive edge creation
    draggingNodes: false,
    network: {
      options: {
        // layout: {
        //   hierarchical: {
        //     enabled: true,
        //     sortMethod: "directed",
        //     shakeTowards: "leaves",
        //     direction: "LR",
        //     nodeSpacing: 100,
        //   },
        // },
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
          font: {
            color: "white",
            align: "left",
            face: "Arial",
            size: 12,
          },
          // Disable vis-network labels since we'll draw them manually
          label: "",
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
            color: "#00E676", // baseAccent
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
          multiselect: true,
        },
      },
    },
    // functions to animate:
    currentRadius: 0,
    animateRadius: true, // can disable or enable animation
    updateFrameVar() {
      this.intervalid1 = setInterval(() => {
        this.updateFrameTimer();
      }, 33);
    },
    newNodePositions: {},
    planets: [],
    stars: [],
    time: null,
    inSystemPreviewView: false,
    previewedNode: null,
    numberOfTasksForThisTopic: 0,
    tasks: [],
    drag: false,
    DOMRect: {},
    nodeLabelColor: "#ffffff", // Default label color
    originalShowMissionsState: false, // Track original showMissions state
  }),
  watch: {
    darkMode(dark) {
      if (dark == false) {
        this.nodeLabelColor = this.$vuetify.theme.themes.light.missionAccent;
        this.makePlanetsColour(this.$vuetify.theme.themes.light.missionAccent);
        this.makeStarsColour("#FFA500"); // Orange for light mode
      } else {
        this.nodeLabelColor = this.$vuetify.theme.themes.dark.missionAccent;
        this.makePlanetsColour("white");
        this.makeStarsColour("#FFD700"); // Gold for dark mode
      }
    },
    // Watch for currentCourseId changes to refresh data when it becomes available
    currentCourseId(newCourseId, oldCourseId) {
      if (newCourseId && newCourseId !== oldCourseId) {
        console.log("currentCourseId changed, refreshing data:", newCourseId);
        this.refreshData();
      }
    },
    // This is a watch for the topic clicked event from the systemListPanel
    // this is needed because trigging topicClicked from GalaxyView it stuck in a loop
    panelTopicClicked(newTopic) {
      if (!newTopic || !this.$refs.network) return;

      // Find the node in the network that matches the clicked topic
      const node = this.$refs.network.nodes.find((n) => n.id === newTopic.id);
      if (node) {
        this.zoomToNode(node);
        const options = { ...this.network.options };
        options.edges.hidden = true; // hide edges
        options.nodes.font.size = 5; // hide labels
        this.$refs.network.setOptions(options);
        this.$emit("topicClicked", newTopic);
      }
    },
  },
  computed: {
    ...mapState(useRootStore, [
      "person",
      "user",
      "currentCourseId",
      "currentTopicId",
      "currentCourseNodes",
      "currentCourseEdges",
      "personsTopics",
      "darkMode",
      "personsCourseTasks",
      "courseTasks",
    ]),
    galaxyCompleted() {
      return this.person.completedCourses?.includes(this.currentCourseId);
    },
    teacher() {
      return (
        this.course?.mappedBy.personId === this.person?.id ||
        this.user.data?.admin ||
        (this.course?.collaboratorIds && this.course.collaboratorIds.includes(this.person?.id))
      );
    },
    // student aka navigator
    student() {
      return this.person?.assignedCourses?.some((courseId) => courseId === this.currentCourseId);
    },
    nodesToDisplay() {
      if (this.currentCourseNodes.length && this.currentCourseNodes[0]?.id) {
        if (this.addingNode || this.addingEdge) {
          // grey out nodes for edit modes
          return this.inActiveNodes;
        } else if (this.student) {
          return this.currentCourseNodesWithStatus;
        } else {
          // re-colour nodes after exiting edit modes
          return this.makeActiveNodes;
        }
      }
      return false;
    },
    edgesToDisplay() {
      return this.student ? this.currentCourseEdgesWithStatusStyles : this.currentCourseEdges;
    },
    inActiveNodes() {
      const inActiveNodes = [];
      for (const node of this.currentCourseNodes) {
        inActiveNodes.push({
          ...node,
          // color: this.stringToColour(matchingNode.label),  // Attempt to match node color to System color
          group: "inactive",
          label: "", // Remove vis-network labels since we draw them manually
        });
      }
      // return nodes with status to network map
      return inActiveNodes;
    },
    makeActiveNodes() {
      const makeActiveNodes = [];
      for (const node of this.currentCourseNodes) {
        makeActiveNodes.push({
          ...node,
          // color: this.stringToColour(matchingNode.label),  // Attempt to match node color to System color
          group: "default",
          label: "", // Remove vis-network labels since we draw them manually
        });
      }
      // return nodes with status to network map
      return makeActiveNodes;
    },
    currentCourseNodesWithStatus() {
      const nodesWithStatus = [];
      // loop each node
      for (const node of this.currentCourseNodes) {
        // find the topic node with status
        const matchingNode = this.personsTopics.find((x) => x.id === node.id);

        // console.log("matching node:", matchingNode);

        // if node is status completed or locked. remove color property
        let color = node.color;
        if (matchingNode?.topicStatus === "locked" || matchingNode?.topicStatus === "completed") {
          color = undefined;
        }

        // push node with status
        nodesWithStatus.push({
          ...node,
          color,
          group: matchingNode?.topicStatus ?? "locked", // assign group property based on topicStatus from matchingNode (aka this.personsTopics)
          label: "", // Remove vis-network labels since we draw them manually
        });
      }

      // return nodes with status to network map
      return nodesWithStatus;
    },
    currentCourseEdgesWithStatusStyles() {
      const edgesWithStatusStyles = [];

      for (const edge of this.currentCourseEdges) {
        // find the topic node with status
        const matchingEdge = this.personsTopics.find((x) => x.id === edge.to);

        // push node with status
        edgesWithStatusStyles.push({
          ...edge,
          // add dashes to the edge (if topic is locked)
          dashes: matchingEdge == null || matchingEdge.topicStatus === "locked" ? true : false,
        });
      }
      // return nodes with status to network map
      return edgesWithStatusStyles;
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  async mounted() {
    // Set initial label color
    this.nodeLabelColor = this.$vuetify.theme.isDark
      ? this.$vuetify.theme.themes.dark.missionAccent
      : this.$vuetify.theme.themes.light.missionAccent;

    // Only refresh data if currentCourseId is already available
    if (this.currentCourseId) {
      this.refreshData();
    }

    // zoom fit on load
    if (this.nodesToDisplay && this.$refs.network.nodes.length > 0) {
      this.needsCentering = true;
    }

    await this.drawSolarSystems();

    // ==== check if all topics completed. if so GALAXY MAP COMPLETE!!! ====
    const isGalaxyMapComplete = this.personsTopics.every(
      (topic) => topic.topicStatus === "completed",
    );
    if (!this.galaxyCompleted && this.personsTopics.length && isGalaxyMapComplete) {
      // TODO: better complete congrats
      console.log("Galaxy Map Complete. Well done!");
      this.$emit("galaxyCompleted");
    }
  },
  beforeDestroy() {
    this.stopNodeAnimation();
    this.$refs.network?.destroy();
    this.disableDragMode(); // Clean up event listeners
  },
  methods: {
    ...mapActions(useRootStore, [
      "bindCourseEdges",
      "bindCourseNodes",
      "bindThisPersonsCourseTopics",
      "getCourseTasks",
      "getPersonsCourseTasks",
      "setCurrentTopicId",
    ]),
    async refreshData() {
      // Validate required fields before proceeding
      if (!this.currentCourseId) {
        console.warn("refreshData: Missing currentCourseId");
        return;
      }

      await this.bindCourseNodes(this.currentCourseId);
      await this.bindCourseEdges(this.currentCourseId);

      // bind topics for course creator
      // if (this.teacher) {
      //   // bind. state.courseTasks
      //   await this.getCourseTasks(this.currentCourseId);
      // } else {
      // bind topics for student
      // await this.bindThisPersonsCourseTopics({
      //   personId: this.person.id,
      //   courseId: this.currentCourseId,
      // });
      // bind state.personsCourseTasks
      //   await this.getPersonsCourseTasks();
      // }

      // ===== NOTE: Updated logic to bind topics for course creator && "non-signed-in-user" (improving new user experience)
      if (this.student) {
        // Validate person.id for student
        if (!this.person?.id) {
          console.warn("refreshData: Missing person.id for student");
          return;
        }

        // bind topics for student
        await this.bindThisPersonsCourseTopics({
          personId: this.person.id,
          courseId: this.currentCourseId,
        });
        // bind state.personsCourseTasks
        await this.getPersonsCourseTasks();
      } else {
        // bind. state.courseTasks
        await this.getCourseTasks(this.currentCourseId);
      }

      this.needsCentering = true;

      await this.drawSolarSystems();

      // ==== check if all topics completed. if so GALAXY MAP COMPLETE!!! ====
      const isGalaxyMapComplete = this.personsTopics.every(
        (topic) => topic.topicStatus === "completed",
      );
      if (!this.galaxyCompleted && this.personsTopics.length && isGalaxyMapComplete) {
        // TODO: better complete congrats
        console.log("Galaxy Map Complete. Well done!");
        this.$emit("galaxyCompleted");
      }
    },
    networkUpdated() {
      if (this.needsCentering === true) {
        this.zoomToNodes(this.$refs.network.nodes);
        // set label colours to missionAccent
        this.nodeLabelColor = this.$vuetify.theme.isDark
          ? this.$vuetify.theme.themes.dark.missionAccent
          : this.$vuetify.theme.themes.light.missionAccent;
      }
    },
    async drawSolarSystems() {
      // set up solar system planets
      await this.setupSolarSystemPlanets();
      // this.setupStars();             // <--- experimenting with drawing a Sun on nodes
      // start animation
      this.startNodeAnimation();
    },
    disableEditMode() {
      this.$refs.network.disableEditMode();
      this.addingNode = false;
      this.addingEdge = false;
      this.active = false;
    },

    getDomCoords(node) {
      const domCoords = this.$refs.network.canvasToDom({ x: node.x, y: node.y });
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
      this.draggingNodes = true;
      // stop animations
      this.stopNodeAnimation();
      // clear solar systems
      this.planets = [];
      this.stars = [];
      this.$refs.network.redraw();
      // enable node dragging
      this.network.options.interaction.dragNodes = true;
      // enable multiselect
      this.network.options.interaction.multiselect = true;
      // Disable default right-click dropdown menu
      this.$el.oncontextmenu = () => false;
      // Add both mouse and touch event listeners
      document.addEventListener("mousedown", this.rectangleMousedown);
      document.addEventListener("mousemove", this.rectangleMousedrag);
      document.addEventListener("mouseup", this.rectangleMouseup);
      // Add touch events
      document.addEventListener("touchstart", this.rectangleTouchstart);
      document.addEventListener("touchmove", this.rectangleTouchmove);
      document.addEventListener("touchend", this.rectangleTouchend);
    },
    disableDragMode() {
      this.draggingNodes = false;
      this.network.options.interaction.dragNodes = false;
      this.planets = [];
      this.stars = [];
      // Remove both mouse and touch event listeners
      document.removeEventListener("mousedown", this.rectangleMousedown);
      document.removeEventListener("mousemove", this.rectangleMousedrag);
      document.removeEventListener("mouseup", this.rectangleMouseup);
      // Remove touch events
      document.removeEventListener("touchstart", this.rectangleTouchstart);
      document.removeEventListener("touchmove", this.rectangleTouchmove);
      document.removeEventListener("touchend", this.rectangleTouchend);
      // Re-enable right-click menu
      this.$el.oncontextmenu = null;
      this.drag = false;
    },
    addNode(data) {
      // if (!this.active) return;
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
      // Validate required fields before proceeding
      if (!this.currentCourseId || !newEdgeData?.id) {
        console.warn("addEdge: Missing required fields", {
          currentCourseId: this.currentCourseId,
          edgeId: newEdgeData?.id,
        });
        return;
      }

      // Prevent multiple edge creations while processing
      if (this.processingEdge) {
        console.warn("Edge creation already in progress, skipping");
        return;
      }
      this.processingEdge = true;

      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("map-edges")
        .doc(newEdgeData.id)
        .set(newEdgeData)
        .then(() => {
          // Only emit once to toggle edge mode off, then back on to stay in edit mode
          this.$emit("toggleAddEdgeMode");
          this.addingEdge = false;
          this.processingEdge = false;
          // Toggle edge mode again to stay in edit edge mode for continuous edge creation
          this.$emit("toggleAddEdgeMode");
        })
        .catch((error) => {
          console.error("Error writing edge: ", error);
          this.processingEdge = false;
        });
    },
    click(data) {
      if (this.addingNode || this.addingEdge) return;
      if (data.edges.length === 0 && data.nodes.length === 0) {
        this.deselectNode();
      }
    },
    async click2(data) {
      console.log("click2: ", data);
      if (
        this.addingNode ||
        this.addingEdge ||
        this.draggingNodes ||
        (data.items.length > 0 && data.nodes.length == 0) // this means its just an edge
      )
        return;
      // 0) get closest node
      const closestNode = this.getClosestNodeToClick(data);
      if (closestNode.group == "locked") return;

      // Check if we're already in preview mode and clicking on the same node
      if (
        this.inSystemPreviewView &&
        this.previewedNode &&
        this.previewedNode.id === closestNode.id
      ) {
        // Exit preview mode if clicking on the same node
        this.exitSolarSystemPreview();
        return;
      }

      // Save the original showMissions state before entering preview mode
      this.originalShowMissionsState = this.showMissions;

      // Disable show missions if it's currently enabled
      if (this.showMissions) {
        this.toggleShowMissions();
      }

      // 1) flag we in preview mode
      this.inSystemPreviewView = true;
      this.previewedNode = closestNode;

      // 2) get tasks for this topic
      const tasksForThisTopic = this.tasks.filter((taskObj) => taskObj.topicId == closestNode.id);

      // 3) zoom to node
      this.zoomToNode(closestNode);

      // 4) hide edges
      const options = { ...this.network.options };
      options.edges.hidden = true; // hide edges
      // Enable vis-network labels just for the previewed node
      try {
        // set the previewed node's label to the original label, positioned below the node
        this.$refs.network.visData.nodes.update({
          id: closestNode.id,
          label: this.currentCourseNodes.find((n) => n.id === closestNode.id)?.label || "",
          font: { size: 10, align: "center", vadjust: 14 },
        });
      } catch (e) {
        console.warn("Failed to enable vis label for preview node", e);
      }
      this.$refs.network.setOptions(options);
      // 5) minimise left panels & buttons
      this.$emit("hideLeftPanels", true);
      // 6) set clicked topic node id in store
      this.setCurrentTopicId(closestNode.id);
      // 7) get number of tasks (used to calc size of circle mask to block out map)
      this.numberOfTasksForThisTopic = tasksForThisTopic.length;
      // 8) hide planets not related to current topic
      this.hidePlanetsForOtherTopics(closestNode.id);
      // 9) hide other topic nodes
      this.hideOtherTopicNodes(closestNode.id);
      // 10) emit topic clicked
      const clickedNode = this.nodesToDisplay.find((node) => node.id == this.currentTopicId);
      // Find the original node data to preserve the label field
      const originalNode = this.currentCourseNodes.find((node) => node.id == this.currentTopicId);
      this.$emit("topicClicked", {
        ...clickedNode,
        label: originalNode?.label || "", // Preserve the original label
        tasks: tasksForThisTopic,
      });
    },
    zoomToNodeWithOffset(node, xOffset, yOffset) {
      this.$refs.network.moveTo({
        position: { x: node.x + xOffset, y: node.y + yOffset },
        scale: 2.5, // or your preferred zoom
        animation: {
          duration: 2000,
          easingFunction: "easeInOutQuad",
        },
      });
    },
    getClosestNodeToClick(clickData) {
      // get click location
      const clickedPosition = clickData.pointer.canvas;
      // get all node locations (returns an object)
      const allNodePositions = this.$refs.network.getPositions();
      // convert object of positions to array of positions
      const allNodePositionsArray = [];
      for (const node in allNodePositions) {
        allNodePositionsArray.push({
          ...allNodePositions[node],
          id: node,
        });
      }
      // calc which node is closes to the click
      let closest = null;
      let shortestDistance = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < allNodePositionsArray.length; i++) {
        const d = this.distSquared(clickedPosition, allNodePositionsArray[i]);
        if (d < shortestDistance) {
          closest = allNodePositionsArray[i];
          shortestDistance = d;
        }
      }
      return this.$refs.network.getNode(closest.id);
    },
    distSquared(pt1, pt2) {
      const diffX = pt1.x - pt2.x;
      const diffY = pt1.y - pt2.y;
      return diffX * diffX + diffY * diffY;
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

      // Get all selected nodes
      const selectedNodes = this.$refs.network.network.getSelectedNodes();
      if (!selectedNodes.length) return;

      // Get new positions for all selected nodes
      const newPositions = this.$refs.network.network.getPositions(selectedNodes);
      const nodes = this.$refs.network.nodes;

      // Check if any node positions changed
      let positionsChanged = false;

      // Update positions for all selected nodes
      selectedNodes.forEach((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        // check if coords changed
        if (newPositions[nodeId].x !== node.x || newPositions[nodeId].y !== node.y) {
          positionsChanged = true;
          // commit new positions to newNodePositions
          const newPositionObj = {
            id: nodeId,
            x: newPositions[nodeId].x,
            y: newPositions[nodeId].y,
          };
          this.newNodePositions[nodeId] = newPositionObj;
        }
      });

      // Only emit if positions actually changed
      if (positionsChanged) {
        console.log("EMITTING: node positions changed");
        this.$emit("nodePositionsChanged");
      }
    },
    async saveNodePositions() {
      this.$emit("nodePositionsChangeLoading");
      const nodes = this.$refs.network.nodes;
      const newNodes = this.newNodePositions;
      // spread/or map new positions to nodes

      // Validate required fields before proceeding
      if (!this.currentCourseId) {
        console.warn("saveNodePositions: Missing currentCourseId");
        this.$emit("nodePositionsChangeSaved");
        return;
      }

      for (const changedNode in newNodes) {
        const changedNodeObj = newNodes[changedNode];
        const node = nodes.find((node) => node.id === changedNodeObj.id);

        // Validate node exists and has required fields
        if (!node || !node.id) {
          console.warn("saveNodePositions: Missing node or node.id", { node });
          continue;
        }

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
            .update({
              x: node.x,
              y: node.y,
            })
            .catch((error) => {
              console.error("Error writing node positions: ", error);
            });

          await db
            .collection("courses")
            .doc(this.currentCourseId)
            .collection("topics")
            .doc(node.id)
            .update({
              x: node.x,
              y: node.y,
            })
            .catch((error) => {
              console.error("Error writing node positions to topics: ", error);
            });
        } else {
          this.$emit("nodePositionsChangeSaved");
          return;
        }
        this.$emit("nodePositionsChangeSaved");
      }
      return (this.newNodePositions = {});
    },
    // selectNode(data) {
    //   if (this.addingNode || this.addingEdge) return;
    //   this.active = true;
    //   if (data.nodes.length == 1) {
    //     // is type node
    //     const nodeId = data.nodes[0];
    //     // this.$refs.network.focus(nodeId, { scale: 1.2, animation: true });
    //     const selectedNode = this.$refs.network.getNode(nodeId);
    //     selectedNode.type = "node";
    //     selectedNode.connectedEdge = data.edges[0];
    //     (selectedNode.DOMx = data.pointer.DOM.x),
    //       (selectedNode.DOMy = data.pointer.DOM.y);
    //     // this.startNodeAnimation();
    //     this.$emit("selected", selectedNode);
    //   }
    // },
    selectEdge(data) {
      if (this.addingNode || this.addingEdge || data.nodes != 0) return;
      console.log("edge clicked", data);
      this.active = true;
      if (data.edges.length == 1) {
        const edgeId = data.edges[0];
        const selectedEdge = this.$refs.network.getEdge(edgeId);
        selectedEdge.type = "edge";
        ((selectedEdge.DOMx = data.pointer.DOM.x), (selectedEdge.DOMy = data.pointer.DOM.y));
        this.$emit("selectedEdge", selectedEdge);
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
    // hoverNode(data) {
    //   if (this.addingEdge == true || this.addingNode) return;
    //   // this.stopNodeAnimation();
    //   const nodeId = data.node;
    //   const hoveredNode = this.$refs.network.getNode(nodeId);
    //   hoveredNode.type = "node";
    //   (hoveredNode.DOMx = data.pointer.DOM.x),
    //     (hoveredNode.DOMy = data.pointer.DOM.y);
    //   this.$emit("hoverNode", hoveredNode);
    // },
    // blurNode() {
    //   this.$emit("blurNode");
    //   if (this.active) return;
    //   setTimeout(() => {
    //     this.$emit("deselected");
    //   }, 1000);
    // },
    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
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
    exitSolarSystemPreview() {
      // bring edges back
      const options = { ...this.network.options };
      options.edges.hidden = false;
      this.$refs.network.setOptions(options);
      // Disable vis-network labels for all nodes again
      try {
        // Reset label property for all nodes back to empty, we draw labels manually
        const ids = this.$refs.network.visData.nodes.getIds();
        const updates = ids.map((id) => ({ id, label: "" }));
        this.$refs.network.visData.nodes.update(updates);
      } catch (e) {
        console.warn("Failed to disable vis labels after preview", e);
      }
      this.previewedNode = null;
      this.inSystemPreviewView = false;
      this.numberOfTasksForThisTopic = 0;
      // Show all planets again
      this.showAllPlanets();
      // Show all topic nodes again
      this.showAllTopicNodes();
      // Clear current topic ID to show all planet labels again
      this.setCurrentTopicId(null);

      // Restore original showMissions state
      if (this.showMissions !== this.originalShowMissionsState) {
        this.toggleShowMissions();
      }

      // this.$refs.network.fit();
      this.zoomToNodes(this.$refs.network.nodes);
    },
    // this controls the fit zoom animation
    zoomToNodes(nodes) {
      // nodes to zoom to
      // get node ids
      const nodeIds = nodes.map((x) => x.id);
      this.$refs.network.fit({
        nodes: nodeIds,
        animation: {
          duration: 2000,
          easingFunction: "easeInOutQuad",
        },
      });
    },
    zoomToNode(node) {
      console.log("zooming to node", node);
      this.$refs.network.moveTo({
        position: { x: node.x, y: node.y },
        scale: 3,
        animation: {
          duration: 2000,
          easingFunction: "easeInOutQuad",
        },
      });
    },
    makeGalaxyLabelsColour(colour) {
      // Store the label color for manual drawing
      this.nodeLabelColor = colour;
      // Trigger a redraw to update the manually drawn labels
      this.$refs.network.redraw();
      this.$refs.network.fit();
    },
    makePlanetsColour(colour) {
      for (const planet of this.planets) {
        planet.color = colour;
      }
    },
    makeStarsColour(colour) {
      for (const star of this.stars) {
        star.color = colour;
      }
    },
    drawNodeLabels(ctx) {
      // If we're in preview, let vis-network render the label for the previewed node
      if (this.inSystemPreviewView) {
        return;
      }
      // Draw node labels with mode-aware sizing/positioning
      ctx.save();
      const scale = this.$refs.network.getScale();
      const nodeRadius = this.network?.options?.nodes?.size ?? 7;
      const previewScreenFontPx = 10; // desired on-screen font size when previewing
      const defaultFontPx = 12;
      const labelColor = this.nodeLabelColor;
      // Configure base style; will be overridden per-mode below
      ctx.fillStyle = labelColor;

      // Get all node positions
      const nodeIds = this.$refs.network.nodes.map(({ id }) => id);
      const nodePositionMap = this.$refs.network.getPositions(nodeIds);

      // Draw labels for each node
      for (const [nodeId, position] of Object.entries(nodePositionMap)) {
        // Get the original node data from currentCourseNodes since we cleared the label in display nodes
        const originalNode = this.currentCourseNodes.find((n) => n.id === nodeId);
        if (originalNode && originalNode.label) {
          // If in system preview view, only show label for the current topic
          if (this.inSystemPreviewView && nodeId !== this.currentTopicId) {
            continue;
          }

          // Default mode: draw label to the right with standard sizing
          ctx.font = `${defaultFontPx}px Arial`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          const labelX = position.x + 15; // offset to the right of node
          const labelY = position.y;
          ctx.fillText(originalNode.label, labelX, labelY);
        }
      }
      ctx.restore();
    },
    async setupSolarSystemPlanets() {
      // Wait for tasks to be loaded if they're not already
      if (this.student && this.personsCourseTasks.length === 0) {
        await this.getPersonsCourseTasks();
      } else if (!this.student && this.courseTasks.length === 0) {
        await this.getCourseTasks(this.currentCourseId);
      }

      this.tasks = [];
      if (this.student) {
        this.tasks = this.personsCourseTasks;
      } else {
        this.tasks = this.courseTasks;
      }

      // no tasks means no planets
      // if (this.tasks.length == 0) {
      //   this.loading = false;
      //   return;
      // }

      // give tasks to GalaxyView (courseTasks)
      this.$emit("courseTasks", this.tasks);

      // if our solar systems are loading, disable spinner

      this.loading = false;

      // get node ids
      // TODO: This is triggering an error when first creating a galaxy
      // Cannot read properties of undefined (reading 'nodes'
      const nodeIds = this.$refs.network.nodes.map(({ id }) => id);
      // get node xy positions
      const nodePositionMap = this.$refs.network.getPositions(nodeIds);

      // reset planets
      this.planets = [];

      // loop nodes/topics
      for (const [topicId, topicPosition] of Object.entries(nodePositionMap)) {
        const topicsTasks = this.tasks.filter((taskObj) => taskObj.topicId == topicId);

        // Sort tasks by orderIndex first, falling back to timestamp if no orderIndex
        topicsTasks.sort((a, b) => {
          if (a.task.orderIndex !== undefined && b.task.orderIndex !== undefined) {
            return a.task.orderIndex - b.task.orderIndex;
          }
          return (
            (a.task.taskCreatedTimestamp?.seconds || 0) -
            (b.task.taskCreatedTimestamp?.seconds || 0)
          );
        });

        for (let i = 0; i < topicsTasks.length; i++) {
          const taskObj = topicsTasks[i];
          const task = taskObj.task; // Access the nested task data

          this.planets.push(
            new Planet(
              topicPosition.x,
              topicPosition.y,
              2, // planet size
              this.dark ? "white" : this.$vuetify.theme.themes.light.missionAccent, // planet colour
              6.28 / (10 * (i + 1)), // planet speed (6.28 radians in a circle. so 6.28 is full circle in 1 second. divide by something to slow it down)
              20 * (i + 1), // planet orbit size,
              topicId, // for debugging
              task.name || task.title || `Task ${i + 1}`, // task name
              i, // task index
            ),
          );
        }
      }
    },
    setupStars() {
      // get node ids
      const nodeIds = this.$refs.network.nodes.map(({ id }) => id);
      // get node xy positions
      const nodePositionMap = this.$refs.network.getPositions(nodeIds);

      // reset stars
      this.stars = [];

      // loop nodes/topics and create a star for each
      for (const [topicId, topicPosition] of Object.entries(nodePositionMap)) {
        this.stars.push(
          new Star(
            topicPosition.x,
            topicPosition.y,
            7, // same size as network nodes
            this.dark ? "#FFD700" : "#FFA500", // golden color for stars
            14, // glow radius for fire-like effect
          ),
        );
      }
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
        // Skip hidden planets
        if (planet.hidden) {
          continue;
        }

        //TODO: does this ternary slow things down
        const strokeColor = this.dark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";

        // Handle planet orbit stop/resume based on showMissions flag
        // Only trigger animation if not already animating
        if (this.showMissions && !planet.orbitStopped && !planet.animating) {
          planet.stopOrbit();
        } else if (!this.showMissions && planet.orbitStopped && !planet.animating) {
          planet.resumeOrbit();
        }

        planet.update(ctx, delta, strokeColor);
      }
    },
    // draw a rect with a hole. to blank out rest of map apart from the previewed system
    // https://stackoverflow.com/questions/6271419/how-to-fill-the-opposite-shape-on-canvas
    afterDrawing(ctx) {
      // Draw stars on top of everything
      // get delta for star animation
      const oldTime = this.time;
      this.time = new Date();
      let delta;
      if (oldTime == null) {
        delta = 1;
      } else {
        delta = (this.time.getTime() - oldTime.getTime()) / 1000;
      }

      // update and draw stars
      // for (const star of this.stars) {
      //   star.update(ctx, delta);
      // }

      // if (this.inSystemPreviewView) {
      //   // console.log("ctx", ctx)
      //   // Canvas - set fill
      //   ctx.fillStyle = this.dark
      //     ? this.$vuetify.theme.themes.dark.background
      //     : this.$vuetify.theme.themes.light.background;
      //   // ctx.fillStyle = "pink";
      //   // Canvas - start path
      //   ctx.beginPath();
      //   // Canvas - draw rectangle the size of the screen
      //   const cavasSizeBuffer = 10000;
      //   ctx.rect(
      //     // 0 - ctx.canvas.offsetWidth,
      //     // 0 - ctx.canvas.offsetHeight,
      //     0 - (ctx.canvas.width + cavasSizeBuffer / 2),
      //     0 - (ctx.canvas.height + cavasSizeBuffer / 2),
      //     ctx.canvas.width + cavasSizeBuffer,
      //     ctx.canvas.height + cavasSizeBuffer,
      //   );
      //   // Canvas - draw arc (circle) the of the numbers of tasks/planet orbits
      //   // Note: drawing a rectanlge then a circle in the same path makes the circle a whole
      //   ctx.arc(
      //     this.previewedNode.x,
      //     this.previewedNode.y,
      //     20 * (this.numberOfTasksForThisTopic + 2), // masked circle is 2 rings out from furtherest ring
      //     0,
      //     2 * Math.PI,
      //     true,
      //   );
      //   ctx.fill();
      // }

      // Draw planet labels only when missions are shown
      if (this.showMissions) {
        const labelColor = this.dark ? "#ffffff" : this.$vuetify.theme.themes.light.baseAccent;
        for (const planet of this.planets) {
          // Skip hidden planets
          if (planet.hidden) {
            continue;
          }

          // If in system preview view, only show labels for the current topic
          const visibleTopicId = this.inSystemPreviewView ? this.currentTopicId : undefined;
          planet.drawLabel(ctx, labelColor, visibleTopicId);
        }
      }

      // Draw node labels manually
      this.drawNodeLabels(ctx);

      // Add rectangle selection drawing
      if (this.drag) {
        const [startX, startY] = this.canvasify(this.DOMRect.startX, this.DOMRect.startY);
        const [endX, endY] = this.canvasify(this.DOMRect.endX, this.DOMRect.endY);

        ctx.setLineDash([5]);
        ctx.strokeStyle = "rgba(78, 146, 237, 0.75)";
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(151, 194, 252, 0.45)";
        ctx.fillRect(startX, startY, endX - startX, endY - startY);
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
    // Rectangle selection methods
    canvasify(DOMx, DOMy) {
      // Fix: Access network instance directly from $refs.network
      const network = this.$refs.network.network;
      const pos = network.DOMtoCanvas({ x: DOMx, y: DOMy });
      return [pos.x, pos.y];
    },

    correctRange(start, end) {
      return start < end ? [start, end] : [end, start];
    },

    selectFromDOMRect() {
      const [sX, sY] = this.canvasify(this.DOMRect.startX, this.DOMRect.startY);
      const [eX, eY] = this.canvasify(this.DOMRect.endX, this.DOMRect.endY);
      const [startX, endX] = this.correctRange(sX, eX);
      const [startY, endY] = this.correctRange(sY, eY);

      // Fix: Access network instance directly from $refs.network
      const network = this.$refs.network.network;
      const selectedNodes = this.$refs.network.nodes.reduce((selected, node) => {
        const pos = network.getPositions(node.id)[node.id];
        return startX <= pos.x && pos.x <= endX && startY <= pos.y && pos.y <= endY
          ? selected.concat(node.id)
          : selected;
      }, []);

      network.selectNodes(selectedNodes);
    },

    rectangleMousedown(event) {
      if (!this.draggingNodes) return;

      // Accept both right click and ctrl+click for selection
      if (event.which === 3 || (event.which === 1 && event.ctrlKey)) {
        event.preventDefault(); // Prevent default context menu
        const container = this.$el;
        Object.assign(this.DOMRect, {
          startX: event.pageX - container.offsetLeft,
          startY: event.pageY - container.offsetTop,
          endX: event.pageX - container.offsetLeft,
          endY: event.pageY - container.offsetTop,
        });
        this.drag = true;
      }
    },

    rectangleMousedrag(event) {
      if (!this.draggingNodes) return;

      if (event.which === 0 && this.drag) {
        this.drag = false;
        this.$refs.network.redraw();
      } else if (this.drag) {
        const container = this.$el;
        Object.assign(this.DOMRect, {
          endX: event.pageX - container.offsetLeft,
          endY: event.pageY - container.offsetTop,
        });
        this.$refs.network.redraw();
      }
    },

    rectangleMouseup(event) {
      if (!this.draggingNodes) return;

      // Accept both right click and ctrl+click for selection
      if (event.which === 3 || (event.which === 1 && event.ctrlKey)) {
        this.drag = false;
        this.$refs.network.redraw();
        this.selectFromDOMRect();
      }
    },

    // New touch event handlers
    rectangleTouchstart(event) {
      if (!this.draggingNodes) return;

      // Only respond to two-finger touch
      if (event.touches.length === 2) {
        event.preventDefault(); // Prevent scrolling
        const container = this.$el;
        const touch = event.touches[0]; // Use first touch point
        Object.assign(this.DOMRect, {
          startX: touch.pageX - container.offsetLeft,
          startY: touch.pageY - container.offsetTop,
          endX: touch.pageX - container.offsetLeft,
          endY: touch.pageY - container.offsetTop,
        });
        this.drag = true;
      }
    },

    rectangleTouchmove(event) {
      if (!this.draggingNodes || !this.drag) return;

      if (event.touches.length === 2) {
        event.preventDefault();
        const container = this.$el;
        const touch = event.touches[0];
        Object.assign(this.DOMRect, {
          endX: touch.pageX - container.offsetLeft,
          endY: touch.pageY - container.offsetTop,
        });
        this.$refs.network.redraw();
      }
    },

    rectangleTouchend(event) {
      if (!this.draggingNodes) return;

      if (this.drag) {
        this.drag = false;
        this.$refs.network.redraw();
        this.selectFromDOMRect();
      }
    },
    focusOnNodeById(nodeId) {
      const node = this.currentCourseNodes.find((n) => n.id === nodeId);
      if (node) {
        // Create a mock click data object to reuse the existing click2 logic
        const mockClickData = {
          items: [node.id],
          nodes: [node.id],
          edges: [],
          pointer: { canvas: { x: node.x, y: node.y } },
        };

        // Temporarily disable edit modes to ensure click2 works properly
        const wasAddingNode = this.addingNode;
        const wasAddingEdge = this.addingEdge;
        const wasDraggingNodes = this.draggingNodes;

        this.addingNode = false;
        this.addingEdge = false;
        this.draggingNodes = false;

        this.click2(mockClickData);

        // Restore edit modes
        this.addingNode = wasAddingNode;
        this.addingEdge = wasAddingEdge;
        this.draggingNodes = wasDraggingNodes;
      }
    },
    toggleShowMissions() {
      this.$emit("toggleShowMissions");
    },
    hidePlanetsForOtherTopics(currentTopicId) {
      // Hide planets that don't belong to the current topic
      for (const planet of this.planets) {
        if (planet.topicId !== currentTopicId) {
          planet.hidden = true;
        }
      }
    },
    showAllPlanets() {
      // Show all planets again
      for (const planet of this.planets) {
        planet.hidden = false;
      }
    },
    hideOtherTopicNodes(currentTopicId) {
      // Hide nodes that are not the current topic using DataSet update
      const nodesToHide = this.currentCourseNodes.filter((node) => node.id !== currentTopicId);
      for (const node of nodesToHide) {
        // Update the node in the DataSet to set hidden = true
        this.$refs.network.visData.nodes.update({
          id: node.id,
          hidden: true,
        });
      }
    },
    showAllTopicNodes() {
      // Show all nodes again using DataSet update
      for (const node of this.currentCourseNodes) {
        // Update the node in the DataSet to set hidden = false
        this.$refs.network.visData.nodes.update({
          id: node.id,
          hidden: false,
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.full-height {
  width: 100%;
  height: 100%;

  // Mobile height
  @media (max-width: 960px) {
    // height: 100vh;
    height: calc(var(--vh, 1vh) * 100);
  }
}
</style>
