<template>
  <v-progress-circular indeterminate :size="size" :color="color" class="mb-4">
    <v-icon :color="color" :size="iconSize" class="robot-dance">{{ mdiRobotExcited }}</v-icon>
  </v-progress-circular>
</template>

<script>
import { mdiRobotExcited } from "@mdi/js";

export default {
  name: "RobotLoadingSpinner",
  props: {
    size: {
      type: [String, Number],
      default: "50",
    },
    color: {
      type: String,
      default: "galaxyAccent",
    },
    iconSize: {
      type: [String, Number],
      default: "24",
    },
  },
  data() {
    return {
      mdiRobotExcited,
    };
  },
};
</script>

<style lang="scss" scoped>
.robot-dance {
  animation: robotDance 2s ease infinite;
  transform-origin: center bottom;
}

@keyframes robotDance {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  12.5% {
    transform: translateY(-2px) rotate(-10deg);
  }
  25% {
    transform: translateY(0) rotate(0deg);
  }
  37.5% {
    transform: translateY(-2px) rotate(10deg);
  }
  50% {
    transform: translateY(0) rotate(0deg);
  }
  62.5% {
    transform: translateY(-2px) rotate(-10deg);
  }
  75% {
    transform: translateY(0) rotate(0deg);
  }
  87.5% {
    transform: translateY(-2px) rotate(10deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}
</style>
