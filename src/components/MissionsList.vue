<template>
  <div class="mission-container">
    <h2 class="missions-label">Missions</h2>

    <div v-if="tasks" style="width:100%">
      <div v-for="(task, index) in tasks" :key="task.id" class="mission-card">
        <div class="mission-section mission-number-section">
          <p class="text-overline text-uppercase">Mission</p>
          <p style="font-size: 50px; text-align: center;">{{ index + 1 }}</p>
        </div>
        <div class="mission-section mission-main-section">
          <h1 class="mission-title">{{ task.title }}</h1>
          <p>{{ task.description }}</p>
        </div>
        <div class="mission-section mission-section-overUnder">
          <div class="section-overUnder">
            <a :href="task.video" class="text-overline text-uppercase "
              >Video</a
            >
          </div>
          <div class="section-overUnder">
            <a :href="task.slides" class="text-overline text-uppercase"
              >Slides</a
            >
          </div>
        </div>
        <div class="mission-section">
          <p class="text-overline text-uppercase">Duration:</p>
          <p style="font-size: 30px; text-align: center;">
            {{ task.duration }}
          </p>
        </div>
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
import CreateMission from "../components/CreateMission";

export default {
  name: "MissionsList",
  components: {
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

.mission-card {
  // width: 90%;
  // height: 400px;
  border: 1px dashed var(--v-missionAccent-base);
  margin: 10px;

  // background: var(--v-neon-base);
  display: flex;
}

h1 {
  color: white;
}

p {
  margin: 0px !important;
}

.mission-label {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base);
  font-weight: 400;
  text-transform: uppercase;
}

.mission-title {
  font-size: 1.2rem;
  color: var(--v-missionAccent-base);
  font-weight: 600;
  text-transform: uppercase;
  margin: 5px 0px;
}

.mission-section {
  margin: 0px;
  color: var(--v-missionAccent-base);
  font-size: 0.9rem;
  border-left: 1px dashed var(--v-missionAccent-base);
  padding: 20px;
  flex-grow: 1;
}

.mission-main-section {
  flex-grow: 2 !important;
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
}

.section-overUnder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.section-overUnder:first-child {
  border-bottom: 1px dashed var(--v-missionAccent-base);
}
</style>
