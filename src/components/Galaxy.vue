<template>
  <div class="full-height">
    <LoadingSpinner v-if="loading" />
    <network
      v-if="
        personsAssignedNodesForDisplay.length > 0 &&
        whichCoursesToDisplay == 'assigned'
      "
      ref="network"
      class="full-height"
      :nodes="personsAssignedNodesForDisplay"
      :edges="personsAssignedEdges"
      :options="network.options"
      @zoom="zoom"
      @click="click"
      @hover-node="hoverNode"
    ></network>
    <network
      v-else-if="
        personsNodesForDisplay.length > 0 && whichCoursesToDisplay == 'my'
      "
      ref="network"
      class="full-height"
      :nodes="personsNodesForDisplay"
      :edges="personsEdges"
      :options="network.options"
      @zoom="zoom"
      @click="click"
      @hover-node="hoverNode"
    ></network>
    <network
      v-else-if="
        allNodesForDisplay.length > 0 && whichCoursesToDisplay == 'all'
      "
      ref="network"
      class="full-height"
      :nodes="allNodesForDisplay"
      :edges="allEdges"
      :options="network.options"
      @zoom="zoom"
      @click="click"
      @hover-node="hoverNode"
    ></network>
    <p v-else class="noGalaxies overline">
      NO {{ whichCoursesToDisplay == "assigned" ? "ASSIGNED" : "" }} GALAXIES TO
      DISPLAY
    </p>
    <PopupPreview
      v-if="popupPreview"
      :course="getCourseById(currentCourseId)"
      @togglePopup="togglePopup"
      class="popupPanel"
    />
  </div>
</template>

<script>
import { Network } from "vue2vis";
import "vue2vis/dist/vue2vis.css";

import { mapState, mapGetters } from "vuex";

import LoadingSpinner from "../components/LoadingSpinner";
import PopupPreview from "../components/PopupPreview";

