<template>
  <v-container class="pa-0">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="50%" light persistent>


          <!-- DIALOG CONTENT -->
          <div class="markdown-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">Edit GALAXY MAP</p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  This is your Galaxy Map in Markdown formatting. <br />
                  # Galaxy Name
                  ## Galaxy Description
                  1. Star System Name [prereq if any]
                    1. Mission Name
                    2. Mission Name
                  2. Next Star System Name [prereq if any]
                    1. Mission Name
                    2. Mission Name
                </p>
              </div>
            </div>

            <div class="markdown-dialog-content">
              <!-- EDITOR -->
              <div>
                <v-skeleton-loader v-if="loading" type="card-avatar"></v-skeleton-loader>
                <v-textarea v-else solo auto-grow id="markdown-editor" v-model="markdownContent" class="markdown-editor" :dark="dark"
                  :light="!dark"></v-textarea>
              </div>

              <!-- ACTION BUTTONS -->
              <div class="action-buttons">
                <v-btn outlined color="baseAccent" @click="saveContent" class="mr-2" :loading="loading">
                  <v-icon left>{{ mdiCheck }}</v-icon>
                  SAVE
                </v-btn>

                <v-btn outlined :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'" class="ml-2" @click="cancel"
                  :disabled="loading">
                  <v-icon left>{{ mdiClose }}</v-icon>
                  Cancel
                </v-btn>
              </div>
            </div>
          </div>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { VueEditor } from "vue2-editor";
import {
  mdiPencil,
  mdiCheck,
  mdiClose,
  mdiInformationVariant,
} from "@mdi/js";

import { db } from "@/store/firestoreConfig";
import firebase from "firebase/compat/app";
import { doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";

export default {
  name: "MarkdownEditorDialog",
  components: {
    VueEditor,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    courseId: {
      type: String,
      default: "",
    },
  },
  data: () => ({
    mdiPencil,
    mdiCheck,
    mdiClose,
    mdiInformationVariant,
    dialog: false,
    markdownContent: "",
    loading: false,
    quillFocused: false,
    customToolbar: [
    ],
  }),
  watch: {
    value(newVal) {
      console.log("value changed", newVal);
      this.dialog = newVal;
      if (newVal == false) {
        this.$emit('close');
      }
    },

  },
  async mounted() {
    await this.getCourseMarkdown(this.courseId).then(markdown => this.markdownContent = markdown)
    .catch(err => console.error("Error retrieving course markdown:", err));;
  },
  computed: {
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    handleImageAdded(file, Editor, cursorLocation) {
      // Image handling logic will go here
      console.log("Image added", file);
    },
    saveContent() {
      // Save logic will go here
      this.dialog = false;
    },
    cancel() {
      this.value = false;
    },
    async getCourseMarkdown(courseId) {
      this.loading = true;
      try {
        // Retrieve the course document from "courses" collection
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) {
          throw new Error(`Course with id ${courseId} not found.`);
        }
        const courseData = courseSnap.data();

        // Start building the markdown string
        let markdown = `# ${courseData.title}\n`;
        markdown += `## ${courseData.description}\n\n`;

        // Retrieve topics from the "topics" subcollection
        const topicsRef = collection(courseRef, "topics");
        const topicsQuery = query(topicsRef, orderBy("topicCreatedTimestamp"));
        const topicsSnapshot = await getDocs(topicsQuery);

        let topicIndex = 1;
        for (const topicDoc of topicsSnapshot.docs) {
          const topicData = topicDoc.data();
          // Format topic line with prerequisites if they exist
          let topicLine = `${topicIndex}. ${topicData.label}`;
          if (topicData.prerequisites && topicData.prerequisites.length > 0) {
            topicLine += " [" + topicData.prerequisites.join(", ") + "]";
          }
          markdown += topicLine + "\n";

          // Retrieve tasks for this topic
          const tasksRef = collection(topicDoc.ref, "tasks");
          const tasksQuery = query(tasksRef, orderBy("taskCreatedTimestamp"));
          const tasksSnapshot = await getDocs(tasksQuery);

          let taskIndex = 1;
          for (const taskDoc of tasksSnapshot.docs) {
            const taskData = taskDoc.data();
            // Add task title indented under the topic
            markdown += `    ${taskIndex}. ${taskData.title}\n`;
            taskIndex++;
          }
          markdown += "\n";
          topicIndex++;
        }
        this.loading = false;
        return markdown;
      } catch (error) {
        this.loading = false;
        throw error;
      }
    }

  },
  
};
</script>

<style scoped lang="scss">
::v-deep .ql-tooltip {
  left: unset !important;
}

.markdown-dialog {
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  display: flex;
  flex-wrap: wrap;
  overflow-x: hidden;
  overflow-y: scroll;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;

  }

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 1.2rem;
    margin-bottom: 10px;
  }

  .dialog-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.7rem;
    margin: 0;
    font-style: italic;
  }
}

.markdown-dialog-content {
  min-height: 800px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  width: 100%;

  .markdown-editor {
    min-height: 600px;
    border: 1px solid var(--v-missionAccent-base);
    color: white;
    font-size: 0.9rem;
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.quill ::v-deep .ql-toolbar {
  border: 1px solid #ffffff45;
}

.quill ::v-deep .ql-container {
  border: 1px solid #ffffff45;
  min-height: 300px;
}

.quill ::v-deep .ql-editor {
  font-size: 0.9rem;
}

.active-quill ::v-deep .ql-toolbar {
  border: 1px solid var(--v-missionAccent-base);
}

.active-quill ::v-deep .ql-container {
  border: 1px solid var(--v-missionAccent-base);
}
</style>
