<template>
  <div id="container" class="bg">
    <div id="left-section">
      <GalaxyInfo :course="course" :teacher="teacher" />
      <!-- <MissionsInfo :missions="galaxy.planets"/> -->
      <AssignedInfo
        v-if="teacher"
        :assignCohorts="true"
        :people="peopleInCourse"
        :cohorts="cohortsInCourse"
      />
      <BackButton :toPath="goBackPath" />
    </div>
    <div id="main-section">
      <!-- Map Buttons -->
      <GalaxyMapButtons
        v-if="teacher"
        :addNodeMode="addNodeMode"
        :addEdgeMode="addEdgeMode"
        :uiMessage="uiMessage ? uiMessage : ''"
        :changeInPositions="changeInPositions"
        :nodePositionsChangeLoading="nodePositionsChangeLoading"
        @toggleAddNodeMode="toggleAddNodeMode"
        @toggleAddEdgeMode="toggleAddEdgeMode"
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
        @deselected="deselect"
        @hoverNode="hovered"
        @blurNode="blurNode"
        @centerFocus="centerFocus"
        @nodePositionsChanged="nodePositionsChanged"
        @nodePositionsChangeLoading="nodePositionsChangeLoading = true"
        @nodePositionsChangeSaved="nodePositionsChangeSaved"
        @toggleAddEdgeMode="toggleAddEdgeMode"
        :teacher="teacher"
      />

      <!-- Edit -->
      <GalaxyMapEditDialog
        v-if="dialog"
        ref="edit"
        :dialog="dialog"
        :dialogTitle="dialogTitle"
        :dialogDescription="dialogDescription"
        :editing="editing"
        :course="course"
        :currentNode="currentNode"
        :currentEdge="currentEdge"
        @closeDialog="closeDialog"
        @openDialog="openDialog"
      />
      <!-- POPUP -->
      <v-scale-transition>
        <PopupSystemPreview
          v-if="infoPopupShow"
          ref="popup"
          :infoPopupShow="infoPopupShow"
          :infoPopupPosition="infoPopupPosition"
          :currentTopic="currentNode"
          :centerFocusPosition="centerFocusPosition"
          :tasks="teacher ? topicsTasks : personsTopicsTasks" 
          :teacher="teacher"       
          @close="closePopup"
          @showEditDialog="showEditDialog"
          @focus="focusPopup"
          @blur="blurPopup"
        />
      </v-scale-transition>
    </div>
  </div>
</template>

<script>
import GalaxyInfo from "../components/GalaxyInfo";
import AssignedInfo from "../components/AssignedInfo";
import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";
import GalaxyMap from "../components/GalaxyMap";
import BackButton from "../components/BackButton";
import GalaxyMapEditDialog from "../components/GalaxyMapEditDialog";
import GalaxyMapButtons from "../components/GalaxyMapButtons";
import PopupSystemPreview from "../components/PopupSystemPreview";

import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";
import { getCourseById } from "@/lib/ff"

