<template>
  <div
    id="right-section"
    :class="{ mobile: isMobile, expanded: isEditing, open: show }"
    class="pt-16"
  >
    <div class="left-side-container" :class="{ expanded: isEditing }">
      <div class="right-section-header">
        <v-btn @click="handleClose" outlined color="missionAccent" small>
          <v-icon left small>{{ mdiArrowLeftBold }}</v-icon>
          Back to Overview
        </v-btn>
      </div>

      <div v-if="displayPlanetData" class="selected-planet-info">
        <template>
          <p class="missionAccent--text text-h2 mission-title" @click="selectAllMissionItems">
            Mission:
          </p>

          <div
            class="planet-header mission-section"
            :class="{
              'active-item': isActiveMissionItem('title & description'),
              editing: isInlineEditing('title & description'),
            }"
            tabindex="0"
            role="button"
            @click="startEditing('title & description')"
          >
            <span class="planet-emoji">🪐</span>
            <div
              class="planet-header-content"
              @click="onSectionContentClick('title & description', $event)"
            >
              <template v-if="isInlineEditing('title & description') && editablePlanetData">
                <v-text-field
                  v-model="editablePlanetData.title"
                  label="Mission Title"
                  outlined
                  dense
                  hide-details="auto"
                  class="inline-field"
                ></v-text-field>
                <v-textarea
                  v-model="editablePlanetData.description"
                  label="Mission Description"
                  outlined
                  rows="3"
                  auto-grow
                  hide-details="auto"
                  class="inline-field inline-textarea"
                ></v-textarea>
                <div class="inline-actions">
                  <v-btn
                    color="missionAccent"
                    small
                    @click.stop="saveInlineEdit('title & description')"
                  >
                    Save
                  </v-btn>
                  <v-btn text small @click.stop="cancelInlineEdit('title & description')">
                    Cancel
                  </v-btn>
                </div>
              </template>
              <template v-else>
                <h3 class="planet-title baseAccent--text">{{ displayPlanetData.title }}</h3>
                <p class="planet-description">{{ displayPlanetData.description }}</p>
              </template>
            </div>
          </div>

          <div v-if="displayPlanetData.missionInstructions.intro">
            <div
              v-if="displayPlanetData.missionInstructions"
              class="section-card intro-card mission-section"
              :class="{
                'active-item': isActiveMissionItem('intro'),
                editing: isInlineEditing('intro'),
              }"
              tabindex="0"
              role="button"
              @click="startEditing('intro')"
            >
              <div @click="onSectionContentClick('intro', $event)">
                <h4 class="section-title text-h5">Intro</h4>
                <template v-if="isInlineEditing('intro') && editablePlanetData">
                  <v-textarea
                    v-model="editablePlanetData.missionInstructions.intro"
                    label="Intro"
                    outlined
                    rows="3"
                    auto-grow
                    hide-details="auto"
                    class="inline-field inline-textarea"
                  ></v-textarea>
                  <div class="inline-actions">
                    <v-btn color="missionAccent" small @click.stop="saveInlineEdit('intro')">
                      Save
                    </v-btn>
                    <v-btn text small @click.stop="cancelInlineEdit('intro')">Cancel</v-btn>
                  </div>
                </template>
                <template v-else>
                  <p class="section-text">{{ displayPlanetData.missionInstructions.intro }}</p>
                </template>
              </div>
            </div>

            <div
              v-for="(step, index) in displayPlanetData.missionInstructions.steps || []"
              :key="`step-${index}`"
              class="step-card mission-section"
              :class="{
                'active-item': isActiveMissionItem('steps[' + index + ']'),
                editing: isInlineEditing('steps[' + index + ']'),
              }"
              tabindex="0"
              role="button"
              @click="startEditing('steps[' + index + ']')"
            >
              <div
                class="step-content"
                @click="onSectionContentClick('steps[' + index + ']', $event)"
              >
                <template v-if="isInlineEditing('steps[' + index + ']') && editablePlanetData">
                  <v-text-field
                    v-model="editablePlanetData.missionInstructions.steps[index].title"
                    :label="`Step ${index + 1} Title`"
                    outlined
                    dense
                    hide-details="auto"
                    class="inline-field"
                  ></v-text-field>

                  <div
                    v-for="(task, taskIndex) in editablePlanetData.missionInstructions.steps[index]
                      .tasks"
                    :key="`task-edit-${index}-${taskIndex}`"
                    class="inline-task-field"
                  >
                    <v-textarea
                      v-model="
                        editablePlanetData.missionInstructions.steps[index].tasks[taskIndex]
                          .taskContent
                      "
                      :label="`Task ${taskIndex + 1}`"
                      outlined
                      rows="2"
                      auto-grow
                      hide-details="auto"
                      class="inline-textarea"
                    ></v-textarea>
                  </div>

                  <v-textarea
                    v-model="editablePlanetData.missionInstructions.steps[index].checkpoint"
                    label="Checkpoint"
                    outlined
                    rows="2"
                    auto-grow
                    hide-details="auto"
                    class="inline-field inline-textarea"
                  ></v-textarea>

                  <div class="inline-actions">
                    <v-btn
                      color="missionAccent"
                      small
                      @click.stop="saveInlineEdit('steps[' + index + ']')"
                    >
                      Save
                    </v-btn>
                    <v-btn text small @click.stop="cancelInlineEdit('steps[' + index + ']')">
                      Cancel
                    </v-btn>
                  </div>
                </template>
                <template v-else>
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
                </template>
              </div>
            </div>

            <div
              v-if="
                displayPlanetData.missionInstructions && displayPlanetData.missionInstructions.outro
              "
              class="section-card outro-card mission-section"
              :class="{
                'active-item': isActiveMissionItem('outro'),
                editing: isInlineEditing('outro'),
              }"
              tabindex="0"
              role="button"
              @click="startEditing('outro')"
            >
              <div @click="onSectionContentClick('outro', $event)">
                <h4 class="section-title text-h5">Outro</h4>
                <template v-if="isInlineEditing('outro') && editablePlanetData">
                  <v-textarea
                    v-model="editablePlanetData.missionInstructions.outro"
                    label="Outro"
                    outlined
                    rows="3"
                    auto-grow
                    hide-details="auto"
                    class="inline-field inline-textarea"
                  ></v-textarea>
                  <div class="inline-actions">
                    <v-btn color="missionAccent" small @click.stop="saveInlineEdit('outro')">
                      Save
                    </v-btn>
                    <v-btn text small @click.stop="cancelInlineEdit('outro')">Cancel</v-btn>
                  </div>
                </template>
                <template v-else>
                  <p class="section-text">{{ displayPlanetData.missionInstructions.outro }}</p>
                </template>
              </div>
            </div>
          </div>
          <div v-else-if="displayPlanetData.missionInstructionsHtmlString">
            <div
              class="section-card mission-html-card mission-section"
              :class="{
                'active-item': isActiveMissionItem('missionHtml'),
                editing: isInlineEditing('missionHtml'),
              }"
              tabindex="0"
              role="button"
              @click="startEditing('missionHtml')"
            >
              <div @click="onSectionContentClick('missionHtml', $event)">
                <h4 class="section-title text-h5">Mission Instructions</h4>
                <template v-if="isInlineEditing('missionHtml') && editablePlanetData">
                  <vue-editor
                    ref="missionHtmlEditor"
                    v-model="editablePlanetData.missionInstructionsHtmlString"
                    class="mb-2 quill inline-field"
                    :class="{ 'active-quill': missionHtmlQuillFocused }"
                    :editor-toolbar="customToolbar"
                    @focus="missionHtmlQuillFocused = true"
                    @blur="missionHtmlQuillFocused = false"
                  />
                  <div class="inline-actions">
                    <v-btn color="missionAccent" small @click.stop="saveInlineEdit('missionHtml')">
                      Save
                    </v-btn>
                    <v-btn text small @click.stop="cancelInlineEdit('missionHtml')">Cancel</v-btn>
                  </div>
                </template>
                <template v-else>
                  <div
                    class="section-text"
                    v-html="displayPlanetData.missionInstructionsHtmlString"
                  ></div>
                </template>
              </div>
            </div>
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
import { VueEditor } from "vue2-editor";

