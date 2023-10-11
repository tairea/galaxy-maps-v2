<template>
  <!-- POPUP -->
  <!-- follow drag -> :style="{ top: getCoords.y - 100 + 'px', left: getCoords.x + 30 + 'px' }" -->
  <div
    v-if="infoPopupShow && this.currentTopic"
    ref="popup"
    class="ss-info-panel"
    :class="{ centeredFocus: centerFocusPosition }"
    :style="{
      top: centerFocusPosition ? infoPopupPosition.y : infoPopupPosition.y - 100 + 'px',
      left: centerFocusPosition ? infoPopupPosition.x : infoPopupPosition.x + 30 + 'px',
    }"
    @mouseover="$emit('focus')"
    @mouseleave="$emit('blur')"
  >
    <div class="ss-preview">
      <!-- Preview: Solar System -->
      <SolarSystem
        :topic="
          teacher ? getTopicById(this.currentTopic.id) : getPersonsTopicById(this.currentTopic.id)
        "
        :tasks="tasks"
        :size="'0.25em'"
      />
      <v-icon v-if="checkIfTopicLocked()" color="missionAccent" class="ss-lock-button">
        {{ mdiLockOutline }}
      </v-icon>
      <v-btn
        v-else
        class="view-ss-button pa-5"
        dark
        small
        color="missionAccent"
        outlined
        tile
        @click="routeToSolarSystem"
      >
        View System
      </v-btn>
      <div class="ss-details-buttons mr-2">
        <v-btn icon small color="missionAccent" class="close-button" @click="close">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
        <v-btn
          v-if="teacher"
          class="my-2"
          icon
          dark
          x-small
          color="baseAccent"
          title="Edit"
          @click="showEditDialog"
        >
          <v-icon>{{ mdiPencil }}</v-icon>
        </v-btn>
      </div>
    </div>
    <!-- Preview: Topic Label -->
    <div class="ss-details overline">
      {{ currentTopic.label }}
    </div>
    <!-- Preview: Table of Topic's Tasks -->
    <div v-if="!checkIfTopicLocked()" class="ss-missions">
      <div v-if="tasks.length == 0">
        <h5 class="mission-text" style="text-align: center">NO MISSIONS SET</h5>
      </div>
      <template v-else>
        <div v-for="(task, index) in tasks" :key="task.id">
          <v-simple-table class="task-table">
            <tr>
              <!-- Table: Mission # -->
              <td style="width: 100px">
                <h5 class="mission-text text-left">MISSION {{ index + 1 }}:</h5>
              </td>
              <!-- Table: Title -->
              <td style="width: 200px">
                <h5 class="mission-text text-center">{{ task.title }}</h5>
              </td>
              <!-- Table: Duration -->
              <!-- <td style="width: 90px">
                <h5 class="mission-text">
                  {{ task.duration ? task.duration + " MINS" : "" }}
                </h5>
              </td> -->
              <!-- Table: Status -->
              <td v-if="!teacher" style="width: 100px">
                <h5 class="mission-text text-right" :class="getStatusColour(task.taskStatus)">
                  {{ task.taskStatus }}
                </h5>
              </td>
            </tr>
          </v-simple-table>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import SolarSystem from "@/components/Reused/SolarSystem.vue";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiLockOutline, mdiClose, mdiPencil } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "PopupSystemPreview",
  components: {
    SolarSystem,
  },
  props: [
    "infoPopupShow",
    "infoPopupPosition",
    "centerFocusPosition",
    "currentTopic",
    "tasks",
    "teacher",
  ],
  async mounted() {
    // set active mission
    this.activeMission = this.personsTopicsTasks.find(
      (topicObj) => topicObj.taskStatus == "active",
    );
    this.setCurrentTaskId(this.activeMission?.id);
  },
  computed: {
    ...mapState(useRootStore, [
      "person",
      "personsTopics",
      "currentCourseId",
      "currentTopicId",
      "personsTopicsTasks",
      "getTopicById",
      "getPersonsTopicById",
    ]),
  },
  data() {
    return {
      mdiLockOutline,
      mdiClose,
      mdiPencil,
      activeMission: null,
    };
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentTaskId", "setCurrentTopic", "setCurrentTopicId"]),
    getStatusColour(status) {
      if (status == "completed") {
        return "baseColour";
      } else if (status == "inreview") {
        return "cohortColour";
      } else if (status == "declined") {
        return "galaxyColour";
      } else {
        return "missionColour";
      }
    },
    checkIfTopicLocked() {
      for (const topic of this.personsTopics) {
        // find the topic node with status
        if (topic.id === this.currentTopic.id) {
          if (topic.topicStatus == "locked") {
            return true;
          }
        }
      }
    },
    showEditDialog() {
      this.setCurrentTopicId(this.currentTopic.id);
      this.setCurrentTopic(this.currentTopic);
      this.$emit("showEditDialog", this.currentTopic);
    },
    routeToSolarSystem() {
      // console.log("route to ss", this.currentTopic.id);
      // save current topic to store
      this.setCurrentTopicId(this.currentTopic.id);
      this.setCurrentTopic(this.currentTopic);
      // save active task to store if we know it
      const activeMission = this.personsTopicsTasks.find(
        (topicObj) => topicObj.taskStatus == "active",
      );
      if (activeMission) {
        this.setCurrentTaskId(activeMission.id);
      }
      // route to topic/solar system
      this.$router.push({
        name: "SolarSystemView",
        params: {
          courseId: this.currentCourseId,
          topicId: this.currentTopic.id,
          teacher: this.teacher,
        },
      });
    },
    close() {
      this.$emit("close");
    },
    deleteFromMap() {
      this.$emit("deleteFromMap");
    },
  },
};
</script>

<style lang="scss" scoped>
// POPUP
.ss-info-panel {
  // background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  position: absolute;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  z-index: 5;

  .ss-preview {
    min-width: 25vw;
    min-height: 20vh;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: hidden;

    .ss-lock-button {
      position: absolute;
      bottom: 20px; // matches 20px padding of ss-details
    }

    .view-ss-button {
      position: absolute;
      bottom: 20px; // matches 20px padding of ss-details
      background-color: var(--v-background-base);
    }

    .ss-details-buttons {
      position: absolute;
      top: 10px;
      right: 0px;
      padding: 0px !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
    }

    .close-button {
    }
  }

  .ss-details {
    border-top: 1px solid var(--v-missionAccent-base);
    padding: 20px;
    text-align: center;
    // color: var(--v-missionAccent-base);
    // font-size: 0.9rem;
    // text-transform: uppercase;
  }

  .ss-missions {
    border-top: 1px solid var(--v-missionAccent-base);
    background-color: var(--v-background-base);

    .mission-text {
      color: var(--v-missionAccent-base);
      padding: 10px;
      text-transform: uppercase;
    }

    .task-table {
      background-color: var(--v-background-base);

      td {
        // border: 1px red solid;
      }
    }
  }

  .info-panel-label {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.8rem;
  }

  .centeredFocus {
    margin-top: -100px;
    margin-left: 50px;
  }
}

.baseColour {
  color: var(--v-baseAccent-base) !important;
}

.cohortColour {
  color: var(--v-cohortAccent-base) !important;
}

.missionColour {
  color: var(--v-missionAccent-base) !important;
}

.galaxyColour {
  color: var(--v-galaxyAccent-base) !important;
}
</style>
