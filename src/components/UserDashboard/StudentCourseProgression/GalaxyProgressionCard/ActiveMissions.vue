<template>
  <!-- <v-btn
    v-if="activeTask"
    outlined
    x-small
    color="missionAccent"
    @click="routeToTasksSystem()"
    :dark="dark"
    :light="!dark"
    class="pa-5 mb-4 mx-2 missionButton"
  >
    <p class="ma-0">{{ activeTopic.label }}</p>
    <p class="ma-0" style="font-weight: 900; padding: 0px 5px">></p>
    <p class="ma-0" style="font-weight: 900">{{ activeTask.title }}</p>
  </v-btn> -->

  <!-- v-btn above OR custom div button. which is better? -->
  <div class="active-mission-card" @click="routeToTasksSystem()">
    <!-- activity uses title field even for topics -->
    <p class="ma-0">{{ activeTopic?.title }}</p>
    <p class="ma-0" style="font-weight: 900; padding: 0px 5px">></p>
    <p class="ma-0" style="font-weight: 900">{{ activeTask?.title }}</p>
  </div>
</template>

<script>
import useRootStore from "@/store/index";
import { mapActions } from "pinia";

export default {
  name: "ActiveMissions",
  props: ["courseId", "data"],
  components: {},
  data() {
    return {};
  },
  computed: {
    activeTopic() {
      const startedTopic = this.data.find(
        (topic) => topic.type === "Topic" && topic.status === "Started",
      );
      return startedTopic ?? null;
    },
    activeTask() {
      const startedTask = this.data.find(
        (task) => task.type === "Task" && task.status === "Started",
      );
      return startedTask ?? null;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentTopicId", "setCurrentTaskId"]),
    routeToTasksSystem() {
      // save current topic & task to store
      this.setCurrentTopicId(this.activeTopic.id);
      this.setCurrentTaskId(this.activeTask.id);

      // route to topic/solar system
      // TODO: bug where system route does work (prob to do with vuex-persisted)
      this.$router.push({
        name: "SolarSystemView",
        params: {
          courseId: this.courseId,
          topicId: this.activeTopic.id,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.active-mission-card {
  font-size: 0.6rem;
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 5px;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 10px;
  margin-bottom: 20px;
  text-transform: uppercase;
  cursor: pointer;
}

.mission-button {
  backdrop-filter: blur(2px) !important;
}
</style>
