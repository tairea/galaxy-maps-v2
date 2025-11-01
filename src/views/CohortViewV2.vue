<template>
  <div class="fullHeight bg with-activity-panel" :style="rootCssVars">
    <!-- Left overlay info panel (15% width) -->
    <div id="left-section" v-if="!isLoadingCohort && cohort" :class="{ minimized: infoMinimized }">
      <div class="cohort-info-wrapper" :class="{ minimized: infoMinimized }">
        <CohortInfo :cohort="cohort" :minimized="infoMinimized" @minimised="onInfoMinimized" />
      </div>
      <BackButton :toPath="'/squads'" :class="infoMinimized ? 'back-button-fixed' : 'mt-2'" />
      <AssignedInfo v-show="!infoMinimized" :cohort="cohort" assignCourses="true" />
    </div>

    <!-- Fullscreen galaxies container -->
    <div class="flexContainer" :class="{ minimized: infoMinimized }">
      <LoadingSpinner v-if="isLoadingCohort || isLoadingCourses" text="loading squad" />

      <GalaxyMapButtons
        v-if="courses && courses.length > 0"
        class="mt-8"
        :showMissions="showMissions"
        :hideShowMissions="hideShowMissions"
        @toggleShowMissions="toggleShowMissions"
      />

      <CohortGalaxies
        v-if="courses && courses.length > 0"
        ref="galaxyMap"
        :courses="courses"
        :courseEdgesMap="courseEdgesMap"
        :courseNodesMap="courseNodesMap"
        :coursesActivity="coursesActivity"
        :highlightCourse="selectedCourseId"
        :isLoadingCourses="isLoadingCourses"
        :onePerRow="true"
        :showMissions="showMissions"
        :paused="timelineInteracting"
        :showCourseTitles="false"
        :showGlow="false"
        :activeMissionsByTopicKey="activeMissionsByTopicKey"
        @courseClicked="onCourseClicked($event)"
      />

      <div v-else class="text-center">
        <p class="overline missionAccent--text">No galaxies assigned to this squad</p>
      </div>
    </div>

    <!-- Bottom Activity Timeline Panel -->
    <CohortActivityTimelinePanel
      v-if="!isLoadingCohort && cohort"
      class="activity-panel"
      :activityData="filteredCoursesActivity"
      :selectedCourseId="selectedCourseId"
      :height="activityPanelHeightPx"
      :isFullscreen="isTimelineFullscreen"
      :style="activityPanelInlineStyle"
      @panelFocus="onTimelineFocus"
      @clearCourseFilter="resetAllView"
      @toggleFullscreen="toggleTimelineFullscreen"
      @close="closeTimelinePanel"
    />
  </div>
</template>

