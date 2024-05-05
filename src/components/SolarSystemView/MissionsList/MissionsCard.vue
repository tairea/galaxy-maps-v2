<template>
  <div>
    <v-expansion-panel-header class="py-0">
      <div
        class="mission-card"
        :class="{ lockedOpacity: task.taskStatus == 'locked' }"
        :style="task.color ? 'border: 1px dashed ' + task.color + ' !important' : ''"
      >
        <div class="mission-section mission-number-section">
          <p
            class="text-overline text-uppercase"
            :style="task.color ? 'color:' + task.color + ' !important' : ''"
          >
            Mission
          </p>
          <p
            class="mission-number"
            :style="task.color ? 'color:' + task.color + ' !important' : ''"
          >
            {{ index + 1 }}
          </p>
          <!-- EDIT BUTTON -->
          <div v-if="teacher">
            <CreateEditDeleteMissionDialog
              :edit="true"
              :course="course"
              :topic="topic"
              :taskId="task.id"
              :taskToEdit="task"
              :index="index"
              :taskColor="task.color"
            />
          </div>
        </div>
        <div
          class="mission-middle-section mission-main-section"
          :style="task.color ? 'border-left: 1px dashed ' + task.color + ' !important' : ''"
        >
          <!-- TITLE -->
          <h1
            class="mission-title pa-4"
            :style="task.color ? 'color:' + task.color + ' !important' : ''"
          >
            {{ task.title }}
          </h1>
          <!-- DESCRIPTION -->
          <div
            v-if="teacher"
            v-html="task.description"
            class="task-description"
            :style="task.color ? 'color:' + task.color + ' !important' : ''"
          ></div>
        </div>

        <!-- <div class="mission-section mission-section-overUnder">
      
      <div class="section-overUnder">
        <a
          v-if="task.video"
          :href="task.video"
          target="_blank"
          class="text-overline text-uppercase"
          >Video</a
        >
        <p v-else class="text-overline text-uppercase" style="color: #707070">
          Video
        </p>
      </div>
      
      <div class="section-overUnder">
        <a
          v-if="task.slides"
          :href="task.slides"
          target="_blank"
          class="text-overline text-uppercase"
          >Slides</a
        >
        <p v-else class="text-overline text-uppercase" style="color: #707070">
          Slides
        </p>
      </div>
    </div> -->

        <div v-if="!teacher" class="mission-section mission-section-overUnder">
          <div v-if="task.duration" class="section-overUnder d-flex justify-center flex-column">
            <p
              class="text-overline text-uppercase text-center"
              :style="task.color ? 'color:' + task.color + ' !important' : ''"
            >
              Estimated Duration:
            </p>
            <p class="text-center" :style="task.color ? 'color:' + task.color + ' !important' : ''">
              {{ task.duration }}
            </p>
          </div>
          <div class="section-overUnder d-flex justify-center flex-column">
            <p
              class="text-overline text-uppercase text-center"
              :style="task.color ? 'color:' + task.color + ' !important' : ''"
            >
              SUBMISSION REQ:
            </p>
            <p :style="[task.submissionRequired ? { color: '#FAF200' } : '']">
              {{ task.submissionRequired ? "YES" : "NO" }}
            </p>
          </div>
        </div>

        <!-- MISSION STATUS -->
        <div
          v-if="!teacher"
          class="mission-section d-flex justify-center align-center flex-column"
          style="width: 20%"
          :class="{
            'topic-in-review': inreview,
            'topic-completed': completed,
            'topic-active': active || declined,
          }"
        >
          <p class="text-overline text-uppercase text-center">
            {{
              completed
                ? "COMPLETED"
                : inreview
                ? "IN REVIEW"
                : unlocked
                ? "START MISSION"
                : active
                ? "ACTIVE MISSION"
                : declined
                ? "RETRY MISSION"
                : "LOCKED"
            }}
          </p>

          <div v-if="unlocked" class="d-flex justify-center">
            <!-- Start Mission button -->
            <StartMissionDialogV2
              :course="course"
              :topic="topic"
              :task="task"
              :topicActive="topicActive"
            />
          </div>
          <div
            v-else-if="active || declined || completed || inreview"
            class="d-flex justify-center"
          >
            <v-icon
              :color="active || completed || declined ? 'baseAccent' : 'cohortAccent'"
              large
              >{{ mdiCheck }}</v-icon
            >
          </div>
          <div v-else class="d-flex justify-center align-center">
            <v-btn color="missionAccent" icon large>
              <v-icon large>{{ mdiLockOutline }}</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- TEACHER VIEW (for type teacher) -->
        <div
          v-else
          class="three-vertical-section"
          :style="task.color ? 'border-left: 1px dashed ' + task.color + ' !important' : ''"
        >
          <div class="three-vertical-section-overUnder">
            <!-- duration -->
            <div
              v-if="task.duration"
              class="d-flex justify-center flex-column three-vertical pa-4 duration"
              :class="taskColorClass"
            >
              <p
                class="text-overline text-uppercase text-center"
                :style="task.color ? 'color:' + task.color + ' !important' : ''"
              >
                Est. Duration:
              </p>
              <p
                class="text-center"
                :style="task.color ? 'color:' + task.color + ' !important' : ''"
              >
                {{ task.duration }} MINUTES
              </p>
            </div>
            <!-- end duration -->
            <!-- submission req -->
            <div
              class="d-flex justify-center flex-column three-vertical pa-4 submission"
              :class="taskColorClass"
            >
              <p
                class="text-overline text-uppercase text-center"
                :style="task.color ? 'color:' + task.color + ' !important' : ''"
              >
                SUBMISSION REQ:
              </p>
              <p class="text-center" :style="[task.submissionRequired ? { color: '#FAF200' } : '']">
                {{ task.submissionRequired ? "YES" : "NO" }}
              </p>
              <div
                v-if="task.submissionInstructions"
                v-html="task.submissionInstructions"
                class="submissions-instructions"
              ></div>
            </div>
            <!-- end submission req -->
            <!-- mission links -->
            <!-- <div class="three-vertical">
              <p class="text-overline text-uppercase text-center">
                Mission Links:
              </p>
              <div class="d-flex justify-center flex-column mt-2">
                <v-btn
                  color="missionAccent"
                  outlined
                  x-small
                  :disabled="!task.video || !task.video.length"
                >
                  LINK TO VIDEO
                </v-btn>
                <v-btn
                  color="missionAccent"
                  outlined
                  class="mt-2"
                  x-small
                  :disabled="!task.slides || !task.slides.length"
                >
                  LINK TO SLIDES
                </v-btn>
              </div>
            </div> -->
            <!-- end mission links -->
          </div>
        </div>
      </div>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <!-- expansion content -->
      <ActiveMissionsCard
        v-if="active || declined"
        :course="course"
        :topic="topic"
        :task="task"
        :active="active"
        :declined="declined"
      />
      <SelectedMissionsCard v-else :task="task" :completed="completed" :inreview="inreview" />
    </v-expansion-panel-content>
  </div>
