<template>
  <div class="map-buttons">
    <v-btn
      class="map-button"
      :color="!addNodeMode ? 'missionAccent' : 'baseAccent'"
      fab
      dark
      small
      outlined
      tile
      title="Add Node"
      @click="toggleAddNodeMode"
    >
      <v-icon v-if="!addNodeMode">mdi-dots-hexagon</v-icon>
      <v-icon v-else color="baseAccent">mdi-close</v-icon>
    </v-btn>

    <!-- Add edge button -->
    <v-btn
      class="map-button"
      :color="!addEdgeMode ? 'missionAccent' : 'baseAccent'"
      fab
      dark
      small
      outlined
      tile
      title="Add Edge"
      @click="toggleAddEdgeMode"
    >
      <v-icon v-if="!addEdgeMode">mdi-chart-timeline-variant</v-icon>
      <v-icon v-else color="baseAccent">mdi-close</v-icon>
    </v-btn>

    <!-- New node positions Save Button -->
    <v-btn
      v-if="changeInPositions"
      class="map-button pa-5"
      color="baseAccent"
      dark
      small
      outlined
      tile
      title="Save new node positions"
      @click="saveNodePositions"
      :loading="nodePositionsChangeLoading"
    >
      Save new positions
    </v-btn>

    <div class="ui-message-wrap">
      <p
        v-if="currentCourseNodes.length === 0 && !addNodeMode"
        class="ui-message"
        style="margin-left: 20px"
      >
        <v-icon color="missionAccent" class="bounce"
          >mdi-hand-pointing-up</v-icon
        >
        Add a new node to start creating a Galaxy map
      </p>
      <p v-else class="ui-message">{{ uiMessage }}</p>
    </div>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyMapButtons",
  components: {},
  props: [
    "addNodeMode",
    "addEdgeMode",
    "changeInPositions",
    "nodePositionsChangeLoading",
    "uiMessage",
  ],
  async mounted() {},
  data() {
    return {};
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
      this.$emit("toggleAddNodeMode");
    },
    toggleAddEdgeMode() {
      this.$emit("toggleAddEdgeMode");
    },
    saveNodePositions() {
      this.$emit("saveNodePositions");
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