export default {
  name: "GalaxyMap",
  props: ["whichCoursesToDisplay"],
  components: {
    Network,
    LoadingSpinner,
    PopupPreview,
  },
  async mounted() {
    console.log("whichCoursesToDisplay = ", this.whichCoursesToDisplay);

    /* ===========================
        Only show MY Galaxies
    =========================== */
    if (this.whichCoursesToDisplay == "my") {
      await this.$store.dispatch("getNodesByPersonId", this.user.data.id);
      await this.$store.dispatch("getEdgesByPersonId", this.user.data.id);
      console.log("nodes by person:", this.personsNodesForDisplay);
      console.log("edges by person:", this.personsEdges);
      this.nodesToDisplay = this.personsNodesForDisplay;
    } else if (this.whichCoursesToDisplay == "assigned") {
      /* ===========================
        Only show ASSIGNED Galaxies
    =========================== */
      // get assigned nodes & edges
      await this.$store.dispatch(
        "getAssignedNodesByPersonId",
        this.user.data.id
      );
      await this.$store.dispatch(
        "getAssignedEdgesByPersonId",
        this.user.data.id
      );
      console.log(
        "assigned nodes by person:",
        this.personsAssignedNodesForDisplay
      );
      console.log("assigned edges by person:", this.personsAssignedEdges);
      this.nodesToDisplay = this.personsAssignedNodesForDisplay;
    } else if (this.whichCoursesToDisplay == "all") {
      /* ===========================
        Only show ALL Galaxies in DATABASE!! (so I can see what maps users have created)
    =========================== */
      await this.$store.dispatch("getAllNodes");
      await this.$store.dispatch("getAllEdges");
      console.log("all nodes ever:", this.allNodesForDisplay);
      console.log("all edges ever:", this.allEdges);
      this.nodesToDisplay = this.allNodesForDisplay;
    }

    // see available Vue2Vis methods
    // console.log(this.$refs.network);

    if (this.nodesToDisplay.length > 0) {
      const repositionedNodes = this.repositionCoursesBasedOnBoundaries();

      if (this.whichCoursesToDisplay == "my") {
        this.$store.commit("updatePersonsNodesForDisplay", repositionedNodes);
      } else if (this.whichCoursesToDisplay == "assigned") {
        this.$store.commit(
          "updatePersonsAssignedNodesForDisplay",
          repositionedNodes
        );
      } else if (this.whichCoursesToDisplay == "all") {
        this.$store.commit("updateAllNodesForDisplay", repositionedNodes);
      }
    }

    // stop loading spinner
    this.loading = false;

    // short timer to give time to load all before zoom
    if (this.nodesToDisplay.length > 0) {
      setTimeout(() => this.zoomToNodes(this.nodesToDisplay), 250);
      // setTimeout(() => this.fitToAllNodes(), 250);
    }
  },
  computed: {
    ...mapState([
      "allNodes",
      "allNodesForDisplay",
      "allEdges",
      "courses",
      "topics",
      "currentCourseId",
      "allNodesLength",
      "personsNodesForDisplay",
      "personsEdges",
      "personsAssignedNodesForDisplay",
      "personsAssignedEdges",
      "personsTopics",
    ]),
    ...mapGetters(["getCourseById", "user"]),
    currentCourseNodesWithStatus(currentNodes) {
      let nodesWithStatus = [];
      // loop each node
      for (const node of currentNodes) {
        // find the topic node with status
        let matchingNode = this.personsTopics.find((x) => {
          return x.id === node.id;
        });
        // console.log("matchingNode",matchingNode)
        // push node with status
        nodesWithStatus.push({
          ...node,
          // color: this.stringToColour(matchingNode.label),  // Attempt to match node color to System color
          group: matchingNode?.status ?? "unlocked",
        });
      }
      // console.log("nodesWithStatus",nodesWithStatus)
      // return nodes with status to network map
      return nodesWithStatus;
    },
    currentCourseEdgesWithStatusStyles(currentEdges) {
      let edgesWithStatusStyles = [];
      let hasDashes = false;

      for (const edge of currentEdges) {
        // find the topic node with status
        let matchingEdge = this.personsTopics.find((x) => {
          // add dashes to the edge (if topic is locked)
          if (x.status == "locked") {
            hasDashes = true;
            // hasDashes = [2,2]
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
  data: () => ({
    active: false,
    loading: true,
    popupPreview: false,
    allNodeIds: [],
    nodesToDisplay: [],
    // allNodesLength: 0,
    numberOfGalaxiesPerRow: 3, // hardcoded num of galaxies in a row
    courseCols: 1,
    courseRows: 1,
    largestRowWidth: 0,
    largestRowHeight: 0,
    network: {
      options: {
        physics: {
          enabled: false,
          // enabled: true,
          solver: "repulsion",
          repulsion: {
            // centralGravity: 1,
            // springLength: 100,
            springConstant: 0.3,
            nodeDistance: 300,
            damping: 0.2,
          },
        },
        edges: {
          length: 50, // Longer edges between nodes.
          smooth: false,
          color: {
            inherit: false,
          },
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
    // toggleLoadingSpinner() {
    //   this.loading = !this.loading
    // },
    async click(data) {
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
      let closest = null;
      let shortestDistance = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < allNodePositionsArray.length; i++) {
        var d = this.distSquared(clickedPosition, allNodePositionsArray[i]);
        if (d < shortestDistance) {
          closest = allNodePositionsArray[i];
          shortestDistance = d;
        }
      }

      const closestNode = this.$refs.network.getNode(closest.id);
      console.log(
        "closest node is " +
          closestNode.label +
          " in group " +
          closestNode.group +
          " in course id " +
          closestNode.courseId
      );

      // set save current course clicked in store
      this.$store.commit("setCurrentCourseId", closestNode.courseId);

      // get topic ids
      let topicsNodes = this.personsNodesForDisplay.filter(
        (node) => node.courseId == closestNode.courseId
      );

      let topicsNodeIds = topicsNodes.reduce(function (output, node) {
        output.push(node.id);
        return output;
      }, []);

      // network fit to array of topic ids
      this.$refs.network.fit({
        nodes: topicsNodeIds,
        offset: {
          x: 500,
        },
        animation: true,
      });

      this.popupPreview = true;
      // network focus to closest node
      // this.$refs.network.focus(closestNode.id, {
      //   scale: 0.8,
      //   offset: {
      //     x: -150,
      //   },
      //   animation: true,
      // });

      // router to the group's galaxy
      // this.$router.push({
      //   name: "GalaxyView",
      //   params: {
      //     courseId: closestNode.courseId,
      //   },
      // });
    },
    hoverNode(data) {
      console.log("hover", data);
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
    repositionCoursesBasedOnBoundaries() {
      const courseCanvasBoundaries = this.calcCourseCanvasBoundaries();
      const allNodes = this.$refs.network.nodes;
      // console.log("allNodes from reposition nodes: ",allNodes)
      let newAllNodes = [];

      // canvas / 3
      let galaxyColsCount = 0;

      // SCALE calc num of galaxy rows
      // const canvasRowHeight = this.canvasHeight / maxHeight;

      // set offset variables
      let currentColWidth = 0;
      let currrentRowHeight = 0;

      // loop nodes and add x y offsets
      for (let i = 0; i < courseCanvasBoundaries.length; i++) {
        let maxRowHeight = 0;

        // const widthOffset = courseCanvasBoundaries[i].maxWidthOffset;
        // const heightOffset = courseCanvasBoundaries[i].maxHeightOffset;

        if (galaxyColsCount != 0) {
          // increase offset for next galaxy column
          currentColWidth += courseCanvasBoundaries[i].width / 2;
        }

        for (const node of allNodes) {
          if (node.courseId == courseCanvasBoundaries[i].id) {
            let newNode = {
              ...node,
              x: currentColWidth + node.x - courseCanvasBoundaries[i].centerX,
              y: currrentRowHeight + node.y - courseCanvasBoundaries[i].centerY,
            };
            newAllNodes.push(newNode);
          }
        }

        // increase offset for next galaxy column aka ** PADDING BETWEEN GALAXIES **

        currentColWidth += courseCanvasBoundaries[i].width / 2 + 600;
        // keep track of largest height
        if (courseCanvasBoundaries[i].height > maxRowHeight) {
          maxRowHeight = courseCanvasBoundaries[i].height + 300;
        }

        // count ++
        galaxyColsCount++;
        // if max num of galaxys per row. go to next row
        if (galaxyColsCount == this.numberOfGalaxiesPerRow) {
          // set max width and heights from these rows
          if (currentColWidth > this.largestRowWidth) {
            this.largestRowWidth = currentColWidth;
          }
          if (maxRowHeight > this.largestRowHeight) {
            this.largestRowHeight = maxRowHeight;
          }
          // reset for next row
          currentColWidth = 0;
          currrentRowHeight += maxRowHeight;
          this.courseRows += 1;
          galaxyColsCount = 0;
        }
      }
      // pad the end of row
      // this.largestRowWidth += this.largestRowWidth / this.numberOfGalaxiesPerRow / 2;
      // this.$refs.network.storePositions();
      // console.log("allNodes", allNodes);
      // console.log("newAllNodes", newAllNodes);
      return newAllNodes;
    },
    calcCourseCanvasBoundaries() {
      let courseCanvasBoundaries = [];
      // get all coords for nodes
      // const allNodes = this.$refs.network.nodes;
      const allNodes = this.nodesToDisplay;
      // console.log("allNodes from calcBoundaries: ", allNodes);

      // per course/galaxy, determine boundaries ie. highest y, highest x, lowest y, lowest x (this is a boundary we want to hover)
      for (let i = 0; i < this.courses.length; i++) {
        let boundary = {
          maxHeightOffset: 0,
          maxWidthOffset: 0,
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          centerY: 0,
          centerX: 0,
        };
        // let DOMboundary = {
        //   top: 0,
        //   bottom: 0,
        //   left: 0,
        //   right: 0,
        // };
        // loop nodes in that course
        for (const node of allNodes) {
          if (node.courseId == this.courses[i].id) {
            if (Math.abs(node.y) > boundary.maxHeightOffset) {
              boundary.maxHeightOffset = Math.abs(node.y);
            }
            if (Math.abs(node.x) > boundary.maxWidthOffset) {
              boundary.maxWidthOffset = Math.abs(node.x);
            }
            // get lowest y (top)
            if (node.y < boundary.top) {
              boundary.top = node.y;
            }
            // get highest x (right)
            if (node.x > boundary.right) {
              boundary.right = node.x;
            }
            // get highest y (bottom)
            if (node.y > boundary.bottom) {
              boundary.bottom = node.y;
            }
            // get lowest x (left)
            if (node.x < boundary.left) {
              boundary.left = node.x;
            }
          }
        }

        //boundary width & height
        boundary.width = boundary.right - boundary.left;
        boundary.height = boundary.bottom - boundary.top;
        boundary.centerX = (boundary.right + boundary.left) / 2;
        boundary.centerY = (boundary.top + boundary.bottom) / 2;
        // in DOM x y
        // boundary.widthDOM = DOMboundary.right - DOMboundary.left;
        // boundary.heightDOM = DOMboundary.bottom - DOMboundary.top;

        // add course id to boundary
        boundary.id = this.courses[i].id;
        boundary.title = this.courses[i].title;
        // console.log("boundary",boundary)
        courseCanvasBoundaries.push(boundary);
      }
      // console.log("courseCanvasBoundaries", courseCanvasBoundaries);
      return courseCanvasBoundaries;
    },
    // this controls the fit zoom animation
    zoomToNodes(nodes) {
      // nodes to zoom
      console.log("nodes to zoom", nodes);
      // get node ids
      var nodeIds = nodes.map((x) => x.id);
      // this.allNodeIds = allNodeIds;
      // console.log("nodeIds to fit", nodeIds);
      // // fit
      console.log("fit");
      this.$refs.network.fit({
        nodes: nodeIds,
        minZoomLevel: 0.2, // <-- TODO: this doesnt work on this version of vis-network. needs to be at least v8.5.0. but vue2vis is v7.4.0
        animation: true,
      });
      // this.$refs.network.moveTo({
      //   scale: 0.2,
      //   animation: true
      // });
    },
    togglePopup() {
      this.popupPreview = !this.popupPreview;
      this.zoomToNodes(this.nodesToDisplay);
    },
  },
};
</script>

<style lang="scss" scoped>
.full-height {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .noGalaxies {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--v-baseAccent-base);
  }
}

.popupPanel {
  position: absolute;
  // position of the PopupPreview panel
  top: calc(50% - 300px);
  left: calc(75% - 5vw);
}
</style>
