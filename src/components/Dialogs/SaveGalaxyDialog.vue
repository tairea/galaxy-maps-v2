<template>
  <v-dialog v-model="showDialog" width="50%" light>
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <p class="dialog-title">
          Save Galaxy
          <span class="galaxyAccent--text"
            ><v-icon color="missionAccent" small class="mb-1">{{ mdiContentSave }}</v-icon></span
          >
        </p>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <div>
            <p class="dialog-description">
              Choose how you'd like to proceed with saving your galaxy map:
            </p>
            <p class="dialog-description mt-2">
              You can either generate all misions tasks and then save, or save first and generate
              them later.
            </p>
          </div>
        </div>
      </div>

      <!-- DIALOG CONTENT -->
      <div class="create-dialog-content">
        <!-- SAVE OPTIONS -->
        <div class="save-options my-12">
          <!-- Generate all tasks and then save -->
          <div
            class="save-option galaxy-border"
            @click="handleGenerateTasksThenSave"
            :class="{ disabled: loading }"
          >
            <div class="save-option-icon">
              <v-icon color="galaxyAccent" :class="{ 'loading-spin': loading }">{{
                mdiRobotExcited
              }}</v-icon>
              <v-icon color="galaxyAccent" :class="{ 'loading-spin': loading }">{{
                mdiArrowRight
              }}</v-icon>
              <v-icon color="galaxyAccent" :class="{ 'loading-spin': loading }">{{
                mdiContentSave
              }}</v-icon>
            </div>
            <div class="save-option-label galaxyAccent--text">
              Generate all MISSION INSTRUCTIONS and then SAVE
            </div>
          </div>

          <!-- I'll create tasks manually -->
          <div
            class="save-option base-border"
            @click="handleSaveNowGenerateLater"
            :class="{ disabled: loading }"
          >
            <div class="save-option-icon">
              <v-icon color="baseAccent">{{ mdiContentSave }}</v-icon>
              <v-icon color="baseAccent">{{ mdiArrowRight }}</v-icon>
              <v-icon color="baseAccent">{{ mdiRobotExcited }}</v-icon>
            </div>
            <div class="save-option-label baseAccent--text">
              Save now, generate mission instructions individually later
            </div>
          </div>
        </div>

        <!-- CANCEL BUTTON -->
        <div class="action-buttons">
          <div class="d-flex align-center justify-center">
            <v-btn
              outlined
              :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
              @click="handleCancel"
              class="ma-4"
              :disabled="loading"
              :dark="dark"
              :light="!dark"
            >
              <v-icon left>{{ mdiClose }}</v-icon>
              Cancel
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script>
import {
  mdiRobotExcited,
  mdiPencil,
  mdiClose,
  mdiInformationVariant,
  mdiContentSave,
  mdiArrowRight,
} from "@mdi/js";

export default {
  name: "SaveGalaxyDialog",
  props: {
    showDialog: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      mdiRobotExcited,
      mdiPencil,
      mdiClose,
      mdiInformationVariant,
      mdiContentSave,
      mdiArrowRight,
    };
  },
  computed: {
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    handleGenerateTasksThenSave() {
      this.$emit("generate-tasks-then-save");
    },
    handleSaveNowGenerateLater() {
      this.$emit("save-now-generate-later");
    },
    handleCancel() {
      this.$emit("cancel");
    },
  },
};
</script>

<style lang="scss" scoped>
// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  display: flex;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
  }
}

.create-dialog-content {
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 1rem;
    color: var(--v-missionAccent-base);
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;

  .galaxy-text {
    color: var(--v-galaxyAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }

  .mission-text {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }
}

.v-btn:not(.v-btn--round).v-size--default {
  background-color: var(--v-background-base) !important;
}

.gap-3 {
  gap: 12px;
}

// Save options styling (matching creation mode options)
.save-options {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin: 20px 0;
  width: 100%;
}

.save-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 30px;
  border: 2px solid var(--v-missionAccent-base);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 150px;
  background-color: var(--v-background-base);
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

.galaxy-border {
  border: 2px solid var(--v-galaxyAccent-base);
}

.base-border {
  border: 2px solid var(--v-baseAccent-base);
}

.save-option-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  .v-icon {
    font-size: 2.5rem;
    color: var(--v-missionAccent-base);
  }
}

.save-option-label {
  font-size: 1rem;
  text-transform: uppercase;
  color: var(--v-missionAccent-base);
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Medium screens (768px - 960px)
@media (min-width: 769px) and (max-width: 960px) {
  .create-dialog {
    .action-buttons {
      margin: 0 auto;
      padding: 20px;
      display: flex;
      gap: 20px;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 600px;

      // The buttons are wrapped in d-flex justify-center, so ensure proper centering
      .d-flex {
        justify-content: center;
        width: 100%;
      }

      .v-btn {
        flex: 0 0 auto;
        min-width: 120px;
      }
    }
  }
}
</style>
