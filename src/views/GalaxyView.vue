<template>
  <div id="container" class="bg">
    <div class="left-section" :class="{ hide: hideLeftPanelsFlag }">
      <!-- <div class="left-section" data-v-step="1"> -->
      <GalaxyInfo :course="currentCourse" :teacher="teacher" :draft="draft" />
      <!-- <MissionsInfo :missions="galaxy.planets"/> -->
      <PublishGalaxy
        v-if="showPublish"
        :course="currentCourse"
        :courseTasks="courseTasks"
      />
      <AssignedInfo
        v-if="!draft && cohortsInCourse.length"
        :assignCohorts="true"
        :people="peopleInCourse"
        :cohorts="cohortsInCourse"
        :teacher="teacher"
      />

      <BackButton />
    </div>
    <div id="main-section" :class="{ shrinkMenu: hideLeftPanelsFlag }">
      <!-- Map Buttons -->
      <GalaxyMapButtons
        class="mt-8"
        v-if="teacher"
        :hideMainButtons="hideLeftPanelsFlag"
        :addNodeMode="addNodeMode"
        :addEdgeMode="addEdgeMode"
        :listEditMode="listEditMode"
        :dragNodeMode="dragNodeMode"
        :uiMessage="uiMessage ? uiMessage : ''"
        :changeInPositions="changeInPositions"
        :nodePositionsChangeLoading="nodePositionsChangeLoading"
        @toggleAddNodeMode="toggleAddNodeMode"
        @toggleAddEdgeMode="toggleAddEdgeMode"
        @toggleDragNodeMode="toggleDragNodeMode"
        @addNode="showAddDialog"
        @saveNodePositions="saveNodePositions"
        @toggleListEditMode="toggleListEditMode"
      />

      <!-- ===== Galaxy Map ===== -->
      <GalaxyMap
        ref="vis"
        :teacher="teacher"
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
        :courses="[currentCourse]"
        :isTeacher="teacher"
        :students="peopleInCourse"
      />
      <SubmissionTeacherFrame
        :isTeacher="teacher"
        :courses="[currentCourse]"
        :students="teacher ? peopleInCourse : [person]"
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
      :course="currentCourse"
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
    <!-- DELETE EDGE PANEL -->
    <EdgeInfoPanel
      v-if="teacher"
      :selectedEdge="currentEdge"
      @closeInfoPanel="closeInfoPanel"
    />
    <!-- LIST MODE PANEL (for system preview)-->
    <ListModePanel
      :show="listEditMode"
      :tasks="topicTasks"
      @closeInfoPanel="closeInfoPanel"
    />

    <!-- Galaxy Completed Popup -->
    <v-dialog
      transition="dialog-bottom-transition"
      max-width="600"
      :value="galaxyCompletedDialog"
    >
      <template v-slot:default="dialog">
        <v-card style="border: 1px solid var(--v-baseAccent-base)">
          <v-toolbar color="baseAccent overline" light
            >congratulations</v-toolbar
          >
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
import GalaxyInfo from "../components/GalaxyInfo";
import PublishGalaxy from "../components/GalaxyView/PublishGalaxy";
import AssignedInfo from "../components/AssignedInfo";
import BackButton from "../components/BackButton";

import GalaxyMap from "../components/GalaxyMap";
import GalaxyMapButtons from "../components/GalaxyMapButtons";

import CreateEditDeleteNodeDialog from "../components/CreateEditDeleteNodeDialog";

import PopupSystemPreview from "../components/PopupSystemPreview";
import SolarSystemInfoPanel from "../components/SolarSystemInfoPanel";
import EdgeInfoPanel from "../components/EdgeInfoPanel";
import ListModePanel from "../components/ListModePanel";

import RequestForHelpTeacherFrame from "../components/RequestForHelpTeacherFrame";
import SubmissionTeacherFrame from "../components/SubmissionTeacherFrame";

import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";

import { db } from "../store/firestoreConfig";
import { mapState, mapGetters, mapActions, mapMutations } from "vuex";
import { getAllPeopleInCourse, getAllCohortsInCourse } from "@/lib/ff";
import { dbMixins } from "../mixins/DbMixins";

