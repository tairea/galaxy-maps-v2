<template>
  <div class="ai-conversation-panel" :class="{ 'panel-open': isOpen }">
    <div class="panel-content">
      <!-- Close Button -->
      <button class="control-button close-button" @click="closePanel">
        <v-icon color="white" size="20">{{ mdiClose }}</v-icon>
      </button>

      <!-- Listening Text -->
      <div class="listening-text">
        <span class="listening-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </span>
        <span class="listening-label">Listening...</span>
      </div>

      <!-- Pause/Play Button -->
      <button class="control-button pause-button" @click="togglePause">
        <v-icon color="white" size="20">
          {{ isPaused ? mdiPlay : mdiPause }}
        </v-icon>
      </button>
    </div>
  </div>
</template>

<script>
import { mdiClose, mdiPlay, mdiPause } from "@mdi/js";
export default {
  name: "AiConversationPanel",
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isPaused: false,
      mdiClose,
      mdiPlay,
      mdiPause,
    };
  },
  methods: {
    closePanel() {
      this.$emit("close");
    },
    togglePause() {
      this.isPaused = !this.isPaused;
      this.$emit("pause-toggle", this.isPaused);
    },
  },
};
</script>

<style lang="scss" scoped>
.ai-conversation-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(
    90deg,
    var(--v-galaxyAccent-base) 0%,
    var(--v-galaxyAccent-darken2) 100%
  );
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;

  &.panel-open {
    transform: translateY(0);
  }

  .panel-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    padding: 0 20px;
  }

  .control-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .listening-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .listening-dots {
    display: flex;
    gap: 4px;
  }

  .dot {
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
    &:nth-child(4) {
      animation-delay: 0.6s;
    }
    &:nth-child(5) {
      animation-delay: 0.8s;
    }
  }

  .listening-label {
    color: white;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .ai-conversation-panel {
    height: 70px;

    .panel-content {
      padding: 0 15px;
    }

    .control-button {
      width: 36px;
      height: 36px;
    }

    .listening-label {
      font-size: 12px;
    }
  }
}
</style>
