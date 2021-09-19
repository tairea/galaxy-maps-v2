<template>
  <div class="full-height">
    <LoadingSpinner v-if="loading" />
    <network
      ref="network"
      class="full-height"
      :nodes="allNodes"
      :edges="allEdges"
      :options="network.options"
      @zoom="zoom"
      @click="click"
      @hover-node="hoverNode"
      @after-drawing="afterDrawing"
    ></network>
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
  // props: ["nodes",  "edges"],
  components: {
    Network,
    LoadingSpinner,
    PopupPreview,
  },
  watch: {
    allNodes: function(n, o) {
      // if (this.allNodesLength == 0) { return}
      // if (n.length == this.allNodesLength) {
      //   console.log("n length: " + n.length + " all nodes length: " + this.allNodesLength)
      //   this.loading = false;
      //   // this.fitToAllNodes();
      // }
    },
  },
  async mounted() {
    // console.log("current course id:", this.course.id);
    await this.$store.dispatch("getAllNodes");
    await this.$store.dispatch("getAllEdges");

    //total nodes
    // this.allNodesLength = this.allNodesLength;

    // see available methods
    console.log(this.$refs.network);

    // timeout to give time for nodes to load before refocussing. TODO: loading wheel before timeout
    setTimeout(() => {
      // scale
      // console.log("scale");
      // var scaleOption = { scale: 0.4 };
      // this.$refs.network.moveTo(scaleOption);

      // recalc node positions
      this.$store.commit(
        "updateAllNodes",
        this.repositionCoursesBasedOnBoundaries()
      );

      // fit to nodes
      this.fitToAllNodes();

      // stop loading spinner
      this.loading = false;
    }, 2000);
  },
  computed: {
    ...mapState([
      "allNodes",
      "allEdges",
      "courses",
      "topics",
      "currentCourseId",
      "allNodesLength",
    ]),
    ...mapGetters(["getCourseById"]),
  },
  data: () => ({
    active: false,
    loading: true,
    popupPreview: false,
    allNodeIds: [],
    // allNodesLength: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    numberOfGalaxiesPerRow: 3, // hardcoded num of galaxies in a row
    courseCols: 1,
    courseRows: 1,
    largestRowWidth: 0,
    largestRowHeight: 0,
    network: {
      options: {
        physics: {
          enabled: false,
          solver: "repulsion",
          repulsion: {
            centralGravity: 1,
            springLength: 100,
            springConstant: 0.3,
            nodeDistance: 300,
            damping: 0.2,
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
          closestNode.group +
          " in course id " +
          closestNode.courseId
      );

      // set save current course clicked in store
      this.$store.commit("setCurrentCourseId", closestNode.courseId);

      // get topic ids
      let topicsNodes = this.allNodes.filter(
        (node) => node.courseId == closestNode.courseId
      );
      let topicsNodeIds = topicsNodes.reduce(function(output, node) {
        output.push(node.id);
        return output;
      }, []);
      console.log("topics ids", topicsNodeIds);

      // network fit to array of topic ids
      this.$refs.network.fit({
        nodes: topicsNodeIds,
        minZoomLevel: 0.8,
        maxZoomLevel: 0.8,
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
    calcCourseCanvasBoundaries() {
      let courseCanvasBoundaries = [];
      // get all coords for nodes
      const allNodes = this.$refs.network.nodes;
      console.log("allNodes from calcBoundaries: ", allNodes);
      // per course/galaxy, determine boundaries ie. highest y, highest x, lowest y, lowest x (this is a boundary we want to hover)
      for (let i = 0; i < this.courses.length; i++) {
        let boundary = {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        };
        let DOMboundary = {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        };
        // loop nodes in that course
        allNodes.forEach((node) => {
          if (node.courseId == this.courses[i].id) {
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
        });
        // DOM equivalent
        allNodes.forEach((node) => {
          if (node.courseId == this.courses[i].id) {
            const nodeWithDOMXY = this.$refs.network.canvasToDom({
              x: node.x,
              y: node.y,
            });
            console.log("canvas -> dom: " + node.label + " ", nodeWithDOMXY);
            if (node.courseId == this.courses[i].id) {
              // get lowest y (top)
              if (nodeWithDOMXY.y < DOMboundary.top) {
                DOMboundary.top = nodeWithDOMXY.y;
              }
              // get highest x (right)
              if (nodeWithDOMXY.x > DOMboundary.right) {
                DOMboundary.right = nodeWithDOMXY.x;
              }
              // get highest y (bottom)
              if (nodeWithDOMXY.y > DOMboundary.bottom) {
                DOMboundary.bottom = nodeWithDOMXY.y;
              }
              // get lowest x (left)
              if (nodeWithDOMXY.x < DOMboundary.left) {
                DOMboundary.left = nodeWithDOMXY.x;
              }
            }
          }
        });
        //boundary width & height
        boundary.width = boundary.right - boundary.left;
        boundary.height = boundary.bottom - boundary.top;
        // in DOM x y
        boundary.widthDOM = DOMboundary.right - DOMboundary.left;
        boundary.heightDOM = DOMboundary.bottom - DOMboundary.top;

        // add course id to boundary
        boundary.id = this.courses[i].id;
        boundary.title = this.courses[i].title;
        // console.log("boundary",boundary)
        courseCanvasBoundaries.push(boundary);
      }
      console.log("courseCanvasBoundaries", courseCanvasBoundaries);
      return courseCanvasBoundaries;
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
      let maxRowHeight = 0;

      // loop nodes and add x y offsets
      for (let i = 0; i < courseCanvasBoundaries.length; i++) {
        allNodes.forEach((node) => {
          if (node.courseId == courseCanvasBoundaries[i].id) {
            // get dom position
            const domXY = this.$refs.network.canvasToDom({
              x: node.x,
              y: node.y,
            });
            // console.log(domXY)
            console.log(
              node.label +
                " x: " +
                node.x +
                " vs " +
                domXY.x +
                " currentColWidth: " +
                currentColWidth
            );
            // console.log(node.label + " y: " + node.y + " vs " + domXY.y);
            let newNode = {
              ...node,
              x: currentColWidth + domXY.x,
              y: currrentRowHeight + domXY.y,
            };
            newAllNodes.push(newNode);
          }
        });

        // increase offset for next galaxy column
        currentColWidth += courseCanvasBoundaries[i].widthDOM;
        // keep track of largest height
        if (courseCanvasBoundaries[i].heightDOM > maxRowHeight) {
          maxRowHeight = courseCanvasBoundaries[i].heightDOM;
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
      this.largestRowWidth +=
        this.largestRowWidth / this.numberOfGalaxiesPerRow / 2;
      this.$refs.network.storePositions();
      console.log("allNodes", allNodes);
      console.log("newAllNodes", newAllNodes);
      return newAllNodes;
    },
    afterDrawing(ctx) {
      // console.log("after drawing");
      // console.log(ctx.canvas)
      const { width, height } = ctx.canvas.getBoundingClientRect();
      this.canvasWidth = width;
      this.canvasHeight = height;
      // this.canvasWidth = ctx.canvas.width;
      // this.canvasHeight = ctx.canvas.height;

      // console.log("w = ",this.canvasWidth)
      // console.log("h = ",this.canvasHeight)
    },
    fitToAllNodes() {
      console.log("fit all nodes GO...");
      // console.log("all nodes from store", this.allNodes);

      // console.log("courseCanvasBoundaries", courseCanvasBoundaries);

      // console.log("scale:");
      // console.log("this.canvasWidth / this.largestRowWidth ");
      // console.log(this.canvasWidth + " / " + this.largestRowWidth + " = ");
      // console.log(this.canvasWidth / this.largestRowWidth);
      // console.log("---");
      // console.log("position x:");
      // console.log("this.largestRowWidth / 2 = ");
      // console.log(this.largestRowWidth + " / 2  = ");
      // console.log(this.largestRowWidth / 2);
      // console.log("---");
      // console.log("position y:");
      // console.log("(this.largestRowHeight * this.courseRows) / 2 = ");
      // console.log(this.largestRowHeight + " * " + this.courseRows + " / 2  = ");
      // console.log((this.largestRowHeight * this.courseRows) / 2);

      var scaleX = this.canvasWidth / this.largestRowWidth;
      var scaleY =
        this.canvasHeight / (this.largestRowHeight * this.courseRows);
      var scale = scaleX;
      if (scale * (this.largestRowHeight * this.courseRows) > this.canvasHeight)
        scale = scaleY;

      if (scale > 1) scale = 0.9 * scale;

      this.$refs.network.moveTo({
        scale: scale,
        position: {
          x: this.largestRowWidth / 2,
          y: (this.largestRowHeight * this.courseRows) / 2,
        },
        animation: true,
      });
    },
    zoomToNodes(nodes) {
      // get node ids
      var nodeIds = nodes.reduce(function(output, node) {
        output.push(node.id);
        return output;
      }, []);
      // this.allNodeIds = allNodeIds;
      console.log("nodeIds to fit", nodeIds);
      // // fit
      console.log("fit");
      this.$refs.network.fit({
        nodes: nodeIds,
        animation: true,
      });
    },
    togglePopup() {
      this.popupPreview = !this.popupPreview;
      this.zoomToNodes(this.allNodes);
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

.popupPanel {
  position: absolute;
  top: 50%;
  left: 50%;
}
</style>
