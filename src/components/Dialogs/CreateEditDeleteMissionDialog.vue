<template>
  <v-container class="pa-0">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="50%" light persistent>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-if="edit"
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button mt-4"
              outlined
              :color="taskColor ? taskColor : 'missionAccent'"
              x-small
            >
              <v-icon class="mr-2" x-small> {{ mdiPencil }}</v-icon>
              edit
            </v-btn>

            <v-btn v-else outlined color="missionAccent" v-bind="attrs" v-on="on">
              <v-icon left> {{ mdiPlus }} </v-icon>
              CREATE MISSION
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                {{ edit ? "Edit Mission " + task.title : dialogTitle }}
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  A Mission is a specific task. <br />Enter the mission details here or link to an
                  external file eg. Youtube video or Google Slide.
                </p>
              </div>
            </div>

            <div class="create-dialog-content">
              <!-- TITLE -->
              <!-- <p class="dialog-description">Mission Title:</p> -->
              <v-text-field
                class="input-field"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                v-model="task.title"
                label="Mission Title"
                required
              ></v-text-field>

              <!-- DESCRIPTION -->
              <!-- <p class="dialog-description">Mission Description:</p> -->
              <!-- <v-textarea
                class="input-field"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                clearable
                rows="6"
                v-model="task.description"
                label="Mission Content"
              ></v-textarea> -->
              <div>
                <vue-editor
                  id="editor1"
                  v-model="task.description"
                  useCustomImageHandler
                  @image-added="handleDescriptionImageAdded"
                  class="mb-8 quill"
                  :class="{ 'active-quill': quillFocused }"
                  :editor-toolbar="customToolbar"
                  @focus="quillFocused = true"
                  @blur="quillFocused = false"
                  style="color: white"
                />
              </div>

              <!-- COLOUR PICKER -->
              <div class="dialog-description">
                Mission colour:
                <v-tooltip right>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon
                      left
                      color="missionAccent"
                      small
                      class="circle-outline ma-1"
                      v-bind="attrs"
                      v-on="on"
                    >
                      {{ mdiInformationVariant }}</v-icon
                    >
                  </template>
                  <span> Feature requested by @scott_southwood </span>
                </v-tooltip>
                <div>
                  <v-color-picker
                    v-model="task.color"
                    class="ma-2 color-picker"
                    show-swatches
                    hide-canvas
                    hide-inputs
                    hide-sliders
                    mode="hexa"
                    value="#69a1e2"
                    width="90%"
                    :swatches="darkSwatches"
                    style="background-color: rgba(0, 0, 0, 0)"
                  >
                  </v-color-picker>
                </div>
              </div>

              <!-- DURATION -->
              <!-- <p class="dialog-description">Duration:</p> -->
              <!-- <v-text-field
                class="input-field"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                v-model="task.duration"
                required
                label="Estimated time to complete this Mission (in minutes)"
              ></v-text-field> -->

              <!-- VIDEO -->
              <!-- <p class="dialog-description">Video:</p> -->
              <!-- <v-text-field
                class="input-field"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                v-model="task.video"
                label="Link to Video (Optional)"
              ></v-text-field> -->

              <!-- SLIDES -->
              <!-- <p class="dialog-description">Slides:</p> -->
              <!-- <v-text-field
                class="input-field"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                v-model="task.slides"
                label="Link to slides (Optional)"
              ></v-text-field> -->

              <!-- SUBMISSION REQUIRED? -->
              <p class="dialog-description submission-colour">
                Does this Mission require the student to submit any evidence of work?
                <v-tooltip right max-width="300">
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon
                      left
                      color="cohortAccent"
                      small
                      class="circle-outline ma-1"
                      v-bind="attrs"
                      v-on="on"
                    >
                      {{ mdiInformationVariant }}</v-icon
                    >
                  </template>
                  <span>
                    With this option checked, students are required to submit a link to evidence of
                    their work.<br /><br />Once the student has submitted a link to their work, you
                    will be notified to review their submission to check if it is completed.<br /><br />
                    IMPORTANT: The student cannot progress onto the next System until you review and
                    approve their submission.
                  </span>
                </v-tooltip>
              </p>
              <v-checkbox
                v-model="task.submissionRequired"
                class="ma-0 pa-0 submission-colour"
                color="cohortAccent"
                :dark="dark"
                :light="!dark"
              >
                <template v-slot:label>
                  <span class="dialog-description submission-colour"
                    >Tick this box to request a submission of evidence for this Mission</span
                  >
                </template>
                <p v-if="task.submissionRequired" class="submission-colour">
                  SUBMISSION REQUIRED FOR THIS MISSION
                </p>
              </v-checkbox>

              <!-- SUBMISSION INSTRUCTIONS -->
              <div v-if="task.submissionRequired">
                <p class="dialog-description submission-colour">
                  Submission Instructions:
                  <v-tooltip right max-width="300">
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon
                        left
                        color="cohortAccent"
                        small
                        class="circle-outline ma-1"
                        v-bind="attrs"
                        v-on="on"
                      >
                        {{ mdiInformationVariant }}</v-icon
                      >
                    </template>
                    <span>
                      Please provide submission instructions. Eg. what type of evidence do you want
                      the student to provide a link to?
                    </span>
                  </v-tooltip>
                </p>
                <vue-editor
                  id="editor2"
                  v-model="task.submissionInstructions"
                  useCustomImageHandler
                  @image-added="handleSubmissionImageAdded"
                  class="mt-2 quill"
                  :class="{
                    'active-submission-quill': submissionQuillFocused,
                  }"
                  :editor-toolbar="customToolbar"
                  @focus="submissionQuillFocused = true"
                  @blur="submissionQuillFocused = false"
                  style="color: var(--v-cohortAccent-base)"
                />
                <!-- <v-textarea
                  v-model="task.submissionInstructions"
                  class="ma-0 pa-0 submission-colour input-field"
                  outlined
                  :dark="dark"
                  :light="!dark"
                  color="cohortAccent"
                ></v-textarea> -->
              </div>

              <!-- ACTION BUTTONS -->
              <div class="action-buttons">
                <v-btn
                  v-if="edit"
                  outlined
                  color="baseAccent"
                  @click="updateTask(task, index)"
                  class="mr-2"
                  :loading="loading"
                  v-bind="attrs"
                  v-on="on"
                >
                  <!-- :disabled="disabled" -->
                  <v-icon left> {{ mdiCheck }} </v-icon>
                  UPDATE
                </v-btn>
                <v-btn
                  v-else
                  outlined
                  color="baseAccent"
                  @click="saveTask(task)"
                  class="mr-2"
                  :loading="loading"
                  v-bind="attrs"
                  v-on="on"
                >
                  <!-- :disabled="disabled" -->
                  <v-icon left> {{ mdiCheck }} </v-icon>
                  SAVE
                </v-btn>

                <!-- DELETE -->
                <v-btn
                  v-if="edit"
                  outlined
                  :disabled="disabled || loading"
                  color="error"
                  @click="deleteDialog()"
                  class="ml-2"
                >
                  <v-icon left> {{ mdiDelete }} </v-icon>
                  DELETE
                </v-btn>

                <v-btn
                  outlined
                  :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                  class="ml-2"
                  @click="cancel"
                  :disabled="disabled || loading"
                >
                  <v-icon left> {{ mdiClose }} </v-icon>
                  Cancel
                </v-btn>
              </div>
              <!-- End action-buttons -->
            </div>
            <!-- End create-dialog-content -->

            <!-- SAVE -->
            <!-- <div class="create-field" :style="{ justifyContent: 'center' }">
              <v-btn
                outlined
                color="missionAccent"
                v-bind="attrs"
                v-on="on"
                @click="saveTask(task)"
              >
                <v-icon left>
                  {{mdiCheck}}
                </v-icon>
                SAVE
              </v-btn>
            </div> -->
          </div>
        </v-dialog>

        <!-- CONFIRM DELETE DIALOG -->
        <v-dialog v-model="dialogConfirm" width="40%" light>
          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header py-10">
              <p class="dialog-title"><strong>Warning!</strong> Delete Mission?</p>
              <div class="d-flex align-start">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  Are you sure you want to <strong>DELETE</strong> this
                  <span class="mission-text">{{ task.title }} Mission</span>?
                  <br />
                  <br />
                  Deleting is permanent!!!
                  <br />
                  <br />
                  <strong>YOU WILL LOSE ALL </strong>
                  <span class="mission-text">Mission</span> data.
                </p>
              </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- DELETE -->
              <v-btn
                outlined
                color="error"
                @click="confirmDeleteTask()"
                class="ml-2"
                :loading="deleting"
              >
                <v-icon left> {{ mdiDelete }} </v-icon>
                DELETE
              </v-btn>

              <v-btn
                v-if="!deleting"
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-2"
                @click="cancelDeleteDialog"
                :disabled="disabled || loading"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog-content -->
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {
  createTaskWithCourseIdTopicId,
  deleteTaskByCourseIdTopicIdTaskId,
  updateTaskByCourseIdTopicIdTaskId,
} from "@/lib/ff";
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import {
  mdiPencil,
  mdiPlus,
  mdiClose,
  mdiCheck,
  mdiDelete,
  mdiInformationVariant,
  mdiConsoleNetworkOutline,
} from "@mdi/js";
import { VueEditor } from "vue2-editor";
import { mapActions, mapState } from "pinia";

