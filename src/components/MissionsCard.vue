<template>
  <div class="mission-card">
    <div class="mission-section mission-number-section">
      <p class="text-overline text-uppercase">Mission</p>
      <p style="font-size: 50px; text-align: center;">{{ index + 1 }}</p>
    </div>
    <div class="mission-section mission-main-section">
      <!-- TITLE -->
      <h1 class="mission-title">{{ task.title }}</h1>
      <!-- DESCRIPTION -->
      <p>{{ task.description }}</p>
      <!-- EDIT BUTTON -->
        <EditMissionButtonDialog :task="task" :index="index" :courseId="courseId"/>
    </div>
    <div class="mission-section mission-section-overUnder">
      <!-- VIDEO -->
      <div class="section-overUnder">
        <a v-if="task.video" :href="task.video" target="_blank" class="text-overline text-uppercase ">Video</a>
        <p v-else class="text-overline text-uppercase" style="color: #707070">Video</p>
      </div>
      <!-- SLIDES -->
      <div class="section-overUnder">
        <a v-if="task.slides" :href="task.slides" target="_blank" class="text-overline text-uppercase">Slides</a>
        <p v-else class="text-overline text-uppercase" style="color: #707070">Slides</p>
      </div>
    </div>
    <div class="mission-section">
      <!-- DURATION -->
      <p class="text-overline text-uppercase">Duration:</p>
      <p style="font-size: 30px; text-align: center;">
        {{ task.duration }}
      </p>
    </div>

    <!-- EDIT MISSION DIALOG-->

  </div>
</template>

<script>

import EditMissionButtonDialog from "../components/EditMissionButtonDialog";

export default {
  name: "MissionsCard",
  components: {
    EditMissionButtonDialog,
  },
  props: ["task", "index", "courseId"],
  data() {
    return {
      editing: false
    };
  },
};
</script>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

a {
  color: var(--v-missionAccent-base) !important;
}

.mission-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;

  .mission-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    padding: 20px;
    flex-grow: 1;
  }

  .mission-main-section {
    // flex-grow: 2 !important;
    width: 30%;
    position: relative;

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
    }

    .section-overUnder:first-child {
      border-bottom: 1px dashed var(--v-missionAccent-base);
    }
  }
}
</style>
