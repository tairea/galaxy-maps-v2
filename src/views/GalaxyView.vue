<template>
  <div id="container" class="bg">
    <!-- <div class="left-section" :class="{ hide: hideLeftPanelsFlag }"> -->
    <div class="left-section" data-v-step="1">
      <GalaxyInfo :course="course" :teacher="teacher" :draft="draft" />
      <PublishGalaxy v-if="showPublish" :course="course" :courseTasks="courseTasks" />
      <BackButton :toPath="'/'" />
      <AssignedInfo
        v-if="!draft && cohortsInCourse.length && teacher"
        :assignCohorts="true"
        :people="peopleInCourse"
        :cohorts="cohortsInCourse"
        :teacher="teacher"
      />
    </div>
    <div id="main-section">
      <!-- Map Buttons -->
      <GalaxyMapButtons
        class="mt-8"
        :class="{ hideButtons: hideLeftPanelsFlag }"
        v-if="teacher"
        :addNodeMode="addNodeMode"
        :addEdgeMode="addEdgeMode"
        :dragNodeMode="dragNodeMode"
        :uiMessage="uiMessage ? uiMessage : ''"
        :changeInPositions="changeInPositions"
        :nodePositionsChangeLoading="nodePositionsChangeLoading"
        @toggleAddNodeMode="toggleAddNodeMode"
        @toggleAddEdgeMode="toggleAddEdgeMode"
        @toggleDragNodeMode="toggleDragNodeMode"
        @addNode="showAddDialog"
        @saveNodePositions="saveNodePositions"
      />

      <!-- ===== Galaxy Map ===== -->
      <GalaxyMap
        ref="vis"
        @add-node="showAddDialog"
        @edit-node="showEditDialog"
        @setUiMessage="setUiMessage"
        @drag-coords="updateDragCoords"
        @selected="selected"
        @selectedEdge="selectedEdge"
        @deselected="deselect"
        @blurNode="blurNode"
        @centerFocus="centerFocus"
        @nodePositionsChanged="nodePositionsChanged"
        @nodePositionsChangeLoading="nodePositionsChangeLoading = true"
        @nodePositionsChangeSaved="nodePositionsChangeSaved"
        @toggleAddEdgeMode="toggleAddEdgeMode"
        @hideLeftPanels="hideLeftPanels"
        @topicClicked="topicClicked($event)"
        @courseTasks="emittedCourseTasks($event)"
        @galaxyCompleted="galaxyCompleted"
      />
      <!--  @hoverNode="hovered" -->
    </div>
    <!--==== Right section ====-->
    <div v-if="!cohortsInCourse" id="right-section">
      <RequestForHelpTeacherFrame
        :courses="[course]"
        :isTeacher="teacher"
        :students="peopleInCourse"
      />
      <SubmissionTeacherFrame
        v-if="teacher"
        :courses="[course]"
        :students="peopleInCourse"
        class="mt-4"
      />
    </div>
    <!-- Edit -->
    <CreateEditDeleteNodeDialog
      v-if="dialog"
      ref="edit"
      :dialog="dialog"
      :dialogTitle="dialogTitle"
      :dialogDescription="dialogDescription"
      :editing="editing"
      :course="course"
      :currentNode="currentNode"
      @closeDialog="closeDialog"
      @openDialog="openDialog"
    />

    <!-- POPUP OUT PANEL (for system preview)-->
    <SolarSystemInfoPanel
      :selectedTopic="clickedTopic"
      :tasks="topicTasks"
      @closeInfoPanel="closeInfoPanel"
      @editNode="showEditDialog"
    />
    <!-- POPUP OUT PANEL (for system preview)-->
    <EdgeInfoPanel
      v-if="teacher"
      :courseId="courseId"
      :selectedEdge="currentEdge"
      @closeInfoPanel="closeInfoPanel"
    />

    <!-- Galaxy Completed Popup -->
    <v-dialog transition="dialog-bottom-transition" max-width="600" :value="galaxyCompletedDialog">
      <template v-slot:default="dialog">
        <v-card style="border: 1px solid var(--v-baseAccent-base)">
          <v-toolbar color="baseAccent overline" light>congratulations</v-toolbar>
          <v-card-text class="pa-0">
            <div class="overline text-center pa-12 baseAccent--text">
              You have completed this Galaxy Map
            </div>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn text @click="dialog.value = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>

    <!-- Vue Tour -->
    <v-tour name="myTour" :steps="steps"></v-tour>
  </div>
</template>

<script>
import GalaxyInfo from "@/components/GalaxyView/GalaxyInfo.vue";
import PublishGalaxy from "@/components/GalaxyView/PublishGalaxy.vue";
import AssignedInfo from "@/components/Reused/AssignedInfo.vue";
import BackButton from "@/components/Reused/BackButton.vue";

