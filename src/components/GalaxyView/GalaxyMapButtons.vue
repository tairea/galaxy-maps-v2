<template>
  <div class="d-flex map-buttons-bottom">
    <div class="d-inline-flex">
      <!-- SHOW MISSIONS (All Users) -->
      <div
        class="mapButton"
        :class="{ active: showMissions, 'mr-4': isTeacher }"
        @click="toggleShowMissions"
      >
        <div class="mapButton-icon" :class="{ activeIcon: showMissions }">
          <v-icon v-if="!showMissions" color="missionAccent">{{ mdiEarth }}</v-icon>
          <v-icon v-else color="baseAccent">{{ mdiEarthOff }}</v-icon>
        </div>
        <div class="mapButton-text">
          <p v-if="!showMissions" class="overline ma-0">Show Missions</p>
          <p v-else class="overline ma-0" style="font-size: 0.7rem">Hide missions</p>
        </div>
      </div>

      <!-- ADD/EDIT STARS TOGGLE (Teacher Only) -->
      <div
        v-if="isTeacher"
        class="mapButton"
        :class="{ active: editModeActive }"
        @click="toggleEditMode"
      >
        <div class="mapButton-icon" :class="{ activeIcon: editModeActive }">
          <v-icon v-if="!editModeActive" color="missionAccent">{{ mdiStarPlus }}</v-icon>
          <v-icon v-else color="baseAccent">{{ mdiClose }}</v-icon>
        </div>
        <div class="mapButton-text">
          <p v-if="!editModeActive" class="overline ma-0">Add/Edit Stars</p>
          <p v-else class="ma-0" style="font-size: 0.7rem">Click to hide edit options</p>
        </div>
      </div>

      <!-- EDIT BUTTONS CONTAINER (Teacher Only) -->
      <div v-if="isTeacher && editModeActive" class="d-inline-flex ml-4">
        <!-- ADD NODE -->
        <div class="mapButton" :class="{ active: addNodeMode }" @click="toggleAddNodeMode">
          <div class="mapButton-icon" :class="{ activeIcon: addNodeMode }">
            <v-icon v-if="!addNodeMode" color="missionAccent">{{ mdiDotsHexagon }}</v-icon>
            <v-icon v-else color="baseAccent">{{ mdiClose }}</v-icon>
          </div>
          <div class="mapButton-text">
            <p v-if="!addNodeMode" class="overline ma-0">Add a new Star</p>
            <p v-else class="ma-0" style="font-size: 0.7rem">
              Click on the map to place a new Star
            </p>
          </div>
        </div>

        <!-- ADD EDGE -->
        <div class="mapButton ml-4" :class="{ active: addEdgeMode }" @click="toggleAddEdgeMode">
          <div class="mapButton-icon" :class="{ activeIcon: addEdgeMode }">
            <v-icon v-if="!addEdgeMode" color="missionAccent">{{ mdiChartTimelineVariant }}</v-icon>
            <v-icon v-else color="baseAccent">{{ mdiClose }}</v-icon>
          </div>
          <div class="mapButton-text">
            <p v-if="!addEdgeMode" class="overline ma-0">Connect Stars</p>
            <p v-else class="ma-0" style="font-size: 0.7rem">Click and drag to connect two Stars</p>
          </div>
        </div>

        <!-- EDIT NODE POSITIONS -->
        <div class="mapButton ml-4" :class="{ active: dragNodeMode }" @click="toggleDragNodeMode">
          <div class="mapButton-icon" :class="{ activeIcon: dragNodeMode }">
            <v-icon v-if="!dragNodeMode" color="missionAccent">{{ mdiArrowExpandAll }}</v-icon>
            <v-icon v-else color="baseAccent">{{ mdiClose }}</v-icon>
          </div>
          <div class="mapButton-text">
            <p v-if="!dragNodeMode" class="overline ma-0">Change Star positions</p>
            <p v-else class="ma-0" style="font-size: 0.7rem">
              {{
                changeInPositions
                  ? "CANCEL or SAVE new positions"
                  : "Click and drag to reposition Star"
              }}
            </p>
          </div>
          <!-- SAVE NODE POSITIONS -->
          <div
            class="mapButton-icon"
            v-if="changeInPositions"
            :class="{ activeIcon: dragNodeMode }"
            @click="saveNodePositions"
          >
            <v-icon color="baseAccent">{{ mdiContentSaveCheck }}</v-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  mdiDotsHexagon,
  mdiClose,
  mdiChartTimelineVariant,
  mdiArrowExpandAll,
  mdiContentSaveCheck,
  mdiEarth,
  mdiEarthOff,
  mdiStarPlus,
} from "@mdi/js";

export default {
  name: "GalaxyMapButtons",
  components: {},
  props: {
    addNodeMode: { default: false },
    addEdgeMode: { default: false },
    dragNodeMode: { default: false },
    changeInPositions: { default: false },
    nodePositionsChangeLoading: { default: false },
    showMissions: { default: false },
    isTeacher: { default: false },
  },
  async mounted() {},
  data() {
    return {
      mdiDotsHexagon,
      mdiClose,
      mdiChartTimelineVariant,
      mdiArrowExpandAll,
      mdiContentSaveCheck,
      mdiEarth,
      mdiEarthOff,
      mdiStarPlus,
      editModeActive: false,
    };
  },
  computed: {
    editMode() {
      return this.addNodeMode || this.addEdgeMode;
    },
  },
  methods: {
    toggleEditMode() {
      this.editModeActive = !this.editModeActive;
      // If turning off edit mode, also turn off all edit modes
      if (!this.editModeActive) {
        if (this.addNodeMode) this.$emit("toggleAddNodeMode");
        if (this.addEdgeMode) this.$emit("toggleAddEdgeMode");
        if (this.dragNodeMode) this.$emit("toggleDragNodeMode");
      }
    },
    toggleAddNodeMode() {
      this.$emit("toggleAddNodeMode");
    },
    toggleAddEdgeMode() {
      this.$emit("toggleAddEdgeMode");
    },
    toggleDragNodeMode() {
      this.$emit("toggleDragNodeMode");
    },
    saveNodePositions() {
      this.$emit("saveNodePositions");
    },
    toggleShowMissions() {
      this.$emit("toggleShowMissions");
    },
  },
};
</script>

<style lang="scss" scoped>
.mapButton {
  display: flex;
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  height: 45px;
  cursor: pointer;
  backdrop-filter: blur(2px);
}

.active {
  color: var(--v-baseAccent-base);
  border: 1px solid var(--v-baseAccent-base);
}

.mapButton-icon,
.mapButton-text {
  display: flex;
  justify-content: center;
  align-items: center;
  border-left: 1px solid var(--v-missionAccent-base);
  padding: 0px 10px;
}

.activeIcon {
  border-left: 1px solid var(--v-baseAccent-base);
  border-right: 1px solid var(--v-baseAccent-base);
}

.mapButton-text {
  text-align: right;
}

.map-buttons-bottom {
  position: fixed;
  bottom: 0;
  left: 50%;
  z-index: 2;
  width: auto;
  transform: translate(-50%, 0%);
  margin: 25px 0px;

  // border: 1px solid blue;
}

.map-buttons-left {
  position: fixed;
  top: 0;
  left: 15%;
  z-index: 2;
  width: auto;
  flex-direction: column;
}

.map-button-bottom {
  margin: 10px;
  background-color: var(--v-background-base);
}

.map-button {
  // margin: 10px;
  background-color: var(--v-background-base);
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

  .active {
    color: var(--v-baseAccent-base) !important;
  }
}

.overline {
  line-height: 1rem !important;
}
</style>
