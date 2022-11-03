<template>
  <div class="full-height justify-center align-center">
    <LoadingSpinner v-if="loading" text="loading learning universe" />
    <div v-if="nodesToDisplay.length == 0">
      <p class="overline noGalaxies">NO GALAXIES TO DISPLAY</p>
      <div class="d-flex justify-center mb-4">
        <v-btn x-small color="baseAccent" @click="$emit('createGalaxy')" outlined class="py-6 px-12">
          <v-icon x-small class="pr-2">mdi-plus</v-icon>
          MAP NEW GALAXY
        </v-btn>
      </div>
    </div>
    <!-- <GradientBackground :gradients="gradients"/> -->
    <network v-if="allNodesForDisplay.length != 0" ref="network" class="full-height" :nodes="allNodesForDisplay"
      :edges="allEdges" :options="network.options" @click="click" @before-drawing="beforeDrawing"></network>
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
    highlightCourse: { type: String, default: null },
  },
  components: {
    Network,
    LoadingSpinner,
    PopupGalaxyPreview,
  },
  data: () => ({
    // gradients: [],
    active: false,
    loading: true,
    popupPreview: false,
    allNodeIds: [],
    nodesToDisplay: [],
    relativeGalaxyBoundaries: [],
    // allNodesLength: 0,
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
            shape: "dot",
          },
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
      "courses",
      "darkMode",
      "person",
    ]),
    ...mapGetters(["getCourseById", "user"]),
    isDark() {
      return this.$vuetify.theme.isDark;
    },
    displayGalaxies() {
      return this.courses.filter(
        (course) =>
          (course.public === true && course.status != "submitted") ||
          course.mappedBy.personId === this.person.id ||
          this.person.assignedCourses?.some(
            (assignedCourse) => assignedCourse === course.id
          )
      );
    },
  },
  watch: {
    darkMode(dark) {
      if (dark == false) {
        this.makeGalaxyLabelsColour(
          this.$vuetify.theme.themes.light.baseAccent
        );
      } else {
        this.makeGalaxyLabelsColour("#ffffff");
      }
    },
    highlightCourse(newCourseId) {
      // get all topic nodes by the closest clicked
      let coursesTopicNodes = this.nodesToDisplay.filter(
        (node) => node.courseId == newCourseId
      );
      this.zoomToNodes(coursesTopicNodes);
    },
  },
  mounted() {
    this.setAllNodesToDisplay();

    // hide labels
    var options = { ...this.network.options };
    options.nodes.font.size = 0;

    this.setCircleTextPrototypes()
  },
  methods: {
    async setAllNodesToDisplay() {
      /* ===========================
        Show ALL Galaxies in DATABASE!! (so I can see what maps users have created)
      =========================== */
      await this.$store.dispatch("getAllNodes"); // node data for course
      await this.$store.dispatch("getAllEdges"); // edge data for course
      this.nodesToDisplay = this.allNodesForDisplay;
      if (this.nodesToDisplay.length > 0) {
        // const repositionedNodes = this.repositionCoursesBasedOnBoundaries();
        const repositionedNodes = this.repositionCoursesBasedOnBoundariesV2();
        if (repositionedNodes.length) {
          this.$store.commit("updateAllNodesForDisplay", repositionedNodes);
        }
      } else {
        // no nodes to load
        this.loading = false;
        return;
      }
      this.centerAfterReposition();
    },
    centerAfterReposition() {
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

      // set save current course clicked in store
      this.$store.commit("setCurrentCourseId", closestNode.courseId);

      this.$emit("courseClicked", { courseId: this.currentCourseId });
    },
    distSquared(pt1, pt2) {
      var diffX = pt1.x - pt2.x;
      var diffY = pt1.y - pt2.y;
      return diffX * diffX + diffY * diffY;
    },
    calcCourseCanvasBoundaries() {
      const courses = this.user.data.admin
        ? this.courses
        : this.displayGalaxies;
      let courseCanvasBoundaries = [];
      // get all coords for nodes
      // const allNodes = this.$refs.network.nodes;
      const allNodes = this.nodesToDisplay;

      // per course/galaxy, determine boundaries ie. highest y, highest x, lowest y, lowest x (this is a boundary we want to hover)
      for (let i = 0; i < courses.length; i++) {
        let boundary = {
          heightOffset: 0,
          maxWidthOffset: 0,
          top: { x: 0, y: 0 },
          bottom: { x: 0, y: 0 },
          left: { x: 0, y: 0 },
          right: { x: 0, y: 0 },
          centerY: 0,
          centerX: 0,
        };
        let courseNodes = [];
        let allNodeXPositions = [];
        let allNodeYPositions = [];
        // let DOMboundary = {
        //   top: 0,
        //   bottom: 0,
        //   left: 0,
        //   right: 0,
        // };
        // loop nodes in that course
        for (const node of allNodes) {
          // console.log("node course id:", node.courseId);
          // sort by course
          if (node.courseId == courses[i].id) {
            // push node to course
            courseNodes.push({
              nodeLabel: node.label,
              nodeId: node.id,
              x: node.x,
              y: node.y,
            });
          }
        }

        //find min x = left
        boundary.left = courseNodes.reduce((prev, curr) =>
          prev.x < curr.x ? prev : curr
        );
        //find max x = right
        boundary.right = courseNodes.reduce((prev, curr) =>
          prev.x > curr.x ? prev : curr
        );
        //find min y = top
        boundary.top = courseNodes.reduce((prev, curr) =>
          prev.y < curr.y ? prev : curr
        );
        //find max y = bottom
        boundary.bottom = courseNodes.reduce((prev, curr) =>
          prev.y > curr.y ? prev : curr
        );

        //boundary width & height
        boundary.width = boundary.right.x - boundary.left.x;
        boundary.height = boundary.bottom.y - boundary.top.y;
        boundary.centerX = (boundary.right.x + boundary.left.x) / 2;
        boundary.centerY = (boundary.bottom.y + boundary.top.y) / 2;
        // in DOM x y
        // boundary.widthDOM = DOMboundary.right - DOMboundary.left;
        // boundary.heightDOM = DOMboundary.bottom - DOMboundary.top;

        // add course id to boundary
        boundary.id = courses[i].id;
        boundary.title = courses[i].title;

        // get the course status for glow colour
        let status;
        if (courses[i].mappedBy.personId == this.person.id) {
          if (courses[i].status == "drafting") status = "draft";
          else if (
            courses[i].status == "published" &&
            courses[i].public == true
          )
            status = "public";
          else if (
            courses[i].status == "published" &&
            courses[i].public == false
          )
            status = "private";
          else if (courses[i].status == "submitted") status = "submitted";
        } else if (
          this.person.assignedCourses?.some(
            (course) => course === courses[i].id
          )
        )
          status = "assigned";
        boundary.status = status;

        // add nodes to boundary for debugging
        boundary.nodes = courseNodes;

        courseCanvasBoundaries.push(boundary);
      }
      return courseCanvasBoundaries;
    },
    repositionCoursesBasedOnBoundariesV2() {
      const courseCanvasBoundaries = this.calcCourseCanvasBoundaries();
      const allNodes = this.$refs.network.nodes;
      // console.log("all nodes ================", allNodes);
      let newAllNodes = [];

      // canvas / 3
      let galaxyColsCount = 0;
      let numberOfGalaxiesPerRow = Math.ceil(Math.sqrt(this.courses.length)); // hardcoded num of galaxies in a row

      // SCALE calc num of galaxy rows
      // const canvasRowHeight = this.canvasHeight / maxHeight;

      // set offset variables
      let currentColWidth = 0;
      let currrentRowHeight = 0;

      // loop nodes and add x y offsets
      for (let i = 0; i < courseCanvasBoundaries.length; i++) {
        let newCourseNodes = [];

        // console.log(
        //   "positioning course: ==============",
        //   courseCanvasBoundaries[i].title
        // );
        // console.log("offsets are: width:" + currentColWidth);
        // console.log("offsets are: height:" + currrentRowHeight);

        let maxRowHeight = 0;

        // const widthOffset = courseCanvasBoundaries[i].maxWidthOffset;
        // const heightOffset = courseCanvasBoundaries[i].maxHeightOffset;

        let relativeTop, relativeRight, relativeBottom, relativeLeft;

        for (const node of allNodes) {
          if (node.courseId == courseCanvasBoundaries[i].id) {
            let newNode = {
              ...node,
              x: currentColWidth + node.x - courseCanvasBoundaries[i].centerX,
              y: currrentRowHeight + node.y - courseCanvasBoundaries[i].centerY,
            };

            // check if a boundary node, so can capture the new relative boundaries
            if (node.id == courseCanvasBoundaries[i].top.nodeId) {
              relativeTop = {
                label: newNode.label,
                x: newNode.x,
                y: newNode.y,
              };
            }
            if (node.id == courseCanvasBoundaries[i].right.nodeId) {
              relativeRight = {
                label: newNode.label,
                x: newNode.x,
                y: newNode.y,
              };
            }
            if (node.id == courseCanvasBoundaries[i].bottom.nodeId) {
              relativeBottom = {
                label: newNode.label,
                x: newNode.x,
                y: newNode.y,
              };
            }
            if (node.id == courseCanvasBoundaries[i].left.nodeId) {
              relativeLeft = {
                label: newNode.label,
                x: newNode.x,
                y: newNode.y,
              };
            }

            newAllNodes.push(newNode);

            newCourseNodes.push({
              label: newNode.label,
              x: newNode.x,
              y: newNode.y,
            });
            // console.log(
            //   "new node:" +
            //     newNode.label +
            //     "- x:" +
            //     newNode.x +
            //     " y:" +
            //     newNode.y
            // );
          }
        }

        // relative bounds test
        // console.log("rel bounds:", {
        //   id: courseCanvasBoundaries[i].id,
        //   title: courseCanvasBoundaries[i].title,
        //   relTop: relativeTop,
        //   relRight: relativeRight,
        //   relBottom: relativeBottom,
        //   relLeft: relativeLeft,
        // });

        // get center point of galaxy
        // thanks to: https://www.quora.com/Geometry-How-do-I-calculate-the-center-of-four-X-Y-coordinates
        // 1) calc centroid triangle 1
        let centroidTri1X =
          (relativeTop.x + relativeRight.x + relativeBottom.x) / 3;
        let centroidTri1Y =
          (relativeTop.y + relativeRight.y + relativeBottom.y) / 3;

        // 2) calc centroid triangle 2
        let centroidTri2X =
          (relativeBottom.x + relativeLeft.x + relativeTop.x) / 3;
        let centroidTri2Y =
          (relativeBottom.y + relativeLeft.y + relativeTop.y) / 3;

        // 3) mid point of line between centroids
        let centroidX = (centroidTri1X + centroidTri2X) / 2;
        let centroidY = (centroidTri1Y + centroidTri2Y) / 2;

        // relative galaxy centers
        let relativeCenter = {
          course: courseCanvasBoundaries[i].title,
          id: courseCanvasBoundaries[i].id,
          centroidX: centroidX,
          centroidY: centroidY,
          top: relativeTop,
          right: relativeRight,
          bottom: relativeBottom,
          left: relativeLeft,
          relativeNodes: newCourseNodes,
          width: courseCanvasBoundaries[i].width,
          height: courseCanvasBoundaries[i].height,
          status: courseCanvasBoundaries[i].status,
        };
        this.relativeGalaxyBoundaries.push(relativeCenter);

        // increase offset for next galaxy column aka ** PADDING BETWEEN GALAXIES **
        currentColWidth += courseCanvasBoundaries[i].width / 2 + 600; // width / 2 because dont want to pad the whole width over + pad just half the course width + pad

        // keep track of largest height
        if (courseCanvasBoundaries[i].height > maxRowHeight) {
          // console.log("new max height:", courseCanvasBoundaries[i].height);
          maxRowHeight = courseCanvasBoundaries[i]?.height + 600;
          // if (courseCanvasBoundaries[i + 1]?.height > maxRowHeight) {
          //   maxRowHeight = courseCanvasBoundaries[i + 1].height + 300;
          // }
        }

        // count ++
        galaxyColsCount++;
        // if max num of galaxys per row. go to next row
        if (galaxyColsCount == numberOfGalaxiesPerRow) {
          //   // set max width and heights from these rows
          // if (currentColWidth > this.largestRowWidth) {
          //   this.largestRowWidth = currentColWidth;
          // }
          // if (maxRowHeight > this.largestRowHeight) {
          //   this.largestRowHeight = maxRowHeight;

          //check heights of next upcoming rows and adjust maxRowHeight if needed
          for (var x = 1; x <= numberOfGalaxiesPerRow; x++) {
            if (courseCanvasBoundaries[i + x]?.height > maxRowHeight) {
              // console.log(
              //   "next row has greater height:",
              //   courseCanvasBoundaries[i + x]?.height
              // );
              maxRowHeight = courseCanvasBoundaries[i + x].height / 2 + 600;
            }
            if (courseCanvasBoundaries[i - x - 1]?.height > maxRowHeight) {
              // console.log(
              //   "current row has greater height:",
              //   courseCanvasBoundaries[i - x - 1]?.height
              // );
              maxRowHeight =
                courseCanvasBoundaries[i - x - 1]?.height / 2 + 600;
            }
          }
          // }
          //   // reset for next row
          currentColWidth = 0;
          currrentRowHeight += maxRowHeight;
          galaxyColsCount = 0;
        }
      }
      // console.log("relative centers", this.relativeGalaxyBoundaries);
      // pad the end of row
      // this.largestRowWidth += this.largestRowWidth / this.numberOfGalaxiesPerRow / 2;
      // this.$refs.network.storePositions();
      // console.log("allNodes", allNodes);
      // console.log("newAllNodes", newAllNodes);
      return newAllNodes;
    },
    // this controls the fit zoom animation
    zoomToNodes(nodes) {
      console.log("zoom to nodes called");
      // get node ids
      var nodeIds = nodes.map((x) => x.id);
      // // fit
      this.$refs.network.fit({
        nodes: nodeIds,
        minZoomLevel: 0.2, // <-- TODO: this doesnt work on this version of vis-network. needs to be at least v8.5.0. but vue2vis is v7.4.0
        animation: true,
      });
      // stop loading spinner
      this.loading = false;
    },
    zoomToAllNodes() {
      this.zoomToNodes(this.nodesToDisplay);
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
    greyoutNonPublished() {
      // can get status here
      let personsCourses = this.courses.filter(course => course.mappedBy.personId == this.person.id)
      const greyoutCourses = []
      for (const course of personsCourses) {
        if (course.status == "submitted" || course.status == "drafting") {
          greyoutCourses.push(course.id)
        }
      }
      console.log("greyoutCourses", greyoutCourses)

      // can change colour here

      let allNodes = this.$refs.network.nodes
      for (const node of allNodes) {
        if (greyoutCourses.indexOf(node.courseId) !== -1) {
          node.color = "grey"
        }
      }
      console.log("allNodes", allNodes)
      console.log("this.$refs.network", this.$refs.network)

      this.$refs.network.visData.nodes.update(allNodes)

      console.log("this.$refs.network.nodes", this.$refs.network.nodes)

      // for (const relative of this.relativeGalaxyBoundaries) {
      //   if (relative.status == "draft" || relative.status == "submitted") {

      //     var options = { ...this.network.options };
      //     options.nodes.color = "grey";
      //     options.edges.color = "grey";
      //     this.$refs.network.setOptions(options);
      //     this.$refs.network.fit();
      //   }

      // }
    },
    beforeDrawing(ctx) {
      for (const relative of this.relativeGalaxyBoundaries) {
        switch (relative.status) {
          case "draft":
            this.drawStatusRing(
              ctx,
              relative.centroidX,
              relative.centroidY,
              relative.width > relative.height ? relative.width : relative.height,
              relative.status, relative.course
            )
            break;
          case "public":
            this.drawGlow(
              ctx,
              relative.centroidX,
              relative.centroidY,
              relative.width > relative.height ? relative.width : relative.height,
              relative.status
            );
            break;
          case "private":
            this.drawGlow(
              ctx,
              relative.centroidX,
              relative.centroidY,
              relative.width > relative.height ? relative.width : relative.height,
              relative.status
            );
            break;
          case "submitted":
            this.drawStatusRing(ctx,
              relative.centroidX,
              relative.centroidY,
              relative.width > relative.height ? relative.width : relative.height,
              relative.status, relative.course)
            break;
          case "assigned":
            this.drawGlow(
              ctx,
              relative.centroidX,
              relative.centroidY,
              relative.width > relative.height ? relative.width : relative.height,
              relative.status
            );
            break;
          default:
            colour = "rgba(20, 30, 48, 0)"; // background as rgba
            break;
        }
      }
    },
    drawBounds(ctx, top, right, bottom, left) {
      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(right.x, right.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.lineTo(left.x, left.y);
      ctx.lineTo(top.x, top.y);
      // ctx.fill();
      ctx.stroke();
      ctx.closePath();
    },
    drawGlow(ctx, x, y, radius, status) {
      radius = radius ? radius : 100;
      // create arc (circle)
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, false);

      // colour
      let colour;

      switch (status) {
        case "draft":
          //colour = "rgba(250,242,0,0.3)"; // cohortAccent as rgba
          colour = "rgba(255,255,255,0.3)"; // cohortAccent as rgba
          break;
        case "public":
          colour = "rgba(105,161,226,0.3)"; // missionAccent as rgba
          break;
        case "private":
          colour = "rgba(226,105,207,0.3)"; // galaxyAccent as rgba
          break;
        case "submitted":
          //colour = "rgba(0,230,118,0.3)"; // baseAccent as rgba
          colour = "rgba(250,242,0,0.3)"; // cohortAccent as rgba
          break;
        case "assigned":
          colour = "rgba(105,161,226,0.3)"; // missionAccent as rgba
          break;
        default:
          colour = "rgba(20, 30, 48, 0)"; // background as rgba
          break;
      }

      // gradient
      var grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
      grd.addColorStop(0, colour);
      grd.addColorStop(1, "rgba(20, 30, 48, 0)");

      // Fill with gradient
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.closePath();
    },
    drawStatusRing(ctx, x, y, radius, status, course) {
      // radius of ring
      radius = 200;

      // create arc (circle)
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, false);
      ctx.setLineDash([10, 10]);

      // colour
      let colour;

      switch (status) {
        case "draft":
          //colour = "rgba(250,242,0,0.3)"; // cohortAccent as rgba
          colour = "rgba(255,255,255,1)"; // cohortAccent as rgba
          break;
        case "public":
          colour = "rgba(105,161,226,1)"; // missionAccent as rgba
          break;
        case "private":
          colour = "rgba(226,105,207,1)"; // galaxyAccent as rgba
          break;
        case "submitted":
          //colour = "rgba(0,230,118,1)"; // baseAccent as rgba
          colour = "rgba(250,242,0,1)"; // cohortAccent as rgba
          break;
        case "assigned":
          colour = "rgba(105,161,226,1)"; // missionAccent as rgba
          break;
        default:
          colour = "rgba(20, 30, 48, 0)"; // background as rgba
          break;
      }

      // Fill with gradient
      ctx.strokeStyle = colour;
      ctx.stroke();
      ctx.font = "15px roboto"
      ctx.fillStyle = (status == 'submitted' ? 'yellow' : 'white');
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center";
      // circle text
      const textInCaps = String(status).toUpperCase()
      ctx.fillCircleText(textInCaps, x, y, radius, Math.PI * 1.7)

      ctx.closePath();
      ctx.setLineDash([]);
    },
    setCircleTextPrototypes() {
      console.log("circle text yoza")
      const FILL = 0;        // const to indicate filltext render
      const STROKE = 1;
      var renderType = FILL; // used internal to set fill or stroke text
      const multiplyCurrentTransform = true; // if true Use current transform when rendering
      // if false use absolute coordinates which is a little quicker
      // after render the currentTransform is restored to default transform



      // measure circle text
      // ctx: canvas context
      // text: string of text to measure
      // r: radius in pixels
      //
      // returns the size metrics of the text
      //
      // width: Pixel width of text
      // angularWidth : angular width of text in radians
      // pixelAngularSize : angular width of a pixel in radians
      var measure = function (ctx, text, radius) {
        var textWidth = ctx.measureText(text).width; // get the width of all the text
        return {
          width: textWidth,
          angularWidth: (1 / radius) * textWidth,
          pixelAngularSize: 1 / radius
        };
      }

      // displays text along a circle
      // ctx: canvas context
      // text: string of text to measure
      // x,y: position of circle center
      // r: radius of circle in pixels
      // start: angle in radians to start. 
      // [end]: optional. If included text align is ignored and the text is 
      //        scaled to fit between start and end;
      // [forward]: optional default true. if true text direction is forwards, if false  direction is backward
      var circleText = function (ctx, text, x, y, radius, start, end, forward) {
        var i, textWidth, pA, pAS, a, aw, wScale, aligned, dir, fontSize;
        if (ctx.globalAlpha === 0) { // dont render empty string or transparent
          return;
        }
        if (isNaN(x) || isNaN(y) || isNaN(radius) || isNaN(start) || (end !== undefined && end !== null && isNaN(end))) { // 
          throw TypeError("circle text arguments requires a number for x,y, radius, start, and end.")
        }
        aligned = ctx.textAlign;        // save the current textAlign so that it can be restored at end
        dir = forward ? 1 : forward === false ? -1 : 1;  // set dir if not true or false set forward as true  
        pAS = 1 / radius;               // get the angular size of a pixel in radians
        textWidth = ctx.measureText(text).width; // get the width of all the text
        if (end !== undefined && end !== null) { // if end is supplied then fit text between start and end
          pA = ((end - start) / textWidth) * dir;
          wScale = (pA / pAS) * dir;
        } else {                 // if no end is supplied correct start and end for alignment
          // if forward is not given then swap top of circle text to read the correct direction
          if (forward === null || forward === undefined) {
            if (((start % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) > Math.PI) {
              dir = -1;
            }
          }
          pA = -pAS * dir;
          wScale = -1 * dir;
          switch (aligned) {
            case "center":       // if centered move around half width
              start -= (pA * textWidth) / 2;
              end = start + pA * textWidth;
              break;
            case "right":// intentionally falls through to case "end"
            case "end":
              end = start;
              start -= pA * textWidth;
              break;
            case "left":  // intentionally falls through to case "start"
            case "start":
              end = start + pA * textWidth;
          }
        }

        ctx.textAlign = "center";                     // align for rendering
        a = start;                                    // set the start angle
        for (var i = 0; i < text.length; i += 1) {    // for each character
          aw = ctx.measureText(text[i]).width * pA; // get the angular width of the text
          var xDx = Math.cos(a + aw / 2);           // get the yAxies vector from the center x,y out
          var xDy = Math.sin(a + aw / 2);
          if (multiplyCurrentTransform) { // transform multiplying current transform
            ctx.save();
            if (xDy < 0) { // is the text upside down. If it is flip it
              ctx.transform(-xDy * wScale, xDx * wScale, -xDx, -xDy, xDx * radius + x, xDy * radius + y);
            } else {
              ctx.transform(-xDy * wScale, xDx * wScale, xDx, xDy, xDx * radius + x, xDy * radius + y);
            }
          } else {
            if (xDy < 0) { // is the text upside down. If it is flip it
              ctx.setTransform(-xDy * wScale, xDx * wScale, -xDx, -xDy, xDx * radius + x, xDy * radius + y);
            } else {
              ctx.setTransform(-xDy * wScale, xDx * wScale, xDx, xDy, xDx * radius + x, xDy * radius + y);
            }
          }
          if (renderType === FILL) {
            ctx.fillText(text[i], 0, 0);    // render the character
          } else {
            ctx.strokeText(text[i], 0, 0);  // render the character
          }
          if (multiplyCurrentTransform) {  // restore current transform
            ctx.restore();
          }
          a += aw;                     // step to the next angle
        }
        // all done clean up.
        if (!multiplyCurrentTransform) {
          ctx.setTransform(1, 0, 0, 1, 0, 0); // restore the transform
        }
        ctx.textAlign = aligned;            // restore the text alignment
      }
      // define fill text
      var fillCircleText = function (text, x, y, radius, start, end, forward) {
        renderType = FILL;
        circleText(this, text, x, y, radius, start, end, forward);
      }
      // define stroke text
      var strokeCircleText = function (text, x, y, radius, start, end, forward) {
        renderType = STROKE;
        circleText(this, text, x, y, radius, start, end, forward);
      }
      // define measure text
      var measureCircleTextExt = function (text, radius) {
        return measure(this, text, radius);
      }
      // set the prototypes
      CanvasRenderingContext2D.prototype.fillCircleText = fillCircleText;
      CanvasRenderingContext2D.prototype.strokeCircleText = strokeCircleText;
      CanvasRenderingContext2D.prototype.measureCircleText = measureCircleTextExt;
    }
  },
};
</script>

<style lang="scss" scoped>
.full-height {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  // margin-top: 20px;
}

.noGalaxies {
  width: 100%;
  height: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--v-missionAccent-base);
}

.popupPanel {
  position: absolute;
  // position of the PopupPreview panel
  top: calc(10%);
  left: calc(75% - 5vw);
  z-index: 2;
}
</style>