export default {
  name: "CreateEditDeleteMissionDialog",
  props: ["course", "topic", "taskId", "taskToEdit", "index", "on", "attrs", "edit", "taskColor"],
  components: {
    VueEditor,
  },
  data: () => ({
    mdiPencil,
    mdiPlus,
    mdiClose,
    mdiDelete,
    mdiCheck,
    mdiInformationVariant,
    dialog: false,
    dialogConfirm: false,
    dialogTitle: "Create a new Mission",
    dialogDescription: "",
    task: {
      title: "",
      description: "",
      duration: "",
      video: "",
      slides: "",
      submissionRequired: "",
      submissionInstructions: "",
      color: "#69a1e2",
    },
    loading: false,
    disabled: false,
    deleting: false,
    quillFocused: false,
    submissionQuillFocused: false,
    customToolbar: [
      [{ header: [false, 3, 4, 5] }],
      ["bold", "italic", "underline", "strike"], // toggled buttons
      [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
      ["link", "image", "video"],
      // ["clean"] // remove formatting button
    ],
    darkSwatches: [["#69A1E2"], ["#E269CF"], ["#00E676"], ["#FAF200"]], //https://coolors.co/69a1e2-e269cf-73fbd3-f3c969-54428e
  }),
  watch: {
    dialog(newVal) {
      if (newVal && this.taskToEdit) {
        Object.assign(this.task, this.taskToEdit);
      }
    },
  },
  // mounted() {
  //   if (this.taskToEdit) {
  //     console.log("editing task");
  //     // this.task = this.taskToEdit;
  //     Object.assign(this.taskToEdit, this.task)
  //   }
  // },
  computed: {
    ...mapState(useRootStore, ["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["getCourseTasks"]),
    async saveTask(task) {
      this.loading = true;
      this.disabled = true;

      // format video & slides url with "http://"
      if (task.video) {
        if (!/^https?:\/\//i.test(task.video)) {
          task.video = "http://" + task.video;
        }
      }
      if (task.slides) {
        if (!/^https?:\/\//i.test(task.slides)) {
          task.slides = "http://" + task.slides;
        }
      }

      const createdTask = await createTaskWithCourseIdTopicId(this.course.id, this.topic.id, task);

      this.$emit("taskCreated", createdTask);
      console.log("createdTask", createdTask);

      this.loading = false;
      this.disabled = false;
      this.dialog = false;

      this.task = {
        title: "",
        description: "",
        duration: "",
        video: "",
        slides: "",
        submissionRequired: "",
        submissionInstructions: "",
        color: "#69a1e2",
      };
    },
    async updateTask(task, index) {
      this.loading = true;
      this.disabled = true;

      // format video & slides url with "http://"
      if (task.video) {
        if (!/^https?:\/\//i.test(task.video)) {
          task.video = "http://" + task.video;
        }
      }
      if (task.slides) {
        if (!/^https?:\/\//i.test(task.slides)) {
          task.slides = "http://" + task.slides;
        }
      }

      // remove taskCreatedTimestamp so it does not update original (there was a change in format when this was happening)
      delete task.taskCreatedTimestamp;

      const updatedTask = await updateTaskByCourseIdTopicIdTaskId(
        this.course.id,
        this.topic.id,
        this.taskId,
        task,
      );

      this.$emit("taskUpdated", updatedTask);

      this.loading = false;
      this.disabled = false;
      this.dialog = false;
    },
    cancel() {
      this.dialog = false;
    },
    // delete task
    deleteDialog() {
      (this.dialog = false), (this.dialogConfirm = true);
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.dialog = true;
    },
    async confirmDeleteTask() {
      this.deleting = true
      const deletedTask = await deleteTaskByCourseIdTopicIdTaskId(
        this.course.id,
        this.topic.id,
        this.taskId,
      );

      this.$emit("taskDeleted", deletedTask);

      // close dialog
      this.deleting = false;
      this.dialogConfirm = false;

    },
    handleDescriptionImageAdded(file, Editor, cursorLocation) {
      console.log("image file", file);
      // ceate a storage ref
      var storageRef = storage.ref(
        "missionDescription-images/teacher-" + this.person.id + this.task.id + "-" + file.name,
      );

      // upload a file
      var uploadTask = storageRef.put(file);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          console.log("image upload: ", snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        // upload error
        (err) => {
          console.log(err);
        },
        // upload complete
        () => {
          // get image url
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // add image url to course obj
            Editor.insertEmbed(cursorLocation, "image", downloadURL);
          });
        },
      );
    },
    handleSubmissionImageAdded(file, Editor, cursorLocation) {
      console.log("image file", file);
      // ceate a storage ref
      var storageRef = storage.ref(
        "missionSubmission-images/teacher-" +
          this.person.id +
          "-task-" +
          this.task.id +
          "-" +
          file.name,
      );

      // upload a file
      var uploadTask = storageRef.put(file);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          console.log("image upload: ", snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        // upload error
        (err) => {
          console.log(err);
        },
        // upload complete
        () => {
          // get image url
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // add image url to course obj
            Editor.insertEmbed(cursorLocation, "image", downloadURL);
          });
        },
      );
    },
  },
};
</script>

