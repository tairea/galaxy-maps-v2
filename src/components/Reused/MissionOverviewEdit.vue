<template>
  <div id="right-section" :class="{ mobile: isMobile, expanded: isEditing, open: show }">
    <div class="left-side-container" :class="{ expanded: isEditing }">
      <div class="right-section-header">
        <v-btn @click="handleClose" outlined color="missionAccent" small>
          <v-icon left small>{{ mdiArrowLeftBold }}</v-icon>
          Back to Overview
        </v-btn>
      </div>

      <div v-if="selectedPlanetData" class="selected-planet-info">
        <template>
          <p class="missionAccent--text text-h2 mission-title" @click="selectAllMissionItems">
            Mission:
          </p>

          <div
            class="planet-header mission-section"
            :class="{ 'active-item': isActiveMissionItem('title & description') }"
            tabindex="0"
            role="button"
            @click="startEditing('title & description')"
          >
            <span class="planet-emoji">🪐</span>
            <div>
              <h3 class="planet-title baseAccent--text">{{ selectedPlanetData.title }}</h3>
              <p class="planet-description">{{ selectedPlanetData.description }}</p>
            </div>
          </div>

          <div
            v-if="selectedPlanetData.missionInstructions"
            class="section-card intro-card mission-section"
            :class="{ 'active-item': isActiveMissionItem('intro') }"
            tabindex="0"
            role="button"
            @click="startEditing('intro')"
          >
            <h4 class="section-title text-h5">Intro</h4>
            <p class="section-text">{{ selectedPlanetData.missionInstructions.intro }}</p>
          </div>

          <div
            v-for="(step, index) in selectedPlanetData.missionInstructions.steps || []"
            :key="`step-${index}`"
            class="step-card mission-section"
            :class="{ 'active-item': isActiveMissionItem('steps[' + index + ']') }"
            tabindex="0"
            role="button"
            @click="startEditing('steps[' + index + ']')"
          >
            <div class="step-header">
              <h4 class="step-title text-h5">{{ step.title }}</h4>
            </div>

            <div class="task-list">
              <div
                v-for="(task, taskIndex) in step.tasks"
                :key="`task-${index}-${taskIndex}`"
                class="task-item"
              >
                <span class="task-bullet" aria-hidden="true"></span>
                <p class="task-text">{{ task.taskContent }}</p>
              </div>
            </div>

            <div v-if="step.checkpoint" class="checkpoint-row">
              <span class="checkpoint-flag">🎯</span>
              <p class="checkpoint-text">
                <em>Checkpoint: {{ step.checkpoint }}</em>
              </p>
            </div>
          </div>

          <div
            v-if="
              selectedPlanetData.missionInstructions && selectedPlanetData.missionInstructions.outro
            "
            class="section-card outro-card mission-section"
            :class="{ 'active-item': isActiveMissionItem('outro') }"
            tabindex="0"
            role="button"
            @click="startEditing('outro')"
          >
            <h4 class="section-title text-h5">Outro</h4>
            <p class="section-text">{{ selectedPlanetData.missionInstructions.outro }}</p>
          </div>
        </template>
      </div>

      <div v-else class="no-planet-selected">
        <p>Click on a mission to view its details</p>
      </div>
    </div>

    <div class="right-side-container" :class="{ expanded: isEditing }">
      <slot name="right-panel">
        <RefineWithAiPrompter
          v-if="isEditing"
          v-model="refinePrompt"
          :is-mobile="isMobile"
          :dark="dark"
          :loading="false"
          :disabled="!activeMissionItems.length"
          :active-galaxy-items="activeMissionItems"
          :chip-display-names="chipDisplayNames"
          :mission-edit-mode="true"
          :show-chips="true"
          :show-legend="true"
          :show-generate-again="false"
          :show-refine="false"
          :show-save-buttons="false"
          @remove-chip="removeActiveMissionItem"
          @refine-mission="emitRefineMission"
          @cancel-edit="handleCancelEdit"
        />
      </slot>
    </div>
  </div>
</template>

<script>
import { mdiArrowLeftBold } from "@mdi/js";
import RefineWithAiPrompter from "@/components/Reused/RefineWithAiPrompter.vue";

