<template>
  <div class="markdown-galaxy-input">
    <div class="editor-toolbar">
      <v-btn x-small text @click="insertBullet" color="missionAccent" title="Insert bullet point">
        <v-icon small>{{ mdiFormatListBulleted }}</v-icon>
      </v-btn>
      <v-btn x-small text @click="indent" color="missionAccent" title="Indent (Tab)">
        <v-icon small>{{ mdiFormatIndentIncrease }}</v-icon>
      </v-btn>
      <v-btn x-small text @click="outdent" color="missionAccent" title="Outdent (Shift+Tab)">
        <v-icon small>{{ mdiFormatIndentDecrease }}</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <div class="editor-stats">
        <span class="overline">{{ lineCount }} lines</span>
        <span class="overline ml-2">{{ charCount }} chars</span>
      </div>
    </div>

    <div ref="editorContainer" class="milkdown-container"></div>

    <div v-if="validationErrors.length > 0" class="validation-errors mt-2">
      <v-alert
        v-for="(error, index) in validationErrors"
        :key="index"
        :type="error.severity === 'error' ? 'error' : 'warning'"
        dense
        text
        class="mb-1"
      >
        Line {{ error.line }}: {{ error.message }}
      </v-alert>
    </div>
  </div>
</template>

<script>
import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { nord } from "@milkdown/theme-nord";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { validateMarkdown } from "@/lib/markdownGalaxyParser";
import { mdiFormatListBulleted, mdiFormatIndentIncrease, mdiFormatIndentDecrease } from "@mdi/js";

