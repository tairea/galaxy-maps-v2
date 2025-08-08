<template>
  <div class="galaxyInfoPanel" :style="show ? 'right: 0px' : ''">
    <div class="panelContent">
      <!-- Loading spinner -->
      <div
        v-if="!selectedTopic && !topicError"
        class="panelContentInner d-flex flex-column justify-center align-center"
        style="padding: 50px"
      >
        <v-btn :loading="!selectedTopic" icon color="missionAccent"></v-btn>
        <p class="overline missionAccent--text">Loading system</p>
      </div>

      <!-- Error message -->
      <div
        v-else-if="topicError"
        class="panelContentInner d-flex flex-column justify-center align-center"
        style="padding: 50px"
      >
        <v-icon large color="missionAccent">{{ mdiAlert }}</v-icon>
        <p class="overline missionAccent--text mt-4">{{ topicError }}</p>
      </div>

      <!-- Loaded Panel -->
      <div class="panelContentInner" v-else-if="selectedTopic">
        <!-- X (close) button -->
        <v-btn icon small color="missionAccent" class="close-button mt-2" @click="closeInfoPanel">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>

        <!-- Panel header -->
        <div class="topOfPanel">
          <div class="topicTitleContainer">
            <!-- Node image (as requested by Dion) -->
            <div
              v-if="selectedTopic.image"
              class="d-flex justify-center align-center ml-2"
              style="height: 40px"
            >
              <img :src="selectedTopic.image" style="height: 80%; object-fit: contain" />
            </div>
            <div v-else>
              <p
                class="topicTitle overline"
                :style="
                  selectedTopic.color
                    ? 'color:' + selectedTopic.color
                    : 'color:var(--v-missionAccent-base)'
                "
              >
                {{ selectedTopic.label }}
              </p>
              <!-- <p
                v-if="selectedTopic.description"
                class="topicTitle caption pt-0"
                :style="
                  selectedTopic.color
                    ? 'color:' + selectedTopic.color
                    : 'color:var(--v-missionAccent-base)'
                "
                style="font-weight: 400"
              >
                {{ selectedTopic.description }}
              </p> -->
            </div>
            <v-btn
              v-if="teacher"
              icon
              x-small
              color="missionAccent"
              class="ml-2 mt-3"
              alt="Edit Topic"
              @click="editNode"
            >
              <v-icon>{{ mdiPencil }}</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Panel Content (mission cards) -->
        <div class="card-container">
          <div v-if="tasks.length == 0" class="noMissionWarningContainer">
            <p class="noMissionWarning">This system has no missions.</p>
            <p class="noMissionWarning mt-6">
              <strong>Systems must have at least one mission</strong>
            </p>
          </div>
          <!-- list of Mission cards -->
          <div
            v-for="(task, index) in sortTasks"
            :key="task.id"
            class="task-card"
            :style="[task.taskStatus == 'locked' ? { opacity: 0.4 } : { opacity: 1 }]"
            v-on="enableClick ? { click: routeToSolarSystem } : {}"
            :class="enableClick ? '' : 'no-click'"
          >
            <div class="number-title-container">
              <p class="task-number overline">MISSION {{ index + 1 }}</p>
              <p class="task-title m0">{{ task.title }}</p>
            </div>
            <div class="status-container">
              <p
                v-if="task.taskStatus != 'locked'"
                class="task-status overline m0 text-center"
                :class="{
                  completed: task.taskStatus == 'completed',
                  locked: task.taskStatus == 'locked',
                  inreview: task.taskStatus == 'inreview',
                  active: task.taskStatus == 'active',
                }"
              >
                {{ task.taskStatus }}
              </p>
              <v-icon v-else color="missionAccent" class="lock-icon">{{ mdiLock }}</v-icon>
            </div>
          </div>
        </div>

        <!-- Panel Actions (buttons) -->
        <div v-if="enableClick" class="bottom">
          <!-- TEACHER OR STUDENT -->
          <v-btn
            v-if="teacher || student"
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

          <!-- NOT-SIGNED-IN-USER -->
          <div v-else-if="!user.loggedIn" class="mt-8">
            <!-- Signin Dialog -->
            <LoginDialog />
          </div>

          <!-- SIGNED IN STUDENT, BUT NOT YET ENROLLED -->
          <v-btn
            v-else
            class="view-ss-button-start"
            dark
            small
            elevation="10"
            color="galaxyAccent"
            title="View Galaxy"
            @click="startThisGalaxy"
            :loading="loading"
          >
            <p class="ma-3 background--text">
              Start <br />
              {{ course.title }} <br />
              Galaxy
            </p>
          </v-btn>

          <!-- <div v-if="loading" style="width: 100%">
            <p class="starting-status ma-0">{{ startingGalaxyStatus }}</p>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  // fetchCourseByCourseId,
  fetchCohortByCohortId,
  addMeToCohort,
  assignCourseToMe,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import { mdiClose, mdiPencil, mdiLock, mdiAlert } from "@mdi/js";
