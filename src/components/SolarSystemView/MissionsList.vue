<template>
  <div class="mission-container">
    <h2 class="missions-label">Missions</h2>

    <div style="width: 100%">
      <!-- loading spinner -->
      <div class="d-flex justify-center align-center" style="padding: 50px" v-if="missionsLoading">
        <v-btn :loading="missionsLoading" icon color="missionAccent"></v-btn>
      </div>
      <div v-else-if="tasks.length > 0" style="width: 100%">
        <v-expansion-panels flat :multiple="false" v-model="indexOfActiveTask">
          <draggable
            v-model="sortableMissionList"
            style="width: 100%"
            ghost-class="ghost"
            :disabled="!teacher"
          >
            <transition-group name="fade">
              <v-expansion-panel
                class="mission-expansions"
                v-for="(task, index) in sortableMissionList"
                :key="task.id"
                @click="missionClicked(task)"
                :readonly="task.taskStatus == 'locked' || task.taskStatus == 'unlocked' || teacher"
                :value="task.taskStatus == 'active'"
              >
                <MissionsCard
                  :course="course"
                  :topic="topic"
                  :task="task"
                  :index="index"
                  :topicActive="topicActive"
                  :teacher="teacher"
                  :tasks="tasks"
                  @missionActivated="missionActivated"
                  @missionStarted="missionStarted"
                  @missionSubmittedForReview="missionSubmittedForReview"
                  @missionCompleted="missionCompleted"
                  @taskUpdated="taskUpdated"
                  @taskDeleted="taskDeleted"
                />
              </v-expansion-panel>
            </transition-group>
          </draggable>
        </v-expansion-panels>
      </div>
      <div v-else style="width: 100%">
        <p class="no-missions-label">No Missions in this system</p>
      </div>
    </div>

    <div class="createButton mt-8" v-if="teacher">
      <CreateEditDeleteMissionDialog
        :course="course"
        :topic="topic"
        @taskCreated="taskCreated"
        :tasks="tasks"
      />
    </div>
  </div>
</template>

<script>
import MissionsCard from "@/components/SolarSystemView/MissionsList/MissionsCard.vue";
import CreateEditDeleteMissionDialog from "@/components/Dialogs/CreateEditDeleteMissionDialog.vue";
import useRootStore from "@/store/index";
import { mapState, mapActions } from "pinia";
import draggable from "vuedraggable";

export default {
  name: "MissionsList",
  components: {
    MissionsCard,
    CreateEditDeleteMissionDialog,
    draggable,
  },
  props: ["course", "topic", "tasks", "teacher", "disableCreateMission", "loading"],
  data() {
    return {
      activeMission: false,
      topicActive: false,
      indexOfActiveTask: -1,
      missionsLoading: true,
      topicsTasks: [],
      lastDraggedContext: null,
    };
  },
  async mounted() {
    // get active task index for expansion panel vmodel (to expand 'active' task on load)
    this.checkActiveTask();
    this.missionsLoading = false;
    this.topicsTasks = [...this.tasks];
  },
  watch: {
    tasks: {
      handler(newVal, oldVal) {
        this.topicsTasks = [...newVal];
      },
    },
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    sortableMissionList: {
      get() {
        return this.topicsTasks;
      },
      set(value) {
        for (let i = 0; i < value.length; i++) {
          value[i].orderIndex = i;
        }
        // this works. value is the correct order with correct orderIndexes
        console.log("draggable => set:", value);
        // update topicTasks
        this.topicsTasks = value;
        this.$emit("taskOrderChanged", value);
      },
    },
  },
  methods: {
    missionClicked(task) {
      this.$emit("task", task);
    },
    missionActivated(taskId) {
      this.checkActiveTask();
      this.$emit("missionActivated", taskId);
    },
    missionStarted(taskId) {
      this.$emit("missionStarted", taskId);
    },
    missionSubmittedForReview(taskId) {
      this.$emit("missionSubmittedForReview", taskId);
    },
    missionCompleted(taskId) {
      this.$emit("missionCompleted", taskId);
    },
    checkActiveTask() {
      this.indexOfActiveTask = this.tasks.findIndex((object) => {
        return object.taskStatus == "active" || object.taskStatus == "declined";
      });
      if (this.topic.topicStatus === "active") {
        this.topicActive = true;
      }
    },
    taskCreated(task) {
      this.$emit("taskCreated", task);
    },
    taskUpdated(task) {
      console.log("task updated inner", task);
      this.$emit("taskUpdated", task);
    },
    taskDeleted(task) {
      this.$emit("taskDeleted", task);
    },
  },
};
</script>

<style lang="scss">
a {
  color: var(--v-missionAccent-base) !important;
}

.mission-container {
  width: calc(100% - 30px);
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  border: 1px solid var(--v-missionAccent-base);
  position: relative;
  overflow: scroll;
  overflow-x: hidden;
  /* Hide horizontal scrollbar */
}

.mission-container ::-webkit-scrollbar {
  display: none;
}

.missions-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: -1px;
  left: -1px;
  background-color: var(--v-missionAccent-base);
  color: var(--v-background-base);
  padding: 0px 15px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
}

.no-missions-label {
  text-align: center;
  text-transform: uppercase;
  color: var(--v-missionAccent-base);
  font-size: 0.8rem;
  margin-top: 50px;
  // letter-spacing: 2px;
}

.mission-expansions {
  background-color: transparent !important;
}

.v-expansion-panel-header__icon {
  display: none;
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

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>
