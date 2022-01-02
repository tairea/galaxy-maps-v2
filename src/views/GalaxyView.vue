<template>
  <div id="container" class="bg">
    <div id="left-section">
      <GalaxyInfo :course="getCourseById(courseId)" />
      <!-- <MissionsInfo :missions="galaxy.planets"/> -->
      <AssignedInfo
        v-if="person.accountType != 'student'"
        :assignCohorts="true"
        :cohorts="getCohortsInThisCourse(courseId)"
        :organisations="getOrganisationsInThisCourse(courseId)"
        :people="getPeopleInThisCourse(courseId)"
      />
      <BackButton :toPath="'/base/galaxies/my'" />
    </div>
    <div id="main-section">
      <!-- Map Buttons -->
      <GalaxyMapButtons
        v-if="person.accountType != 'student'"
        :addNodeMode="addNodeMode"
        :addEdgeMode="addEdgeMode"
        :uiMessage="uiMessage ? uiMessage : ''"
        :changeInPositions="changeInPositions"
        :nodePositionsChangeLoading="nodePositionsChangeLoading"
        @toggleAddNodeMode="toggleAddNodeMode"
        @toggleAddEdgeMode="toggleAddEdgeMode"
        @addNode="addNode"
        @saveNodePositions="saveNodePositions"
      />

      <!-- ===== Galaxy Map ===== -->
      <GalaxyMap
        ref="vis"
        @add-node="addNode"
        @edit-node="editNode"
        @setUiMessage="setUiMessage"
        @drag-coords="updateDragCoords"
        @selected="selected"
        @deselected="deselected"
        @hovered="hovered"
        @centerFocus="centerFocus"
        @nodePositionsChanged="nodePositionsChanged"
        @nodePositionsChangeLoading="nodePositionsChangeLoading = true"
        @nodePositionsChangeSaved="nodePositionsChangeSaved"
        @edgeSaved="toggleAddEdgeMode"
      />

      <!-- Edit -->
      <GalaxyMapEditDialog
        ref="edit"
        :course="getCourseById(courseId)"
        :coords="coords"
        @removeUnsavedNode="removeUnsavedNode"
        @closePopup="closePopup"
      />
    </div>
  </div>
</template>

<script>
import GalaxyInfo from "../components/GalaxyInfo";
import AssignedInfo from "../components/AssignedInfo";
import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";
import Galaxy from "../components/Galaxy";
import GalaxyMap from "../components/GalaxyMap";
import BackButton from "../components/BackButton";
import GalaxyMapEditDialog from "../components/GalaxyMapEditDialog";
import GalaxyMapButtons from "../components/GalaxyMapButtons";

import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyView",
  components: {
    GalaxyInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    Galaxy,
    GalaxyMap,
    BackButton,
    GalaxyMapEditDialog,
    GalaxyMapButtons,
  },
  props: ["courseId"],
  async mounted() {
    if (this.fromCreate) {
      let nodeId = null;
      // create first node (hard coded)
      console.log("trying to add default intro node");
      await db
        .collection("courses")
        .doc(this.courseId)
        .collection("map-nodes")
        .add({
          // hardcoded first node
          label: this.courseTitle + " Intro",
          group: "introduction",
          x: 0,
          y: 0,
        })
        .then((docRef) => {
          console.log("Node successfully written! With ID:", docRef.id);
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
          label: "Intro",
        })
        .then((docRef) => {
          console.log("Topic successfully written!");
          // this.loading = false;
          // this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
    }

    console.log("courseId", this.courseId);
    if (this.courseId) {
      return;
    }
  },
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
    };
  },
  computed: {
    ...mapState(["currentCourseId", "currentCourseNodes", "person"]),
    ...mapGetters([
      "getCourseById",
      "getCohortsInThisCourse",
      "getOrganisationsInThisCourse",
      "getPeopleInThisCourse",
    ]),
  },
  methods: {
    toggleAddNodeMode() {
      this.addNodeMode = !this.addNodeMode;
      if (this.addNodeMode == true) {
        this.$refs.vis.addNodeMode();
      } else if (this.addNodeMode == false) {
        this.$refs.vis.disableEditMode();
        this.uiMessage = "";
      }
    },
    toggleAddEdgeMode() {
      this.addEdgeMode = !this.addEdgeMode;
      if (this.addEdgeMode == true) {
        this.$refs.vis.addEdgeMode();
      } else if (this.addEdgeMode == false) {
        this.$refs.vis.disableEditMode();
        this.uiMessage = "";
      }
    },
    addNode(node) {
      this.addNodeMode = false;
      this.uiMessage = "";
      this.coords.x = node.x;
      this.coords.y = node.y;
      this.$refs.edit.add(node);
    },
    editNode(node) {
      this.uiMessage = "";
      this.coords.x = node.x;
      this.coords.y = node.y;
      this.$refs.edit.edit(node);
    },
    setUiMessage(message) {
      this.uiMessage = message;
    },
    updateDragCoords(coords) {
      this.coords = coords;
    },
    // TODO: This patetrn feels bad and is hard to manage and understand. This should be updated
    // Current pattern: emit action from a child component to parent which refs method and changes state in other child component
    // Update to: manage state in parent component and prop down into children components
    selected(node) {
      this.$refs.edit.selected(node);
    },
    hovered(node) {
      this.$refs.edit.hovered(node);
    },
    deselected() {
      this.$refs.edit.deselect();
    },
    removeUnsavedNode() {
      this.$refs.vis.removeUnsavedNode();
    },
    centerFocus(node) {
      this.$refs.edit.centerFocus(node);
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
    closePopup() {
      // TODO: this doesnt reset the node correctly
      this.$refs.vis.deselectNode()
    }
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
  background: var(--v-missionAccent-base);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
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
