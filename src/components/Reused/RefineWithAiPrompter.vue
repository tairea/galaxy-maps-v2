<template>
  <div
    class="galaxy-prompt-container"
    :class="{ mobile: isMobile, missionEditMode: missionEditMode }"
  >
    <div class="prompt-textarea-container mt-4">
      <div class="prompt-context-chips pb-2" v-if="showChips">
        <v-chip
          v-for="item in activeGalaxyItems"
          :key="item"
          class="mr-2 mb-2 theme-chip"
          outlined
          color="missionAccent"
          text-color="missionAccent"
          close
          @click:close="$emit('remove-chip', item)"
        >
          {{ chipDisplayNames[item] }}
        </v-chip>
      </div>

      <!-- Legend -->
      <div class="legend-container" v-if="showLegend && !missionEditMode">
        <span class="legend-title ma-0">Legend:</span>
        <span class="legend-item-icon ml-3">⭐</span>
        <span class="legend-item-text">Star/Zone</span>
        <span class="legend-item-icon ml-3">🪐</span>
        <span class="legend-item-text">Planet/Mission</span>
      </div>

      <v-textarea
        v-model="localValue"
        :dark="dark"
        :light="!dark"
        class="input-field mt-2"
        outlined
        color="missionAccent"
        rows="5"
        auto-grow
        clearable
        label="What change would you like me to make?"
        :disabled="loading"
        :autofocus="!isMobile"
        @click:clear="clearInput"
      />

      <div class="action-buttons" :class="{ mobile: isMobile }">
        <v-btn
          v-if="missionEditMode"
          outlined
          @click="$emit('cancel-edit')"
          :loading="loading"
          :disabled="loading"
          :dark="dark"
          :light="!dark"
        >
          <v-icon left> {{ mdiRobotExcited }} </v-icon>
          CANCEL
        </v-btn>

        <v-btn
          v-if="!missionEditMode && showGenerateAgain"
          outlined
          color="galaxyAccent"
          @click="$emit('generate-again')"
          :loading="loading"
          :dark="dark"
          :light="!dark"
          :disabled="!disabled"
        >
          <v-icon left> {{ mdiRobotExcited }} </v-icon>
          GENERATE AGAIN
        </v-btn>

        <v-btn
          v-if="!missionEditMode && showRefine"
          outlined
          color="galaxyAccent"
          @click="$emit('refine-galaxy-map')"
          :loading="loading"
          :disabled="disabled"
          :dark="dark"
          :light="!dark"
        >
          <v-icon left> {{ mdiRobotExcited }} </v-icon>
          REFINE GALAXY MAP
        </v-btn>

        <!-- <v-btn
          v-if="!missionEditMode && showStructureRefine"
          outlined
          color="galaxyAccent"
          @click="$emit('refine-structure')"
          :loading="loading"
          :disabled="disabled"
          :dark="dark"
          :light="!dark"
        >
          <v-icon left> {{ mdiRobotExcited }} </v-icon>
          REFINE STRUCTURE
        </v-btn> -->

        <v-btn
          v-if="!missionEditMode && showSaveButtons && !courseId"
          @click="$emit('save-new')"
          outlined
          color="baseAccent"
        >
          <v-icon left> {{ mdiContentSave }} </v-icon>
          Save Galaxy Map
        </v-btn>
        <v-btn
          v-if="!missionEditMode && showSaveButtons && courseId"
          outlined
          color="baseAccent"
          :disabled="!hasUnsavedChanges || loading"
          @click="$emit('update-galaxy')"
        >
          <v-icon left> {{ mdiContentSave }} </v-icon>
          Save Galaxy Changes
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { mdiRobotExcited, mdiContentSave } from "@mdi/js";

export default {
  name: "RefineWithAiPrompter",
  props: {
    value: { type: String, default: "" },
    isMobile: { type: Boolean, default: false },
    dark: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    activeGalaxyItems: { type: Array, default: () => [] },
    chipDisplayNames: { type: Object, default: () => ({}) },
    courseId: { type: [String, Number, null], default: null },
    hasUnsavedChanges: { type: Boolean, default: false },
    missionEditMode: { type: Boolean, default: false },
    // UI toggles
    showChips: { type: Boolean, default: true },
    showLegend: { type: Boolean, default: true },
    showGenerateAgain: { type: Boolean, default: true },
    showRefine: { type: Boolean, default: true },
    showStructureRefine: { type: Boolean, default: false },
    showSaveButtons: { type: Boolean, default: true },
  },
  data() {
    return {
      mdiRobotExcited,
      mdiContentSave,
      localValue: this.value,
    };
  },
  watch: {
    value(newVal) {
      if (newVal !== this.localValue) this.localValue = newVal;
    },
    localValue(newVal) {
      this.$emit("input", newVal);
    },
  },
  methods: {
    clearInput() {
      this.localValue = "";
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxy-prompt-container {
  width: 60%;
  height: 30%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 100px;

  &.missionEditMode {
    width: 100%;
    justify-content: center;
  }

  &.mobile {
    width: 100%;
  }

  .prompt-textarea-container {
    width: 80%;

    &.mobile {
      width: 100%;
    }

    .legend-container {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 6px;
      border-radius: 8px 8px 0 0;
      color: #808080;
      font-size: 0.92rem;
      box-shadow: none;
      z-index: 2;
      pointer-events: auto;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #808080;
      font-size: 0.95em;
      font-weight: 400;
      letter-spacing: 0.01em;
      opacity: 0.85;
    }
    .legend-item-icon {
      font-size: 1.1em;
      margin-right: 2px;
      opacity: 0.7;
    }

    .input-field {
      width: 100%;
      text-align: center;
      flex: none;
      font-size: 1rem;
      color: var(--v-missionAccent-base);
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin-top: -10px;
      gap: 20px;

      &.mobile {
        flex-direction: column;
        gap: 10px;

        .v-btn {
          width: 100%;
        }
      }
    }

    .theme-chip {
      border: 1px solid var(--v-missionAccent-base) !important;
      color: var(--v-missionAccent-base) !important;
      background-color: transparent !important;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(var(--v-missionAccent-base), 0.1) !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(var(--v-missionAccent-base), 0.3);
      }

      .v-chip__close {
        color: var(--v-missionAccent-base) !important;

        &:hover {
          background-color: rgba(var(--v-missionAccent-base), 0.2) !important;
        }
      }
    }
  }
}
</style>
