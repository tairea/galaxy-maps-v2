<template>
  <div class="mission-container">
    <h2 class="missions-label">Missions</h2>

    <div style="width: 100%">
      <!-- loading spinner -->
      <div class="d-flex justify-center align-center" style="padding: 50px" v-if="missionsLoading">
        <v-btn :loading="missionsLoading" icon color="missionAccent"></v-btn>
      </div>
      <div v-else-if="tasks.length > 0" style="width: 100%">
        <v-expansion-panels :flat="true" :multiple="false" v-model="indexOfActiveTask">
          <v-expansion-panel
            class="mission-expansions"
            v-for="(task, index) in tasks"
            :key="task.id"
            @click="missionClicked(task)"
            :readonly="task.taskStatus == 'locked' || task.taskStatus == 'unlocked' || teacher"
            :value="task.taskStatus == 'active'"
          >
            <MissionsCard
              :task="task"
              :id="task.id"
              :index="index"
              :topicId="topicId"
              :topicActive="topicActive"
              :teacher="teacher"
              @missionActivated="missionActivated"
              @topicCompleted="topicCompleted"
            />
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
      <div v-else style="width: 100%">
        <p class="no-missions-label">No Missions in this system</p>
      </div>
    </div>

    <div class="createButton mt-8" v-if="teacher">
      <CreateEditDeleteMissionDialog :topicId="topicId" />
    </div>
  </div>
</template>

<script>
import MissionsCard from "@/components/MissionsCard.vue";
import CreateEditDeleteMissionDialog from "@/components/CreateEditDeleteMissionDialog.vue";
import useRootStore from "@/store/index";
import { mapState } from "pinia";

export default {
  name: "MissionsList",
  components: {
    MissionsCard,
    CreateEditDeleteMissionDialog,
  },
  props: ["tasks", "topicId", "teacher"],
  data() {
    return {
      activeMission: false,
      topicActive: false,
      indexOfActiveTask: [],
      missionsLoading: true,
    };
  },
  async mounted() {
    // get active task index for expansion panel vmodel (to expand 'active' task on load)
    this.checkActiveTask();
    await new Promise((resolve) => setTimeout(resolve, 2000)); // show loading for 2 sec
    this.missionsLoading = false;
  },
  computed: {
    ...mapState(useRootStore, ["person", "currentTopic"]),
  },
  methods: {
    missionClicked(task) {
      this.$emit("task", task);
    },
    missionActivated() {
      this.checkActiveTask();
      this.$emit("missionActivated");
    },
    checkActiveTask() {
      this.indexOfActiveTask = this.tasks.findIndex((object) => {
        return object.taskStatus == "active" || object.taskStatus == "declined";
      });
      if (this.currentTopic.topicStatus === "active") this.topicActive = true;
    },
    topicCompleted() {
      console.log("3");
      this.$emit("topicCompleted");
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
</style>
