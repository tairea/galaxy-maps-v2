<template>
  <div id="mobile-solar-system-info" v-if="topic" :class="{ student: isStudent }">
    <div class="mobile-panel-container">
      <!-- Header section with minimize toggle -->
      <div class="mobile-panel-header">
        <!-- Clickable Label with Arrow for minimize -->
        <div class="mobile-system-label" @click="toggleMinimize">
          <div v-if="!isMinimized">Star System</div>
          <div v-else>
            {{ truncateTitle(topic.label) }}
          </div>
          <v-icon class="arrow" color="var(--v-background-base)">{{
            isMinimized ? mdiMenuDown : mdiMenuUp
          }}</v-icon>
        </div>

        <!-- Collapsible Content -->
        <div class="mobile-system-content" :class="{ minimized: isMinimized }">
          <!-- System title -->
          <h1 class="mobile-ss-title">{{ topic.label }}</h1>

          <!-- Solar System component -->
          <div class="mobile-solar-system-container">
            <SolarSystem
              :courseId="course.id"
              :topic="topic"
              :size="'0.2em'"
              :height="'100px'"
              :tasks="tasks"
            />
          </div>

          <!-- Galaxy info -->
          <div class="mobile-galaxy-info">
            <p class="mobile-galaxy-description">Part of the</p>
            <h1 class="mobile-galaxy-title">{{ course.title }}</h1>
            <p class="mobile-galaxy-description">Galaxy</p>
          </div>

          <!-- Mobile back button (outside left-section, fixed position) -->
          <BackButton
            v-if="isMobile"
            :toPath="'/'"
            :mobile="true"
            :showText="false"
            :color="'missionAccent'"
            class="back-button-mobile"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SolarSystem from "@/components/Reused/SolarSystem.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import { mdiMenuUp, mdiMenuDown } from "@mdi/js";
import useRootStore from "@/store/index";
import { mapActions } from "pinia";

export default {
  name: "MobileSolarSystemInfo",
  props: ["topic", "tasks", "teacher", "course"],
  components: {
    SolarSystem,
    BackButton,
  },
  data() {
    return {
      mdiMenuUp,
      mdiMenuDown,
      isMinimized: false,
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    isStudent() {
      return !this.teacher;
    },
  },
  mounted() {
    // Initialize the store state with the current minimized state
    this.setMobileInfoMinimized(this.isMinimized);
  },
  methods: {
    ...mapActions(useRootStore, ["setMobileInfoMinimized"]),
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.setMobileInfoMinimized(this.isMinimized);
      this.$emit("infoMinimised", this.isMinimized);
    },
    truncateTitle(title) {
      if (!title) return "";
      if (title.length > 15) {
        return title.substring(0, 15) + "...";
      }
      return title;
    },
    getBorderClass() {
      return "system-border";
    },
  },
};
</script>

<style lang="scss" scoped>
// Mobile panel container
#mobile-solar-system-info {
  width: 100%;
  position: relative;
  backdrop-filter: blur(2px);
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  z-index: 1;

  &.student {
    border: none;
  }

  .mobile-panel-container {
    position: relative;
    backdrop-filter: blur(2px);
  }
}

// Header section
.mobile-panel-header {
  height: auto;

  // System label with minimize functionality
  .mobile-system-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    position: absolute;
    top: 0;
    left: -1px;
    color: var(--v-background-base);
    background-color: var(--v-missionAccent-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    width: fit-content;
    min-width: 120px;
    box-sizing: border-box;
    z-index: 10;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;

    &.minimized {
      width: fit-content;
      border: none;
      box-shadow: none;
      z-index: 15;
    }

    .arrow {
      font-size: 0.6rem;
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }
  }

  // Collapsible content
  .mobile-system-content {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
    max-height: 1000px;
    padding: 20px;

    &.minimized {
      max-height: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
    }
  }
}

// System title
.mobile-ss-title {
  font-size: 1.2rem;
  color: var(--v-missionAccent-base);
  font-weight: 600;
  text-transform: uppercase;
  margin: 0 0 15px 0;
}

// Solar System container
.mobile-solar-system-container {
  display: flex;
  justify-content: center;
  margin: 20px 0 -30px 0;
}

// Galaxy info section
.mobile-galaxy-info {
  text-align: right;
  margin-top: 0px;

  .mobile-galaxy-title {
    font-size: 0.9rem;
    color: var(--v-galaxyAccent-base);
    font-weight: 600;
    text-transform: uppercase;
    margin: 5px 0;
  }

  .mobile-galaxy-description {
    color: var(--v-galaxyAccent-base);
    font-size: 0.7rem;
    margin: 0;
    text-transform: uppercase;
  }
}

.system-border {
  border: 1px solid var(--v-missionAccent-base);
}

.back-button-mobile {
  position: absolute;
  bottom: 0px;
  left: 10px;
  background: none;
  @media (min-width: 960px) {
    display: none;
  }
}

// Responsive adjustments for very small screens
@media (max-width: 480px) {
  .mobile-panel-header {
    .mobile-system-content {
      padding: 15px;
      padding-top: 30px;
    }
  }

  .mobile-ss-title {
    font-size: 1rem;
  }

  .mobile-galaxy-info {
    .mobile-galaxy-title {
      font-size: 0.8rem;
    }

    .mobile-galaxy-description {
      font-size: 0.6rem;
    }
  }
}
</style>
