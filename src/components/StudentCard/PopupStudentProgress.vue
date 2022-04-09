<template>
 <v-menu
      v-model="show"
      :position-x="e.left"
      :position-y="e.top + 110"
    >
    <div class="ss-info-panel">
      <p class="caption base-text">
        {{payload.completedTopics}} out of {{payload.totalTopics}} topics completed for course: {{payload.course}}
      </p>
      <p class="caption mission-text">
        {{payload.completedTasks}} out of {{payload.totalTasks}} tasks completed for system: {{payload.topic}}
      </p>
    </div>
    </v-menu>
</template>
<script>

export default {
  name: "PopupStudentProgress",
  props: [
   "show", "payload", "e"
  ],

}
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
