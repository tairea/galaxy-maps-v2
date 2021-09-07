<template>
  <div id="container" class="bg">
    <div id="left-section">
      <GalaxyInfo :course="getCourseById(currentCourseId)" />
      <!-- <MissionsInfo :missions="galaxy.planets"/> -->
      <AssignedInfo
        :assignCohorts="true"
        :cohorts="getCohortsInThisCourse(currentCourseId)"
      />
      <BackButton :toPath="'/galaxy'" />
    </div>
    <div id="main-section">
      <!-- Map Buttons -->
      <div class="map-buttons">
        <v-btn
          class="map-button"
          color="missionAccent"
          fab
          dark
          small
          outlined
          tile
          title="Add Node"
          @click="$refs.vis.addNodeMode()"
        >
          <v-icon>mdi-dots-hexagon</v-icon>
        </v-btn>
        <v-btn
          class="map-button"
          color="missionAccent"
          fab
          dark
          small
          outlined
          tile
          title="Add Edge"
          @click="$refs.vis.addEdgeMode()"
        >
          <v-icon>mdi-chart-timeline-variant</v-icon>
        </v-btn>
       

        <div class="ui-message-wrap">
          <p class="ui-message">{{ uiMessage }}</p>
        </div>
      </div>

      <!-- Galaxy Map -->
      <GalaxyMap
        ref="vis"
        @add-node="addNode"
        @edit-node="editNode"
        @setUiMessage="setUiMessage"
        @drag-coords="updateDragCoords"
        @selected="selected"
        @deselected="deselected"
      />

      <!-- Edit -->
      <EditNode
        :course="getCourseById(currentCourseId)"
        :coords="coords"
        @removeUnsavedNode="removeUnsavedNode"
        ref="edit"
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
import EditNode from "../components/EditNode";

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
    EditNode,
  },
  props: ["courseId", "courseTitle"],
  mounted() {},
  data() {
    return {
      uiMessage: "",
      coords: {},
    };
  },
  computed: {
    ...mapState(["currentCourseId"]),
    ...mapGetters([
      "getCourseById",
      "getTasksByCourseId",
      "getCohortsInThisCourse",
    ]),
  },
  methods: {
    addNode(node) {
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
    selected(node) {
      this.$refs.edit.selected(node);
    },
    deselected() {
      this.$refs.edit.deselect()
    },
    removeUnsavedNode() {
      this.$refs.vis.removeUnsavedNode()
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
    // margin-left: 80px;
    z-index: 2;

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
      text-align: center;
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
</style>
