<template>
  <div>
    <div class="d-flex map-buttons-bottom" :class="{ mobile: isMobile, hidden: buttonsHidden }">
      <div class="d-inline-flex">
        <!-- SHOW MISSIONS (All Users) -->
        <div
          v-if="!hideShowMissions"
          class="mapButton"
          :class="{
            active: showMissions,
            'mr-4': isTeacher,
            dimmed: editModeActive,
          }"
          @click="toggleShowMissions"
        >
          <div class="mapButton-icon" :class="{ activeIcon: showMissions }">
            <v-icon v-if="!showMissions" color="missionAccent">{{ mdiEarth }}</v-icon>
            <v-icon v-else color="baseAccent">{{ mdiEarthOff }}</v-icon>
          </div>
          <div v-if="!isMobile" class="mapButton-text">
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
          <div v-if="!isMobile" class="mapButton-text">
            <p v-if="!editModeActive" class="overline ma-0">Add/Edit Stars</p>
            <p v-else class="ma-0" style="font-size: 0.7rem">Click to hide edit options</p>
          </div>
        </div>

        <!-- EDIT WITH AI (Teacher Only) -->
        <div
          v-if="isTeacher"
          class="mapButtonGalaxyAccent ml-4"
          :class="{ dimmed: editModeActive }"
          :style="editModeActive ? { order: 99 } : {}"
          @click="openAiGalaxyEdit"
        >
          <div class="mapButton-icon">
            <v-icon color="galaxyAccent">{{ mdiRobotExcited }}</v-icon>
          </div>
          <div v-if="!isMobile" class="mapButton-text">
            <p class="overline ma-0">Edit with AI</p>
          </div>
        </div>

        <!-- EDIT BUTTONS CONTAINER (Teacher Only) -->
        <div v-if="isTeacher && editModeActive" class="d-inline-flex ml-4">
          <!-- ADD NODE -->
          <div class="mapButton" :class="{ active: addNodeMode }" @click="toggleAddNodeMode">
            <div class="mapButton-icon" :class="{ activeIcon: addNodeMode }">
              <v-icon v-if="!addNodeMode" color="missionAccent">{{
                mdiMapMarkerPlusOutline
              }}</v-icon>
              <v-icon v-else color="baseAccent">{{ mdiClose }}</v-icon>
            </div>
            <div v-if="!isMobile" class="mapButton-text">
              <p v-if="!addNodeMode" class="overline ma-0">Add a new Star</p>
              <p v-else class="ma-0" style="font-size: 0.7rem" data-testid="add-node-instruction">
                Click on the map to place a new Star
              </p>
            </div>
          </div>

          <!-- ADD EDGE -->
          <div class="mapButton ml-4" :class="{ active: addEdgeMode }" @click="toggleAddEdgeMode">
            <div class="mapButton-icon" :class="{ activeIcon: addEdgeMode }">
              <v-icon v-if="!addEdgeMode" color="missionAccent">{{ mdiVectorPolylinePlus }}</v-icon>
              <v-icon v-else color="baseAccent">{{ mdiClose }}</v-icon>
            </div>
            <div v-if="!isMobile" class="mapButton-text">
              <p v-if="!addEdgeMode" class="overline ma-0">Connect Stars</p>
              <p v-else class="ma-0" style="font-size: 0.7rem" data-testid="connect-stars-instruction">
                Click and drag to connect two Stars
              </p>
            </div>
          </div>

          <!-- EDIT NODE POSITIONS -->
          <div class="mapButton ml-4" :class="{ active: dragNodeMode }" @click="toggleDragNodeMode">
            <div class="mapButton-icon" :class="{ activeIcon: dragNodeMode }">
              <v-icon v-if="!dragNodeMode" color="missionAccent">{{ mdiCursorMove }}</v-icon>
              <v-icon v-else color="baseAccent">{{ mdiClose }}</v-icon>
            </div>
            <div v-if="!isMobile" class="mapButton-text">
              <p v-if="!dragNodeMode" class="overline ma-0">Change Star positions</p>
              <p v-else class="ma-0" style="font-size: 0.7rem" data-testid="drag-instruction">
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
              data-testid="save-positions-button"
            >
              <v-icon color="baseAccent">{{ mdiContentSaveCheck }}</v-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="chevron-toggle" @click="toggleButtonsVisibility">
      <v-icon :color="buttonsHidden ? 'missionAccent' : 'missionAccent'" class="chevron-icon">
        {{ buttonsHidden ? mdiChevronUp : mdiChevronDown }}
      </v-icon>
    </div>
  </div>
