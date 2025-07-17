<template>
  <v-dialog v-model="showDialog" width="500px" persistent>
    <v-card class="layout-selection-dialog">
      <v-card-title class="dialog-title">
        Choose Galaxy Layout
        <v-icon color="galaxyAccent" class="ml-2">{{ mdiChartLineVariant }}</v-icon>
      </v-card-title>

      <v-card-text class="dialog-content">
        <p class="dialog-description">
          Select how you want your stars positioned in the galaxy map
        </p>
        <p class="dialog-description mt-2">
          <em>(You can customize star positions later in the editor)</em>
        </p>

        <div class="layout-options mt-6">
          <div
            class="layout-option"
            :class="{ selected: selectedLayout === 'zigzag' }"
            @click="selectedLayout = 'zigzag'"
          >
            <div class="layout-icon">
              <v-icon>{{ mdiChartLineVariant }}</v-icon>
            </div>
            <div class="layout-info">
              <div class="layout-label">Zigzag</div>
              <div class="layout-description">
                Stars arranged in a zigzag pattern, alternating up and down
              </div>
            </div>
          </div>

          <div
            class="layout-option"
            :class="{ selected: selectedLayout === 'spiral' }"
            @click="selectedLayout = 'spiral'"
          >
            <div class="layout-icon">🌀</div>
            <div class="layout-info">
              <div class="layout-label">Spiral</div>
              <div class="layout-description">
                Stars arranged in a spiral pattern, expanding outward
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer></v-spacer>
        <v-btn outlined color="grey" @click="cancel" :disabled="loading"> Cancel </v-btn>
        <v-btn
          outlined
          color="galaxyAccent"
          @click="confirm"
          :loading="loading"
          :disabled="!selectedLayout"
          class="ml-2"
        >
          <v-icon left>{{ mdiRobotExcited }}</v-icon>
          Save Galaxy
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mdiChartLineVariant, mdiRobotExcited } from "@mdi/js";

export default {
  name: "LayoutSelectionDialog",
  props: {
    showDialog: {
      type: Boolean,
      required: true,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      mdiChartLineVariant,
      mdiRobotExcited,
      selectedLayout: "zigzag",
    };
  },
  watch: {
    showDialog(newValue) {
      if (newValue) {
        this.selectedLayout = "zigzag"; // Reset to default when dialog opens
      }
    },
  },
  methods: {
    cancel() {
      this.$emit("cancel");
    },
    confirm() {
      this.$emit("confirm", this.selectedLayout);
    },
  },
};
</script>

<style lang="scss" scoped>
.layout-selection-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
    padding: 20px;
  }

  .dialog-content {
    padding: 20px;
  }

  .dialog-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.8rem;
    margin: 0;
    line-height: 1.4;
  }

  .layout-options {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .layout-option {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 2px solid var(--v-missionAccent-base);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: var(--v-background-base);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    &.selected {
      border-color: var(--v-baseAccent-base);
      background-color: rgba(var(--v-baseAccent-base), 0.1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--v-baseAccent-base), 0.3);
    }
  }

  .layout-icon {
    font-size: 2rem;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;

    .v-icon {
      font-size: 2rem;
      color: var(--v-missionAccent-base);
    }
  }

  .layout-info {
    flex: 1;
  }

  .layout-label {
    font-size: 1rem;
    text-transform: uppercase;
    color: var(--v-missionAccent-base);
    font-weight: 600;
    margin-bottom: 4px;
  }

  .layout-description {
    font-size: 0.75rem;
    color: var(--v-missionAccent-base);
    opacity: 0.8;
    line-height: 1.3;
  }

  .dialog-actions {
    padding: 20px;
    border-top: 1px solid var(--v-missionAccent-base);
  }
}
</style>
