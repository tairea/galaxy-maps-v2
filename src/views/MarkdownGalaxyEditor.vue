<template>
  <div class="markdown-galaxy-editor">
    <!-- Main Editor Area -->
    <div class="editor-container" :class="{ 'mobile-layout': isMobile }">
      <!-- Galaxy Map - Full Width Background -->
      <div class="galaxy-map-background">
        <div v-if="parsedMap && parsedMap.nodes.length > 0" class="galaxy-preview">
          <div v-if="physicsStatus" class="physics-status">
            <v-chip x-small :color="physicsStabilized ? 'success' : 'warning'" text-color="white">
              {{ physicsStatus }}
            </v-chip>
          </div>
          <GalaxyMap
            ref="galaxyMap"
            :course="previewCourse"
            :previewNodes="parsedMap.nodes"
            :previewEdges="parsedMap.edges"
            :previewPlanets="parsedMap.planets"
            :showMissions="false"
            :enablePhysics="true"
            @stabilized="onPhysicsStabilized"
          />
          <div class="preview-stats">
            <v-chip small class="mr-2">
              <v-icon small left>{{ mdiCircle }}</v-icon>
              {{ parsedMap.nodes.length }} Nodes
            </v-chip>
            <v-chip small class="mr-2">
              <v-icon small left>{{ mdiConnection }}</v-icon>
              {{ parsedMap.edges.length }} Connections
            </v-chip>
            <v-chip small>
              <v-icon small left>{{ mdiEarth }}</v-icon>
              {{ parsedMap.planets.length }} Missions
            </v-chip>
          </div>
        </div>

        <div v-else class="empty-preview">
          <v-icon large color="missionAccent" class="mb-4">{{ mdiMapMarker }}</v-icon>
          <p class="overline">Start typing markdown to see your galaxy map</p>
          <p class="caption">Use bullet points with different indentation levels</p>
        </div>
      </div>

      <!-- Markdown Editor - Fixed Position on Left -->
      <div class="markdown-editor-fixed" :style="{ width: isMobile ? '100%' : '30%' }">
        <div class="markdown-editor-content">
          <div class="markdown-input-wrapper">
            <MarkdownGalaxyInput
              v-model="markdownText"
              @validation-change="handleValidationChange"
              @error="handleEditorError"
            />
          </div>
          <div class="editor-actions">
            <BackButton :toPath="'/'" :mobile="isMobile" :showText="!isMobile" />
            <v-btn small outlined color="missionAccent" @click="showHelp = true" class="mr-2">
              <v-icon small left>{{ mdiHelpCircle }}</v-icon>
              {{ isMobile ? "" : "Help" }}
            </v-btn>
            <v-btn
              small
              outlined
              color="missionAccent"
              @click="exportMarkdown"
              class="mr-2"
              :disabled="!markdownText"
            >
              <v-icon small left>{{ mdiDownload }}</v-icon>
              {{ isMobile ? "" : "Export" }}
            </v-btn>
            <v-btn
              small
              outlined
              color="baseAccent"
              @click="saveGalaxy"
              :loading="saving"
              :disabled="!canSave"
            >
              <v-icon small left>{{ mdiContentSave }}</v-icon>
              {{ isMobile ? "" : "Save Galaxy" }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Help Dialog -->
    <v-dialog v-model="showHelp" max-width="800px" style="z-index: 1000">
      <v-card class="help-dialog">
        <v-card-title class="dialog-title galaxyAccent--text">
          <v-icon left color="galaxyAccent">{{ mdiInformationVariant }}</v-icon>
          {{ helpContent.title }}
        </v-card-title>
        <v-card-text class="dialog-content">
          <p class="mb-4">{{ helpContent.description }}</p>

          <div v-for="(level, index) in helpContent.levels" :key="index" class="mb-4">
            <h3 class="baseAccent--text">{{ level.name }}</h3>
            <p class="mb-2">{{ level.description }}</p>
            <div class="code-block mb-2">
              <code>{{ level.example }}</code>
            </div>
            <p class="caption">Indentation: {{ level.indent }}</p>
          </div>

          <h3 class="baseAccent--text mt-4">Tips</h3>
          <ul>
            <li v-for="(tip, index) in helpContent.tips" :key="index">{{ tip }}</li>
          </ul>

          <h3 class="baseAccent--text mt-4">Example</h3>
          <div class="code-block">
            <pre>{{ exampleMarkdown }}</pre>
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer></v-spacer>
          <v-btn text color="missionAccent" @click="showHelp = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Save Dialog -->
    <v-dialog v-model="saveDialog" max-width="500px">
      <v-card>
        <v-card-title class="galaxyAccent--text">Save Galaxy Map</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="galaxyTitle"
            label="Galaxy Name"
            outlined
            color="missionAccent"
            :rules="[(v) => !!v || 'Galaxy name is required']"
          ></v-text-field>
          <v-textarea
            v-model="galaxyDescription"
            label="Galaxy Description (optional)"
            outlined
            color="missionAccent"
            rows="3"
          ></v-textarea>

          <div v-if="saveValidation && !saveValidation.valid" class="mt-2">
            <v-alert
              v-for="(error, index) in saveValidation.errors"
              :key="`error-${index}`"
              type="error"
              dense
              text
              class="mb-1"
            >
              {{ error }}
            </v-alert>
          </div>

          <div v-if="saveValidation && saveValidation.warnings.length > 0" class="mt-2">
            <v-alert
              v-for="(warning, index) in saveValidation.warnings"
              :key="`warning-${index}`"
              type="warning"
              dense
              text
              class="mb-1"
            >
              {{ warning }}
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="saveDialog = false">Cancel</v-btn>
          <v-btn
            color="baseAccent"
            text
            @click="confirmSave"
            :loading="saving"
            :disabled="!galaxyTitle || (saveValidation && !saveValidation.valid)"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import GalaxyMap from "@/components/GalaxyView/GalaxyMap.vue";
import MarkdownGalaxyInput from "@/components/MarkdownEditor/MarkdownGalaxyInput.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import { parseMarkdownToGalaxyMap } from "@/lib/markdownGalaxyParser";
import {
  exportMarkdownFile,
  captureNodePositions,
  validateBeforeSave,
  MARKDOWN_HELP,
  MARKDOWN_EXAMPLE,
} from "@/lib/markdownGalaxyUtils";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mapState, mapActions } from "pinia";
import {
  mdiHelpCircle,
  mdiDownload,
  mdiContentSave,
  mdiInformationVariant,
  mdiCircle,
  mdiConnection,
  mdiEarth,
  mdiMapMarker,
} from "@mdi/js";
import firebase from "firebase/compat/app";

