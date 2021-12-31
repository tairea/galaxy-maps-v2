<template>
  <div class="mission-container">
    <h2 class="missions-label">Missions</h2>

    <div v-if="tasks.length > 0" style="width: 100%">
      <div v-for="(task, index) in tasks" :key="task.id">
        <MissionsCard
          :task="task"
          :id="task.id"
          :index="index"
          :topicId="topicId"
        />
      </div>
    </div>

    <div v-else style="width: 100%">
      <p class="no-missions-label">No Missions in this system</p>
    </div>

    <div class="createButton" v-if="person.accountType != 'student'">
      <CreateEditDeleteMissionDialog :topicId="topicId" />
    </div>
  </div>
</template>

<script>
import MissionsCard from "../components/MissionsCard";
import CreateEditDeleteMissionDialog from "../components/CreateEditDeleteMissionDialog";

import { mapGetters } from "vuex";

export default {
  name: "MissionsList",
  components: {
    MissionsCard,
    CreateEditDeleteMissionDialog,
  },
  props: ["tasks", "topicId"],
  computed: {
    ...mapGetters(["person"]),
  },
  data() {
    return {};
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
  overflow-x: hidden; /* Hide horizontal scrollbar */
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
  // letter-spacing: 2px;
}
</style>
