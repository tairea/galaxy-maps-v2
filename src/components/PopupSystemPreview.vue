<template>
  <!-- POPUP -->
  <!-- follow drag -> :style="{ top: getCoords.y - 100 + 'px', left: getCoords.x + 30 + 'px' }" -->
  <div
    v-if="infoPopupShow && this.currentTopic"
    ref="popup"
    class="ss-info-panel"
    :class="{ centeredFocus: centerFocusPosition }"
    :style="{
      top: centerFocusPosition
        ? infoPopupPosition.y
        : infoPopupPosition.y - 100 + 'px',
      left: centerFocusPosition
        ? infoPopupPosition.x
        : infoPopupPosition.x + 30 + 'px',
    }"
    @mouseover="$emit('focus')"
    @mouseleave="$emit('blur')"
  >
    <div class="ss-preview">
      <!-- Preview: Solar System -->
      <SolarSystem
        :topic="
          person.accountType == 'student'
            ? getPersonsTopicById(this.currentTopic.id)
            : getTopicById(this.currentTopic.id)
        "
        :tasks="tasks"
        :size="'0.25em'"
      />
      <v-icon
        v-if="checkIfTopicLocked()"
        color="missionAccent"
        class="ss-lock-button"
      >
        mdi-lock-outline
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
        <v-btn
          icon
          small
          color="missionAccent"
          class="close-button"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-btn
          v-if="person.accountType != 'student'"
          class="my-2"
          icon
          dark
          x-small
          color="baseAccent"
          title="Edit"
          @click="editNode"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          v-if="person.accountType != 'student'"
          icon
          dark
          x-small
          color="red"
          title="Delete"
          @click="deleteFromMap"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>
    </div>
    <!-- Preview: Topic Label -->
    <div class="ss-details">
      {{ currentTopic.label }}
    </div>
    <!-- Preview: Table of Topic's Tasks -->
    <div class="ss-missions">
      <div v-if="tasks.length == 0">
        <h5 class="mission-text" style="text-align: center">NO MISSIONS SET</h5>
      </div>
      <div v-else v-for="(task, index) in tasks" :key="task.id">
        <v-simple-table class="task-table">
          <tr>
            <td>
              <h5 class="mission-text">MISSION {{ index + 1 }}:</h5>
            </td>
            <td>
              <h5 class="mission-text">{{ task.title }}</h5>
            </td>
            <td v-if="task.duration">
              <h5 class="mission-text">{{ task.duration }} MINS</h5>
            </td>
          </tr>
        </v-simple-table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

import { db } from "../store/firestoreConfig";

import SolarSystem from "../components/SolarSystem";

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
  ],
  async mounted() {
    console.log("topics tasks from popup === ", this.tasks);
    // this.getTopicTasks();

    // bind tasksbytopic here aka on preview
    // await this.$store.dispatch("bindTasksByTopicId", {
    //   courseId: this.currentCourseId,
    //   topicId: this.currentTopicId,
    // });
  },
  computed: {
    ...mapState([
      "person",
      "personsTopics",
      "currentCourseId",
      "currentTopicId",
      "personsTopicsTasks",
    ]),
    ...mapGetters(["getTopicById", "getPersonsTopicById"]),
  },
  data() {
    return {
      topicTasks: [],
      hoverPopup: false,
    };
  },
  methods: {
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
    editNode() {
      this.$emit("editNode");
    },
    getTopicTasks() {
      // console.log("node = ", this.currentTopic.id);
      // get the topics for this current node
      let topic =
        this.person.accountType == "student"
          ? this.getPersonsTopicById(this.currentTopic.id)
          : this.getTopicById(this.currentTopic.id);
      // console.log("topic = ", topic);
      if (!topic) {
        return;
      }
      this.topicTasks = topic.tasks;
      return this.topicTasks;
    },
    routeToSolarSystem() {
      // console.log("route to ss", this.currentTopic.id);
      // save current topic to store
      this.$store.commit("setCurrentTopicId", this.currentTopic.id);
      // route to topic/solar system
      this.$router.push({
        name: "SolarSystemView",
        params: {
          topicId: this.currentTopic.id,
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
  z-index: 3;

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
  }

  .ss-missions {
    border-top: 1px solid var(--v-missionAccent-base);
    background-color: var(--v-background-base);

    .task-table {
      background-color: var(--v-background-base);
    }
  }

  .info-panel-label {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.8rem;
  }

  .mission-text {
    color: var(--v-missionAccent-base);
    padding: 10px 20px;
  }

  .centeredFocus {
    margin-top: -100px;
    margin-left: 50px;
  }
}
</style>
