<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-if="edit"
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button mt-4"
              outlined
              color="missionAccent"
              x-small
            >
              <v-icon small> mdi-pencil </v-icon>
            </v-btn>

            <v-btn
              v-else
              outlined
              color="missionAccent"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon left> mdi-plus </v-icon>
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
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">{{ dialogDescription }}</p>
              </div>
            </div>

            <div class="create-dialog-content">
              <!-- TITLE -->
              <!-- <p class="dialog-description">Mission Title:</p> -->
              <v-text-field
                class="input-field"
                outlined
                dark
                color="missionAccent"
                v-model="task.title"
                label="Mission Title"
              ></v-text-field>

              <!-- DESCRIPTION -->
              <!-- <p class="dialog-description">Mission Description:</p> -->
              <v-textarea
                class="input-field"
                outlined
                dark
                color="missionAccent"
                auto-grow
                clearable
                rows="1"
                v-model="task.description"
                label="Mission Description"
              ></v-textarea>

              <!-- DURATION -->
              <!-- <p class="dialog-description">Duration:</p> -->
              <v-text-field
                class="input-field"
                outlined
                dark
                color="missionAccent"
                v-model="task.duration"
                label="Duration"
              ></v-text-field>

              <!-- VIDEO -->
              <!-- <p class="dialog-description">Video:</p> -->
              <v-text-field
                class="input-field"
                outlined
                dark
                color="missionAccent"
                v-model="task.video"
                label="Video"
              ></v-text-field>

              <!-- SLIDES -->
              <!-- <p class="dialog-description">Slides:</p> -->
              <v-text-field
                class="input-field"
                outlined
                dark
                color="missionAccent"
                v-model="task.slides"
                label="slides"
              ></v-text-field>

              <!-- SUBMISSION REQUIRED? -->
              <p class="dialog-description submission-colour">
                Does this Mission require the student to submit evidence of
                work?
                <v-tooltip right max-width="300">
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon
                      left
                      color="cohortAccent"
                      small
                      class="circle-outline ma-1"
                      v-bind="attrs"
                      v-on="on"
                      >mdi-information-variant</v-icon
                    >
                  </template>
                  <span>
                    With this option checked, students are required to submit a
                    link to evidence of their work.<br /><br />Once the student
                    has submitted a link to their work, you will be notified to
                    review their submission to check if it is completed.
                  </span>
                </v-tooltip>
              </p>
              <v-checkbox
                v-model="task.submissionRequired"
                class="ma-0 pa-0 submission-colour"
                color="cohortAccent"
                dark
              >
                <template v-slot:label>
                  <span class="dialog-description submission-colour"
                    >Tick this box to request a submission of evidence for this
                    Mission</span
                  >
                </template>
                <p v-if="task.submissionRequired" class="submission-colour">
                  SUBMISSION REQUIRED FOR THIS MISSION
                </p>
              </v-checkbox>
              <!-- SUBMISSION INSTRUCTIONS -->
              <div v-if="task.submissionRequired" class="px-6">
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
                        >mdi-information-variant</v-icon
                      >
                    </template>
                    <span>
                      Please provide submission instructions. Eg. what type of
                      evidence do you want the student to provide a link to?
                    </span>
                  </v-tooltip>
                </p>
                <v-textarea
                  v-model="task.submissionInstructions"
                  class="ma-0 pa-0 submission-colour"
                  outlined
                  dark
                  color="cohortAccent"
                ></v-textarea>
              </div>

              <!-- ACTION BUTTONS -->
              <div class="action-buttons">
                <v-btn
                  v-if="edit"
                  outlined
                  color="green darken-1"
                  @click="updateTask(task, index)"
                  class="mr-2"
                  :loading="loading"
                  :disabled="disabled"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> mdi-check </v-icon>
                  UPDATE
                </v-btn>
                <v-btn
                  v-else
                  outlined
                  color="green darken-1"
                  @click="saveTask(task)"
                  class="mr-2"
                  :loading="loading"
                  :disabled="disabled"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> mdi-check </v-icon>
                  SAVE
                </v-btn>

                <!-- DELETE -->
                <v-btn
                  v-if="edit"
                  outlined
                  color="error"
                  @click="deleteDialog()"
                  class="ml-2"
                >
                  <v-icon left> mdi-delete </v-icon>
                  DELETE
                </v-btn>

                <v-btn
                  outlined
                  :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                  class="ml-2"
                  @click="cancel"
                  :disabled="disabled || loading"
                >
                  <v-icon left> mdi-close </v-icon>
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
                  mdi-check
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
              <p class="dialog-title">
                <strong>Warning!</strong> Delete Mission?
              </p>
              <div class="d-flex align-start">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
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
                <v-icon left> mdi-delete </v-icon>
                DELETE
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-2"
                @click="cancelDeleteDialog"
                :disabled="disabled || loading"
              >
                <v-icon left> mdi-close </v-icon>
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
import firebase from "firebase/app";

import { db } from "../store/firestoreConfig";
import { mapState } from "vuex";

export default {
  name: "CreateEditDeleteMissionDialog",
  props: ["taskToEdit", "taskId", "index", "topicId", "on", "attrs", "edit"],
  data: () => ({
    dialog: false,
    dialogConfirm: false,
    dialogTitle: "Create a new Mission",
    dialogDescription:
      "A Mission is a set of specific tasks. \r\nWe recommend linking to a Google Slides file that has all the Mission tasks in it.",
    task: {
      title: "",
      description: "",
      duration: "",
      video: "",
      slides: "",
      submissionRequired: "",
      submissionInstructions: "",
    },
    loading: false,
    disabled: false,
    deleting: false,
  }),
  mounted() {
    if (this.taskToEdit) {
      console.log("editing task");
      this.task = this.taskToEdit;
    }
  },
  computed: {
    ...mapState(["currentCourseId"]),
  },
  methods: {
    saveTask(task) {
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

      // Add a new document in collection "courses"
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("topics")
        .doc(this.topicId)
        .collection("tasks")
        .add({ ...task, timestamp: new Date() })
        .then((docRef) => {
          docRef.update({ id: docRef.id }); // add task id to task
          console.log("Task successfully written!");
          this.loading = false;
          this.disabled = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.task = {};
    },
    updateTask(task, index) {
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

      // Add a new document in collection "courses"
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("topics")
        .doc(this.topicId)
        .collection("tasks")
        .doc(this.taskId)
        .update(this.task)
        .then((res) => {
          console.log("Task successfully updated!");
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
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
    confirmDeleteTask() {
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("topics")
        .doc(this.topicId)
        .collection("tasks")
        .doc(this.taskId)
        .delete()
        .then(() => {
          console.log("Task successfully deleted!");
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      // close dialog
      this.dialogConfirm = false;
    },
  },
};
</script>

<style scoped lang="scss">
// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
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
  color: var(--v-missionAccent-base);
  padding: 20px;
  text-transform: uppercase;
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

.mission-edit-button {
  position: absolute;
  top: 10px;
  right: 20px;
  // font-size: 0.5rem;
}

.circle-outline {
  border: 1px solid var(--v-cohortAccent-base);
  border-radius: 50%;
}

.submission-colour {
  color: var(--v-cohortAccent-base);
}

</style>
