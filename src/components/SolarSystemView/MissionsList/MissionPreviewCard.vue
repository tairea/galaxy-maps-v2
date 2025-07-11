<template>
  <div
    class="mission-preview-card"
    :style="task.color ? 'border: 1px dashed ' + task.color + ' !important' : '#69a1e2'"
  >
    <div class="mission-section mission-number-section">
      <p
        class="text-overline text-uppercase"
        :style="task.color ? 'color:' + task.color + ' !important' : '#69a1e2'"
      >
        Mission
      </p>
      <p
        class="mission-number"
        :style="task.color ? 'color:' + task.color + ' !important' : '#69a1e2'"
      >
        {{ index + 1 }}
      </p>
    </div>
    <div
      class="mission-middle-section mission-main-section"
      :style="task.color ? 'border-left: 1px dashed ' + task.color + ' !important' : ''"
    >
      <h1
        class="mission-title pa-4"
        :style="task.color ? 'color:' + task.color + ' !important' : ''"
      >
        {{ task.title }}
      </h1>
      <div
        v-html="task.description"
        class="task-description"
        :style="task.color ? 'color:' + task.color + ' !important' : ''"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MissionPreviewCard",
  props: ["task", "index"],
};
</script>

<style lang="scss" scoped>
.mission-preview-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;
  height: auto;
  background: var(--v-background-base, #181f2a);
  z-index: 1000;
  position: relative;

  .mission-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    padding: 20px;
    flex-grow: 1;
  }

  .mission-middle-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    flex-grow: 1;
    .task-description {
      padding: 0px 16px 16px 16px;
      width: 100%;
    }
  }

  .mission-number-section {
    border-left: none;
    .mission-number {
      font-size: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .mission-title {
    font-size: 1.2rem;
    color: var(--v-missionAccent-base);
    font-weight: 600;
    text-transform: uppercase;
    margin: 5px 0px;
  }
}
</style>