export default {
  name: "MarkdownGalaxyEditor",
  components: {
    GalaxyMap,
    MarkdownGalaxyInput,
    BackButton,
  },
  data() {
    return {
      mdiHelpCircle,
      mdiDownload,
      mdiContentSave,
      mdiInformationVariant,
      mdiCircle,
      mdiConnection,
      mdiEarth,
      mdiMapMarker,
      markdownText: "",
      parsedMap: null,
      nodePositions: {}, // Will be populated when saving
      physicsStabilized: false,
      physicsStatus: "Waiting for input...",
      isValid: false,
      showHelp: false,
      helpContent: MARKDOWN_HELP,
      exampleMarkdown: MARKDOWN_EXAMPLE,
      isResizing: false,
      saveDialog: false,
      galaxyTitle: "",
      galaxyDescription: "",
      saving: false,
      saveValidation: null,
      parseDebounce: null,
    };
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    canSave() {
      return (
        this.isValid && this.parsedMap && this.parsedMap.nodes.length > 0 && this.physicsStabilized
      );
    },
    previewCourse() {
      if (!this.parsedMap) return null;

      // Create a properly structured course object for GalaxyMap
      return {
        id: "preview",
        title: this.galaxyTitle || "Preview",
        description: this.galaxyDescription || "",
        status: "drafting",
        visibility: "private",
        // Don't pass nodes/edges directly - GalaxyMap will bind them from store
        // We need to set them in data for the component to pick up
        physicsEnabled: !this.physicsStabilized,
      };
    },
  },
  watch: {
    markdownText(newValue) {
      this.debouncedParse(newValue);
    },
  },
  mounted() {
    if (this.parseDebounce) {
      clearTimeout(this.parseDebounce);
    }
  },
  beforeDestroy() {
    if (this.parseDebounce) {
      clearTimeout(this.parseDebounce);
    }
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar", "setCurrentCourseId"]),
    debouncedParse(markdown) {
      if (this.parseDebounce) {
        clearTimeout(this.parseDebounce);
      }

      this.physicsStabilized = false;
      this.physicsStatus = "Parsing...";

      this.parseDebounce = setTimeout(() => {
        this.parseMarkdown(markdown);
      }, 300);
    },
    parseMarkdown(markdown) {
      if (!markdown || markdown.trim().length === 0) {
        this.parsedMap = null;
        this.physicsStatus = "Waiting for input...";
        return;
      }

      try {
        this.parsedMap = parseMarkdownToGalaxyMap(markdown);
        this.physicsStatus = "Calculating layout...";
        this.physicsStabilized = false; // Reset stabilization status
        // Don't reset nodePositions here - we'll capture them when saving
      } catch (error) {
        console.error("Parse error:", error);
        this.setSnackbar({
          show: true,
          text: "Failed to parse markdown",
          color: "error",
        });
      }
    },
    onPhysicsStabilized() {
      // Just mark as stabilized, but keep physics enabled
      // We'll capture positions only when saving
      this.physicsStabilized = true;
      this.physicsStatus = "Layout stabilized";
    },
    capturePositionsForSave() {
      if (!this.$refs.galaxyMap || !this.$refs.galaxyMap.$refs.network) {
        return {};
      }

      try {
        const network = this.$refs.galaxyMap.$refs.network.network;
        return captureNodePositions(network);
      } catch (error) {
        console.error("Failed to capture positions:", error);
        return {};
      }
    },
    handleValidationChange(valid) {
      this.isValid = valid;
    },
    handleEditorError(error) {
      this.setSnackbar({
        show: true,
        text: error,
        color: "error",
      });
    },
    exportMarkdown() {
      if (!this.markdownText) return;
      const filename = `galaxy-map-${Date.now()}.md`;
      exportMarkdownFile(this.markdownText, filename);
      this.setSnackbar({
        show: true,
        text: "Markdown exported",
        color: "baseAccent",
      });
    },
    saveGalaxy() {
      // Capture positions right before saving
      this.nodePositions = this.capturePositionsForSave();

      // Validate before opening dialog
      this.saveValidation = validateBeforeSave(
        this.parsedMap,
        this.nodePositions,
        this.galaxyTitle,
      );

      this.saveDialog = true;
    },
    async confirmSave() {
      if (!this.galaxyTitle) {
        this.setSnackbar({
          show: true,
          text: "Please enter a galaxy name",
          color: "error",
        });
        return;
      }

      // Capture positions again right before saving (in case physics moved them)
      this.nodePositions = this.capturePositionsForSave();

      // Final validation
      this.saveValidation = validateBeforeSave(
        this.parsedMap,
        this.nodePositions,
        this.galaxyTitle,
      );

      if (!this.saveValidation.valid) {
        return;
      }

      this.saving = true;

      try {
        await this.saveToFirestore();
      } catch (error) {
        console.error("Save error:", error);
        this.setSnackbar({
          show: true,
          text: "Failed to save galaxy",
          color: "error",
        });
      } finally {
        this.saving = false;
      }
    },
    async saveToFirestore() {
      const batch = db.batch();

      // Create course document
      const courseRef = db.collection("courses").doc();
      const courseData = {
        id: courseRef.id,
        title: this.galaxyTitle.trim(),
        description: this.galaxyDescription.trim() || "",
        status: "drafting",
        visibility: "private",
        owner: db.collection("people").doc(this.person.id),
        mappedBy: {
          name: `${this.person.firstName} ${this.person.lastName}`,
          personId: this.person.id,
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      batch.set(courseRef, courseData);

      // Create map-nodes with physics positions
      this.parsedMap.nodes.forEach((node) => {
        const position = this.nodePositions[node.id] || { x: 0, y: 0 };
        const nodeRef = courseRef.collection("map-nodes").doc(node.id);
        batch.set(nodeRef, {
          id: node.id,
          label: node.label,
          x: position.x,
          y: position.y,
          color: node.color || "#88C0D0",
          size: node.size || 7,
          shape: node.shape || "dot",
          group: node.group || "default",
          topicCreatedTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Create topic document for backward compatibility
        const topicRef = courseRef.collection("topics").doc(node.id);
        batch.set(topicRef, {
          id: node.id,
          label: node.label,
          x: position.x,
          y: position.y,
          color: node.color || "#88C0D0",
          group: node.group || "default",
          topicCreatedTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
          taskTotal: 0,
        });
      });

      // Create map-edges
      this.parsedMap.edges.forEach((edge) => {
        const edgeRef = courseRef.collection("map-edges").doc(edge.id);
        batch.set(edgeRef, {
          id: edge.id,
          from: edge.from,
          to: edge.to,
          color: edge.color || { inherit: "to" },
        });
      });

      // Create tasks (planets)
      this.parsedMap.planets.forEach((planet) => {
        if (planet.topicId) {
          const taskRef = courseRef
            .collection("topics")
            .doc(planet.topicId)
            .collection("tasks")
            .doc(planet.id);
          batch.set(taskRef, {
            id: planet.id,
            name: planet.name,
            description: "",
            order: planet.order,
            topicId: planet.topicId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      // Commit batch
      await batch.commit();

      this.setSnackbar({
        show: true,
        text: "Galaxy saved successfully",
        color: "baseAccent",
      });

      this.saveDialog = false;
      this.setCurrentCourseId(courseRef.id);

      // Navigate to the new galaxy
      this.$router.push({
        name: "GalaxyView",
        params: { courseId: courseRef.id },
      });
    },
  },
};
</script>

<style scoped lang="scss">
.markdown-galaxy-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--v-background-base);
  position: relative;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;

  &.mobile-layout {
    flex-direction: column;
  }
}

.galaxy-map-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.galaxy-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.physics-status {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.preview-stats {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.empty-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  padding: 32px;
  text-align: center;
}

.markdown-editor-fixed {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  z-index: 100;
  backdrop-filter: blur(2px);
  background-color: var(--v-background-base);
  opacity: 0.95;
}

.markdown-editor-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
}

.markdown-input-wrapper {
  height: 80%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
  height: 20%;
  flex-shrink: 0;
  justify-content: center;
}

// Help Dialog Styles
.help-dialog {
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
    max-height: 70vh;
    overflow-y: auto;
  }

  .dialog-actions {
    padding: 20px;
    border-top: 1px solid var(--v-missionAccent-base);
  }
}

.code-block {
  background-color: var(--v-background-darken1);
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--v-missionAccent-base);
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.875rem;
  overflow-x: auto;

  code,
  pre {
    color: var(--v-text-base);
    margin: 0;
  }
}

@media (max-width: 768px) {
  .markdown-editor-fixed {
    position: relative;
    padding: 8px;
    backdrop-filter: none;
    background-color: var(--v-background-base);
  }

  .mobile-layout .markdown-editor-fixed {
    max-height: 40vh;
  }

  .editor-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