export default {
  name: "MissionOverviewEdit",
  components: { RefineWithAiPrompter },
  props: {
    selectedPlanetData: {
      type: Object,
      required: false,
      default: null,
    },
    missionPath: {
      type: String,
      default: null,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "close",
    "update-mission",
    "cancel-edit",
    "mission-editing-state-change",
    "refine-mission",
  ],
  data() {
    return {
      mdiArrowLeftBold,
      isEditingInternal: false,
      editTarget: null,
      refinePrompt: "",
      activeMissionItems: [],
    };
  },
  computed: {
    isEditing() {
      return this.isEditingInternal;
    },
    chipDisplayNames() {
      const names = {};
      this.activeMissionItems.forEach((item) => {
        if (item.includes(".missionInstructions.")) {
          const target = item.split(".missionInstructions.")[1];
          if (target === "intro") {
            names[item] = "Mission Intro";
          } else if (target === "outro") {
            names[item] = "Mission Outro";
          } else if (target === "title") {
            names[item] = "Mission Title";
          } else if (target === "description") {
            names[item] = "Mission Description";
          } else if (target.startsWith("steps[")) {
            const stepIndex = target.match(/steps\[(\d+)\]/)?.[1];
            if (stepIndex !== undefined) {
              const step =
                this.selectedPlanetData?.missionInstructions?.steps?.[parseInt(stepIndex)];
              // Use just the step title if it exists, otherwise show "Step X"
              names[item] = step?.title || `Step ${parseInt(stepIndex) + 1}`;
            }
          }
        } else {
          // This is the planet path (title & description)
          names[item] = "Title & Description";
        }
      });
      return names;
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  watch: {
    selectedPlanetData: {
      immediate: true,
      handler(newVal) {
        if (!newVal) {
          this.isEditingInternal = false;
          return;
        }
      },
    },
    isEditing(newValue) {
      this.$emit("mission-editing-state-change", newValue);
    },
  },
  methods: {
    handleClose() {
      this.isEditingInternal = false;
      this.editTarget = null;
      this.$emit("close");
    },
    startEditing(target) {
      if (!this.selectedPlanetData) return;
      if (!this.isEditingInternal) {
        this.isEditingInternal = true;
      }
      this.editTarget = target;
      console.log("startEditing target: ", target);
      this.trackActiveMissionItem(target);
    },
    trackActiveMissionItem(target) {
      if (!target) return;
      // Build full object notation path: star[x].planet[y].missionInstructions.target
      const basePath = this.selectedPlanetData?.id || this.missionPath;
      if (!basePath) return;

      let keys = [];
      if (target === "title & description") {
        // Add both title and description as separate items
        keys = [
          `${basePath}.missionInstructions.title`,
          `${basePath}.missionInstructions.description`,
        ];
      } else {
        keys = [`${basePath}.missionInstructions.${target}`];
      }

      keys.forEach((key) => {
        if (!this.activeMissionItems.includes(key)) this.activeMissionItems.push(key);
      });
      console.log("activeMissionItems: ", this.activeMissionItems);
    },
    removeActiveMissionItem(key) {
      this.activeMissionItems = this.activeMissionItems.filter((k) => k !== key);
      console.log("activeMissionItems: ", this.activeMissionItems);
    },
    isActiveMissionItem(target) {
      if (!target) return false;
      const basePath = this.selectedPlanetData?.id || this.missionPath;
      if (!basePath) return false;

      if (target === "title & description") {
        // Check if either title or description is active
        return (
          this.activeMissionItems.includes(`${basePath}.missionInstructions.title`) ||
          this.activeMissionItems.includes(`${basePath}.missionInstructions.description`)
        );
      } else {
        return this.activeMissionItems.includes(`${basePath}.missionInstructions.${target}`);
      }
    },
    selectAllMissionItems() {
      if (!this.selectedPlanetData) return;
      const basePath = this.selectedPlanetData?.id || this.missionPath;
      if (!basePath) return;

      // Enable expanded mode
      this.isEditingInternal = true;
      this.editTarget = "all";

      // Clear existing selections
      this.activeMissionItems = [];

      // Add all mission items
      const allItems = [
        `${basePath}.missionInstructions.title`,
        `${basePath}.missionInstructions.description`,
        `${basePath}.missionInstructions.intro`,
        `${basePath}.missionInstructions.outro`,
      ];

      // Add all steps
      const steps = this.selectedPlanetData?.missionInstructions?.steps || [];
      steps.forEach((_, index) => {
        allItems.push(`${basePath}.missionInstructions.steps[${index}]`);
      });

      this.activeMissionItems = allItems;
      console.log("Selected all mission items: ", this.activeMissionItems);
    },
    handleCancelEdit() {
      // Clear all active mission items
      this.activeMissionItems = [];

      // Disable expanded state
      this.isEditingInternal = false;
      this.editTarget = null;

      // Clear the refine prompt
      this.refinePrompt = "";

      console.log("Cancelled edit - cleared all selections");
    },
    emitRefineMission() {
      const context = this.activeMissionItems;
      this.$emit("refine-mission", {
        prompt: this.refinePrompt,
        context,
        missionPath: this.missionPath,
      });
    },
  },
};
</script>

<style scoped lang="scss">
#right-section {
  width: 50%;
  height: 100%;
  z-index: 51;
  margin-left: auto;
  border-left: 1px solid var(--v-missionAccent-base);
  padding: 0px 5px 0px 35px;
  overflow-y: auto;
  background-color: var(--v-background-base);
  display: flex;
  gap: 24px;
  position: fixed;
  right: -50%;
  transition: all 0.3s ease;

  &.open {
    right: 0;
  }

  &.expanded {
    width: 100%;
    margin-right: 0;
  }

  &.mobile {
    width: 100%;
    border-left: none;
    padding: 0;
  }

  .left-side-container,
  .right-side-container {
    transition: width 0.3s ease;
  }

  .left-side-container {
    flex: 1 1 auto;
    max-width: 100%;

    &.expanded {
      width: 50%;
    }
  }

  .right-side-container {
    flex: 0 0 0;
    max-width: 0;
    overflow: hidden;

    &.expanded {
      flex: 1 1 50%;
      max-width: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding-right: 20px;
      position: sticky;
      top: 50%;
      transform: translateY(-50%);
      height: fit-content;
    }
  }

  .right-section-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(var(--v-missionAccent-base), 0.2);
  }

  .mission-title {
    cursor: pointer;
    user-select: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  .selected-planet-info {
    display: flex;
    flex-direction: column;
    gap: 14px;

    .mission-section {
      border-radius: 10px;
      padding: 25px;
      margin: 10px 10px;
      box-shadow: 0 4px 14px color-mix(in srgb, var(--v-missionAccent-base) 80%, transparent);
      cursor: pointer;
      outline: none;

      &.active-item {
        box-shadow: 0 4px 14px color-mix(in srgb, var(--v-galaxyAccent-base) 80%, transparent);
      }
    }

    .mission-section:hover,
    .mission-section:focus-visible {
      transform: scale(1.02);
      transition: transform 0.2s ease;
      border-right: 10px solid var(--v-galaxyAccent-base);
      position: relative;
    }

    .mission-section:hover::after,
    .mission-section:focus-visible::after {
      content: "E\A D\A I\A T";
      white-space: pre;
      position: absolute;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--v-galaxyAccent-base);
      font-weight: bold;
      font-size: 0.7rem;
      letter-spacing: 0.1em;
      line-height: 1.2;
      text-align: center;
    }

    .planet-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;

      .planet-emoji {
        font-size: 1.5rem;
      }

      .planet-title {
        margin: 0;
        color: var(--v-missionAccent-base);
        font-size: 1.5rem;
        font-weight: 600;
      }
    }

    .section-title {
      color: var(--v-missionAccent-base);
    }

    .section-text {
      line-height: 1.65;
      font-size: 0.92rem;
    }
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .step-title {
    margin: 0;
    color: var(--v-missionAccent-base);
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .task-item {
    display: grid;
    grid-template-columns: 14px 1fr;
    align-items: start;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background-color: rgba(var(--v-missionAccent-base), 0.05);
  }

  .task-bullet {
    width: 8px;
    height: 8px;
    margin-top: 6px;
    border-radius: 50%;
    background: var(--v-missionAccent-base);
    display: inline-block;
  }

  .task-text {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.6;
  }

  .checkpoint-row {
    display: grid;
    grid-template-columns: 18px 1fr;
    align-items: start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    margin-top: 10px;
    background: rgba(var(--v-galaxyAccent-base), 0.06);
    border: 1px solid rgba(var(--v-galaxyAccent-base), 0.25);
  }

  .checkpoint-flag {
    font-size: 0.95rem;
    margin-top: 2px;
  }

  .checkpoint-text {
    margin: 0;
    font-size: 0.9rem;
    color: var(--v-missionAccent-base);
    line-height: 1.6;
  }

  .no-planet-selected {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--v-missionAccent-base);
    opacity: 0.7;
    font-style: italic;
  }
}
</style>
