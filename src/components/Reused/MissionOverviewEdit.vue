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
        <template v-if="!isEditing">
          <p class="missionAccent--text text-h2">Mission:</p>

          <div
            class="planet-header mission-section"
            tabindex="0"
            role="button"
            @click="startEditing('planet')"
            @keyup.enter.prevent="startEditing('planet')"
            @keyup.space.prevent="startEditing('planet')"
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
            tabindex="0"
            role="button"
            @click="startEditing('intro')"
            @keyup.enter.prevent="startEditing('intro')"
            @keyup.space.prevent="startEditing('intro')"
          >
            <h4 class="section-title text-h5">Intro</h4>
            <p class="section-text">{{ selectedPlanetData.missionInstructions.intro }}</p>
          </div>

          <div
            v-for="(step, index) in selectedPlanetData.missionInstructions.steps || []"
            :key="`step-${index}`"
            class="step-card mission-section"
            tabindex="0"
            role="button"
            @click="startEditing({ type: 'step', index })"
            @keyup.enter.prevent="startEditing({ type: 'step', index })"
            @keyup.space.prevent="startEditing({ type: 'step', index })"
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
            tabindex="0"
            role="button"
            @click="startEditing('outro')"
            @keyup.enter.prevent="startEditing('outro')"
            @keyup.space.prevent="startEditing('outro')"
          >
            <h4 class="section-title text-h5">Outro</h4>
            <p class="section-text">{{ selectedPlanetData.missionInstructions.outro }}</p>
          </div>
        </template>

        <template v-else>
          <div class="edit-form">
            <p class="missionAccent--text text-h4 mb-4">Edit Mission Content</p>

            <v-text-field
              ref="planetTitle"
              v-model="formState.title"
              outlined
              dense
              label="Mission title"
              color="missionAccent"
            />

            <v-textarea
              v-model="formState.description"
              outlined
              auto-grow
              rows="2"
              label="Mission description"
              color="missionAccent"
            />

            <v-textarea
              ref="introField"
              v-model="formState.missionInstructions.intro"
              outlined
              auto-grow
              rows="3"
              label="Intro"
              color="missionAccent"
            />

            <div class="steps-editor">
              <div
                v-for="(step, index) in formState.missionInstructions.steps"
                :key="`edit-step-${index}`"
                class="step-editor-card"
              >
                <div class="step-editor-header">
                  <v-text-field
                    :ref="`stepTitle-${index}`"
                    v-model="step.title"
                    outlined
                    dense
                    label="Step title"
                    color="missionAccent"
                  />
                  <v-btn icon small color="error" @click="removeStep(index)">
                    <v-icon small>{{ mdiDelete }}</v-icon>
                  </v-btn>
                </div>

                <div class="tasks-editor">
                  <div
                    v-for="(task, taskIndex) in step.tasks"
                    :key="`edit-task-${index}-${taskIndex}`"
                    class="task-editor"
                  >
                    <v-textarea
                      v-model="task.taskContent"
                      outlined
                      auto-grow
                      rows="2"
                      :label="`Task ${taskIndex + 1}`"
                      color="missionAccent"
                    />
                    <v-btn icon x-small color="error" @click="removeTaskFromStep(index, taskIndex)">
                      <v-icon small>{{ mdiDelete }}</v-icon>
                    </v-btn>
                  </div>
                  <v-btn
                    outlined
                    small
                    color="galaxyAccent"
                    class="mt-2"
                    @click="addTaskToStep(index)"
                  >
                    <v-icon left small>{{ mdiPlus }}</v-icon>
                    Add Task
                  </v-btn>
                </div>

                <v-textarea
                  v-model="step.checkpoint"
                  outlined
                  auto-grow
                  rows="2"
                  label="Checkpoint"
                  color="missionAccent"
                />
              </div>

              <v-btn outlined small color="galaxyAccent" class="mt-4" @click="addStep">
                <v-icon left small>{{ mdiPlus }}</v-icon>
                Add Step
              </v-btn>
            </div>

            <v-textarea
              ref="outroField"
              v-model="formState.missionInstructions.outro"
              outlined
              auto-grow
              rows="3"
              label="Outro"
              color="missionAccent"
            />

            <div class="form-actions">
              <v-btn outlined color="error" @click="cancelEdit">Cancel</v-btn>
              <v-btn color="missionAccent" dark @click="submitEdit">Update Mission</v-btn>
            </div>
          </div>
        </template>
      </div>

      <div v-else class="no-planet-selected">
        <p>Click on a mission to view its details</p>
      </div>
    </div>

    <div class="right-side-container" :class="{ expanded: isEditing }">
      <slot name="right-panel"></slot>
    </div>
  </div>
</template>