import GalaxyMap from "@/components/GalaxyView/GalaxyMap.vue";
import GalaxyMapButtons from "@/components/GalaxyView/GalaxyMapButtons.vue";

import CreateEditDeleteNodeDialog from "@/components/Dialogs/CreateEditDeleteNodeDialog.vue";

import SolarSystemInfoPanel from "@/components/GalaxyView/SolarSystemInfoPanel.vue";
import EdgeInfoPanel from "@/components/GalaxyView/EdgeInfoPanel.vue";

import RequestForHelpTeacherFrame from "@/components/Reused/RequestForHelpTeacherFrame.vue";
import SubmissionTeacherFrame from "@/components/Reused/SubmissionTeacherFrame.vue";

import confetti from "canvas-confetti";
import {
  fetchAllPeopleInCourseByCourseId,
  fetchAllCohortsInCourseByCourseId,
  fetchCohorts,
  fetchCourseByCourseId,
  fetchPersonByPersonId,
  fetchTopicByCourseIdTopicId,
} from "@/lib/ff";
import firebase from "firebase/compat/app";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
import { loggedIntoGalaxyXAPIStatement } from "@/lib/veracityLRS";

export default {
  name: "GalaxyView",
  components: {
    GalaxyInfo,
    AssignedInfo,
    GalaxyMap,
    BackButton,
    CreateEditDeleteNodeDialog,
    GalaxyMapButtons,
    PublishGalaxy,
    RequestForHelpTeacherFrame,
    SubmissionTeacherFrame,
    SolarSystemInfoPanel,
    EdgeInfoPanel,
  },
  props: ["courseId"],
  data() {
    return {
      steps: [
        {
          target: '[data-v-step="1"]',
          content: "Open this panel to view a list of Maps",
          params: {
            placement: "right",
          },
        },
      ],
      addNodeMode: false,
      addEdgeMode: false,
      dragNodeMode: false,
      uiMessage: "",
      coords: {},
      changeInPositions: false,
      nodePositionsChangeLoading: false,
      fromCreate: this.$route.params.fromCreate,
      courseTitle: this.$route.params.courseTitle,
      infoPopupShow: false,
      infoPopupPosition: {},
      centerFocusPosition: false,
      type: "",
      currentNode: null,
      currentEdge: null,
      hoverPopup: false,
      hoverNode: false,
      dialog: false,
      dialogTitle: "",
      dialogDescription: "",
      editing: false,
      moveNodes: false,
      peopleInCourse: [],
      cohortsInCourse: [],
      selectedNode: {},
      hideLeftPanelsFlag: false,
      clickedTopicId: null,
      clickedTopic: null,
      courseTasks: [],
      topicTasks: [],
      galaxyCompletedDialog: false,
      course: null,
      xpPointsForThisGalaxy: 2000,
    };
  },
  watch: {
    async courseId(newCourseId) {
      this.course = await fetchCourseByCourseId(newCourseId);
      this.setCurrentCourseId(newCourseId);
    },
    async course(newVal, oldVal) {
      this.cohortsInCourse = await fetchAllCohortsInCourseByCourseId(this.courseId);
    },
  },
  async mounted() {
    this.course = await fetchCourseByCourseId(this.courseId);
    this.setCurrentCourseId(this.courseId);
    console.log("is course? : ", this.course);
    console.log("is teacher? : ", this.teacher);

    // bind assigned people in this course
    if (this.teacher) {
      this.peopleInCourse = await fetchAllPeopleInCourseByCourseId(this.courseId);
      this.setPeopleInCourse(this.peopleInCourse);
      this.cohortsInCourse = await fetchAllCohortsInCourseByCourseId(this.courseId);
    } else {
      const cohorts = await fetchCohorts();
      let cohort = cohorts.find((cohort) =>
        cohort.courses.some((courseId) => courseId === this.courseId),
      );
      this.cohortsInCourse.push(cohort);
      // if (this.cohortsInCourse.length) {
      //   this.setCurrentCohortId(this.cohortsInCourse[0]?.id);
      //   const students = await Promise.all(
      //     this.cohortsInCourse[0].students?.map((student) => fetchPersonByPersonId(student)),
      //   );
      //   this.peopleInCourse = students;
      //   this.setPeopleInCourse(students);
      // }
    }

    // Start Vue Tour
    // this.$tours["myTour"].start(); // Disabled for now

    // LRS statement recording a student has logged in to this course
    if (this.course && !this.teacher) {
      await loggedIntoGalaxyXAPIStatement({
        actor: {
          email: this.person.email,
          firstName: this.person.firstName,
          lastName: this.person.lastName,
          id: this.person.id,
        },
        galaxyId: this.courseId,
      });
    }
  },
  computed: {
    ...mapState(useRootStore, ["person", "user"]),
    draft() {
      return this.course?.status === "drafting";
    },
    submitted() {
      return this.course?.status === "submitted";
    },
    teacher() {
      return this.course?.mappedBy.personId === this.person.id || this.user.data.admin;
    },
    student() {
      return this.person.assignedCourses?.some((courseId) => courseId === this.courseId);
    },
    showPublish() {
      return (this.user.data.admin && this.course?.status === "submitted") || this.draft;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCohortId", "setCurrentCourseId", "setPeopleInCourse"]),
    setUiMessage(message) {
      this.uiMessage = message;
    },
    updateDragCoords(coords) {
      this.coords = coords;
    },
    nodePositionsChanged() {
      this.changeInPositions = true;
    },
    saveNodePositions() {
      this.$refs.vis.saveNodePositions();
    },
    nodePositionsChangeSaved() {
      this.nodePositionsChangeLoading = false;
      this.changeInPositions = false;
    },
    toggleAddNodeMode() {
      console.log("toggling");
      this.$refs.vis.disableEditMode();
      this.addNodeMode = !this.addNodeMode;
      if (this.addNodeMode == true) {
        this.$refs.vis.addNodeMode();
      }
      if (this.addEdgeMode) this.addEdgeMode = false;
      if (this.dragNodeMode) this.dragNodeMode = false;
    },
    toggleAddEdgeMode() {
      this.$refs.vis.disableEditMode();
      this.addEdgeMode = !this.addEdgeMode;
      if (this.addEdgeMode == true) {
        this.$refs.vis.addEdgeMode();
      }
      if (this.addNodeMode) this.addNodeMode = false;
      if (this.dragNodeMode) this.dragNodeMode = false;
    },
    toggleDragNodeMode() {
      console.log("drag mode toggled");
      this.$refs.vis.disableEditMode();
      this.dragNodeMode = !this.dragNodeMode;
      if (this.dragNodeMode == true) {
        this.$refs.vis.dragNodeMode();
      } else {
        this.$refs.vis.disableDragMode();
        this.changeInPositions = false;
        // redraw solar systems
        this.$refs.vis.drawSolarSystems();
      }
      if (this.addEdgeMode) this.addEdgeMode = false;
      if (this.addNodeMode) this.addNodeMode = false;
    },
    hideLeftPanels(hideFlag) {
      this.hideLeftPanelsFlag = hideFlag;
    },
    closeInfoPanel() {
      this.clickedTopicId = null;
      this.clickedTopic = null;
      this.currentEdge = null;
      this.topicTasks = [];
      this.hideLeftPanelsFlag = false;
      this.$refs.vis.exitSolarSystemPreview();
      // this.$refs.listPanel.courseClicked();
    },
    async topicClicked(emittedPayload) {
      // get topic id
      this.clickedTopicId = emittedPayload.topicId;
      // get topic
      this.clickedTopic = await fetchTopicByCourseIdTopicId(this.courseId, this.clickedTopicId);
      console.log("clicked topic:", this.clickedTopic);
      // reset topic tasks (to prevent duplicate)
      this.topicTasks = [];
      // loop courseTasks for this topic id (= this.topicTasks)
      for (const task of this.courseTasks) {
        if (task.topicId == this.clickedTopicId) {
          this.topicTasks.push(task.task);
        }
      }
      // order topic tasks by created
      this.topicTasks = this.topicTasks.sort(
        (objA, objB) => Number(objA.taskCreatedTimestamp) - Number(objB.taskCreatedTimestamp),
      );
    },
    emittedCourseTasks(emittedPayload) {
      console.log("course tasks emitted from GalaxyMap.vue", emittedPayload);
      this.courseTasks = emittedPayload;
    },
    selected(selected) {
      this.type = selected.type;
      this.infoPopupPosition.x = selected.DOMx;
      this.infoPopupPosition.y = selected.DOMy;
      if (selected.type == "node") {
        this.currentNode = selected;
        this.selectedNode = selected;
      } else if (selected.type == "edge") {
        // this.currentEdge = selected;
      }
      this.infoPopupShow = true;
    },
    centerFocus(centerFocusNode) {
      if (centerFocusNode.length > 1) return; // this avoids pop up when no specific node selected
      this.centerFocusPosition = true;
      this.type = centerFocusNode.type;
      this.infoPopupPosition.x = "50%"; // 50%
      this.infoPopupPosition.y = "50%"; // 50%
      // this.currentNode = centerFocusNode;
    },
    showAddDialog(node) {
      this.addNodeMode = false;
      this.uiMessage = "";
      // this.coords.x = node.x;
      // this.coords.y = node.y;
      this.currentNode = node;
      this.dialogTitle = "add new node";
      this.dialogDescription = "add a new system to this galaxy";
      this.dialog = true;
    },
    showEditDialog(node) {
      console.log("edit node", node);
      // this.uiMessage = "";
      // this.coords.x = node.x;
      // this.coords.y = node.y;
      this.currentNode = node;
      this.dialogTitle = node.label;
      this.dialogDescription = "edit this system";
      this.dialog = true;
      this.editing = true;
    },
    closeDialog() {
      if (!this.editing) {
        this.$refs.vis.removeUnsavedNode();
        this.deselect();
      }
      this.$refs.vis.deselectNode();
      this.dialog = false;
      this.editing = false;
      this.dialogTitle = "";
      this.dialogDescription = "";
      this.currentNode = null;
      this.currentEdge = null;
      // close panel
      this.closeInfoPanel();
    },
    openDialog() {
      // TODO: this doesnt reset the node correctly
      this.dialog = true;
      this.editing = true;
    },
    blurNode() {
      this.hoverNode = false;
    },
    focusPopup() {
      this.hoverPopup = true;
    },
    closePopup() {
      this.$refs.vis.deselectNode();
      this.blurPopup();
    },
    blurPopup() {
      if (this.selectedNode === this.currentNode) return;
      this.hoverPopup = false;
      this.deselect();
    },
    deselect() {
      this.selectedNode = {};
      if (!this.hoverPopup && !this.hoverNode) {
        this.infoPopupShow = false;
        this.centerFocusPosition = false;
      }
    },
    selectedEdge(selected) {
      console.log("selected edge emitted:", selected);
      this.currentEdge = selected;
    },
    async galaxyCompleted() {
      this.galaxyCompletedDialog = true;
      // confetti fireworks
      var duration = 30 * 1000;
      var animationEnd = Date.now() + duration;
      var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      var interval = setInterval(() => {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: this.randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: this.getGMColours(),
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: this.randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: this.getGMColours(),
        });
      }, 250);
      // xp points
      console.log(
        "updating XP points: " +
          this.person.xpPointsTotal +
          " + " +
          this.xpPointsForThisGalaxy +
          " = " +
          (this.person.xpPointsTotal + this.xpPointsForThisGalaxy),
      );
      await db
        .collection("people")
        .doc(this.person.id)
        .update({
          xpPointsTotal: firebase.firestore.FieldValue.increment(this.xpPointsForThisGalaxy),
        });
    },
    randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    },
    getGMColours() {
      let colours = [];
      if (this.$vuetify.theme.isDark) {
        colours = [
          this.$vuetify.theme.themes.dark.missionAccent,
          this.$vuetify.theme.themes.dark.baseAccent,
          // this.$vuetify.theme.themes.dark.galaxyAccent,
        ];
      } else {
        colours = [
          this.$vuetify.theme.themes.light.missionAccent,
          this.$vuetify.theme.themes.light.baseAccent,
          // this.$vuetify.theme.themes.light.galaxyAccent,
        ];
      }
      return colours;
    },
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
}

