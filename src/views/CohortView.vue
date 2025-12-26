<template>
  <div id="container" class="bg">
    <LoadingSpinner v-if="isLoadingCohort" text="loading squad" />

    <!-- Restricted access message -->
    <div class="no-cohort" v-if="isRestricted">
      <v-icon large color="missionAccent">{{ mdiAlertOutline }}</v-icon>
      <p class="overline missionAccent--text">INVALID OR RESTRICTED SQUAD</p>
      <p class="caption missionAccent--text" style="opacity: 0.5">
        Check you have the correct ID,<br />or you may need to be signed-in
      </p>
      <BackButton :toPath="'/squads'" />
    </div>

    <div v-else class="cohort-container">
      <div id="left-section" :class="{ minimized: infoMinimized }">
        <div class="cohort-info-wrapper" :class="{ minimized: infoMinimized }">
          <CohortInfo
            v-if="!isLoadingCohort && cohort"
            :cohort="cohort"
            :minimized="infoMinimized"
            @minimised="onInfoMinimized"
          />
        </div>
        <BackButton
          v-if="!isLoadingCohort"
          :toPath="'/squads'"
          :class="infoMinimized ? 'back-button-fixed' : 'mt-2'"
        />
        <AssignedInfo
          v-if="!isLoadingCohort && cohort"
          v-show="!infoMinimized"
          :cohort="cohort"
          assignCourses="true"
        />
      </div>

      <div id="main-section">
        <!-- loading spinner -->
        <div class="d-flex justify-center align-center" v-if="isLoadingCohort">
          <v-btn
            :loading="isLoadingCohort"
            icon
            color="missionAccent"
            class="d-flex justify-center align-center"
          ></v-btn>
        </div>

        <!-- SQUAD FRAME -->
        <div
          v-if="cohort"
          class="people-frame"
          :class="{ 'premium-locked': isPremiumFeatureRestricted && activeTab === 'navigators' }"
        >
          <!-- Navigators TAB -->
          <div class="people-border">
            <div :class="peopleLabel" @click="setActiveTab('navigators')">
              <span class="pl-3">NAVIGATORS</span>
            </div>
          </div>

          <!-- Overview TAB (commented out) -->
          <!--
          <div class="graph-border">
            <div :class="graphLabel" class="text-center" @click="setActiveTab('overview')">
              <span class="pl-3">OVERVIEW</span>
            </div>
          </div>
          -->

          <!-- Status Report TAB (commented out) -->
          <!--
          <div class="report-border">
            <div :class="reportLabel" @click="setActiveTab('status')">
              <span class="pl-3">STATUS REPORT</span>
            </div>
          </div>
          -->

          <!-- Maps TAB -->
          <div class="maps-border" :class="{ 'premium-disabled': isPremiumFeatureRestricted }">
            <div
              :class="mapsLabel"
              class="text-center"
              @click="!isPremiumFeatureRestricted && setActiveTab('maps')"
            >
              <span class="pl-3">MAPS</span>
            </div>
          </div>

          <!-- Timeline TAB -->
          <div class="timeline-border" :class="{ 'premium-disabled': isPremiumFeatureRestricted }">
            <div
              :class="timelineLabel"
              @click="!isPremiumFeatureRestricted && setActiveTab('timeline')"
            >
              <span class="pl-3">TIMELINE</span>
            </div>
          </div>

          <!-- Status Report (commented out) -->
          <!--
          <StatusReportPanel
            v-if="activeTab === 'status'"
            class="mt-4"
            :cohort="cohort"
            :cohortsCoursesData="cohortsCoursesData"
          />
          -->

          <!-- Navigators -->
          <div class="premium-feature-wrapper">
            <StudentDataIterator
              v-show="activeTab === 'navigators'"
              class="mt-4 premium-content"
              :class="{ 'premium-blurred': isPremiumFeatureRestricted }"
              :cohort="cohort"
              :cohortsCoursesData="cohortsCoursesData"
              @learnerOverviewDialogClosed="refreshComponents"
            />
          </div>
          <!-- Overlay positioned relative to people-frame, not wrapper -->
          <div
            v-if="isPremiumFeatureRestricted && activeTab === 'navigators' && !paywall.show"
            class="premium-overlay"
          >
            <div class="premium-message overline">
              <p class="mb-2">Premium feature</p>
              <p class="mb-0">
                Please
                <a href="#" @click.prevent="handleUpgradeClick" class="upgrade-link">upgrade</a>
                to access this feature
              </p>
            </div>
          </div>

          <!-- Maps View -->
          <div
            v-show="activeTab === 'maps'"
            class="galaxies-container"
            :class="{ fullscreen: isGalaxiesFullscreen }"
          >
            <v-btn
              icon
              small
              class="fullscreen-toggle"
              style="right: 44px"
              color="missionAccent"
              @click="togglePlanetsAnimation"
              :title="showMissions ? 'Hide missions' : 'Show missions'"
            >
              <v-icon small>{{ showMissions ? mdiEarthOff : mdiEarth }}</v-icon>
            </v-btn>
            <v-btn
              icon
              small
              class="fullscreen-toggle"
              color="missionAccent"
              @click="toggleGalaxiesFullscreen"
            >
              <v-icon small>{{ isGalaxiesFullscreen ? mdiFullscreenExit : mdiFullscreen }}</v-icon>
            </v-btn>

            <CohortGalaxies
              ref="galaxyMap"
              class="mt-4"
              :courses="coursesFull"
              :courseEdgesMap="courseEdgesMap"
              :courseNodesMap="courseNodesMap"
              :coursesActivity="cohortsCoursesData"
              :highlightCourse="selectedCourseId"
              :isLoadingCourses="isLoadingCourses"
              :onePerRow="true"
              :showMissions="showMissions"
              :paused="false"
              :showCourseTitles="false"
              :showGlow="false"
              :activeMissionsByTopicKey="activeMissionsByTopicKey"
              :isLoadingActiveMissions="isLoadingActiveMissions"
              @courseClicked="onCourseClicked"
            />
          </div>

          <!-- Timeline View -->
          <div
            v-show="activeTab === 'timeline'"
            class="timeline-container-wrap"
            :class="{ fullscreen: isTimelineFullscreen }"
          >
            <CohortActivityTimelinePanel
              class="mt-4"
              :activityData="cohortsCoursesData"
              :selectedCourseId="selectedCourseId"
              :isFullscreen="isTimelineFullscreen"
              @toggleFullscreen="isTimelineFullscreen = !isTimelineFullscreen"
              @close="/* close hidden per request */ null"
            />
          </div>

          <!-- Overview (commented out) -->
          <!--
          <CohortGraphs v-else :cohort="cohort" :cohortsCoursesData="cohortsCoursesData" />
          -->
        </div>
      </div>

      <div id="right-section">
        <RequestForHelpTeacherFrame
          v-if="cohort"
          :key="refreshRequests"
          :isTeacher="teacher"
          :courses="courses"
          :students="students"
          :isPremiumRestricted="isPremiumFeatureRestricted"
        />
        <SubmissionTeacherFrame
          v-if="cohort && teacher"
          :key="refreshSubmissions"
          :isTeacher="teacher"
          :courses="courses"
          :students="students"
          class="mt-4"
          :isPremiumRestricted="isPremiumFeatureRestricted"
        />
        <!-- Completed Separate -->
        <!-- <p class="baseAccent--text completed-label ma-0 py-6">COMPLETED</p>
        <RequestForHelpTeacherFrame
          :isTeacher="teacher"
          :courses="courses"
          :students="cohort.students"
          :completedRequestsOnly="true"
          class="mt-0"
        />
        <SubmissionTeacherFrame
          v-if="teacher"
          :isTeacher="teacher"
          :courses="courses"
          :students="cohort.students"
          :completedSubmissionsOnly="true"
          class="mt-4"
        /> -->
      </div>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import CohortInfo from "@/components/CohortView/CohortInfo.vue";