<script>
import { mdiArrowLeftBold, mdiPlus, mdiDelete } from "@mdi/js";

export default {
  name: "MissionOverviewEdit",
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
  emits: ["close", "update-mission", "cancel-edit", "mission-editing-state-change"],
  data() {
    return {
      mdiArrowLeftBold,
      mdiPlus,
      mdiDelete,
      isEditingInternal: false,
      editTarget: null,
      formState: null,
    };
  },
  computed: {
    isEditing() {
      return this.isEditingInternal;
    },
  },
  watch: {
    selectedPlanetData: {
      immediate: true,
      handler(newVal) {
        if (!newVal) {
          this.isEditingInternal = false;
          this.formState = null;
          return;
        }
        this.formState = this.createFormState(newVal);
      },
    },
    isEditing(newValue) {
      this.$emit("mission-editing-state-change", newValue);
      if (!newValue && this.selectedPlanetData) {
        this.formState = this.createFormState(this.selectedPlanetData);
      }
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
      if (!this.formState) {
        this.formState = this.createFormState(this.selectedPlanetData);
      }
      this.$nextTick(() => {
        const refName = this.getRefNameForTarget(target);
        const element = refName && this.$refs[refName];
        if (element && element.focus) {
          element.focus();
        }
      });
    },
    getRefNameForTarget(target) {
      if (!target) return null;
      if (target === "planet") return "planetTitle";
      if (target === "intro") return "introField";
      if (target === "outro") return "outroField";
      if (typeof target === "object" && target.type === "step") {
        return `stepTitle-${target.index}`;
      }
      return null;
    },
    cancelEdit() {
      this.isEditingInternal = false;
      this.editTarget = null;
      this.formState = this.createFormState(this.selectedPlanetData);
      this.$emit("cancel-edit");
    },
    submitEdit() {
      if (!this.formState || !this.missionPath) return;
      const sanitizedSteps = this.formState.missionInstructions.steps.map((step) => ({
        title: step.title || "",
        checkpoint: step.checkpoint || "",
        tasks: (step.tasks || []).map((task) => ({
          taskContent: task.taskContent || "",
        })),
      }));

      const payload = {
        missionPath: this.missionPath,
        planet: {
          title: this.formState.title || "",
          description: this.formState.description || "",
          missionInstructions: {
            intro: this.formState.missionInstructions.intro || "",
            outro: this.formState.missionInstructions.outro || "",
            steps: sanitizedSteps,
          },
        },
      };

      this.$emit("update-mission", payload);
      this.isEditingInternal = false;
      this.editTarget = null;
    },
    createFormState(planet) {
      if (!planet) return null;
      const mission = planet.missionInstructions || {};
      return {
        title: planet.title || "",
        description: planet.description || "",
        missionInstructions: {
          intro: mission.intro || "",
          outro: mission.outro || "",
          steps: (mission.steps || []).map((step) => ({
            title: step.title || "",
            checkpoint: step.checkpoint || "",
            tasks: (step.tasks || []).map((task) => ({
              taskContent: task.taskContent || "",
            })),
          })),
        },
      };
    },
    addStep() {
      if (!this.formState) return;
      this.formState.missionInstructions.steps.push({
        title: "",
        checkpoint: "",
        tasks: [{ taskContent: "" }],
      });
    },
    removeStep(index) {
      if (!this.formState) return;
      this.formState.missionInstructions.steps.splice(index, 1);
    },
    addTaskToStep(index) {
      if (!this.formState) return;
      this.formState.missionInstructions.steps[index].tasks.push({ taskContent: "" });
    },
    removeTaskFromStep(stepIndex, taskIndex) {
      if (!this.formState) return;
      const tasks = this.formState.missionInstructions.steps[stepIndex].tasks;
      if (tasks.length > 1) {
        tasks.splice(taskIndex, 1);
      } else {
        tasks[0].taskContent = "";
      }
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
  padding: 20px;
  overflow-y: auto;
  background-color: var(--v-background-base);
  display: flex;
  gap: 24px;
  transition: width 0.3s ease;
  position: fixed;
  right: -50%;
  transition: right 0.3s ease;

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
      align-items: flex-start;
      padding-right: 20px;
    }
  }

  .right-section-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(var(--v-missionAccent-base), 0.2);
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
      content: "EDIT";
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--v-galaxyAccent-base);
      font-weight: bold;
      font-size: 0.7rem;
      letter-spacing: 0.35em;
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

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .steps-editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .step-editor-card {
      border: 1px solid rgba(var(--v-missionAccent-base), 0.25);
      border-radius: 10px;
      padding: 16px;
      background: rgba(var(--v-missionAccent-base), 0.05);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step-editor-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tasks-editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .task-editor {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
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
