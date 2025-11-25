<template>
  <v-dialog v-model="showDialog" width="50%" light>
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <p class="dialog-title">
          Create Galaxy Map
          <span class="galaxyAccent--text"
            ><v-icon color="missionAccent" small class="mb-1">{{ mdiRobotExcited }}</v-icon></span
          >
        </p>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <div>
            <p class="dialog-description">Choose how you'd like to create your galaxy map:</p>
            <p class="dialog-description mt-2">
              You can either get AI assistance with human guidance, or let AI create everything
              automatically.
            </p>
          </div>
        </div>
      </div>

      <!-- DIALOG CONTENT -->
      <div class="create-dialog-content">
        <!-- CREATION OPTIONS -->
        <div class="creation-options my-12">
          <!-- With human help -->
          <div
            class="creation-option base-border"
            @click="handleHumanHelp"
            :class="{ disabled: loading }"
          >
            <div class="creation-option-icon">
              <v-icon color="baseAccent" :class="{ 'loading-spin': loading }">{{
                mdiRobotExcited
              }}</v-icon>
              <v-icon color="baseAccent" :class="{ 'loading-spin': loading }">{{
                mdiArrowRight
              }}</v-icon>
              🤔
            </div>
            <div class="creation-option-label baseAccent--text">
              CREATE GALAXY MAP with human help
            </div>
          </div>

          <!-- No human help -->
          <div
            class="creation-option galaxy-border"
            @click="handleNoHumanHelp"
            :class="{ disabled: loading }"
          >
            <div class="creation-option-icon">
              <v-icon color="galaxyAccent" :class="{ 'loading-spin': loading }">{{
                mdiRobotExcited
              }}</v-icon>
              <v-icon color="galaxyAccent" :class="{ 'loading-spin': loading }">{{
                mdiArrowRight
              }}</v-icon>
              🚀
            </div>
            <div class="creation-option-label galaxyAccent--text">
              CREATE GALAXY MAP WITH NO HUMAN HELP
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
  name: "CreateGalaxyOptionsDialog",
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
    handleHumanHelp() {
      this.$emit("human-help");
    },
    handleNoHumanHelp() {
      this.$emit("no-human-help");
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

// Creation options styling (matching SaveGalaxyDialog)
.creation-options {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin: 20px 0;
  width: 100%;
}

.creation-option {
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

.creation-option-icon {
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

.creation-option-label {
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
</style>
