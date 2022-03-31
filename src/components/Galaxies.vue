<template>
  <div class="full-height">
    <LoadingSpinner v-if="loading" />
    <network
      v-if="
        personsAssignedNodesForDisplay.length > 0 &&
        whichCoursesToDisplay === 'assigned'
      "
      ref="network"
      class="full-height"
      :nodes="personsAssignedNodesForDisplay"
      :edges="personsAssignedEdges"
      :options="network.options"
      @click="click"
    ></network>
    <network
      v-else-if="
        personsNodesForDisplay.length > 0 && whichCoursesToDisplay === 'my'
      "
      ref="network"
      class="full-height"
      :nodes="personsNodesForDisplay"
      :edges="personsEdges"
      :options="network.options"
      @click="click"
    ></network>
    <network
      v-else-if="
        allNodesForDisplay.length > 0 && whichCoursesToDisplay === 'all'
      "
      ref="network"
      class="full-height"
      :nodes="allNodesForDisplay"
      :edges="allEdges"
      :options="network.options"
      @click="click"
    ></network>
    <network
      v-else-if="
        submittedNodes.length > 0 && whichCoursesToDisplay === 'submitted'
      "
      ref="network"
      class="full-height"
      :nodes="submittedNodes"
      :edges="submittedEdges"
      :options="network.options"
      @click="click"
    ></network>
    <p v-else-if="whichCoursesToDisplay == 'assigned'" class="noGalaxies overline">
      DISCOVER GALAXIES TO START LEARNING
    </p>
    <p v-else-if="whichCoursesToDisplay == 'my'" class="noGalaxies overline">
      CREATE A GALAXY TO START TEACHING
    </p>
    <p v-else-if="whichCoursesToDisplay == 'submitted'" class="noGalaxies overline">
      NO SUBMITTED GALAXIES TO REVIEW 
    </p>
    <PopupGalaxyPreview
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

import { mapState, mapGetters, mapMutations } from "vuex";

import LoadingSpinner from "../components/LoadingSpinner";
import PopupGalaxyPreview from "../components/PopupGalaxyPreview";

