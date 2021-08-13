<template>
  <div class="mission-container">
    <h2 class="missions-label">Missions</h2>

    <div v-if="tasks.length > 0" style="width:100%">
      <div v-for="task in tasks" :key="task.id" class="mission-card">
        <h1 class="mission-title">{{ task.name }}</h1>
        <p class="mission-description">{{ task.description }}</p>
        <p class="mission-description">Duration: {{ task.duration }}</p>
        <p class="mission-description">Video: {{ task.video }}</p>
        <p class="mission-description">Slides: {{ task.slides }}</p>
      </div>
    </div>

    <div v-else style="width:100%" >
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
    CreateMission
  },
  props: ["tasks", "courseId"],
  data() {
    return {
      // missions: [
      //   {
      //     title: "Mission 01",
      //     description: "This is mission 01",
      //     duration: 120,
      //     videoLink: "youtube.com",
      //     slidesLink: "slides.google.com"
      //   },
      //   {
      //     title: "Mission 02",
      //     description: "This is mission 02",
      //     duration: 190,
      //     videoLink: "youtube.com",
      //     slidesLink: "slides.google.com"
      //   },
      // ],
    };
  },
};
</script>

<style lang="scss">

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
  margin-bottom: 10px;
  padding: 20px;
  // background: var(--v-neon-base);
}

h1 {
  color: white;
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

.mission-description {
  margin-top: 10px;
  color: var(--v-missionAccent-base);
  font-size: 0.9rem;
}
</style>