</template>

<script>
import CreateEditDeleteMissionDialog from "@/components/Dialogs/CreateEditDeleteMissionDialog.vue";
import StartMissionDialogV2 from "@/components/Dialogs/StartMissionDialogV2.vue";
import ActiveMissionsCard from "@/components/SolarSystemView/MissionsList/MissionsCard/ActiveMissionsCard.vue";
import SelectedMissionsCard from "@/components/SolarSystemView/MissionsList/MissionsCard/SelectedMissionsCard.vue";
import useRootStore from "@/store/index";
import { mdiCheck, mdiLockOutline } from "@mdi/js";
import { mapState } from "pinia";

export default {
  name: "MissionsCard",
  components: {
    CreateEditDeleteMissionDialog,
    StartMissionDialogV2,
    ActiveMissionsCard,
    SelectedMissionsCard,
  },
  props: ["course", "topic", "task", "index", "teacher", "topicActive"],
  data() {
    return {
      mdiCheck,
      mdiLockOutline,
      editing: false,
      activeTask: false,
      panel: [],
      taskSlides: false,
      taskVideo: false,
    };
  },
  watch: {
    task: {
      deep: true,
      handler(newVal, oldVal) {
        if (oldVal.taskStatus == "unlocked" && newVal.taskStatus == "active") {
          this.$emit("missionActivated");
        }
      },
    },
  },
  computed: {
    ...mapState(useRootStore, ["personsTopics", "person"]),
    active() {
      return this.task.taskStatus == "active";
    },
    declined() {
      return this.task.taskStatus == "declined";
    },
    completed() {
      return this.task.taskStatus == "completed";
    },
    inreview() {
      return this.task.taskStatus == "inreview";
    },
    unlocked() {
      return this.task.taskStatus == "unlocked";
    },
    taskColorClass() {
      switch (this.task.color) {
        case "#69A1E2FF":
          return "border-top-missionAccent";
        case "#E269CFFF":
          return "border-top-galaxyAccent";
        case "#00E676FF":
          return "border-top-baseAccent";
        case "#FAF200FF":
          return "border-top-cohortAccent";
        default:
          return "";
      }
    },
  },
  methods: {},
};
</script>

