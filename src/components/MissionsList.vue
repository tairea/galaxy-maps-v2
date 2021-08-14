<template>
  <div class="mission-container">
    <h2 class="missions-label">Missions</h2>

    <div v-if="tasks" style="width:100%">
      <div v-for="(task, index) in tasks" :key="task.id">
        <MissionsCard :task="task" :index="index"/>
      </div>
    </div>

    <div v-else style="width:100%">
      <h2 class="mission-label">No Missions</h2>
    </div>

    <div class="createButton">
      <CreateMission :courseId="courseId" />
    </div>
  </div>
</template>

<script>
import MissionsCard from "../components/MissionsCard";
import CreateMission from "../components/CreateMission";

export default {
  name: "MissionsList",
  components: {
    MissionsCard,
    CreateMission,
  },
  props: ["tasks", "courseId"],
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
}

.missions-label {
  font-size: 0.8rem;
  color: var(--v-neon-base);
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

</style>
