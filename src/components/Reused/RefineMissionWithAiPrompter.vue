<template>
  <div class="mission-prompt-container" :class="{ mobile: isMobile }">
    <div class="prompt-textarea-container mt-4">
      <div class="prompt-context-chips pb-2" v-if="showChips && activeMissionItems.length">
        <v-chip
          v-for="mission in activeMissionItems"
          :key="mission"
          class="mr-2 mb-2 mission-chip"
          outlined
          color="galaxyAccent"
          text-color="galaxyAccent"
          close
          @click:close="$emit('remove-mission-chip', mission)"
        >
          {{ missionChipDisplayNames[mission] || mission }}
        </v-chip>
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
        label="How should we refine this mission?"
        :disabled="loading"
        :autofocus="!isMobile"
        @click:clear="clearInput"
      />

      <div class="action-buttons" :class="{ mobile: isMobile }">
        <v-btn
          outlined
          color="galaxyAccent"
          @click="$emit('refine')"
          :loading="loading"
          :disabled="disabled"
          :dark="dark"
          :light="!dark"
        >
          <v-icon left> {{ mdiRobotExcited }} </v-icon>
          REFINE MISSION
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { mdiRobotExcited } from "@mdi/js";

export default {
  name: "RefineMissionWithAiPrompter",
  props: {
    value: { type: String, default: "" },
    isMobile: { type: Boolean, default: false },
    dark: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    activeMissionItems: { type: Array, default: () => [] },
    missionChipDisplayNames: { type: Object, default: () => ({}) },
    showChips: { type: Boolean, default: true },
  },
  emits: ["input", "refine", "remove-mission-chip"],
  data() {
    return {
      mdiRobotExcited,
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
.mission-prompt-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  &.mobile {
    width: 100%;
  }

  .prompt-textarea-container {
    width: 100%;

    &.mobile {
      width: 100%;
    }

    .input-field {
      width: 100%;
      font-size: 1rem;
      color: var(--v-missionAccent-base);
    }

    .action-buttons {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
      margin-top: 10px;
      gap: 12px;

      &.mobile {
        flex-direction: column;
        align-items: stretch;

        .v-btn {
          width: 100%;
        }
      }
    }

    .mission-chip {
      border: 1px solid var(--v-galaxyAccent-base) !important;
      color: var(--v-galaxyAccent-base) !important;
      background-color: transparent !important;
      font-weight: 500;
    }
  }
}
</style>
