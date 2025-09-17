<template>
  <div class="full-height justify-center align-center">
    <LoadingSpinner v-if="isLoadingCourses || loading" text="loading learning universe" />
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
    <div v-if="avatarDots.length" class="avatar-overlay">
      <template v-for="(dot, i) in avatarDots">
        <img
          v-if="dot.url"
          :key="'img-' + i"
          class="avatar-dot"
          :src="dot.url"
          :style="{
            left: dot.left + 'px',
            top: dot.top + 'px',
            width: dot.size + 'px',
            height: dot.size + 'px',
            border: dot.online ? '2px solid #00E676' : '1px solid rgba(0,0,0,0.4)',
          }"
          :title="dot.name || ''"
          alt="avatar"
        />
        <div
          v-else
          :key="'div-' + i"
          class="avatar-dot placeholder"
          :style="{
            left: dot.left + 'px',
            top: dot.top + 'px',
            width: dot.size + 'px',
            height: dot.size + 'px',
            backgroundImage: "url('/avatar_placeholder.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: dot.online ? '2px solid #00E676' : '1px solid rgba(0,0,0,0.4)',
          }"
          :title="dot.name || ''"
        />
      </template>
      <!-- In-canvas tooltip replaces DOM tooltip; keep element for potential future use -->
    </div>
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
import { Planet } from "@/lib/planet";
import { fetchTasksByCourseIdTopicId } from "@/lib/ff";