import AssignedInfo from "@/components/Reused/AssignedInfo.vue";
import StudentDataIterator from "@/components/CohortView/StudentDataIterator.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import RequestForHelpTeacherFrame from "@/components/Reused/RequestForHelpTeacherFrame.vue";
import SubmissionTeacherFrame from "@/components/Reused/SubmissionTeacherFrame.vue";
import CohortGraphs from "@/components/CohortView/CohortGraphs.vue";
import StatusReportPanel from "@/components/CohortView/StatusReportPanel.vue";
import CohortGalaxies from "@/components/CohortView/CohortGalaxies.vue";
import CohortActivityTimelinePanel from "@/components/CohortView/CohortActivityTimelinePanel.vue";
import {
  fetchCohortCoursesActivityByCohortId,
  fetchCourseByCourseId,
  fetchCourseMapEdgesAndNodesByCourseId,
} from "@/lib/ff";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import useCohortViewStore from "@/store/cohortView";
import { mapActions, mapState } from "pinia";
import { mdiAlertOutline, mdiFullscreen, mdiFullscreenExit, mdiEarth, mdiEarthOff } from "@mdi/js";

export default {
  name: "CohortView",
  props: ["cohortId"],
  components: {
    LoadingSpinner,
    CohortInfo,
    AssignedInfo,
    BackButton,
    StudentDataIterator,
    RequestForHelpTeacherFrame,
    SubmissionTeacherFrame,
    CohortGraphs,
    StatusReportPanel,
    CohortGalaxies,
    CohortActivityTimelinePanel,
  },
  data() {
    return {
      mdiAlertOutline,
      mdiFullscreen,
      mdiFullscreenExit,
      mdiEarth,
      mdiEarthOff,
      cohortsCoursesData: [],
      refreshSubmissions: 0, // TODO: Is this needed? is causing duplicate error
      refreshRequests: 0,
      infoMinimized: false,
      // Maps data
      isLoadingCourses: false,
      coursesFull: [],
      courseNodesMap: new Map(),
      courseEdgesMap: new Map(),
      selectedCourseId: null,
      showMissions: true,
      pausedPlanets: false,
      activeMissionsByTopicKey: new Map(),
      personAvatarById: new Map(),
      personNameById: new Map(),
      isGalaxiesFullscreen: false,
      isTimelineFullscreen: false,
      isLoadingActiveMissions: false,
    };
  },
  async mounted() {
    await this.loadCohort(this.cohortId);

    // ==== get cohort course data from LRS
    this.cohortsCoursesData = await fetchCohortCoursesActivityByCohortId(this.cohort.id);
    console.log("cohortsCoursesData", this.cohortsCoursesData);
    // Load maps data for new Maps tab
    // Only fetch maps if not already cached
    if (
      !this.coursesFull?.length ||
      this.courseNodesMap.size === 0 ||
      this.courseEdgesMap.size === 0
    )
      await this.loadCohortCoursesAndMaps();
    // Load active missions for avatars next to planets
    await this.loadActiveMissions();
    // Force CohortGalaxies to rebuild planets and redraw after data loads
    this.$nextTick(() => {
      try {
        const g = this.$refs.galaxyMap;
        // Ensure tasks are loaded before building planets
        if (g && typeof g.loadCohortTasks === "function") {
          g.loadCohortTasks().then(() => {
            if (typeof g.buildPlanetsForAllNodes === "function") g.buildPlanetsForAllNodes();
            if (g.$refs && g.$refs.network && typeof g.$refs.network.redraw === "function")
              g.$refs.network.redraw();
          });
        } else if (g && typeof g.buildPlanetsForAllNodes === "function") {
          g.buildPlanetsForAllNodes();
          if (g.$refs && g.$refs.network && typeof g.$refs.network.redraw === "function")
            g.$refs.network.redraw();
        }
      } catch (_) {}
    });
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId", "person", "userStatus", "user", "paywall"]),
    ...mapState(useCohortViewStore, ["studentsView", "isLoadingCohort", "cohort", "activeTab"]),
    ready() {
      return this.cohortId === this.currentCohortId && this.cohort != null;
    },
    courses() {
      if (!this.cohort?.courses) return [];
      // Use Set to ensure unique course IDs, then map to objects
      const uniqueCourseIds = [...new Set(this.cohort.courses)];
      return uniqueCourseIds.map((courseId) => {
        return { id: courseId };
      });
    },
    students() {
      if (!this.cohort?.students) return [];
      // Use Set to ensure unique student IDs
      return [...new Set(this.cohort.students)];
    },
    teacher() {
      return this.cohort.teachers.includes(this.person.id);
    },
    reportLabel() {
      return this.activeTab === "status" ? "report-label" : "inactive-report-label";
    },
    peopleLabel() {
      return this.activeTab === "navigators" ? "people-label" : "inactive-people-label";
    },
    graphLabel() {
      return this.activeTab === "overview" ? "graph-label" : "inactive-graph-label";
    },
    mapsLabel() {
      return this.activeTab === "maps" ? "maps-label" : "inactive-maps-label";
    },
    timelineLabel() {
      return this.activeTab === "timeline" ? "timeline-label" : "inactive-timeline-label";
    },
    isRestricted() {
      // If no cohort is loaded yet, don't show restricted message
      if (!this.cohort) return false;

      // Check if person is a teacher of this cohort
      return !this.cohort.teachers.includes(this.person?.id);
    },
    hasActiveSubscription() {
      return Boolean(this.user?.data?.hasActiveSubscription);
    },
    isPremiumFeatureRestricted() {
      // Show paywall if user doesn't have active subscription
      return !this.hasActiveSubscription;
    },
  },
  methods: {
    ...mapActions(useCohortViewStore, ["loadCohort", "setStudentsView", "setActiveTab"]),
    ...mapActions(useRootStore, ["setMobileInfoMinimized", "setPaywall"]),
    // hack to update TeacherFrames. (this is because LearnerOveriewDashboard uses the same
    // components and when you close the dialog, the cohortview teacher frames are empty. issue#121)
    refreshComponents() {
      this.refreshSubmissions++;
      this.refreshRequests++;
    },
    onInfoMinimized(minimized) {
      this.infoMinimized = minimized;
      // Only propagate minimized=true to global state; avoid expanding Navbar/Userbar on expand
      if (minimized) this.setMobileInfoMinimized(true);
    },
    async loadCohortCoursesAndMaps() {
      try {
        if (!this.cohort || !Array.isArray(this.cohort.courses)) {
          this.coursesFull = [];
          this.courseNodesMap = new Map();
          this.courseEdgesMap = new Map();
          return;
        }
        if (this.coursesFull?.length && this.courseNodesMap.size && this.courseEdgesMap.size) {
          // already cached
          return;
        }
        this.isLoadingCourses = true;
        const uniqueCourseIds = [...new Set(this.cohort.courses)];
        // Fetch full course objects
        const fetchedCourses = await Promise.all(
          uniqueCourseIds.map((courseId) => fetchCourseByCourseId(courseId)),
        );
        // Fetch edges and nodes for each course
        const edgesAndNodes = await Promise.all(
          uniqueCourseIds.map((courseId) =>
            fetchCourseMapEdgesAndNodesByCourseId(courseId).then((res) => ({ courseId, ...res })),
          ),
        );
        const nodesMap = new Map();
        const edgesMap = new Map();
        for (const { courseId, nodes, edges } of edgesAndNodes) {
          nodesMap.set(courseId, nodes);
          edgesMap.set(courseId, edges);
        }
        this.coursesFull = fetchedCourses;
        this.courseNodesMap = nodesMap;
        this.courseEdgesMap = edgesMap;
        // Ensure planets are built once maps are ready
        this.$nextTick(() => {
          try {
            const g = this.$refs.galaxyMap;
            if (g && typeof g.refreshAllNodesAndEdgesToDisplay === "function")
              g.refreshAllNodesAndEdgesToDisplay(true);
            if (g && typeof g.loadCohortTasks === "function") {
              g.loadCohortTasks().then(() => {
                if (typeof g.buildPlanetsForAllNodes === "function") g.buildPlanetsForAllNodes();
                if (g.$refs && g.$refs.network && typeof g.$refs.network.redraw === "function")
                  g.$refs.network.redraw();
              });
            } else {
              if (g && typeof g.buildPlanetsForAllNodes === "function") g.buildPlanetsForAllNodes();
              if (g && g.$refs && g.$refs.network && typeof g.$refs.network.redraw === "function")
                g.$refs.network.redraw();
            }
          } catch (_) {}
        });
      } catch (e) {
        console.error("Error loading cohort courses/maps:", e);
        this.coursesFull = [];
        this.courseNodesMap = new Map();
        this.courseEdgesMap = new Map();
      } finally {
        this.isLoadingCourses = false;
      }
    },
    onCourseClicked(payload) {
      this.selectedCourseId = payload?.courseId ?? null;
      this.showMissions = true;
      // rebuild on-demand when returning to maps
      this.$nextTick(() => {
        try {
          const g = this.$refs.galaxyMap;
          if (!g) return;
          if (typeof g.loadCohortTasks === "function") {
            g.loadCohortTasks().then(() => {
              if (typeof g.buildPlanetsForAllNodes === "function") g.buildPlanetsForAllNodes();
              if (g.$refs && g.$refs.network && typeof g.$refs.network.redraw === "function")
                g.$refs.network.redraw();
            });
          }
        } catch (_) {}
      });
    },
    toggleGalaxiesFullscreen() {
      this.isGalaxiesFullscreen = !this.isGalaxiesFullscreen;
      this.$nextTick(() => {
        try {
          const g = this.$refs.galaxyMap;
          if (g && g.$refs && g.$refs.network && typeof g.$refs.network.redraw === "function")
            g.$refs.network.redraw();
        } catch (_) {}
      });
    },
    togglePlanetsAnimation() {
      this.showMissions = !this.showMissions;
      this.$nextTick(() => {
        try {
          const g = this.$refs.galaxyMap;
          if (!g) return;
          // Ensure animation loop is running so orbits can update after toggle
          if (typeof g.startNodeAnimation === "function") g.startNodeAnimation();
          if (g.$refs && g.$refs.network && typeof g.$refs.network.redraw === "function")
            g.$refs.network.redraw();
        } catch (_) {}
      });
    },
    async loadActiveMissions() {
      try {
        this.isLoadingActiveMissions = true;
        this.activeMissionsByTopicKey = new Map();
        if (
          !this.cohort ||
          !Array.isArray(this.cohort.students) ||
          this.cohort.students.length === 0
        )
          return;
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
      } finally {
        this.isLoadingActiveMissions = false;
      }
    },
    handleUpgradeClick() {
      this.setPaywall({
        show: true,
        text: "A Galaxy Maps subscription is required to see Squad data.",
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.searchInput >>> .v-text-field__slot input {
  color: var(--v-missionAccent-base);
}

.bg {
  background: var(--v-background-base);
}

#container {
  height: 100vh;
  width: 100%;
  display: flex;
  overflow: hidden;
  margin: 0 !important;

  .no-cohort {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .cohort-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

#left-section {
  width: 15%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  overflow-y: auto;
  padding: 50px 0px;
  margin-left: 5%;
  // margin-left: 2.5%;
  padding-right: 20px;

  &.minimized {
    /* Keep container interactive so specific children can be clickable */
    pointer-events: auto;

    /* Disable pointer events for children by default, except the ribbon wrapper */
    > *:not(.cohort-info-wrapper) {
      pointer-events: none;
    }
  }
}

#main-section {
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  padding-top: 50px;
  margin: 0px 5%;
  transition: all 0.2s ease-in-out;

  .people-frame {
    position: relative;
    width: 100%;
    margin: 30px 20px;
    height: 90%;
    // margin: 30px 20px;
    border: 1px solid var(--v-missionAccent-base);
    overflow: auto;

    /* Disable scroll when premium is restricted */
    &.premium-locked {
      overflow: hidden;
    }

    .people-border {
      // ribbon label
      position: absolute;
      top: -1px;
      left: -1px;
      background-color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      cursor: pointer;
      width: 120px;
      height: 22px;
      z-index: 310;
    }

    .people-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      -webkit-clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      cursor: pointer;
      width: 116px;
      height: 20px;
    }

    .inactive-people-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-background-base);
      color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      -webkit-clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
      cursor: pointer;
      width: 116px;
      height: 20px;
    }
    .graph-border {
      // ribbon label
      position: absolute;
      top: -1px;
      left: 120px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 120px;
      height: 22px;
      z-index: 310;
    }
    .graph-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 120px;
      height: 22px;
    }

    .inactive-graph-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-background-base);
      color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 116px;
      height: 20px;
    }

    .report-border {
      position: absolute;
      top: -1px;
      left: 240px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 150px;
      height: 22px;
      z-index: 310;
    }
    .report-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 150px;
      height: 20px;
    }
    .inactive-report-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-background-base);
      color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 146px;
      height: 20px;
    }

    /* Maps tab styling (mirrors Overview) */
    .maps-border {
      position: absolute;
      top: -1px;
      left: 120px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 120px;
      height: 22px;
      z-index: 310;
    }
    .maps-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 120px;
      height: 22px;
    }
    .inactive-maps-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-background-base);
      color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 116px;
      height: 20px;
    }

    /* Timeline tab styling (mirrors Status Report) */
    .timeline-border {
      position: absolute;
      top: -1px;
      left: 240px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 150px;
      height: 22px;
      z-index: 310;
    }
    .timeline-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 150px;
      height: 20px;
    }
    .inactive-timeline-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      position: relative;
      top: 1px;
      left: -3px;
      background-color: var(--v-background-base);
      color: var(--v-missionAccent-base);
      padding: 0px 30px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
      cursor: pointer;
      width: 146px;
      height: 20px;
    }

    /* Disabled state for premium-restricted tabs */
    .premium-disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
      pointer-events: none;

      .maps-label,
      .inactive-maps-label,
      .timeline-label,
      .inactive-timeline-label {
        cursor: not-allowed !important;
        pointer-events: none;
        opacity: 0.5;
      }
    }
  }
}