</template>

<script>
import {
  mdiMapMarkerPlusOutline,
  mdiClose,
  mdiVectorPolylinePlus,
  mdiCursorMove,
  mdiContentSaveCheck,
  mdiEarth,
  mdiEarthOff,
  mdiStarPlus,
  mdiRobotExcited,
  mdiChevronDown,
  mdiChevronUp,
} from "@mdi/js";
import { mapActions, mapState } from "pinia";
import useRootStore from "@/store/index";
import { getGalaxyMapObjectFromCourse } from "@/lib/ff";

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
    hideShowMissions: { default: false },
    isTeacher: { default: false },
    course: { default: null },
  },
  async mounted() {},
  data() {
    return {
      mdiMapMarkerPlusOutline,
      mdiClose,
      mdiVectorPolylinePlus,
      mdiCursorMove,
      mdiContentSaveCheck,
      mdiEarth,
      mdiEarthOff,
      mdiStarPlus,
      mdiRobotExcited,
      mdiChevronDown,
      mdiChevronUp,
      editModeActive: false,
      buttonsHidden: false,
    };
  },
  computed: {
    ...mapState(useRootStore, ["boundCourse"]),
    editMode() {
      return this.addNodeMode || this.addEdgeMode;
    },
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setAiGalaxyEditData"]),
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
    toggleButtonsVisibility() {
      this.buttonsHidden = !this.buttonsHidden;
    },
    async openAiGalaxyEdit() {
      this.$emit("toggleLoading", true);
      console.log("openAiGalaxyEdit for course: ", this.boundCourse?.id);

      if (!this.boundCourse?.galaxyMapAsObject) {
        // create galaxyMapObject
        const galaxyMapObject = await getGalaxyMapObjectFromCourse(this.boundCourse?.id);
        this.setAiGalaxyEditData(galaxyMapObject);
      }

      console.log("galaxyMapObject: ", this.boundCourse?.galaxyMapAsObject);
      this.setAiGalaxyEditData(this.boundCourse?.galaxyMapAsObject);

      this.$emit("toggleLoading", false);

      // Navigate to the new route with courseId
      this.$router.push({
        name: "AiGalaxyEditWithCourse",
        params: {
          // galaxyMapAsObject: this.boundCourse?.galaxyMapAsObject,
          courseId: this.boundCourse?.id,
        },
      });
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
.mapButtonGalaxyAccent {
  display: flex;
  color: var(--v-galaxyAccent-base);
  border: 1px solid var(--v-galaxyAccent-base);
  height: 45px;
  cursor: pointer;
  backdrop-filter: blur(2px);

  .mapButton-icon {
    border-left: none;
  }

  .mapButton-text {
    border-left: 1px solid var(--v-galaxyAccent-base);
  }
}

.active {
  color: var(--v-baseAccent-base);
  border: 1px solid var(--v-baseAccent-base);
}

.dimmed {
  opacity: 0.2;
  pointer-events: none;
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
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 25px 0px;
  margin-left: auto;
  margin-right: auto;
  transition: transform 0.3s ease-in-out;
  transform: translateY(0);

  &.hidden {
    transform: translateY(calc(100% + 25px));
  }

  &.mobile {
    .mapButton-icon {
      border-left: none !important;
    }
  }

  // border: 1px solid blue;
}

.chevron-toggle {
  position: fixed;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  // padding: 8px;
  opacity: 0.5;
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 0.6;
  }

  .chevron-icon {
    transition: transform 0.3s ease-in-out;
  }
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
  flex: 1; /* Makes buttons take equal width */
  min-width: 0; /* Allows flex items to shrink */
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
