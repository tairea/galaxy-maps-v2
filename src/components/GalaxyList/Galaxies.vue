<template>
  <div class="full-height justify-center align-center">
    <LoadingSpinner v-if="loading" text="loading learning universe" />
    <div v-if="allNodesForDisplay.length == 0">
      <p class="overline noGalaxies">NO GALAXIES TO DISPLAY</p>
      <div class="d-flex justify-center mb-4">
        <v-btn
          x-small
          color="baseAccent"
          @click="$emit('createGalaxy')"
          outlined
          class="py-6 px-12"
        >
          <v-icon x-small class="pr-2">{{ mdiPlus }}</v-icon>
          MAP NEW GALAXY
        </v-btn>
      </div>
    </div>
    <!-- <GradientBackground :gradients="gradients"/> -->
    <network
      v-if="allNodesForDisplay.length != 0"
      ref="network"
      class="full-height"
      :nodes="allNodesForDisplay"
      :edges="allEdgesForDisplay"
      :options="network.options"
      @hook:mounted="networkMounted"
      @hook:updated="networkUpdated"
      @click="click"
      @before-drawing="beforeDrawing"
      @after-drawing="afterDrawing"
      @animation-finished="animationFinished"
    ></network>
  </div>
</template>

<script>
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import useGalaxyListViewStore from "@/store/galaxyListView";
import useRootStore from "@/store/index";
import Network from "@/vue2vis/Network.vue";
import { layoutBlock, drawBlock, Placement2D } from "@cprecioso/canvas-text-layout";
import { mdiPlus } from "@mdi/js";
import { mapActions, mapState } from "pinia";
import "vis-network/styles/vis-network.css";