<style scoped lang="scss">
::v-deep .ql-tooltip {
  left: unset !important;
}
.create-dialog {
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;
  overflow-y: scroll;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .dialog-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.7rem;
    margin: 0;
    font-style: italic;
  }

  .left-side {
    width: 50%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    transition: all 0.3s;
  }

  .right-side {
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    transition: all 0.3s;
    // flex-direction: column;
    // border-left: 1px solid var(--v-missionAccent-base);

    // galaxy info
    #galaxy-info {
      width: calc(100% - 40px);
      // min-height: 100%;
      border: 1px solid var(--v-galaxyAccent-base);
      margin-top: 30px;
      padding: 20px;
      // background: var(--v-baseAccent-base);
      position: relative;
      z-index: 3;

      .galaxy-label {
        font-size: 0.8rem;
        font-weight: 400;
        text-transform: uppercase;
        // ribbon label
        position: absolute;
        top: -1px;
        left: -1px;
        background-color: var(--v-galaxyAccent-base);
        color: var(--v-background-base);
        padding: 0px 15px 0px 5px;
        clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
      }

      .galaxy-title {
        font-size: 1.2rem;
        color: var(--v-galaxyAccent-base);
        font-weight: 600;
        text-transform: uppercase;
        margin: 20px 0px 5px 0px;
      }

      .galaxy-description {
        margin-top: 10px;
        color: var(--v-galaxyAccent-base);
        // font-size: 0.9rem;
      }
    }
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
  }
}

.create-dialog-content {
  // width: 33.33%;
  min-height: 400px;
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  padding: 20px;
  width: 100%;
  // font-size: 0.6rem;
  // border: 1px solid var(--v-missionAccent-base);

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 0.8rem;
    color: var(--v-missionAccent-base);
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;

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

.circle-outline {
  // border: 1px solid var(--v-cohortAccent-base);
  border-radius: 50%;
}

.submission-colour {
  color: var(--v-cohortAccent-base);
}

.quill ::v-deep .ql-toolbar {
  border: 1px solid #ffffff45;
}

.quill ::v-deep .ql-container {
  border: 1px solid #ffffff45;
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

.active-submission-quill ::v-deep .ql-toolbar {
  border: 1px solid var(--v-cohortAccent-base);
}

.active-submission-quill ::v-deep .ql-container {
  border: 1px solid var(--v-cohortAccent-base);
}
</style>