export default {
  name: "MissionOverviewEdit",
  components: { RefineWithAiPrompter, VueEditor },
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
      editablePlanetData: null,
      originalPlanetSnapshot: null,
      inlineEditingTargets: [],
      missionHtmlQuillFocused: false,
      customToolbar: [
        [{ header: [false, 3, 4, 5] }],
        ["bold", "italic", "underline", "strike"],
        [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["link", "image", "video"],
      ],
    };
  },
  computed: {
    isEditing() {
      return this.isEditingInternal;
    },
    displayPlanetData() {
      return this.editablePlanetData || this.selectedPlanetData;
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
        } else if (item.endsWith(".missionInstructionsHtmlString")) {
          names[item] = "Mission Instructions (HTML)";
        } else if (item.includes("title")) {
          names[item] = "Mission Title";
        } else if (item.includes("description")) {
          names[item] = "Mission Description";
        } else {
          // This is the planet path (title & description)
          names[item] = "unknown";
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
          this.editablePlanetData = null;
          this.originalPlanetSnapshot = null;
          this.inlineEditingTargets = [];
          return;
        }
        this.setEditablePlanetData(newVal);
        this.editTarget = null;
        this.activeMissionItems = [];
        this.inlineEditingTargets = [];
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
      this.inlineEditingTargets = [];
      this.$emit("close");
    },
    startEditing(target) {
      if (!this.selectedPlanetData) return;
      const wasEditing = this.isEditingInternal;
      const isSameTarget = this.editTarget === target;

      if (!this.isEditingInternal) {
        this.isEditingInternal = true;
      }

      this.editTarget = target;

      if (!isSameTarget) {
        this.trackActiveMissionItem(target);
        return;
      }

      if (!wasEditing) {
        this.trackActiveMissionItem(target);
        return;
      }

      if (!this.isInlineEditing(target)) {
        this.openInlineEditing(target);
      }
    },
    setEditablePlanetData(planet) {
      const cloned = this.clonePlanetData(planet);
      this.editablePlanetData = cloned;
      this.originalPlanetSnapshot = this.clonePlanetData(cloned);
    },
    clonePlanetData(planet) {
      if (!planet) return null;
      const rawClone = JSON.parse(JSON.stringify(planet));
      const normalizedInstructions = this.normalizeMissionInstructions(
        rawClone.missionInstructionsObject || rawClone.missionInstructions,
      );
      return {
        ...rawClone,
        title: rawClone.title || "",
        description: rawClone.description || "",
        missionInstructions: normalizedInstructions,
        missionInstructionsObject: normalizedInstructions,
      };
    },
    normalizeMissionInstructions(instructions) {
      let base = instructions;
      if (!base) {
        base = {};
      } else if (typeof base === "string") {
        try {
          base = JSON.parse(base);
        } catch (error) {
          console.warn("Failed to parse mission instructions string", error);
          base = {};
        }
      }

      const steps = Array.isArray(base.steps) ? base.steps : [];

      return {
        intro: base.intro || "",
        outro: base.outro || "",
        steps: steps.map((step) => this.cloneMissionStep(step)),
      };
    },
    cloneMissionStep(step) {
      const baseStep = step ? JSON.parse(JSON.stringify(step)) : {};
      return {
        ...baseStep,
        title: baseStep.title || "",
        checkpoint: baseStep.checkpoint || "",
        tasks: (baseStep.tasks || []).map((task) => ({
          ...task,
          taskContent: task?.taskContent || "",
        })),
      };
    },
    trackActiveMissionItem(target) {
      if (!target) return;
      // Build full object notation path: star[x].planet[y].missionInstructions.target
      const basePath = this.selectedPlanetData?.id || this.missionPath;
      if (!basePath) return;

      let keys = [];
      if (target === "title & description") {
        // Add both title and description as separate items with legacy fallbacks
        keys = [`${basePath}.title`, `${basePath}.description`];
      } else if (target === "missionHtml") {
        keys = [`${basePath}.missionInstructionsHtmlString`];
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
          this.activeMissionItems.includes(`${basePath}.title`) ||
          this.activeMissionItems.includes(`${basePath}.description`)
        );
      } else if (target === "missionHtml") {
        return this.activeMissionItems.includes(`${basePath}.missionInstructionsHtmlString`);
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
    isInlineEditing(target) {
      return this.inlineEditingTargets.includes(target);
    },
    openInlineEditing(target) {
      if (!target) return;
      if (!this.inlineEditingTargets.includes(target)) {
        this.inlineEditingTargets.push(target);
      }
    },
    closeInlineEditing(target) {
      this.inlineEditingTargets = this.inlineEditingTargets.filter((t) => t !== target);
    },
    onSectionContentClick(target, event) {
      if (this.isInlineEditing(target)) {
        event.stopPropagation();
      }
    },
    cancelInlineEdit(target) {
      this.restoreSectionFromOriginal(target);
      this.closeInlineEditing(target);
    },
    // Note: v-model keeps the editor in sync; avoid forcing content to prevent duplicates
    setMissionHtmlEditorContent() {},
    restoreSectionFromOriginal(target) {
      if (!target || !this.originalPlanetSnapshot || !this.editablePlanetData) return;

      if (target === "title & description") {
        this.editablePlanetData.title = this.originalPlanetSnapshot.title;
        this.editablePlanetData.description = this.originalPlanetSnapshot.description;
        return;
      }

      const mission = this.editablePlanetData.missionInstructions || {};
      const originalMission = this.originalPlanetSnapshot.missionInstructions || {};

      if (target === "missionHtml") {
        this.editablePlanetData.missionInstructionsHtmlString =
          this.originalPlanetSnapshot.missionInstructionsHtmlString || "";
        return;
      }

      if (target === "intro") {
        mission.intro = originalMission.intro;
        return;
      }

      if (target === "outro") {
        mission.outro = originalMission.outro;
        return;
      }

      const stepMatch = target.match(/steps\[(\d+)\]/);
      if (stepMatch) {
        const index = parseInt(stepMatch[1], 10);
        if (!Number.isNaN(index)) {
          const originalStep = originalMission.steps?.[index];
          if (originalStep && Array.isArray(mission.steps)) {
            this.$set(mission.steps, index, this.cloneMissionStep(originalStep));
          }
        }
      }
    },
    saveInlineEdit(target) {
      if (!this.editablePlanetData) return;
      const payloadResult = this.buildPlanetPayload();
      if (!payloadResult) return;

      const { planetPayload, sanitizedMission, missionInstructionsHtmlString } = payloadResult;

      const missionPath = this.missionPath || this.selectedPlanetData?.id;

      // If editing raw HTML, prefer the edited HTML string over generated one
      if (target === "missionHtml") {
        const editedHtml = this.editablePlanetData.missionInstructionsHtmlString || "";
        planetPayload.missionInstructionsHtmlString = editedHtml;
      }

      this.$emit("update-mission", {
        missionPath,
        planet: planetPayload,
      });

      const clonedMission = JSON.parse(JSON.stringify(sanitizedMission));
      this.editablePlanetData.missionInstructions = clonedMission;
      this.editablePlanetData.missionInstructionsObject = clonedMission;
      this.editablePlanetData.missionInstructionsHtmlString =
        target === "missionHtml"
          ? this.editablePlanetData.missionInstructionsHtmlString
          : missionInstructionsHtmlString;

      // Update the original snapshot so subsequent cancels use the saved state
      this.originalPlanetSnapshot = this.clonePlanetData(this.editablePlanetData);
      this.closeInlineEditing(target);
    },
    buildPlanetPayload() {
      if (!this.editablePlanetData) return null;

      const mission = this.normalizeMissionInstructions(
        this.editablePlanetData.missionInstructions,
      );

      const sanitizedMission = {
        intro: mission.intro,
        outro: mission.outro,
        steps: mission.steps.map((step) => ({
          title: step.title,
          checkpoint: step.checkpoint,
          tasks: (step.tasks || []).map((task) => ({
            taskContent: task.taskContent,
          })),
        })),
      };

      const missionInstructionsHtmlString = this.formatMissionInstructionsToHtml(sanitizedMission);

      return {
        planetPayload: {
          ...this.editablePlanetData,
          title: this.editablePlanetData.title,
          description: this.editablePlanetData.description,
          missionInstructions: JSON.parse(JSON.stringify(sanitizedMission)),
          missionInstructionsObject: JSON.parse(JSON.stringify(sanitizedMission)),
          missionInstructionsHtmlString,
        },
        sanitizedMission,
        missionInstructionsHtmlString,
      };
    },
    formatMissionInstructionsToHtml(missionInstructions) {
      if (!missionInstructions) return "";

      const safeText = (text) => this.escapeHtml(text);
      let html = "";

      if (missionInstructions.intro) {
        html += `<p class="intro">${safeText(missionInstructions.intro)}</p>`;
      }

      const steps = Array.isArray(missionInstructions.steps) ? missionInstructions.steps : [];
      if (steps.length) {
        html += `<h2>Instructions</h2>`;

        steps.forEach((step) => {
          if (!step) return;

          if (step.title) {
            html += `<h3>${safeText(step.title)}</h3>`;
          }

          const tasks = Array.isArray(step.tasks) ? step.tasks : [];
          if (tasks.length) {
            html += "<ul>";
            tasks.forEach((task) => {
              const content = safeText(task?.taskContent || "");
              if (content) {
                html += `<li>${content}</li>`;
              }
            });
            html += "</ul>";
          }

          if (step.checkpoint) {
            html += `<p class="checkpoint"><em>Checkpoint: ${safeText(step.checkpoint)}</em></p>`;
          }
        });
      }

      if (missionInstructions.outro) {
        html += `<p class="outro">${safeText(missionInstructions.outro)}</p>`;
      }

      return html;
    },
    escapeHtml(text) {
      if (typeof text !== "string") return "";
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
    handleCancelEdit() {
      // Clear all active mission items
      this.activeMissionItems = [];

      // Disable expanded state
      this.isEditingInternal = false;
      this.editTarget = null;

      // Clear the refine prompt
      this.refinePrompt = "";

      // Revert inline edits back to the last saved snapshot
      if (this.originalPlanetSnapshot) {
        this.editablePlanetData = this.clonePlanetData(this.originalPlanetSnapshot);
      }
      this.inlineEditingTargets = [];

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

    // When closed on mobile, ensure it's fully hidden
    &:not(.open) {
      right: -100%;
    }
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
    margin-bottom: 10px;
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

      &.editing {
        border: 1px solid rgba(var(--v-missionAccent-base), 0.4);
        box-shadow: 0 0 0 2px rgba(var(--v-missionAccent-base), 0.1) inset;
        cursor: default;
      }
    }

    .mission-section:hover,
    .mission-section:focus-visible {
      transform: scale(1.02);
      transition: transform 0.2s ease;
      border-right: 10px solid var(--v-galaxyAccent-base);
      position: relative;
    }

    .mission-section.editing:hover,
    .mission-section.editing:focus-visible {
      transform: none;
      border-right: none;
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

    .mission-section.editing::after {
      display: none;
    }

    .planet-header-content,
    .step-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .inline-field {
      margin-bottom: 4px;
    }

    .inline-task-field {
      margin-bottom: 8px;
    }

    .inline-actions {
      display: flex;
      gap: 16px;
      margin-top: 8px;
    }

    .inline-textarea {
      ::v-deep textarea {
        height: auto !important;
        min-height: 56px;
        max-height: 55vh;
        overflow-y: auto;
      }
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

    .quill ::v-deep .ql-toolbar {
      border: 1px solid #ffffff45;
    }

    .quill ::v-deep .ql-container {
      border: 1px solid #ffffff45;

      .ql-editor {
        font-size: 0.9rem;
        color: var(--v-missionAccent-base);
      }
    }

    .active-quill ::v-deep .ql-toolbar {
      border: 1px solid var(--v-missionAccent-base);
    }

    .active-quill ::v-deep .ql-container {
      border: 1px solid var(--v-missionAccent-base);
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

// Medium screens (768px - 960px) - ensure right section is fully hidden when closed
@media (min-width: 769px) and (max-width: 960px) {
  #right-section {
    // When closed on medium screens, ensure it's fully hidden
    &:not(.open) {
      right: -100%;
    }
  }
}

// Mobile screens (≤768px) - ensure right section is fully hidden when closed
@media (max-width: 768px) {
  #right-section {
    // When closed on mobile, ensure it's fully hidden
    &:not(.open) {
      right: -100%;
    }
  }
}
</style>