import { mapActions, mapState } from "pinia";
import LoginDialog from "@/components/Dialogs/LoginDialog.vue";

export default {
  name: "SolarSystemInfoPanel",
  props: ["show", "course", "selectedTopic", "tasks", "topicError"],
  components: { LoginDialog },
  data() {
    return {
      mdiClose,
      mdiPencil,
      mdiLock,
      mdiAlert,
      allCourses: [],
      selectedGalaxy: false,
      activeLearning: null,
      activeTeaching: null,
      activePublic: null,
      currentCourse: null,
      loading: false,
    };
  },
  async mounted() {
    // this.currentCourse = await fetchCourseByCourseId(this.currentCourseId);
    // console.log("selected topic is:", this.selectedTopic);
  },
  computed: {
    ...mapState(useRootStore, ["person", "user"]),
    // filteredTasks() {
    //   return this.tasks.filter((task) => task.topicId == this.selectedTopic);
    // },
    enableClick() {
      console.log("click");
      if (this.course.presentationOnly && !this.teacher) return false;
      return true;
    },
    teacher() {
      return (
        this.course?.mappedBy?.personId === this.person?.id ||
        this.user.data?.admin ||
        (this.course?.collaboratorIds && this.course.collaboratorIds.includes(this.person?.id))
      );
    },
    student() {
      return this.person?.assignedCourses?.some((courseId) => courseId === this.course.id);
    },
    sortTasks() {
      return this.tasks.sort((a, b) => a.orderIndex - b.orderIndex);
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentTaskId", "setCurrentTopicId", "setCurrentCourseId"]),
    closeInfoPanel() {
      this.$emit("closeInfoPanel");
    },
    editNode() {
      this.$emit("editNode", this.selectedTopic);
    },
    routeToSolarSystem() {
      // console.log("route to ss", this.currentTopic.id);
      // save current topic to store
      this.setCurrentTopicId(this.selectedTopic.id);
      // save active task to store if we know it
      const activeMission = this.tasks.find((topicObj) => topicObj.taskStatus == "active");
      if (activeMission) {
        this.setCurrentTaskId(activeMission.id);
      }
      // route to topic/solar system
      this.$router.push({
        name: "SolarSystemView",
        params: {
          courseId: this.course.id,
          topicId: this.selectedTopic.id,
          teacher: this.teacher,
        },
      });
    },
    async startThisGalaxy() {
      this.loading = true;
      // add this galaxy metadata (eg. topics) to this persons course database

      // save current course to store
      this.setCurrentCourseId(this.course.id);

      // 5) assign student to cohort and course
      const cohort = await fetchCohortByCohortId(this.course.cohort);
      await addMeToCohort(cohort.id);
      await assignCourseToMe(this.course.id);

      this.loading = false;

      // this.$router.push({
      //   name: "GalaxyView",
      //   params: {
      //     courseId: this.course.id,
      //     role: "student",
      //   },
      // });

      // emit enroled in course. reload GalaxyMap
      this.$emit("enrolledInCourse");
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxyInfoPanel {
  background: var(--v-background-darken1);
  width: 350px;
  height: 600px;
  position: fixed;
  top: calc(50% - 300px);
  right: -350px;
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
      overflow-y: auto;
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
        height: calc(73% + 25px);
        overflow-y: auto;
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

        .task-card {
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
          cursor: default;

          &:not(.no-click) {
            cursor: pointer;
          }

          .number-title-container {
            width: 70%;

            .task-number {
              font-size: 0.7rem !important;
              margin: 0px;
            }

            .task-title {
              margin: 0px;
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

        .task-card:last-child {
          margin-bottom: 50px;
        }
      }

      .bottom {
        position: absolute;
        bottom: 23px;
        width: 99%;
        height: 75px;
        border-top: 1px solid var(--v-missionAccent-base);
        margin-left: 1px;

        display: flex;
        justify-content: center;
        align-items: center;

        background: var(--v-background-darken1);

        .view-ss-button {
          width: 70%;
          margin-top: 20px;
          background-color: var(--v-background-base);
        }

        .view-ss-button-start {
          width: 70%;
          margin-top: 20px;
          background-color: var(--v-background-base);
          height: auto;
          padding: 5px 10px;
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
