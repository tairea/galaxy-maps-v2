<template>
  <div id="ss-info">
    <h2 class="ss-label">System</h2>
    <h1 class="ss-title">{{ topic.label }}</h1>
    <SolarSystem
      :topic="topic"
      :size="'0.25em'"
      :height="'200px'"
      :tasks="tasks"
    />
    <!-- <SolarSystem
      :topic="
        teacher
          ? getTopicById(currentTopicId)
          : getPersonsTopicById(currentTopicId)
      "
      :size="'0.25em'"
      :height="'200px'"
      :tasks="tasks"
    /> -->
    <p class="galaxy-description">Part of the</p>
    <h1 class="galaxy-title">{{ getCourseById(currentCourseId).title }}</h1>
    <p class="galaxy-description">Galaxy</p>
  </div>
</template>

<script>
import SolarSystem from "@/components/SolarSystem.vue";
import { mapState, mapGetters } from "vuex";

export default {
  name: "SolarSystemInfo",
  props: ["topic", "tasks", "teacher"],
  components: {
    SolarSystem,
  },
  computed: {
    ...mapState(["currentTopicId", "currentCourseId"]),
    ...mapGetters([
      "person",
      "getPersonsTopicById",
      "getCourseById",
      "getTopicById",
    ]),
  },
  mounted() {},
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
#ss-info {
  border: 1px solid var(--v-missionAccent-base);
  margin-top: 30px;
  padding: 20px;
  backdrop-filter: blur(2px);
  width: 100%;
}

h1 {
  color: white;
}

.ss-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: 0;
  left: -1px;
  background-color: var(--v-missionAccent-base);
  color: var(--v-background-base);
  padding: 0px 20px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
}

.ss-title {
  font-size: 1.2rem;
  color: var(--v-missionAccent-base);
  font-weight: 600;
  text-transform: uppercase;
  margin: 20px 0px 5px 0px;
}

.galaxy-title {
  font-size: 0.9rem;
  color: var(--v-galaxyAccent-base);
  font-weight: 600;
  text-transform: uppercase;
  margin: 0px;
}

.galaxy-description {
  // margin-top: 10px;
  color: var(--v-galaxyAccent-base);
  font-size: 0.7rem;
  margin: 0px;
  margin-bottom: 0px !important;
  padding: 0px;
  text-transform: uppercase;
}
</style>