export default {
  name: "MarkdownGalaxyInput",
  props: {
    value: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      mdiFormatListBulleted,
      mdiFormatIndentIncrease,
      mdiFormatIndentDecrease,
      editor: null,
      validationErrors: [],
      lineCount: 0,
      charCount: 0,
    };
  },
  mounted() {
    this.initializeMilkdown();
  },
  beforeDestroy() {
    // Clean up tab handler
    if (this._tabHandler && this.$refs.editorContainer) {
      const editorElement = this.$refs.editorContainer;
      const editableElement = editorElement.querySelector(".milkdown .editor");
      if (editableElement) {
        editableElement.removeEventListener("keydown", this._tabHandler);
      }
      editorElement.removeEventListener("keydown", this._tabHandler);
    }

    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    async initializeMilkdown() {
      try {
        const editor = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, this.$refs.editorContainer);
            ctx.set(defaultValueCtx, this.value || "");

            ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
              this.updateContent(markdown);
            });
          })
          .use(nord)
          .use(commonmark)
          .use(listener)
          .create();

        this.editor = editor;
        this.updateStats(this.value || "");

        // Prevent Tab key from leaving the editor
        this.$nextTick(() => {
          this.setupTabHandling();
        });
      } catch (error) {
        console.error("Failed to initialize Milkdown:", error);
        // Fallback: show error to user
        this.$emit("error", "Failed to initialize markdown editor");
      }
    },
    setupTabHandling() {
      if (!this.$refs.editorContainer) return;

      const editorElement = this.$refs.editorContainer;

      // Find the actual editable element inside Milkdown
      const editableElement = editorElement.querySelector(".milkdown .editor");
      if (!editableElement) {
        // Fallback to container if editable element not found yet
        setTimeout(() => this.setupTabHandling(), 100);
        return;
      }

      // Handle Tab key to prevent focus leaving
      const handleKeyDown = (event) => {
        if (event.key === "Tab") {
          // Prevent default tab behavior (focus leaving)
          event.preventDefault();
          event.stopPropagation();

          if (event.shiftKey) {
            // Shift+Tab: Remove indentation
            this.outdent();
          } else {
            // Tab: Add indentation
            this.indent();
          }
        }
      };

      editableElement.addEventListener("keydown", handleKeyDown);

      // Also handle on container as fallback
      editorElement.addEventListener("keydown", handleKeyDown);

      // Store handler for cleanup
      this._tabHandler = handleKeyDown;
    },
    updateContent(markdown) {
      this.updateStats(markdown);
      this.validateContent(markdown);
      this.$emit("input", markdown);
    },
    updateStats(markdown) {
      this.lineCount = markdown.split("\n").length;
      this.charCount = markdown.length;
    },
    validateContent(markdown) {
      this.validationErrors = validateMarkdown(markdown);
      this.$emit("validation-change", this.validationErrors.length === 0);
    },
    insertBullet() {
      if (this.editor) {
        const { action } = this.editor;
        action((ctx) => {
          const view = ctx.get(rootCtx).view;
          const { state, dispatch } = view;
          const { tr } = state;
          const text = "\n- ";
          tr.insertText(text);
          dispatch(tr);
        });
      }
    },
    indent() {
      if (this.editor) {
        const { action } = this.editor;
        action((ctx) => {
          const view = ctx.get(rootCtx).view;
          const { state, dispatch } = view;
          const { tr, selection } = state;

          // Get current line
          const { from } = selection;
          const line = state.doc.textBetween(
            state.doc.resolve(from).start(),
            state.doc.resolve(from).end(),
            "\n",
          );

          // Add 4 spaces at the start of the line
          const lineStart = state.doc.resolve(from).start();
          tr.insertText("    ", lineStart);
          dispatch(tr);
        });
      }
    },
    outdent() {
      if (this.editor) {
        const { action } = this.editor;
        action((ctx) => {
          const view = ctx.get(rootCtx).view;
          const { state, dispatch } = view;
          const { tr, selection } = state;

          // Get current line
          const { from } = selection;
          const lineStart = state.doc.resolve(from).start();
          const line = state.doc.textBetween(lineStart, state.doc.resolve(from).end(), "\n");

          // Remove up to 4 spaces from the start
          if (line.startsWith("    ")) {
            tr.delete(lineStart, lineStart + 4);
            dispatch(tr);
          } else if (line.startsWith("   ")) {
            tr.delete(lineStart, lineStart + 3);
            dispatch(tr);
          } else if (line.startsWith("  ")) {
            tr.delete(lineStart, lineStart + 2);
            dispatch(tr);
          } else if (line.startsWith(" ")) {
            tr.delete(lineStart, lineStart + 1);
            dispatch(tr);
          }
        });
      }
    },
  },
  watch: {
    value(newValue) {
      // Skip if editor isn't ready or value hasn't actually changed
      if (!this.editor) return;

      // Get current markdown from editor to avoid loops
      try {
        this.editor.action((ctx) => {
          const editorView = ctx.get(rootCtx);
          if (editorView && editorView.dom) {
            // Editor is ready, we can safely update if needed
            // But for now, we'll let the listener handle updates
          }
        });
      } catch (error) {
        console.error("Error updating editor:", error);
      }
    },
  },
};
</script>

<style lang="scss">
/* Import ProseMirror styles */
@import "prosemirror-view/style/prosemirror.css";
</style>

<style scoped lang="scss">
.markdown-galaxy-input {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: var(--v-background-lighten1);
  border-bottom: 1px solid var(--v-missionAccent-base);
  gap: 4px;
}

.editor-stats {
  display: flex;
  gap: 8px;
  color: var(--v-missionAccent-base);
  opacity: 0.7;
  font-size: 0.75rem;
}

.milkdown-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  line-height: 1.6;
}

/* Milkdown Nord theme customization */
:deep(.milkdown) {
  height: 100%;
  background-color: var(--v-background-base);
  color: var(--v-text-base);
}

:deep(.milkdown .editor) {
  outline: none;
  height: 100%;
  min-height: 400px;
}

:deep(.milkdown ul),
:deep(.milkdown ol) {
  padding-left: 24px;
}

:deep(.milkdown li) {
  margin: 4px 0;
}

:deep(.milkdown .list-item) {
  color: var(--v-text-base);
}

.validation-errors {
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
  background-color: var(--v-background-darken1);
}
</style>