export default {
  name: "GalaxyView",
  components: {
    GalaxyInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    GalaxyMap,
    BackButton,
    GalaxyMapEditDialog,
    GalaxyMapButtons,
    PopupSystemPreview,
  },
  props: ["courseId", "role"],
  data() {
    return {
      addNodeMode: false,
      addEdgeMode: false,
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
      currentEdge: {},
      hoverPopup: false,
      hoverNode: false,
      dialog: false,
      dialogTitle: "",
      dialogDescription: "",
      editing: false,
      moveNodes: false,
      course: {},
    };
  },
  async mounted() {
    // create first node, when galaxy first created (hard coded)
    this.course = await getCourseById(this.courseId)
    console.log("role: ", this.role)

    if (this.fromCreate) {
      let nodeId = null;
      await db
        .collection("courses")
        .doc(this.courseId)
        .collection("map-nodes")
        .add({
          // hardcoded first node
          label: this.courseTitle + " Intro",
          group: "introduction",
          topicCreatedTimestamp: new Date(),
          x: 0,
          y: 0,
        })
        .then((docRef) => {
          // update node obj with docRef.id aka nodeId
          db.collection("courses")
            .doc(this.courseId)
            .collection("map-nodes")
            .doc(docRef.id)
            .update({ id: docRef.id });
          // this.loading = false;
          // this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
      // get the node id
      const querySnapshot = await db
        .collection("courses")
        .doc(this.courseId)
        .collection("map-nodes")
        .get();
      for (const doc of querySnapshot.docs) {
        nodeId = doc.id;
      }
      // create topic with node id
      db.collection("courses")
        .doc(this.courseId)
        .collection("topics")
        .doc(nodeId)
        .set({
          // hardcoded first node topic
          id: nodeId,
          label: this.courseTitle + " Intro",
          group: "introduction",
          topicCreatedTimestamp: new Date(),
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
    }

    // bind assigned people in this course
    await this.$store.dispatch("bindPeopleInCourse", this.courseId);
    // bind assigned cohorts in this course
    await this.$store.dispatch("bindCohortsInCourse", this.courseId);
  },
  computed: {
    ...mapState([
      "currentCourseId",
      "currentCourseNodes",
      "person",
      "peopleInCourse",
      "cohortsInCourse",
      "topicsTasks",
      "personsTopicsTasks",
    ]),
    ...mapGetters(["person"]),
    teacher () {
      return this.role === "teacher"
    },
    goBackPath() {
      if (this.teacher) {
        return { path: "/base/galaxies", props: { display: 'my'}};
      } else {
        return { path: "/base/galaxies", props: { display: 'assigned'}};
      }
    },
  },
  methods: {
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
      this.$refs.vis.disableEditMode()
      this.addNodeMode = !this.addNodeMode;
      if (this.addNodeMode == true) {
        this.$refs.vis.addNodeMode();
      }
      if (this.addEdgeMode) this.addEdgeMode = false
    },
    toggleAddEdgeMode() {
      this.$refs.vis.disableEditMode()
      this.addEdgeMode = !this.addEdgeMode;
      if (this.addEdgeMode == true) {
        this.$refs.vis.addEdgeMode();
      }
      if (this.addNodeMode) this.addNodeMode = false
    },
    async bindTasks(courseId, topicId) {
      if (this.person.accountType == "student") {
        await this.$store.dispatch("bindPersonsTasksByTopicId", {
          personId: this.person.id,
          courseId: courseId,
          topicId: topicId,
        });
      } else {
        await this.$store.dispatch("bindTasksByTopicId", {
          courseId: courseId,
          topicId: topicId,
        });
      }
    },
    async hovered(hoveredNode) {

      this.hoverNode = true;
      // this.infoPopupShow = false;
      this.centerFocusPosition = false;
      this.type = hoveredNode.type;
      this.infoPopupPosition.x = hoveredNode.DOMx;
      this.infoPopupPosition.y = hoveredNode.DOMy;
      this.currentNode = hoveredNode;
      //bind tasks for popup preview
      await this.bindTasks(this.currentCourseId, hoveredNode.id);
      this.infoPopupShow = true;
    },
    selected(selected) {
      this.type = selected.type;
      this.infoPopupPosition.x = selected.DOMx;
      this.infoPopupPosition.y = selected.DOMy;
      if (selected.type == "node") {
        this.currentNode = selected;
      } else if (selected.type == "edge") {
        this.currentEdge = selected;
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
      this.uiMessage = "";
      this.coords.x = node.x;
      this.coords.y = node.y;
      this.dialogTitle = node.label;
      this.dialogDescription = "edit this system";
      this.dialog = true;
      this.editing = true;
    },
    closeDialog() {
      console.log('closeDialog: ', this.editing)
      if (!this.editing) {
        this.$refs.vis.removeUnsavedNode()
        this.deselect()
      }
      this.$refs.vis.deselectNode();
      this.dialog = false;
      this.editing = false;
      this.dialogTitle = "";
      this.dialogDescription = "";
      this.currentNode = {};
      this.currentEdge = {};
      // fit
      this.$refs.vis.zoomToNodes(this.currentCourseNodes);
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
      this.hoverPopup = false;
      this.deselect();
    },
    deselect() {
      if (!this.hoverPopup && !this.hoverNode) {
        this.infoPopupShow = false;
        this.centerFocusPosition = false;
      }
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

#left-section {
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
  overflow-y: scroll;
  padding-bottom: 50px;
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

  .map-buttons {
    position: fixed;
    top: 20px;
    left: 25%;
    z-index: 2;
    width: auto;

    .map-button {
      margin: 10px;
      background-color: var(--v-background-base);
    }
  }

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
  width: 30%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
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