export default {
  name: "GalaxyView",
  mixins: [dbMixins],
  components: {
    GalaxyInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    GalaxyMap,
    BackButton,
    CreateEditDeleteNodeDialog,
    GalaxyMapButtons,
    PopupSystemPreview,
    PublishGalaxy,
    RequestForHelpTeacherFrame,
    SubmissionTeacherFrame,
    SolarSystemInfoPanel,
    EdgeInfoPanel,
    ListModePanel,
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
      currentNode: {},
      currentEdge: null,
      hoverPopup: false,
      hoverNode: false,
      dialog: false,
      dialogTitle: "",
      dialogDescription: "",
      editing: false,
      moveNodes: false,
      course: {},
      peopleInCourse: [],
      cohortsInCourse: [],
      selectedNode: {},
      hideLeftPanelsFlag: false,
      clickedTopicId: null,
      clickedTopic: null,
      courseTasks: [],
      topicTasks: [],
      galaxyCompletedDialog: false,
      listEditMode: false,
    };
  },
  watch: {
    async currentCourse(newVal, oldVal) {
      if (!oldVal.cohort && newVal.cohort)
        this.cohortsInCourse = await getAllCohortsInCourse(
          this.courseId,
          this.person.id
        );
    },
  },
  async beforeMount() {
    // check galaxy params match state.currentCourse
    if (this.$route.params.courseId != this.currentCourse?.id) {
      const course = await db
        .collection("courses")
        .doc(this.$route.params.courseId)
        .get();
      console.log("params dont match setting currentCourse: ", course.data());
      this.course = course.data();
      this.$store.commit("setCurrentCourse", course.data());
    }
  },
  async mounted() {
    // bind assigned people in this course
    if (this.teacher) {
      this.peopleInCourse = await getAllPeopleInCourse(this.courseId);
      this.setPeopleInCourse(this.peopleInCourse);
      this.cohortsInCourse = await getAllCohortsInCourse(
        this.courseId,
        this.person.id
      );
    } else {
      await this.getCohortsByPersonId(this.person);
      let cohort = await this.cohorts.find((cohort) =>
        cohort.courses.some((courseId) => courseId === this.currentCourseId)
      );
      this.cohortsInCourse.push(cohort);
      if (this.cohortsInCourse.length) {
        this.setCurrentCohort(this.cohortsInCourse[0]);
        const students = await Promise.all(
          this.cohortsInCourse[0].students?.map(async (student) => {
            return await this.MXgetPersonByIdFromDB(student);
          })
        );
        this.peopleInCourse = students;
        this.setPeopleInCourse(students);
      }
    }

    // Start Vue Tour
    // this.$tours["myTour"].start(); // Disabled for now
  },
  computed: {
    ...mapState([
      "currentCourseId",
      "currentCourseNodes",
      "person",
      "topicsTasks",
      "personsTopicsTasks",
      "currentCourse",
      "cohorts",
      "user",
    ]),
    ...mapGetters(["person", "user"]),
    draft() {
      return this.currentCourse?.status === "drafting";
    },
    submitted() {
      return this.currentCourse?.status === "submitted";
    },
    teacher() {
      return (
        this.currentCourse?.mappedBy?.personId === this.person.id ||
        this.user.data.admin
      );
    },
    student() {
      return this.person.assignedCourses?.some(
        (courseId) => courseId === this.currentCourseId
      );
    },
    showPublish() {
      return (
        (this.user.data.admin && this.currentCourse.status === "submitted") ||
        this.draft
      );
    },
  },
  methods: {
    ...mapActions(["getCohortsByPersonId", "setCurrentCohort"]),
    ...mapMutations(["setPeopleInCourse"]),
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
    toggleListEditMode() {
      // this.$refs.vis.disableEditMode();
      this.listEditMode = !this.listEditMode;
      if (this.listEditMode == true) {
        // do what?
        //1. hide left panels
        this.hideLeftPanels(true);
        //2. pop out right list panel
        this.showListModePanel = true;
        //3. disable system preview panel?
      } else if (this.listEditMode == false) {
        this.hideLeftPanels(false);
      }
      if (this.addNodeMode) this.addNodeMode = false;
      if (this.dragNodeMode) this.dragNodeMode = false;
    },
    // async bindTasks(courseId, topicId) {
    //   if (!this.teacher) {
    //     await this.$store.dispatch("bindPersonsTasksByTopicId", {
    //       personId: this.person.id,
    //       courseId: courseId,
    //       topicId: topicId,
    //     });
    //   } else {
    //     await this.$store.dispatch("bindTasksByTopicId", {
    //       courseId: courseId,
    //       topicId: topicId,
    //     });
    //   }
    // },
    // async hovered(hoveredNode) {
    //   this.hoverNode = true;
    //   // this.infoPopupShow = false;
    //   this.centerFocusPosition = false;
    //   this.type = hoveredNode.type;
    //   this.infoPopupPosition.x = hoveredNode.DOMx;
    //   this.infoPopupPosition.y = hoveredNode.DOMy;
    //   this.currentNode = hoveredNode;
    //   //bind tasks for popup preview
    //   await this.bindTasks(this.currentCourseId, hoveredNode.id);
    //   this.infoPopupShow = true;
    // },
    hideLeftPanels(hideFlag) {
      this.hideLeftPanelsFlag = hideFlag;
    },
    closeInfoPanel() {
      this.clickedTopicId = null;
      this.clickedTopic = null;
      this.currentEdge = null;
      this.showListModePanel = null;
      this.topicTasks = [];
      this.hideLeftPanelsFlag = false;
      this.listEditMode = false;
      this.$refs.vis.exitSolarSystemPreview();
      // this.$refs.listPanel.courseClicked();
    },
    async topicClicked(emittedPayload) {
      // get topic id
      this.clickedTopicId = emittedPayload.topicId;
      // get topic
      this.clickedTopic = this.currentCourseNodes.find(
        (node) => node.id == this.clickedTopicId
      );
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
        (objA, objB) =>
          Number(objA.taskCreatedTimestamp) - Number(objB.taskCreatedTimestamp)
      );
    },
    emittedCourseTasks(emittedPayload) {
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
      this.currentNode = {};
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
    galaxyCompleted() {
      this.galaxyCompletedDialog = true;
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
  transition: all 0.3s;

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

.shrinkMenu {
  width: calc(100vw - 550px) !important;
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
