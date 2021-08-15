<template>
  <div class="mission-container">
    <h2 class="missions-label">Missions</h2>

    <div v-if="tasks" style="width:100%">
      <div v-for="(task, index) in tasks" :key="task.id">
        <MissionsCard :task="task" :index="index" :courseId="courseId"/>
      </div>
    </div>

    <div v-else style="width:100%">
      <p class="no-missions-label">No Missions</p>
    </div>

    <div class="createButton">
      <CreateMissionButtonDialog :courseId="courseId" />
    </div>
  </div>
</template>

<script>
import MissionsCard from "../components/MissionsCard";
import CreateMissionButtonDialog from "../components/CreateMissionButtonDialog";

export default {
  name: "MissionsList",
  components: {
    MissionsCard,
    CreateMissionButtonDialog,
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