<script>
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import CohortInfo from "@/components/CohortView/CohortInfo.vue";
import AssignedInfo from "@/components/Reused/AssignedInfo.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import GalaxyMapButtons from "@/components/GalaxyView/GalaxyMapButtons.vue";
import {
  fetchCourseByCourseId,
  fetchCourseMapEdgesAndNodesByCourseId,
  fetchCohortCoursesActivityByCohortId,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import useCohortViewStore from "@/store/cohortView";
import { mapActions, mapState } from "pinia";
import { db } from "@/store/firestoreConfig";
import CohortGalaxies from "@/components/CohortView/CohortGalaxies.vue";
import CohortActivityTimelinePanel from "@/components/CohortView/CohortActivityTimelinePanel.vue";

export default {
  name: "CohortViewV2",
  props: ["cohortId"],
  components: {
    LoadingSpinner,
    CohortInfo,
    AssignedInfo,
    BackButton,
    GalaxyMapButtons,
    CohortGalaxies,
    CohortActivityTimelinePanel,
  },
  data() {
    return {
      isLoadingCourses: false,
      courses: [],
      courseNodesMap: new Map(),
      courseEdgesMap: new Map(),
      coursesActivity: [],
      selectedCourseId: null,
      infoMinimized: false,
      showMissions: false,
      activeMissionsByTopicKey: new Map(),
      personAvatarById: new Map(),
      personNameById: new Map(),
      activityPanelHeightPx: 260,
      defaultActivityPanelHeightPx: 260,
      activityPanelOpen: false,
      timelineInteracting: false,
      isTimelineFullscreen: false,
    };
  },
  async mounted() {
    await this.loadCohort(this.cohortId);
    await this.loadCohortCoursesAndMaps();
    await this.loadCohortCoursesActivity();
    await this.loadActiveMissions();
    window.addEventListener("resize", this.onWindowResize, { passive: true });
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onWindowResize);
  },
  beforeRouteLeave(to, from, next) {
    // Reset global minimized state when navigating away from the Cohort view
    this.setMobileInfoMinimized(false);
    next();
  },
  watch: {
    async cohort(newVal, oldVal) {
      if (!newVal) return;
      const oldCourses = (oldVal?.courses ?? []).join(",");
      const newCourses = (newVal?.courses ?? []).join(",");
      if (oldCourses !== newCourses) {
        await this.loadCohortCoursesAndMaps();
        await this.loadCohortCoursesActivity();
        await this.loadActiveMissions();
      }
    },
  },
  computed: {
    ...mapState(useRootStore, ["person", "user"]),
    ...mapState(useCohortViewStore, ["isLoadingCohort", "cohort"]),
    isRestricted() {
      if (!this.cohort) return false;
      return !this.cohort.teachers?.includes(this.person?.id);
    },
    filteredCoursesActivity() {
      if (!this.selectedCourseId) return this.coursesActivity || [];
      return (this.coursesActivity || []).filter(
        (entry) => entry?.course?.id === this.selectedCourseId,
      );
    },
    hideShowMissions() {
      // Hide the Show Missions button while a galaxy is selected
      return Boolean(this.selectedCourseId);
    },
    rootCssVars() {
      // Expose panel height as a CSS var for sibling components (e.g., map buttons)
      const h = this.activityPanelOpen ? this.activityPanelHeightPx : 0;
      return { "--activity-panel-height": `${h}px` };
    },
    activityPanelInlineStyle() {
      const h = this.activityPanelHeightPx;
      return {
        bottom: this.activityPanelOpen ? "0px" : `-${h}px`,
        height: `${h}px`,
      };
    },
  },
  methods: {
    ...mapActions(useCohortViewStore, ["loadCohort"]),
    ...mapActions(useRootStore, ["setMobileInfoMinimized"]),
    onInfoMinimized(minimized) {
      this.infoMinimized = minimized;
      // Toggle global mini menu state (used by NavBar)
      this.setMobileInfoMinimized(Boolean(minimized));
    },
    async loadCohortCoursesAndMaps() {
      if (!this.cohort || !Array.isArray(this.cohort.courses)) {
        this.courses = [];
        this.courseNodesMap = new Map();
        this.courseEdgesMap = new Map();
        return;
      }

      this.isLoadingCourses = true;
      try {
        const uniqueCourseIds = [...new Set(this.cohort.courses)];

        // Fetch full course objects
        const fetchedCourses = await Promise.all(
          uniqueCourseIds.map((courseId) => fetchCourseByCourseId(courseId)),
        );

        // Fetch edges and nodes for each course
        const edgesAndNodes = await Promise.all(
          uniqueCourseIds.map((courseId) =>
            fetchCourseMapEdgesAndNodesByCourseId(courseId).then((res) => ({
              courseId,
              ...res,
            })),
          ),
        );

        const nodesMap = new Map();
        const edgesMap = new Map();
        for (const { courseId, nodes, edges } of edgesAndNodes) {
          nodesMap.set(courseId, nodes);
          edgesMap.set(courseId, edges);
        }

        this.courses = fetchedCourses;
        this.courseNodesMap = nodesMap;
        this.courseEdgesMap = edgesMap;
      } catch (e) {
        console.error("Error loading cohort courses/maps:", e);
        this.courses = [];
        this.courseNodesMap = new Map();
        this.courseEdgesMap = new Map();
      } finally {
        this.isLoadingCourses = false;
      }
    },
    async loadCohortCoursesActivity() {
      try {
        if (!this.cohort?.id) return;
        this.coursesActivity = await fetchCohortCoursesActivityByCohortId(this.cohort.id);
      } catch (e) {
        console.error("Error loading cohort courses activity:", e);
        this.coursesActivity = [];
      }
    },
    onCourseClicked(emittedPayload) {
      // Open the panel first so CSS var updates before fit()
      this.activityPanelOpen = true;
      // Force Show Missions state when a galaxy is selected
      this.showMissions = true;
      // Minimize info panels when a galaxy is selected
      this.onInfoMinimized(true);
      // Finally, set highlight to trigger fit on resized canvas
      this.selectedCourseId = emittedPayload?.courseId ?? null;
    },
    onTimelineFocus(focused) {
      this.timelineInteracting = Boolean(focused);
    },
    resetAllView() {
      // Clear selected course, show all timeline groups, and zoom out galaxies
      this.selectedCourseId = null;
      // CohortGalaxies listens to highlightCourse and will zoom out on null
      // Restore Show Missions toggle/button
      this.showMissions = false;
    },
    closeTimelinePanel() {
      // Close panel and reset view/zoom
      this.activityPanelOpen = false;
      // Exit fullscreen and restore default height
      this.isTimelineFullscreen = false;
      this.activityPanelHeightPx = this.defaultActivityPanelHeightPx;
      this.resetAllView();
    },
    toggleShowMissions() {
      this.showMissions = !this.showMissions;
    },
    toggleTimelineFullscreen() {
      this.activityPanelOpen = true;
      this.isTimelineFullscreen = !this.isTimelineFullscreen;
      if (this.isTimelineFullscreen) {
        this.activityPanelHeightPx = this.computeFullscreenHeight();
        // Minimize side info to give maximum space
        this.onInfoMinimized(true);
      } else {
        this.activityPanelHeightPx = this.defaultActivityPanelHeightPx;
      }
    },
    onWindowResize() {
      if (this.isTimelineFullscreen) {
        this.activityPanelHeightPx = this.computeFullscreenHeight();
      }
    },
    computeFullscreenHeight() {
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      return Math.max(vh, this.defaultActivityPanelHeightPx);
    },
    async loadActiveMissions() {
      try {
        this.activeMissionsByTopicKey = new Map();

        if (
          !this.cohort ||
          !Array.isArray(this.cohort.students) ||
          this.cohort.students.length === 0
        ) {
          return;
        }
        const uniqueCourseIds = [...new Set(this.cohort.courses || [])];
        if (uniqueCourseIds.length === 0) return;

        // Fetch avatars for cohort students
        const personDocs = await Promise.all(
          this.cohort.students.map((personId) => db.collection("people").doc(personId).get()),
        );
        for (const snap of personDocs) {
          if (snap.exists) {
            const data = snap.data();
            this.personAvatarById.set(snap.id, data?.image?.url || null);
            const nameField =
              data?.displayName ||
              data?.name ||
              [data?.firstName, data?.lastName].filter(Boolean).join(" ") ||
              null;
            this.personNameById.set(snap.id, nameField);
          }
        }

        // Build fetch jobs for active tasks per student/topic
        const jobs = [];
        for (const courseId of uniqueCourseIds) {
          const nodes = this.courseNodesMap.get(courseId) || [];
          for (const node of nodes) {
            const topicId = node?.id;
            if (!topicId) continue;
            for (const personId of this.cohort.students) {
              jobs.push(
                db
                  .collection("people")
                  .doc(personId)
                  .collection(courseId)
                  .doc(topicId)
                  .collection("tasks")
                  .where("taskStatus", "==", "active")
                  .limit(1)
                  .get()
                  .then((q) => ({ personId, courseId, topicId, docs: q.docs }))
                  .catch(() => ({ personId, courseId, topicId, docs: [] })),
              );
            }
          }
        }

        const results = await Promise.all(jobs);
        for (const res of results) {
          const { personId, courseId, topicId, docs } = res;
          if (!docs || docs.length === 0) continue;
          const taskData = docs[0].data();
          const taskName = taskData?.name || taskData?.title || null;
          const orderIndex = taskData?.orderIndex ?? null;
          const avatarUrl = this.personAvatarById.get(personId) || null;
          const name = this.personNameById.get(personId) || null;
          const key = `${courseId}:${topicId}`;
          const arr = this.activeMissionsByTopicKey.get(key) || [];
          // Deduplicate by personId for this course/topic
          const existingIndex = arr.findIndex((x) => x.personId === personId);
          const payload = { personId, avatarUrl, name, taskName, orderIndex };
          if (existingIndex >= 0) arr[existingIndex] = payload;
          else arr.push(payload);
          this.activeMissionsByTopicKey.set(key, arr);
        }
      } catch (e) {
        console.error("Error loading active missions:", e);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
}

.fullHeight {
  height: 100vh; /* Fallback */
  height: calc(var(--vh, 1vh) * 100);
  overflow: hidden;
}

.flexContainer {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;

  // &.minimized {
  //   z-index: 1;
  // }
}

#left-section {
  position: absolute;
  top: 0;
  left: 50px;
  height: 100%;
  width: 15%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  overflow-y: auto;
  // padding: 50px 0px;
  padding-right: 20px;
  // z-index: 3;

  &.minimized {
    /* Keep container interactive so specific children can be clickable */
    pointer-events: auto;

    /* Disable pointer events for children by default, except the ribbon wrapper */
    > *:not(.cohort-info-wrapper) {
      pointer-events: none;
    }
  }
}

.cohort-info-wrapper {
  width: 100%;
  transition: all 0.3s ease-in-out;
  position: relative;

  &.minimized {
    position: fixed;
    top: -10px; // show just the ribbon peeking from top
    left: 0;
    z-index: 200; // ensure above galaxies canvas
    /* Re-enable pointer events so the ribbon is clickable */
    pointer-events: auto;
    width: 200px; // keep a sensible width for ribbon click area
  }
}

.back-button-fixed {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 10;
  width: auto;
}

/* Place Galaxy Map buttons above the activity panel in this view */
.with-activity-panel {
  // bump the bottom-fixed galaxy buttons up by the panel height
  ::v-deep .map-buttons-bottom {
    bottom: calc(20px + var(--activity-panel-height, 260px));
  }
}

/* Bottom activity panel container */
.activity-panel {
  position: fixed;
  left: 50%;
  bottom: calc(-1 * var(--activity-panel-height, 0px));
  transform: translateX(-50%);
  height: var(--activity-panel-height, 0px);
  width: 100vw;
  z-index: 3; /* above galaxies canvas, below any modals */
  transition: all 0.3s ease-in-out;
}

/* width */
::-webkit-scrollbar {
  width: 1px;
}

/* Track */
::-webkit-scrollbar-track {
  background: var(--v-background-base);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--v-background-base);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--v-background-base);
}
</style>