.galaxies-container {
  position: relative;
  width: 100%;
  height: 100%;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    z-index: 400; /* above tab ribbons */
    background: var(--v-background-base);
    padding: 0;
    margin: 0;
  }

  .fullscreen-toggle {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 320; /* above ribbons and canvas */
  }
}

.timeline-container-wrap {
  position: relative;
  width: 100%;
  height: 100%;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    z-index: 400; /* above tab ribbons to fully cover */
    background: var(--v-background-base);
    padding: 0;
    margin: 0;
    /* Remove outer margins and ensure inner panel fills viewport */
    .mt-4 {
      margin-top: 0 !important;
    }
    .cohort-activity-panel {
      height: 100vh !important;
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

#right-section {
  width: 15%;
  height: 84%;
  // padding-top: 50px;
  // margin-right: 35px;
  margin-right: 5%;
  overflow-y: auto;

  .completed-label {
    font-weight: 500;
    letter-spacing: 0.05rem;
    font-size: 0.8rem;
    text-align: center;
  }
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

/* Premium feature paywall styles */
.premium-feature-wrapper {
  position: relative;
  width: 100%;
  /* Ensure wrapper takes up space but overlay can cover it */
  min-height: 400px;

  .premium-content {
    transition: filter 0.3s ease-in-out;
    position: relative;
    z-index: 1;
    width: 100%;

    &.premium-blurred {
      filter: blur(4px);
      pointer-events: none;
      user-select: none;
    }
  }
}

/* Overlay scoped to people-frame container only */
.people-frame .premium-overlay {
  position: absolute; /* Relative to people-frame container */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center; /* Vertically centered */
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 150; /* Lower than v-dialog (typically 200+) but above content */
  pointer-events: auto;
}

/* Frame-specific styles - keep borders and labels visible */
.premium-frame-wrapper {
  position: relative;

  /* Apply blur to component */
  ::v-deep .premium-blurred {
    filter: blur(4px);
    -webkit-filter: blur(4px);
    pointer-events: none;
    user-select: none;
    position: relative;
    z-index: 1;
  }

  /* Keep labels visible - use high z-index and try to escape blur */
  ::v-deep .premium-blurred h2.help-label,
  ::v-deep .premium-blurred h2.submission-label {
    filter: blur(0) !important;
    -webkit-filter: blur(0) !important;
    pointer-events: auto;
    z-index: 1001; /* Above overlay */
    position: absolute;
    /* Try to escape blur context */
    transform: translateZ(0);
    will-change: transform;
  }

  /* Overlay positioning for frames - includes border recreation */
  .premium-frame-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 1000; /* Above blurred content */
    pointer-events: auto;
    /* Recreate border on overlay for visibility */
    box-shadow: inset 0 0 0 1px var(--v-galaxyAccent-base);
  }

  /* Submission frame overlay border color */
  &:nth-child(2) .premium-frame-overlay {
    box-shadow: inset 0 0 0 1px var(--v-cohortAccent-base);
  }
}

.premium-message {
  background-color: var(--v-background-base);
  // border: 1px solid var(--v-missionAccent-base);
  padding: 30px 40px;
  text-align: center;
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;

  p {
    margin: 0;
  }

  .upgrade-link {
    color: var(--v-missionAccent-base);
    text-decoration: underline;
    cursor: pointer;
    font-weight: 600;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