<style lang="scss">
pre {
  background-color: #23241f;
  color: #f8f8f2;
  overflow: visible;
  padding: 10px;
}

li,
pre {
  margin-bottom: 16px;
}

.task-description > p,
.task-description > ol > li,
.task-description > ul > li {
  line-height: 20px !important;
}
.task-description {
  width: 100%;
}
.task-description a {
  color: var(--v-galaxyAccent-base) !important;
}

.task-description > p > img {
  width: 100%;
}

iframe.ql-video {
  width: 100% !important;
  height: 300px !important;
}
</style>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

.lockedOpacity {
  opacity: 0.4;
}

.mission-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;
  height: auto;

  .mission-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    padding: 20px;
    flex-grow: 1;
  }

  .mission-middle-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    flex-grow: 1;

    .task-description {
      padding: 0px 16px 16px 16px;
    }
  }

  .mission-number-section {
    border-left: none;

    .mission-number {
      font-size: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .topic-in-review {
    border: 1px solid var(--v-cohortAccent-base);
    color: var(--v-cohortAccent-base);
  }

  .topic-declined {
    border: 1px solid var(--v-cohortAccent-base);
    color: var(--v-cohortAccent-base);
  }

  .topic-completed,
  .topic-active {
    border: 1px solid var(--v-baseAccent-base);
    color: var(--v-baseAccent-base);
  }

  // .topic-active {
  //   border-top: 1px solid var(--v-baseAccent-base);
  //   border-right: 1px solid var(--v-baseAccent-base);
  //   border-left: 1px solid var(--v-baseAccent-base);
  //   border-bottom: 3px solid var(--v-background-base);
  //   color: var(--v-baseAccent-base);
  //   z-index: 101;
  // }

  .mission-main-section {
    // flex-grow: 4 !important;
    width: 40%;
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;

    .mission-edit-button {
      // position: absolute;
      // bottom: 10px;
      // left: 10px;
      font-size: 0.7rem;
    }
  }

  .mission-title {
    font-size: 1.2rem;
    color: var(--v-missionAccent-base);
    font-weight: 600;
    text-transform: uppercase;
    margin: 5px 0px;
  }

  .mission-number-section {
    flex-grow: 0 !important;
    flex-shrink: 1 !important;
  }

  .mission-section-overUnder {
    padding: 0px !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .section-overUnder {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 100%;
      height: 100%;
      padding: 10px;
    }

    .section-overUnder:first-child {
      border-bottom: 1px dashed var(--v-missionAccent-base);
    }
  }

  .three-vertical-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);

    width: 30%;

    .three-vertical-section-overUnder {
      padding: 0px !important;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;

      .three-vertical {
        width: 100%;
        // height: 50%;
        display: flex;
        // flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .duration {
        height: 30%;
      }

      .three-vertical:not(:first-child) {
        border-top: 1px dashed var(--v-missionAccent-base);
      }

      .border-top-missionAccent {
        border-top: 1px dashed var(--v-missionAccent-base) !important;
      }
      .border-top-galaxyAccent {
        border-top: 1px dashed var(--v-galaxytAccent-base) !important;
      }
      .border-top-baseAccent {
        border-top: 1px dashed var(--v-baseAccent-base) !important;
      }

      .border-top-cohortAccent {
        border-top: 1px dashed var(--v-cohortAccent-base) !important;
      }
    }
  }
}

.submissions-instructions {
  color: var(--v-cohortAccent-base);
  font-size: 0.8rem;
  font-style: italic;
  margin: 20px 0px;
  padding: 10px;
  padding-top: 26px;
  border: 1px solid var(--v-cohortAccent-base);
  border-radius: 5px;
  // display: flex;
  // justify-content: center;
  // align-items: center;
  // flex-direction: column;
}

.v-application p {
  margin-bottom: 0px !important;
}
</style>