#container {
  height: 100vh;
  width: 100%;
  display: flex;
  overflow: hidden;
  margin: 0 !important;
  // border: 1px solid red;
}

.left-section {
  width: 200px;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
  overflow-y: scroll;
  padding: 0px 0px 50px 20px;
  z-index: 3;
  transition: all 0.3s;
  position: absolute;
  left: 0px;
  top: 0px;
}

.hide {
  left: -200px;
  top: 100%;
}

.hideButtons {
  position: absolute;
  bottom: -200px;
}

#main-section {
  position: absolute;
  width: 100vw;
  margin: 0px;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  z-index: 1;
  // border: 1px solid pink;

  .ui-message-wrap {
    // border: 1px solid var(--v-missionAccent-base);

    .ui-message {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      text-align: left;
      margin-left: 10px;
    }
  }
}

#right-section {
  width: 20%;
  height: 100%;
  z-index: 3;
  margin-left: auto;
  margin-right: 20px;
}

/* width */
::-webkit-scrollbar {
  width: 10px;
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

.bounce {
  -webkit-animation: mover 1s infinite alternate;
  animation: mover 1s infinite alternate;
}

.bounce {
  -webkit-animation: mover 1s infinite alternate;
  animation: mover 1s infinite alternate;
}

@-webkit-keyframes mover {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(-5px);
  }
}

@keyframes mover {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(-5px);
  }
}
</style>