export default {
  name: "CohortGalaxies",
  props: {
    courses: { type: Array, default: () => [] },
    courseEdgesMap: { type: Map, default: () => new Map() },
    courseNodesMap: { type: Map, default: () => new Map() },
    coursesActivity: { type: Array, default: () => [] },
    highlightCourse: { type: String, default: null },
    isLoadingCourses: { type: Boolean, default: true },
    onePerRow: { type: Boolean, default: false },
    showMissions: { type: Boolean, default: false },
    showCourseTitles: { type: Boolean, default: true },
    activeMissionsByTopicKey: { type: Map, default: () => new Map() },
    showGlow: { type: Boolean, default: false },
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
    planetsByNode: new Map(),
    lastFrameTime: 0,
    intervalid1: null,
    time: null,
    tasksByTopicId: new Map(),
    avatarDots: [],
    avatarTooltip: { visible: false, text: "", left: 0, top: 0, topicId: null },
    hoveredAvatar: null,
    network: {
      options: {
        physics: {
          enabled: false,
          solver: "repulsion",
          repulsion: {
            springConstant: 0.3,
            nodeDistance: 300,
            damping: 0.2,
          },
        },
        edges: {
          length: 50,
          smooth: false,
          color: { inherit: "to" },
        },
        nodes: {
          shape: "dot",
          size: 7,
          fixed: { x: true, y: true },
          color: {
            border: "grey",
            highlight: { border: "black", background: "white" },
            hover: { border: "orange", background: "grey" },
          },
          font: { color: "white" },
        },
        groups: {
          default: { shape: "dot" },
          introduction: { shape: "dot", color: "#00E676" },
          tasks: { shape: "dot", color: "#69A1E2" },
          project: { shape: "dot", color: "#E269CF" },
        },
        interaction: { hover: true, hoverConnectedEdges: false, dragNodes: false },
      },
    },
  }),
  computed: {
    ...mapState(useRootStore, ["darkMode", "person", "user"]),
    ...mapState(useGalaxyListViewStore, []),
    isDark() {
      return this.$vuetify.theme.isDark;
    },
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    avatarTooltipStyle() {
      return {};
    },
  },
  watch: {
    darkMode(dark) {
      if (dark == false) this.makeGalaxyLabelsColour(this.$vuetify.theme.themes.light.baseAccent);
      else this.makeGalaxyLabelsColour("#ffffff");
    },
    highlightCourse(newCourseId) {
      const coursesTopicNodes = this.allNodesForDisplay.filter(
        (node) => node.courseId === newCourseId,
      );
      if (coursesTopicNodes.length > 0) {
        this.zoomToNodes(coursesTopicNodes);
        if (this.isMobile) {
          setTimeout(() => {
            const currentView = this.$refs.network.getViewPosition();
            const currentScale = this.$refs.network.getScale();
            const topHalfCenter = (window.innerHeight - 320) / 2;
            const fullHeightCenter = window.innerHeight / 2;
            const offsetY = (fullHeightCenter - topHalfCenter) / 2;
            this.$refs.network.moveTo({
              position: { x: currentView.x, y: currentView.y + offsetY },
              scale: currentScale,
              animation: { duration: 300, easingFunction: "easeOutQuad" },
            });
          }, 850);
        }
      } else {
        this.zoomToNodes(this.allNodesForDisplay, true);
      }
    },
    async courses(newCourses, oldCourses) {
      this.loading = true;
      let needsCentering = true;
      if (newCourses?.length === oldCourses?.length) {
        needsCentering = false;
        for (let i = 0; i < newCourses.length; i++) {
          if (newCourses[i].id !== oldCourses[i].id) {
            needsCentering = true;
            break;
          }
        }
      }
      if (newCourses && this.courseNodesMap && this.courseEdgesMap)
        this.refreshAllNodesAndEdgesToDisplay(needsCentering);
    },
    allNodesForDisplay() {
      this.buildPlanetsForAllNodes();
    },
    async courses(newVal) {
      if (Array.isArray(newVal) && newVal.length > 0) {
        await this.loadCohortTasks();
        this.buildPlanetsForAllNodes();
      }
    },
  },
  mounted() {
    if (this.courses && this.courseNodesMap && this.courseEdgesMap)
      this.refreshAllNodesAndEdgesToDisplay(true);
    this.startNodeAnimation();
    // Passive global mouse move for in-canvas tooltips that doesn't block wheel
    window.addEventListener("mousemove", this.onGlobalMouseMove, { passive: true });
  },
  beforeDestroy() {
    this.clearPlanets();
    this.stopNodeAnimation();
    window.removeEventListener("mousemove", this.onGlobalMouseMove);
  },
  methods: {
    showAvatarTooltip(dot, isTouch = false) {
      if (!dot?.name) return;
      // Track hovered avatar to draw tooltip on canvas
      this.hoveredAvatar = {
        name: dot.name,
        basePlanet: { x: dot._basePlanetX ?? 0, y: dot._basePlanetY ?? 0 },
        topicId: dot._topicId || null,
      };
      // Redraw to display tooltip immediately
      this.$refs.network?.redraw();
      if (isTouch) {
        clearTimeout(this._avatarTooltipTimer);
        this._avatarTooltipTimer = setTimeout(() => {
          this.hideAvatarTooltip();
        }, 1500);
      }
    },
    hideAvatarTooltip() {
      this.hoveredAvatar = null;
      this.$refs.network?.redraw();
    },
    onGlobalMouseMove(evt) {
      try {
        if (!this.avatarDots || this.avatarDots.length === 0) {
          if (this.hoveredAvatar) this.hideAvatarTooltip();
          return;
        }
        const x = evt.clientX;
        const y = evt.clientY;
        let hovered = null;
        for (const dot of this.avatarDots) {
          if (
            x >= dot.left &&
            x <= dot.left + dot.size &&
            y >= dot.top &&
            y <= dot.top + dot.size &&
            dot.name
          ) {
            hovered = dot;
            break;
          }
        }
        if (hovered) {
          // Update hovered avatar reference for canvas tooltip
          this.hoveredAvatar = {
            name: hovered.name,
            basePlanet: { x: hovered._basePlanetX ?? 0, y: hovered._basePlanetY ?? 0 },
            // Convert DOM center of avatar back to canvas coords for accurate placement
            canvasX: this.$refs.network.domToCanvas({
              x: hovered.left + hovered.size / 2,
              y: hovered.top + hovered.size / 2,
            }).x,
            canvasY: this.$refs.network.domToCanvas({
              x: hovered.left + hovered.size / 2,
              y: hovered.top + hovered.size / 2,
            }).y,
            topicId: hovered._topicId || null,
          };
        } else if (this.hoveredAvatar) {
          this.hoveredAvatar = null;
        }
      } catch (e) {}
    },
    onOverlayWheel(evt) {
      // Forward wheel to vis-network container so zoom still works while hovering avatars
      try {
        const container = this.$refs.network?.$el;
        if (!container) return;
        const forwarded = new WheelEvent("wheel", {
          deltaX: evt.deltaX,
          deltaY: evt.deltaY,
          deltaMode: evt.deltaMode,
          clientX: evt.clientX,
          clientY: evt.clientY,
          ctrlKey: evt.ctrlKey,
          shiftKey: evt.shiftKey,
          altKey: evt.altKey,
          metaKey: evt.metaKey,
          bubbles: true,
          cancelable: true,
        });
        container.dispatchEvent(forwarded);
      } catch (e) {}
    },
    onAvatarWheel(evt) {
      // Let vis-network handle zoom, but ensure our overlay doesn't block it
      // 1) Hide tooltip so it doesn't flicker during zoom
      this.hideAvatarTooltip();
      // 2) Manually call network's wheel handler by dispatching to the canvas container
      try {
        // vis-network attaches wheel listeners to the container element
        const el = this.$refs.network?.$el || this.$refs.network?.$el?.parentElement;
        if (!el) return;
        // Temporarily disable pointer events on overlay so original wheel reaches canvas
        const overlay = this.$el.querySelector(".avatar-overlay");
        if (overlay) {
          overlay.style.pointerEvents = "none";
          requestAnimationFrame(() => {
            overlay.style.pointerEvents = "";
          });
        }
      } catch (e) {}
    },
    ...mapActions(useRootStore, []),
    refreshAllNodesAndEdgesToDisplay(needsCentering) {
      if (!this.courses || !this.courseNodesMap || !this.courseEdgesMap) {
        console.warn("Missing required data for refreshAllNodesAndEdgesToDisplay");
        this.allNodesForDisplay = [];
        this.allEdgesForDisplay = [];
        this.loading = false;
        this.needsCentering = needsCentering;
        return;
      }
      const repositionedNodes = this.repositionCoursesBasedOnBoundariesV2();
      this.allNodesForDisplay = repositionedNodes;
      this.allEdgesForDisplay = Array.from(this.courseEdgesMap.values()).flatMap((x) => x);
      if (repositionedNodes.length === 0 && this.isLoadingCourses === false) this.loading = false;
      this.needsCentering = needsCentering;
      this.buildPlanetsForAllNodes();
    },
    networkMounted() {
      this.centerAfterReposition();
    },
    networkUpdated() {
      if (this.needsCentering === true) this.centerAfterReposition();
    },
    beforeDrawing(ctx) {
      const oldTime = this.time;
      this.time = new Date();
      let delta = oldTime == null ? 1 : (this.time.getTime() - oldTime.getTime()) / 1000;
      const strokeColor = this.$vuetify.theme.isDark
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.15)";
      // Always draw planets and orbits regardless of zoom level
      for (const planets of this.planetsByNode.values()) {
        for (const planet of planets) {
          if (this.showMissions && !planet.orbitStopped && !planet.animating) planet.stopOrbit();
          else if (!this.showMissions && planet.orbitStopped && !planet.animating)
            planet.resumeOrbit();
          planet.update(ctx, delta, strokeColor);
        }
      }
    },
    afterDrawing(canvasContext) {
      const currentScale = this.$refs.network.getScale();
      if (currentScale < 0.7) {
        for (const course of this.courses) {
          if (this.showCourseTitles) this.drawCourseTitle(canvasContext, course);
          this.drawCourseProgressionCircle(canvasContext, course, "50");
        }
      } else if (currentScale > 0.7) {
        for (const course of this.courses)
          this.drawCourseProgressionCircle(canvasContext, course, "20");
      }
      if (this.needsCentering === true) this.centerAfterReposition();
      if (this.loading === true) this.loading = false;
      if (this.showMissions) {
        const labelColor = this.$vuetify.theme.isDark
          ? "#ffffff"
          : this.$vuetify.theme.themes.light.baseAccent;
        for (const planets of this.planetsByNode.values())
          for (const planet of planets) planet.drawLabel(canvasContext, labelColor);
      }
      // In-canvas tooltip for hovered avatar
      try {
        if (this.hoveredAvatar && this.hoveredAvatar.name) {
          const ctx = canvasContext;
          const { name } = this.hoveredAvatar;
          ctx.save();
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          const paddingX = 6,
            paddingY = 4;
          const textWidth = ctx.measureText(name).width;
          const boxWidth = textWidth + paddingX * 2;
          const boxHeight = 18;
          const x = this.hoveredAvatar.canvasX ?? this.hoveredAvatar.basePlanet?.x ?? 0;
          const y = (this.hoveredAvatar.canvasY ?? this.hoveredAvatar.basePlanet?.y ?? 0) - 22;
          // online border indicator around avatar (green if online)
          if (this.hoveredAvatar.personId) {
            const status = this.userStatus?.[this.hoveredAvatar.personId]?.status;
            if (status === "online") {
              ctx.beginPath();
              ctx.arc(x, y + 22, 12, 0, Math.PI * 2);
              ctx.strokeStyle = "#00E676";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x - boxWidth / 2, y - boxHeight, boxWidth, boxHeight, 4);
          else ctx.rect(x - boxWidth / 2, y - boxHeight, boxWidth, boxHeight);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.fillText(name, x, y - 4);
          ctx.restore();
        }
      } catch (e) {}
      // Draw custom topic labels (hide default vis labels)
      try {
        const ctx = canvasContext;
        ctx.save();
        ctx.fillStyle = this.$vuetify.theme.isDark
          ? this.$vuetify.theme.themes.dark.missionAccent
          : this.$vuetify.theme.themes.light.missionAccent;
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const nodeIds = this.$refs.network.nodes.map(({ id }) => id);
        const nodePositionMap = this.$refs.network.getPositions(nodeIds);
        for (const [nodeId, position] of Object.entries(nodePositionMap)) {
          const originalNode = this.allNodesForDisplay.find((n) => n.id === nodeId);
          const label = originalNode?.label || originalNode?.title || "";
          if (!label) continue;
          ctx.fillText(label, position.x + 15, position.y);
        }
        ctx.restore();
      } catch (e) {}
      try {
        const dots = [];
        const avatarSize = 18;
        for (const [topicId, planets] of this.planetsByNode.entries()) {
          const courseId = this.findCourseIdForTopic(topicId);
          const key = courseId + ":" + topicId;
          const activeList = this.activeMissionsByTopicKey?.get(key) || [];
          if (!activeList.length) continue;

          // Group active avatars by their target planet index
          const groups = new Map(); // planetTaskIndex -> entries[]
          for (const entry of activeList) {
            const { orderIndex, taskName } = entry;
            let base = null;
            if (orderIndex != null) base = planets.find((p) => p.taskIndex === orderIndex);
            if (!base && taskName) base = planets.find((p) => p.taskName === taskName);
            if (!base) base = planets[0];
            if (!base) continue;
            const idx = base.taskIndex ?? 0;
            const arr = groups.get(idx) || [];
            arr.push({ base, entry });
            groups.set(idx, arr);
          }

          // Position per planet: stack all avatars to the left with a small gap
          for (const arr of groups.values()) {
            for (let j = 0; j < arr.length; j++) {
              const { base, entry } = arr[j];
              const dom = this.$refs.network.canvasToDom({ x: base.x, y: base.y });
              const gap = 4;
              const centerX = dom.x - (avatarSize + gap) * (j + 1) + gap / 2;
              const centerY = dom.y;
              const planetRef = base; // keep reference for tooltip position
              const online = this.userStatus?.[entry.personId]?.status === "online";
              dots.push({
                url: entry.avatarUrl || null,
                name: entry.name || null,
                personId: entry.personId || null,
                online,
                left: centerX - avatarSize / 2,
                top: centerY - avatarSize / 2,
                size: avatarSize,
                _basePlanetX: planetRef.x,
                _basePlanetY: planetRef.y,
                _topicId: planetRef.topicId,
              });
            }
          }
        }
        this.avatarDots = dots;
      } catch (e) {}
    },
    drawCourseTitle(canvasContext, course) {
      const courseBoundary = this.relativeGalaxyBoundaries.find((x) => x.id === course.id);
      canvasContext.fillStyle = "rgba(255, 255, 255, 1)";
      canvasContext.textAlign = "center";
      canvasContext.textBaseline = "middle";
      const maxWidth = Math.max(courseBoundary.width, 500);
      canvasContext.font = 'bold 50px "Arial"';
      canvasContext.fillStyle = this.$vuetify.theme.isDark
        ? this.$vuetify.theme.themes.dark.galaxyAccent
        : this.$vuetify.theme.themes.light.galaxyAccent;
      const title = course.title.toUpperCase();
      const words = title.split(" ");
      const lines = [];
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        const testWidth = canvasContext.measureText(testLine).width;
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      const courseBoundaryXCenter = courseBoundary.left.x + courseBoundary.width / 2;
      const courseBoundaryYCenter = courseBoundary.top.y + courseBoundary.height / 2;
      const courseTitleX = courseBoundaryXCenter;
      const courseTitleY = courseBoundaryYCenter + 150;
      canvasContext.font = 'bold 40px "Arial"';
      canvasContext.textAlign = "center";
      canvasContext.textBaseline = "middle";
      canvasContext.font = 'bold 50px "Arial"';
      const lineHeight = 60;
      const totalHeight = lines.length * lineHeight;
      const startY = courseTitleY - (totalHeight - lineHeight) / 2;
      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        canvasContext.fillText(line, courseTitleX, y);
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
      const arcCircleOffset = -(90 * (Math.PI / 180));
      const radius = 400;
      const padding = 20;
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
      if (progressFraction != 0) {
        drawBlock(canvasContext, progressTitleBlockInfo, { x: progressTitleX, y: progressTitleY });
        canvasContext.beginPath();
        canvasContext.strokeStyle = "rgba(255, 255, 255, 0.1)";
        canvasContext.lineWidth = 4;
        canvasContext.arc(courseBoundaryXCenter, courseBoundaryYCenter, radius, 0, Math.PI * 2);
        canvasContext.stroke();
        canvasContext.closePath();
        if (progressFraction != 0) {
          canvasContext.beginPath();
          canvasContext.strokeStyle = this.hexToRGBA(
            this.$vuetify.theme.isDark
              ? this.$vuetify.theme.themes.dark.galaxyAccent
              : this.$vuetify.theme.themes.light.galaxyAccent,
            0.5,
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
      const r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
      if (opacity !== undefined) return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      else return `rgb(${r}, ${g}, ${b})`;
    },
    animationFinished() {
      if (this.needsToZoomOut === true) {
        this.needsToZoomOut = false;
        this.zoomOut();
      }
    },
    centerAfterReposition() {
      this.needsCentering = false;
      this.makeGalaxyLabelsColour(
        this.$vuetify.theme.isDark ? "#fff" : this.$vuetify.theme.themes.light.baseAccent,
      );
      const coursesTopicNodes = this.allNodesForDisplay.filter(
        (node) => node.courseId === this.highlightCourse,
      );
      if (coursesTopicNodes.length > 0) this.zoomToNodes(coursesTopicNodes);
      else this.zoomToNodes(this.allNodesForDisplay, true);
    },
    click(data) {
      const clickedPosition = data.pointer.canvas;
      const allNodePositions = this.$refs.network.getPositions();
      const allNodePositionsArray = [];
      for (const node in allNodePositions) {
        allNodePositionsArray.push({ ...allNodePositions[node], id: node });
      }
      let closest = null;
      let shortestDistance = 400;
      for (let i = 0; i < allNodePositionsArray.length; i++) {
        const d = this.pointDistance(clickedPosition, allNodePositionsArray[i]);
        if (d < shortestDistance) {
          closest = allNodePositionsArray[i];
          shortestDistance = d;
        }
      }
      if (closest == null) return;
      const closestNode = this.$refs.network.getNode(closest.id);
      this.$emit("courseClicked", { courseId: closestNode.courseId });
    },
    pointDistance(pt1, pt2) {
      const diffX = pt1.x - pt2.x;
      const diffY = pt1.y - pt2.y;
      return Math.sqrt(diffX ** 2 + diffY ** 2);
    },
    // calcCourseCanvasBoundaries + repositionCoursesBasedOnBoundariesV2 copied from Galaxies.vue
    calcCourseCanvasBoundaries() {
      const courses = this.courses;

      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return [];
      }

      const courseCanvasBoundaries = [];
      for (let i = 0; i < courses.length; i++) {
        const boundary = {
          heightOffset: 0,
          maxWidthOffset: 0,
          top: { x: 0, y: 0 },
          bottom: { x: 0, y: 0 },
          left: { x: 0, y: 0 },
          right: { x: 0, y: 0 },
          centerY: 0,
          centerX: 0,
        };
        const courseNodes = [];

        const nodes = this.courseNodesMap.get(courses[i].id);

        if (!nodes || nodes.length === 0) {
          continue;
        }

        for (const node of nodes) {
          courseNodes.push({
            nodeLabel: node.label,
            nodeId: node.id,
            x: node.x,
            y: node.y,
          });
        }

        boundary.left = courseNodes.reduce((prev, curr) => (prev.x < curr.x ? prev : curr), 0);
        boundary.right = courseNodes.reduce((prev, curr) => (prev.x > curr.x ? prev : curr), 0);
        boundary.top = courseNodes.reduce((prev, curr) => (prev.y < curr.y ? prev : curr), 0);
        boundary.bottom = courseNodes.reduce((prev, curr) => (prev.y > curr.y ? prev : curr), 0);

        boundary.width = boundary.right.x - boundary.left.x;
        boundary.height = boundary.bottom.y - boundary.top.y;
        boundary.centerX = (boundary.right.x + boundary.left.x) / 2;
        boundary.centerY = (boundary.bottom.y + boundary.top.y) / 2;

        boundary.id = courses[i].id;
        boundary.title = courses[i].title;

        let status;
        if (
          courses[i].mappedBy?.personId == this.person?.id ||
          (courses[i].collaboratorIds && courses[i].collaboratorIds.includes(this.person?.id))
        ) {
          if (courses[i].status == "drafting") status = "drafting";
          else if (courses[i].status == "published" && courses[i].public == true) status = "public";
          else if (courses[i].status == "published" && courses[i].public == false)
            status = "private";
          else if (courses[i].status == "submitted") status = "submitted";
        } else if (this.person?.assignedCourses?.some((course) => course === courses[i].id)) {
          status = "assigned";
        } else if (this.user?.data?.admin && courses[i].status == "submitted") {
          status = "submitted";
        } else {
          status = "no glow";
        }

        boundary.status = status;
        boundary.nodes = courseNodes;

        courseCanvasBoundaries.push(boundary);
      }
      return courseCanvasBoundaries;
    },
    repositionCoursesBasedOnBoundariesV2() {
      const startTime = performance.now();

      const courseCanvasBoundaries = this.calcCourseCanvasBoundaries();

      if (!this.courses || !this.courseNodesMap) {
        return [];
      }

      const newAllNodes = [];
      const newRelativeGalaxyBoundaries = [];

      let galaxyColsCount = 0;
      const numberOfGalaxiesPerRow = this.onePerRow
        ? 1
        : this.isMobile
          ? 3
          : Math.ceil(Math.sqrt(this.courses.length));

      let currentColWidth = 0;
      let currrentRowHeight = 0;

      for (let i = 0; i < courseCanvasBoundaries.length; i++) {
        const newCourseNodes = [];
        let maxRowHeight = 0;

        let relativeTop = { label: "", x: 0, y: 0 },
          relativeRight,
          relativeBottom,
          relativeLeft;

        const nodes = this.courseNodesMap.get(courseCanvasBoundaries[i].id);
        if (!nodes || nodes.length === 0) {
          continue;
        }

        for (const node of nodes) {
          const newNode = {
            ...node,
            courseId: courseCanvasBoundaries[i].id,
            x: currentColWidth + node.x - courseCanvasBoundaries[i].centerX,
            y: currrentRowHeight + node.y - courseCanvasBoundaries[i].centerY,
          };

          if (node.id == courseCanvasBoundaries[i].top.nodeId) {
            relativeTop = { label: newNode.label, x: newNode.x, y: newNode.y };
          }
          if (node.id == courseCanvasBoundaries[i].right.nodeId) {
            relativeRight = { label: newNode.label, x: newNode.x, y: newNode.y };
          }
          if (node.id == courseCanvasBoundaries[i].bottom.nodeId) {
            relativeBottom = { label: newNode.label, x: newNode.x, y: newNode.y };
          }
          if (node.id == courseCanvasBoundaries[i].left.nodeId) {
            relativeLeft = { label: newNode.label, x: newNode.x, y: newNode.y };
          }

          newAllNodes.push(newNode);

          newCourseNodes.push({ labe: newNode.label, x: newNode.x, y: newNode.y });
        }

        const centroidTri1X = (relativeTop.x + relativeRight.x + relativeBottom.x) / 3;
        const centroidTri1Y = (relativeTop.y + relativeRight.y + relativeBottom.y) / 3;
        const centroidTri2X = (relativeBottom.x + relativeLeft.x + relativeTop.x) / 3;
        const centroidTri2Y = (relativeBottom.y + relativeLeft.y + relativeTop.y) / 3;
        const centroidX = (centroidTri1X + centroidTri2X) / 2;
        const centroidY = (centroidTri1Y + centroidTri2Y) / 2;

        const relativeCenter = {
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

        currentColWidth += courseCanvasBoundaries[i].width / 2 + 1600;

        if (courseCanvasBoundaries[i].height > maxRowHeight) {
          maxRowHeight = courseCanvasBoundaries[i]?.height;
        }

        galaxyColsCount++;
        if (galaxyColsCount == numberOfGalaxiesPerRow) {
          for (let x = 1; x <= numberOfGalaxiesPerRow; x++) {
            if (courseCanvasBoundaries[i + x]?.height > maxRowHeight) {
              maxRowHeight = courseCanvasBoundaries[i + x].height / 2 + 600;
            }
            if (courseCanvasBoundaries[i - x - 1]?.height > maxRowHeight) {
              maxRowHeight = courseCanvasBoundaries[i - x - 1]?.height / 2 + 600;
            }
          }
          currentColWidth = 0;
          currrentRowHeight += maxRowHeight + 300;
          galaxyColsCount = 0;
        }
      }

      this.relativeGalaxyBoundaries = newRelativeGalaxyBoundaries;

      const endTime = performance.now();
      const duration = endTime - startTime;
      if (duration > 500) {
        console.warn(`⚠️ Slow repositioning detected (${duration.toFixed(2)}ms)`);
        courseCanvasBoundaries.forEach((boundary) => {
          const nodeCount = this.courseNodesMap.get(boundary.id)?.length || 0;
          if (nodeCount > 50) {
            console.warn(`🐌 Course ${boundary.id} (${boundary.title}) has ${nodeCount} nodes`);
          }
        });
      }

      return newAllNodes;
    },
    // zoom helpers + options
    zoomToNodes(nodes, fast = false) {
      const startTime = performance.now();
      const nodeIds = nodes.map((x) => x.id);
      const courseIds = [...new Set(nodes.map((n) => n.courseId))];
      this.$refs.network.fit({
        nodes: nodeIds,
        animation: { duration: 800, easingFunction: "easeInOutQuad" },
      });
      setTimeout(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        if (duration > 1000) {
          const courseNodeCounts = {};
          nodes.forEach((node) => {
            courseNodeCounts[node.courseId] = (courseNodeCounts[node.courseId] || 0) + 1;
          });
        }
      }, 850);
    },
    zoomOut() {
      this.$refs.network.moveTo({ scale: 0.15, animation: true });
    },
    zoomToAllNodes() {
      this.zoomToNodes(this.allNodesForDisplay);
    },
    togglePopup() {
      this.popupPreview = !this.popupPreview;
      this.zoomToNodes(this.allNodesForDisplay);
    },
    makeGalaxyLabelsColour(colour) {
      const options = { ...this.network.options };
      options.nodes.font.color = colour;
      options.nodes.fixed = true;
      // Hide default vis labels; we'll draw custom labels in afterDrawing
      options.nodes.font.size = 0;
      this.$refs.network.setOptions(options);
    },
    updateFrameTimer() {
      if (this.$refs.network) {
        this.$refs.network.redraw();
      }
    },
    startNodeAnimation() {
      if (this.intervalid1) return;
      this.intervalid1 = setInterval(() => {
        this.updateFrameTimer();
      }, 33);
    },
    stopNodeAnimation() {
      if (this.intervalid1) {
        clearInterval(this.intervalid1);
        this.intervalid1 = null;
      }
    },
    async loadCohortTasks() {
      try {
        this.tasksByTopicId = new Map();
        if (!Array.isArray(this.courses) || this.courses.length === 0) return;
        const fetchJobs = [];
        for (const course of this.courses) {
          const nodes = this.courseNodesMap.get(course.id) || [];
          for (const node of nodes) {
            if (!node?.id) continue;
            fetchJobs.push(
              fetchTasksByCourseIdTopicId(course.id, node.id)
                .then((tasks) => ({ courseId: course.id, topicId: node.id, tasks }))
                .catch(() => ({ courseId: course.id, topicId: node.id, tasks: [] })),
            );
          }
        }
        const results = await Promise.all(fetchJobs);
        for (const { courseId, topicId, tasks } of results)
          this.tasksByTopicId.set(`${courseId}:${topicId}`, tasks || []);
      } catch (e) {
        console.error("Error loading cohort tasks:", e);
      }
    },
    buildPlanetsForAllNodes() {
      try {
        this.clearPlanets();
        if (!Array.isArray(this.allNodesForDisplay) || this.allNodesForDisplay.length === 0) return;
        const planetColor = this.$vuetify.theme.isDark
          ? "white"
          : this.$vuetify.theme.themes.light.missionAccent;
        for (const node of this.allNodesForDisplay) {
          if (typeof node.x !== "number" || typeof node.y !== "number") continue;
          const courseId = node.courseId;
          const topicId = node.id;
          const tasks = this.tasksByTopicId.get(`${courseId}:${topicId}`) || [];
          if (!tasks.length) continue;
          const planets = [];
          tasks.sort((a, b) => {
            if (a?.orderIndex !== undefined && b?.orderIndex !== undefined)
              return a.orderIndex - b.orderIndex;
            return (
              (a?.taskCreatedTimestamp?.seconds || 0) - (b?.taskCreatedTimestamp?.seconds || 0)
            );
          });
          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            planets.push(
              new Planet(
                node.x,
                node.y,
                2,
                planetColor,
                6.28 / (10 * (i + 1)),
                20 * (i + 1),
                topicId,
                task?.name || task?.title || `Task ${i + 1}`,
                i,
              ),
            );
          }
          this.planetsByNode.set(topicId, planets);
        }
      } catch (e) {
        console.error("Error building planets:", e);
      }
    },
    clearPlanets() {
      if (this.planetsByNode && typeof this.planetsByNode.clear === "function")
        this.planetsByNode.clear();
      else this.planetsByNode = new Map();
    },
    findCourseIdForTopic(topicId) {
      for (const [courseId, nodes] of this.courseNodesMap.entries()) {
        if (nodes && nodes.some((n) => n.id === topicId)) return courseId;
      }
      const node = this.allNodesForDisplay.find((n) => n.id === topicId);
      return node?.courseId || "";
    },
  },
};
</script>

<style lang="scss" scoped>
.full-height {
  width: 100%;
  height: 100%;
  height: calc(var(--vh, 1vh) * 100);
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.noGalaxies {
  width: 100%;
  height: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--v-missionAccent-base);
}
.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* Keep overlay passive so wheel/zoom always reaches canvas */
  pointer-events: none;
}
.avatar-dot {
  position: absolute;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
  /* Make avatars non-interactive; we track hover via global mousemove */
  pointer-events: none;
  cursor: pointer;
}
.avatar-dot.placeholder {
  background-color: rgba(200, 200, 200, 0.3);
}
.avatar-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  pointer-events: none;
  white-space: nowrap;
}
</style>
