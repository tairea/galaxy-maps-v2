<template>
  <div class="galaxyInfoPanel" :style="show ? 'right: 0px' : ''">
    <div class="panelContent">
      <div class="panelContentInner" v-if="show">
        <v-btn
          icon
          small
          color="missionAccent"
          class="close-button mt-2"
          @click="closeInfoPanel"
        >
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
        <div class="topOfPanel">
          <div class="topicTitleContainer">
            <p class="topicTitle overline missionAccent--text">
              List of Systems & Missions
            </p>
            <!-- <v-btn
              v-if="teacher"
              icon
              x-small
              color="missionAccent"
              class="ml-2 mt-4"
              alt="Edit Topic"
              @click="editNode"
            >
              <v-icon>{{ mdiPencil }}</v-icon>
            </v-btn> -->
          </div>
        </div>

        <div class="card-container">
          <!-- Topic Card -->
          <div
            class="topic-card"
            v-for="topic of listOfTopics(currentCourseNodes)"
            :key="topic.id"
          >
            <!-- Topic -->
            <div class="topic-details overline missionAccent--text">
              {{ topic.label }}
            </div>
            <!-- Tasks -->
            <div class="topic-tasks">
              <div
                v-for="(task, index) in tasksInTopic(topic.id)"
                :key="task.id"
                class="task-card"
                @click="routeToSolarSystem(topic.id)"
              >
                <div class="number-title-container">
                  <p class="task-number overline">MISSION {{ index + 1 }}</p>
                </div>
                <div class="task-title-container">
                  <p class="task-title ma-0">{{ task.task.title }}</p>
                </div>
                <!-- <div class="status-container"></div> -->
              </div>
            </div>
          </div>
        </div>
        <!-- <div class="bottom">
            <v-btn
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
          </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { mdiClose, mdiPencil, mdiLock } from "@mdi/js";

export default {
  name: "ListModePanel",
  props: ["selectedTopic", "tasks", "show"],
  components: {},
  data() {
    return {
      mdiClose,
      mdiPencil,
    };
  },
  async mounted() {
    // console.log("selected topic is:", this.selectedTopic);
  },
  computed: {
    ...mapState([
      "person",
      "currentCourse",
      "currentCourseNodes",
      "courseTasks",
    ]),
    ...mapGetters(["getCourseById", "getTopicById", "person", "user"]),

    teacher() {
      return (
        this.currentCourse?.mappedBy?.personId === this.person.id ||
        this.user.data.admin
      );
    },
  },
  methods: {
    listOfTopics(topics) {
      return topics.sort(function (x, y) {
        return x.nodeCreatedTimestamp.seconds - y.nodeCreatedTimestamp.seconds;
      });
    },
    tasksInTopic(topicId) {
      // filter tasks with topic id
      return this.courseTasks.filter((task) => task.topicId == topicId);
    },
    closeInfoPanel() {
      this.$emit("closeInfoPanel");
    },
    editNode() {
      this.$emit("editNode", this.selectedTopic);
    },
    routeToSolarSystem(topicId) {
      // console.log("route to ss", this.currentTopic.id);
      // save current topic to store
      this.$store.commit("setCurrentTopicId", topicId);
      this.$store.commit("setCurrentTopic", this.getTopicById(topicId));
      // save active task to store if we know it
      const activeMission = this.courseTasks.find(
        (topicObj) => topicObj.taskStatus == "active"
      );
      if (activeMission) {
        this.$store.commit("setCurrentTaskId", activeMission.id);
      }
      // route to topic/solar system
      this.$router.push({
        name: "SolarSystemView",
        params: {
          topicId: topicId,
          teacher: this.teacher,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxyInfoPanel {
  background: var(--v-background-darken1);
  width: 550px;
  height: 600px;
  position: fixed;
  top: calc(50% - 300px);
  right: -550px;
  transition: all 0.3s ease-out;
  z-index: 200;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 95%);

  .panelContent {
    height: calc(100% - 40px);
    width: auto;
    margin: 20px 0px 30px 20px;
    background: var(--v-missionAccent-base);
    margin-right: -2px;
    position: relative;

    .panelContentInner {
      position: relative;
      height: 99%;
      width: 99.5%;
      overflow-y: hidden;
      overflow-x: hidden;

      .topOfPanel {
        border-bottom: 1px solid var(--v-missionAccent-base);
      }

      .topicTitleContainer {
        display: flex;
        width: 90%;
      }

      .topicTitle {
        // color: var(--v-missionAccent-base);
        font-weight: 800;
        padding: 10px 0px 10px 20px;
        margin: 0px;
      }

      .close-button {
        position: absolute;
        top: 0;
        right: 0;
      }

      .card-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        justify-content: flex-start;

        .noMissionWarningContainer {
          margin-top: 30%;
          width: 100%;

          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;

          .noMissionWarning {
            color: var(--v-missionAccent-base);
            font-size: 0.7rem;
            text-align: center;
            text-transform: uppercase;
          }
        }

        .task-card,
        .topic-card {
          border: 1px solid var(--v-missionAccent-base);
          padding: 10px;
          margin: 20px;
          margin-bottom: 0px;
          color: var(--v-missionAccent-base);
          width: calc(100% - 40px);
          font-size: 0.7rem;
          position: relative;
          align-self: start;
          display: flex;
          cursor: pointer;

          .topic-details {
            width: 20%;
          }

          .topic-tasks {
            width: 80%;
          }

          .number-title-container {
            width: 30%;
            display: flex;
            justify-content: start;
            align-items: start;

            .task-number {
              font-size: 0.7rem !important;
              margin: 0px;
            }
          }
          .task-title-container {
            width: 70%;
            display: flex;
            justify-content: start;
            align-items: center;

            .task-title {
              display: flex;
              justify-content: start;
              align-items: start;
              // margin-bottom: 20px;
            }
          }
          .status-container {
            width: 30%;
            display: flex;
            justify-content: center;
            align-items: center;

            .task-status,
            .lock-icon {
              margin-bottom: 0px !important;
              text-transform: uppercase;
              font-weight: 800;
              text-align: center;
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .completed {
              color: var(--v-baseAccent-base);
            }

            .inreview {
              color: var(--v-cohortAccent-base);
            }

            .active {
              color: var(--v-galaxyAccent-base);
            }
          }
        }

        .task-card {
          margin-top: 0px;
          margin-bottom: 20px;
        }
      }
    }

    .galaxyListPanelLabel {
      color: var(--v-galaxyAccent-base);
      position: relative;
      border-bottom: 1px solid var(--v-galaxyAccent-base);
    }

    .galaxyListPanelContent {
      color: var(--v-galaxyAccent-base);
      position: relative;
      font-size: 0.6rem;
      letter-spacing: 1px;
    }
  }

  .panelContent:before {
    content: "";
    width: 99%;
    height: calc(100% - 2px);
    background: var(--v-background-darken1);
    display: block;
    position: absolute;
    top: 1px;
    left: 1px;
  }

  .panelContent,
  .panelContent:before {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0% 95%);
  }
}

.galaxyListPanel:hover {
  left: 0px;
}

*::-webkit-scrollbar {
  width: 5px;
}

/* Track */
*::-webkit-scrollbar-track {
  background: var(--v-background-base);
  margin-top: 1px;
  margin-bottom: 25px;
}

/* Handle */
*::-webkit-scrollbar-thumb {
  background: var(--v-missionAccent-base);
}

/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}
</style>