export default {
  name: "Galaxies",
  props: {
    whichCoursesToDisplay: { type: String, default: null },
  },
  components: {
    Network,
    LoadingSpinner,
    PopupGalaxyPreview,
  },
  data: () => ({
    active: false,
    loading: false,
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
          },
        },
        groups: {
          // useDefaultGroups: false,
          default: {
            shape: "dot"
          },
          // locked: {
          //   color: "rgba(132,132,132,0.2)",
          //   shape: "dot",
          //   // opacity: 0.1,
          // },
          // unlocked: {
          //   shape: "dot",
          //   color: "#848484",
          //   opacity: 1,
          // },
          // current: { color: "rgb(0,255,140)" },
          // // node status
          // inreview: {
          //   shape: "dot",
          //   color: "#FAF200",
          // },
          // completed: {
          //   shape: "dot",
          //   color: "#00E676",
          // },
          // node types
          introduction: {
            shape: "dot",
            color: "#00E676",
          },
          tasks: {
            // color: { background: "yellow", border: "white" },
            // shape: "diamond",
            shape: "dot",
            color: "#69A1E2",
          },
          project: {
            shape: "dot",
            color: "#E269CF",
          },
        },
        interaction: {
          hover: true,
          hoverConnectedEdges: false,
          dragNodes: false,
        },
      },
    },
  }),
  computed: {
    ...mapState([
      "allNodes",
      "allNodesForDisplay",
      "allEdges",
      "currentCourseId",
      "personsNodesForDisplay",
      "personsEdges",
      "personsAssignedNodesForDisplay",
      "personsAssignedEdges",
      "courses",
      "darkMode",
      "submittedNodes", 
      "submittedEdges"
      // "topics",
      // "personsTopics",
    ]),
    ...mapGetters(["getCourseById", "user"]),
    isDark() {
      return this.$vuetify.theme.isDark;
    },
  },
  async mounted() {
    this.setNodesToDisplay(this.whichCoursesToDisplay);
  },
  watch: {
    darkMode(dark) {
      console.log("darkMode: ", dark);
      if (dark == false) {
        this.makeGalaxyLabelsColour(
          this.$vuetify.theme.themes.light.baseAccent
        );
      } else {
        this.makeGalaxyLabelsColour("#ffffff");
      }
    },
    whichCoursesToDisplay (newVal) {
      this.setNodesToDisplay(newVal)
    }
  },
  methods: {
    setNodesToDisplay(newVal) {
      this.loading = true
      if (newVal === 'all') this.setAllNodesToDisplay()
      if (newVal === 'assigned') this.setAssignedNodesToDisplay()
      if (newVal === 'my') this.setMyNodesToDisplay()
      if (newVal === 'submitted') this.setSubmittedNodesToDisplay()
    },
    async setSubmittedNodesToDisplay() {
      /* ===========================
          Only show submitted Galaxies to Admin
      =========================== */
      await this.$store.dispatch("getSubmittedNodesAndEdges"); // node data for course
      // await this.$store.dispatch("getSubmittedEdges"); // edge data for course
      this.nodesToDisplay = this.submittedNodes;
      
      if (this.nodesToDisplay.length > 0) {
        const repositionedNodes = this.repositionCoursesBasedOnBoundaries();
        if (repositionedNodes.length) {
          this.$store.state.submittedNodes = repositionedNodes;
        }
      }

      this.centerAfterReposition()
    },
    async setMyNodesToDisplay() {
      /* ===========================
          Only show MY Galaxies
      =========================== */
      await this.$store.dispatch("bindCoursesByPersonId", this.user.data.id); // bind courses created by this user id
      await this.$store.dispatch("getNodesByPersonId", this.user.data.id);
      await this.$store.dispatch("getEdgesByPersonId", this.user.data.id);
      this.nodesToDisplay = this.personsNodesForDisplay;

      if (this.nodesToDisplay.length > 0) {
        const repositionedNodes = this.repositionCoursesBasedOnBoundaries();
        
        if (repositionedNodes.length) {
          this.$store.commit("updatePersonsNodesForDisplay", repositionedNodes);
        }
      }
      this.centerAfterReposition()
    },
    async setAssignedNodesToDisplay() {
      /* ===========================
          Only show ASSIGNED Galaxies
      =========================== */
      await this.$store.dispatch("getAssignedNodesByPersonId", this.user.data.id);
      await this.$store.dispatch("getAssignedEdgesByPersonId", this.user.data.id);
      this.nodesToDisplay = this.personsAssignedNodesForDisplay;
      
      if (this.nodesToDisplay.length > 0) {
        const repositionedNodes = this.repositionCoursesBasedOnBoundaries();
        
        if (repositionedNodes.length) {
          this.$store.commit("updatePersonsAssignedNodesForDisplay",
            repositionedNodes
          );
        }
      }
      this.centerAfterReposition()
    },
    async setAllNodesToDisplay() {
      console.log("settingAllNodes")
      /* ===========================
        Only show ALL Galaxies in DATABASE!! (so I can see what maps users have created)
      =========================== */
      await this.$store.dispatch("getAllNodes"); // node data for course
      await this.$store.dispatch("getAllEdges"); // edge data for course
      this.nodesToDisplay = this.allNodesForDisplay;
      
      if (this.nodesToDisplay.length > 0) {
        const repositionedNodes = this.repositionCoursesBasedOnBoundaries();
        if (repositionedNodes.length) {
          this.$store.commit("updateAllNodesForDisplay", repositionedNodes);
        }
      }

      this.centerAfterReposition()
    },
    centerAfterReposition() {
      // stop loading spinner
      this.loading = false;
      // short timer to give time to load all before zoom
      if (this.nodesToDisplay.length > 0) {
        setTimeout(() => {
          this.zoomToNodes(this.nodesToDisplay);
          // set label colours (important if in light mode)
          this.makeGalaxyLabelsColour(
            this.$vuetify.theme.isDark
              ? "#fff"
              : this.$vuetify.theme.themes.light.baseAccent
          );
        }, 250);
        // setTimeout(() => this.fitToAllNodes(), 250);
      }
    },
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
      console.log("clicked: ", closestNode)
      // debugger

      // set save current course clicked in store
      this.$store.commit("setCurrentCourseId", closestNode.courseId);

      // get all topic nodes by the closest clicked
      let coursesTopicNodes = this.nodesToDisplay.filter(
        (node) => node.courseId == closestNode.courseId
      );

      // get just the ids of the topic nodes to fit/zoom to
      let coursesTopicNodesIds = coursesTopicNodes.reduce(function (
        output,
        node
      ) {
        output.push(node.id);
        return output;
      },
      []);

      // network fit to array of topic ids
      this.$refs.network.fit({
        nodes: coursesTopicNodesIds,
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
    distSquared(pt1, pt2) {
      var diffX = pt1.x - pt2.x;
      var diffY = pt1.y - pt2.y;
      return diffX * diffX + diffY * diffY;
    },
    repositionCoursesBasedOnBoundaries() {
      const courseCanvasBoundaries = this.calcCourseCanvasBoundaries();
      const allNodes = this.$refs.network.nodes;
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
      const courses = this.courses
      let courseCanvasBoundaries = [];
      // get all coords for nodes
      // const allNodes = this.$refs.network.nodes;
      const allNodes = this.nodesToDisplay;
      // console.log("allNodes from calcBoundaries: ", allNodes);

      // per course/galaxy, determine boundaries ie. highest y, highest x, lowest y, lowest x (this is a boundary we want to hover)
      for (let i = 0; i < courses.length; i++) {
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
          if (node.courseId == courses[i].id) {
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
        boundary.id = courses[i].id;
        boundary.title = courses[i].title;
        // console.log("boundary",boundary)
        courseCanvasBoundaries.push(boundary);
      }
      // console.log("courseCanvasBoundaries", courseCanvasBoundaries);
      return courseCanvasBoundaries;
    },
    // this controls the fit zoom animation
    zoomToNodes(nodes) {
      // nodes to zoom
      // console.log("nodes to zoom", nodes);
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
    makeGalaxyLabelsColour(colour) {
      var options = { ...this.network.options };
      options.nodes.font.color = colour;
      options.nodes.fixed = true;
      this.$refs.network.setOptions(options);
      this.$refs.network.fit();
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
}

.noGalaxies {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--v-baseAccent-base);
}

.popupPanel {
  position: absolute;
  // position of the PopupPreview panel
  top: calc(10%);
  left: calc(75% - 5vw);
  z-index: 2;
}
</style>
