<template>
  <v-menu v-model="show" :position-x="e.left" :position-y="e.top + 110">
    <div class="ss-info-panel">
      <p class="caption base-text">
        {{ payload.completedTasks }} out of {{ payload.totalTasks }} MISSIONS
        completed for SYSTEM:
        <span class="font-weight-bold">{{ payload.topic.toUpperCase() }}</span>
      </p>
      <p class="caption mission-text">
        {{ payload.completedTopics }} out of {{ payload.totalTopics }} SYSTEMS
        completed for GALAXY MAP:
        <span class="font-weight-bold galaxyAccent--text">{{
          payload.course.toUpperCase()
        }}</span>
      </p>
    </div>
  </v-menu>
</template>
<script>
export default {
  name: "PopupStudentProgress",
  props: ["show", "payload", "e"],
};
</script>

<style lang="scss" scoped>
// POPUP
.ss-info-panel {
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  backdrop-filter: blur(8px);
}
.base-text {
  margin: 5px;
  color: var(--v-baseAccent-base);
}
.mission-text {
  margin: 5px;
  color: var(--v-missionAccent-base);
}
</style>