export default {
  name: "Galaxies",
  props: {
    courses: { type: Array, default: () => [] },
    courseEdgesMap: { type: Map, default: () => new Map() },
    courseNodesMap: { type: Map, default: () => new Map() },
    coursesActivity: { type: Array, default: () => [] },
    highlightCourse: { type: String, default: null },
    isLoadingCourses: { type: Boolean, default: true },
  },
  components: {
    Network,
    LoadingSpinner,
  },
  data: () => ({
    mdiPlus,
    active: false,
    loading: true,
    needsCentering: false,
    needsToZoomOut: false,
    popupPreview: false,
    allNodesForDisplay: [],
    allEdgesForDisplay: [],
    relativeGalaxyBoundaries: [],
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
    ...mapState(useRootStore, ["darkMode", "person", "user"]),
    ...mapState(useGalaxyListViewStore, []),
    isDark() {
      return this.$vuetify.theme.isDark;
    },
  },
  watch: {
    darkMode(dark) {
      if (dark == false) {
        this.makeGalaxyLabelsColour(this.$vuetify.theme.themes.light.baseAccent);
      } else {
        this.makeGalaxyLabelsColour("#ffffff");
      }
    },
    highlightCourse(newCourseId) {
      // get all topic nodes by the closest clicked
      const coursesTopicNodes = this.allNodesForDisplay.filter(
        (node) => node.courseId === newCourseId,
      );

      if (coursesTopicNodes.length > 0) {
        // zoom to specific galaxy nodes
        this.zoomToNodes(coursesTopicNodes);
      } else {
        // zoom out to fit all nodes
        this.zoomToNodes(this.allNodesForDisplay, true);
      }
    },
    async courses(newCourses, oldCourses) {
      this.loading = true;
      let needsCentering = true;
      if (newCourses?.length === oldCourses?.length) {
        needsCentering = false;
        // Do a quick check to see if the courses have changed even though the number of courses is the same
        for (let i = 0; i < newCourses.length; i++) {
          if (newCourses[i].id === oldCourses[i].id) {
            continue;
          }
          needsCentering = true;
          break;
        }
      }
      this.refreshAllNodesAndEdgesToDisplay(needsCentering);
    },
  },
  mounted() {
    this.refreshAllNodesAndEdgesToDisplay(true);
  },
  methods: {
    ...mapActions(useRootStore, []),
    refreshAllNodesAndEdgesToDisplay(needsCentering) {
      const repositionedNodes = this.repositionCoursesBasedOnBoundariesV2();
      this.allNodesForDisplay = repositionedNodes;
      this.allEdgesForDisplay = Array.from(this.courseEdgesMap.values()).flatMap((x) => x);

      if (repositionedNodes.length === 0 && this.isLoadingCourses === false) {
        this.loading = false;
      }

      this.needsCentering = needsCentering;
    },
    networkMounted() {
      console.log("networkMounted called");
      this.centerAfterReposition();
    },
    networkUpdated() {
      console.log("networkUpdated called");
      if (this.needsCentering === true) {
        this.centerAfterReposition();
      }
    },
    beforeDrawing(ctx) {
      if (this.relativeGalaxyBoundaries.length === 0) {
        return;
      }
      for (const relative of this.relativeGalaxyBoundaries) {
        // console.log("relative boundary:", relative);
        this.drawGlow(
          ctx,
          relative.centroidX,
          relative.centroidY,
          relative.width > relative.height ? relative.width : relative.height,
          relative.status,
          relative.course,
          relative.id,
        );
        // draw the galaxy maps bounds (for debugging boundaries)
        // this.drawBounds(
        //   ctx,
        //   relative.top,
        //   relative.right,
        //   relative.bottom,
        //   relative.left
        // );
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
    drawGlow(ctx, x, y, radius, status, course, courseId) {
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
          colour = "rgba(250,242,0,0.2)"; // cohortAccent as rgba
          //colour = "rgba(233,196,106,0.3)"; // cohortAccent as rgba
          break;
        case "assigned":
          colour = "rgba(105,161,226,0.3)"; // missionAccent as rgba
          break;
        default:
          colour = "rgba(20, 30, 48, 0)"; // background as rgba
          break;
      }

      // gradient
      // var grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
      if (isFinite(x) && isFinite(y) && isFinite(radius)) {
        var grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
      } else {
        console.error("Invalid values for galaxy [" + course + "] id [" + courseId + "]: ", {
          x,
          y,
          radius,
        });
      }
      grd.addColorStop(0, colour);
      grd.addColorStop(1, "rgba(20, 30, 48, 0)");

      // Fill with gradient
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.closePath();
    },

    /**
     * Called after the network has been drawn
     * @param {CanvasRenderingContext2D} canvasContext
     */
    afterDrawing(canvasContext) {
      // get current scale of canvas (zoom level)
      const currentScale = this.$refs.network.getScale();

      // Draw extra components when scale is under 0.7 aka zoomed out
      if (currentScale < 0.7) {
        for (const course of this.courses) {
          this.drawCourseTitle(canvasContext, course);
          this.drawCourseProgressionCircle(canvasContext, course, "50");
        }
        // Draw dialog if course highlighted
        // if (this.highlightCourse != null) {
        //   const course = this.courses.find((x) => x.id === this.highlightCourse);
        //   const courseBoundary = this.relativeGalaxyBoundaries.find(
        //     (x) => x.id === this.highlightCourse,
        //   );
        //   const courseActivity = this.coursesActivity.find(
        //     (x) => x.course.id === this.highlightCourse,
        //   );
        //   const percentage =
        //     courseActivity != null
        //       ? Math.round(
        //           (courseActivity.topicCompletedCount / courseActivity.course.topicTotal) * 100,
        //         )
        //       : 0;
        //   const courseTitleBlockInfo = layoutBlock(canvasContext, course.title, { maxWidth: 180 });
        //   canvasContext.strokeStyle = "rgba(255, 255, 255, 1)";
        //   canvasContext.lineWidth = 1;
        //   canvasContext.beginPath();
        //   canvasContext.roundRect(
        //     courseBoundary.top.x,
        //     courseBoundary.top.y,
        //     courseTitleBlockInfo.width + 20,
        //     courseTitleBlockInfo.height + 20,
        //     20,
        //   );
        //   canvasContext.stroke();
        //   canvasContext.closePath();
        //   drawBlock(canvasContext, courseTitleBlockInfo, {
        //     x: courseBoundary.top.x + 10,
        //     y: courseBoundary.top.y + 10,
        //   });
        //   const progressionBlockInfo = layoutBlock(canvasContext, `${percentage}%`, {
        //     maxWidth: 180,
        //   });
        //   canvasContext.strokeStyle = "rgba(255, 255, 255, 1)";
        //   canvasContext.lineWidth = 1;
        //   canvasContext.beginPath();
        //   canvasContext.roundRect(
        //     courseBoundary.top.x + courseTitleBlockInfo.width + 20 + 5,
        //     courseBoundary.top.y,
        //     progressionBlockInfo.width + 20,
        //     courseTitleBlockInfo.height + 20,
        //     20,
        //   );
        //   canvasContext.stroke();
        //   canvasContext.closePath();
        //   drawBlock(canvasContext, progressionBlockInfo, {
        //     x: courseBoundary.top.x + courseTitleBlockInfo.width + 20 + 5 + 10,
        //     y: courseBoundary.top.y + 10,
        //   });
        // }
      } else if (currentScale > 0.7) {
        // Draw extra components when scale is over 0.7 aka zoomed in
        for (const course of this.courses) {
          this.drawCourseProgressionCircle(canvasContext, course, "20");
        }
      }

      if (this.needsCentering === true) {
        this.centerAfterReposition();
      }
      // stop loading spinner
      if (this.loading === true) {
        this.loading = false;
      }
    },
    /**
     * Called to draw the title for the course
     * @param {CanvasRenderingContext2D} canvasContext
     */
    drawCourseTitle(canvasContext, course) {
      const courseBoundary = this.relativeGalaxyBoundaries.find((x) => x.id === course.id);
      const courseActivity = this.coursesActivity.find((x) => x.course.id === course.id);

      canvasContext.fillStyle = "rgba(255, 255, 255, 1)";
      canvasContext.textAlign = "left";
      canvasContext.textBaseline = "top";

      // Give at least 500px width for the title
      const maxWidth = Math.max(courseBoundary.width, 500);

      canvasContext.font = 'bold 50px "Arial"';
      canvasContext.fillStyle = this.$vuetify.theme.isDark
        ? this.$vuetify.theme.themes.dark.galaxyAccent
        : this.$vuetify.theme.themes.light.galaxyAccent;

      const courseTitleBlockInfo = layoutBlock(canvasContext, course.title.toUpperCase(), {
        maxWidth: maxWidth,
      });

      const courseBoundaryXCenter = courseBoundary.left.x + courseBoundary.width / 2;
      const courseBoundaryYCenter = courseBoundary.top.y + courseBoundary.height / 2;

      const contentWidth = courseTitleBlockInfo.width + 20 + 50; // 20 for spacing and 50 for progress circle
      const contentHeight = courseTitleBlockInfo.height; // 20 for spacing and 50 for progress circle

      // const courseTitleX = courseBoundaryXCenter - contentWidth / 2; // middle
      // const courseTitleY = courseBoundary.top.y - 40 - courseTitleBlockInfo.height; // 40 for spacing away from nodes
      const courseTitleX = courseBoundary.left.x - contentWidth;
      const courseTitleY = courseBoundaryYCenter - contentHeight / 2; // 40 for spacing away from nodes

      // === Box border around title
      // canvasContext.beginPath();
      // --- Box border stroke
      // const padding = 50;
      // canvasContext.strokeStyle = this.$vuetify.theme.isDark
      //   ? this.$vuetify.theme.themes.dark.galaxyAccent
      //   : this.$vuetify.theme.themes.light.galaxyAccent;
      // canvasContext.lineWidth = 3;
      // canvasContext.rect(
      //   courseTitleX - padding,
      //   courseTitleY - padding,
      //   courseTitleBlockInfo.width + padding * 2,
      //   courseTitleBlockInfo.height + padding * 2,
      // );
      // --- Box background fill
      // canvasContext.fillStyle = this.$vuetify.theme.isDark
      //   ? this.$vuetify.theme.themes.dark.background
      //   : this.$vuetify.theme.themes.light.background;
      // canvasContext.fill();
      // canvasContext.stroke();
      // canvasContext.closePath();

      canvasContext.font = 'bold 50px "Arial"';

      drawBlock(canvasContext, courseTitleBlockInfo, {
        x: courseTitleX,
        y: courseTitleY,
      });
    },
    drawCourseProgressionCircle(canvasContext, course, fontSize) {
      const courseBoundary = this.relativeGalaxyBoundaries.find((x) => x.id === course.id);
      const courseActivity = this.coursesActivity.find((x) => x.course.id === course.id);

      const progressFraction =
        courseActivity != null
          ? courseActivity.topicCompletedCount / courseActivity.course.topicTotal
          : 0;
      const displayPercentage = Math.round(progressFraction * 100);

      canvasContext.textAlign = "left";
      canvasContext.textBaseline = "top";

      canvasContext.font = 'bold 50px "Arial"';
      canvasContext.fillStyle = this.$vuetify.theme.isDark
        ? this.$vuetify.theme.themes.dark.galaxyAccent
        : this.$vuetify.theme.themes.light.galaxyAccent;

      canvasContext.font = 'bold 14px "Arial"';
      const progressTitleBlockInfo = layoutBlock(canvasContext, `${displayPercentage}%`, {
        maxWidth: 40,
      });

      const courseBoundaryXCenter = courseBoundary.left.x + courseBoundary.width / 2;
      const courseBoundaryYCenter = courseBoundary.top.y + courseBoundary.height / 2;

      // Circles start from the right so we need to calculate an offset to use
      const arcCircleOffset = -(90 * (Math.PI / 180));
      const radius = 400;

      // padding for the progress title
      const padding = 20;

      // compute x and y coordinates of the end angle relative to course centers
      const progressTitleX =
        courseBoundaryXCenter +
        Math.cos(Math.PI * 2 * progressFraction + arcCircleOffset) * radius -
        progressTitleBlockInfo.width / 2 -
        padding;
      const progressTitleY =
        courseBoundaryYCenter +
        Math.sin(Math.PI * 2 * progressFraction + arcCircleOffset) * radius +
        padding;

      canvasContext.font = "bold " + fontSize + 'px "Arial"';

      // add progress if not 0%
      if (progressFraction != 0) {
        drawBlock(canvasContext, progressTitleBlockInfo, {
          x: progressTitleX,
          y: progressTitleY,
        });

        // Draw the background cirlce
        canvasContext.beginPath();
        canvasContext.strokeStyle = "rgba(255, 255, 255, 0.1)";
        canvasContext.lineWidth = 4;
        canvasContext.arc(courseBoundaryXCenter, courseBoundaryYCenter, radius, 0, Math.PI * 2);
        canvasContext.stroke();
        canvasContext.closePath();

        // Now the foreground progression segment (if not 0%)
        if (progressFraction != 0) {
          canvasContext.beginPath();
          // convert vuetify theme colour to rgba
          canvasContext.strokeStyle = this.hexToRGBA(
            this.$vuetify.theme.isDark
              ? this.$vuetify.theme.themes.dark.galaxyAccent
              : this.$vuetify.theme.themes.light.galaxyAccent,
            0.5, // 50% opacity
          );
          canvasContext.lineWidth = 8;
          canvasContext.arc(
            courseBoundaryXCenter,
            courseBoundaryYCenter,
            radius,
            0 + arcCircleOffset,
            Math.PI * 2 * progressFraction + arcCircleOffset,
          );
          canvasContext.stroke();
          canvasContext.closePath();
        }
      }
    },
    hexToRGBA(hex, opacity) {
      let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

      if (opacity !== undefined) {
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else {
        return `rgb(${r}, ${g}, ${b})`;
      }
    },
    animationFinished() {
      console.log("animation finished");
      if (this.needsToZoomOut === true) {
        this.needsToZoomOut = false;
        console.log("zooming out");
        this.zoomOut();
      }
    },
    centerAfterReposition() {
      this.needsCentering = false;

      // set label colours (important if in light mode)
      this.makeGalaxyLabelsColour(
        this.$vuetify.theme.isDark ? "#fff" : this.$vuetify.theme.themes.light.baseAccent,
      );

      // get all topic nodes for the highlighted course
      const coursesTopicNodes = this.allNodesForDisplay.filter(
        (node) => node.courseId === this.highlightCourse,
      );

      if (coursesTopicNodes.length > 0) {
        // zoom to specific galaxy nodes
        this.zoomToNodes(coursesTopicNodes);
      } else {
        // zoom out to fit all nodes
        this.zoomToNodes(this.allNodesForDisplay, true);
      }
    },
    click(data) {
      // get click location
      const clickedPosition = data.pointer.canvas;
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
      let shortestDistance = 400; // limit the furthest distance
      for (let i = 0; i < allNodePositionsArray.length; i++) {
        var d = this.pointDistance(clickedPosition, allNodePositionsArray[i]);
        if (d < shortestDistance) {
          closest = allNodePositionsArray[i];
          shortestDistance = d;
        }
      }

      if (closest == null) {
        return;
      }

      const closestNode = this.$refs.network.getNode(closest.id);

      this.$emit("courseClicked", { courseId: closestNode.courseId });

      // hide canvas title
    },
    pointDistance(pt1, pt2) {
      var diffX = pt1.x - pt2.x;
      var diffY = pt1.y - pt2.y;
      return Math.sqrt(diffX ** 2 + diffY ** 2);
    },
    calcCourseCanvasBoundaries() {
      const courses = this.courses;
      let courseCanvasBoundaries = [];

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
        // let DOMboundary = {
        //   top: 0,
        //   bottom: 0,
        //   left: 0,
        //   right: 0,
        // };

        // get nodes in course
        const nodes = this.courseNodesMap.get(courses[i].id);

        // If we don't have any nodes for this galaxy then don't include it in the final result
        if (nodes.length === 0) {
          console.warn("no nodes for course: ", courses[i].id);
          continue;
        }

        // loop nodes in that course
        for (const node of nodes) {
          // push node to course
          courseNodes.push({
            nodeLabel: node.label,
            nodeId: node.id,
            x: node.x,
            y: node.y,
          });
        }

        //find min x = left
        boundary.left = courseNodes.reduce((prev, curr) => (prev.x < curr.x ? prev : curr), 0);
        //find max x = right
        boundary.right = courseNodes.reduce((prev, curr) => (prev.x > curr.x ? prev : curr), 0);
        //find min y = top
        boundary.top = courseNodes.reduce((prev, curr) => (prev.y < curr.y ? prev : curr), 0);
        //find max y = bottom
        boundary.bottom = courseNodes.reduce((prev, curr) => (prev.y > curr.y ? prev : curr), 0);

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
          else if (courses[i].status == "published" && courses[i].public == true) status = "public";
          else if (courses[i].status == "published" && courses[i].public == false)
            status = "private";
          else if (courses[i].status == "submitted") status = "submitted";
        } else if (this.person.assignedCourses?.some((course) => course === courses[i].id)) {
          status = "assigned";
        }
        // glow submitted for admin to easily see submitted galaxies for review
        else if (this.user.data?.admin && courses[i].status == "submitted") {
          status = "submitted";
        }
        boundary.status = status;

        // add nodes to boundary for debugging
        boundary.nodes = courseNodes;

        courseCanvasBoundaries.push(boundary);
      }
      return courseCanvasBoundaries;
    },
    repositionCoursesBasedOnBoundariesV2() {
      const courseCanvasBoundaries = this.calcCourseCanvasBoundaries();

      let newAllNodes = [];
      let newRelativeGalaxyBoundaries = [];

      // canvas / 3
      let galaxyColsCount = 0;
      const numberOfGalaxiesPerRow = Math.ceil(Math.sqrt(this.courses.length)); // hardcoded num of galaxies in a row

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

        let relativeTop = { label: "", x: 0, y: 0 },
          relativeRight,
          relativeBottom,
          relativeLeft;

        // get nodes in course
        const nodes = this.courseNodesMap.get(courseCanvasBoundaries[i].id);

        for (const node of nodes) {
          let newNode = {
            ...node,
            courseId: courseCanvasBoundaries[i].id,
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
            labe: newNode.label,
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
        let centroidTri1X = (relativeTop.x + relativeRight.x + relativeBottom.x) / 3;
        let centroidTri1Y = (relativeTop.y + relativeRight.y + relativeBottom.y) / 3;

        // 2) calc centroid triangle 2
        let centroidTri2X = (relativeBottom.x + relativeLeft.x + relativeTop.x) / 3;
        let centroidTri2Y = (relativeBottom.y + relativeLeft.y + relativeTop.y) / 3;

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
        newRelativeGalaxyBoundaries.push(relativeCenter);

        // increase offset for next galaxy column aka ** PADDING BETWEEN GALAXIES **
        currentColWidth += courseCanvasBoundaries[i].width / 2 + 1600; // width / 2 because dont want to pad the whole width over + pad just half the course width + pad

        // keep track of largest height
        if (courseCanvasBoundaries[i].height > maxRowHeight) {
          // console.log("new max height:", courseCanvasBoundaries[i].height);
          maxRowHeight = courseCanvasBoundaries[i]?.height;
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
          for (let x = 1; x <= numberOfGalaxiesPerRow; x++) {
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
              maxRowHeight = courseCanvasBoundaries[i - x - 1]?.height / 2 + 600;
            }
          }
          // }
          // reset for next row
          currentColWidth = 0;
          currrentRowHeight += maxRowHeight + 300; // FIXME: temporarily always add some padding
          galaxyColsCount = 0;
        }
      }
      // console.log("relative centers", this.relativeGalaxyBoundaries);
      this.relativeGalaxyBoundaries = newRelativeGalaxyBoundaries;
      // pad the end of row
      // this.largestRowWidth += this.largestRowWidth / this.numberOfGalaxiesPerRow / 2;
      // this.$refs.network.storePositions();
      // console.log("newAllNodes", newAllNodes);
      return newAllNodes;
    },
    // this controls the fit zoom animation
    zoomToNodes(nodes, fast = false) {
      console.log("zoom to nodes called");
      // get node ids
      const nodeIds = nodes.map((x) => x.id);

      // fit
      this.$refs.network.fit({
        nodes: nodeIds,
        // scale: 0.5,
        // animation: true,
        animation: {
          duration: fast ? 800 : 2000,
          easingFunction: "easeInOutQuad",
        },
      });
    },
    zoomOut() {
      this.$refs.network.moveTo({
        scale: 0.15,
        animation: true,
        // animation: {
        //   duration: 2000,
        //   easingFunction: "easeInOutQuad",
        // },
      });
    },
    zoomToAllNodes() {
      this.zoomToNodes(this.allNodesForDisplay);
    },
    togglePopup() {
      this.popupPreview = !this.popupPreview;
      this.zoomToNodes(this.allNodesForDisplay);
    },
    makeGalaxyLabelsColour(colour) {
      var options = { ...this.network.options };
      options.nodes.font.color = colour;
      options.nodes.fixed = true;
      this.$refs.network.setOptions(options);
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
