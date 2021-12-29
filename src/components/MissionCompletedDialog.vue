<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- COMPLETED BUTTON (looks like checkbox) -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-if="!missionCompleted"
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button mt-4"
              color="missionAccent"
              small
            >
              <v-icon> mdi-checkbox-blank-outline </v-icon>
            </v-btn>

            <v-btn
              v-else-if="missionCompleted"
              outlined
              color="baseAccent"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon> mdi-checkbox-outline </v-icon>
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                Have you completed Mission -
                <strong
                  ><i>{{ task.title }}</i></strong
                >
                - ?
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">{{ dialogDescription }}</p>
              </div>
            </div>
          </div>

          <div class="submission-create-dialog">
            <!-- SUBMISSION FIELDS -->
            <div v-if="submissionRequired">
              <div class="submission-dialog-header">
                <p class="submission-dialog-title">Submission Requirements</p>
                <div class="d-flex align-center">
                  <v-icon left color="cohortAccent">mdi-alert-outline</v-icon>
                  <p class="submission-dialog-description">
                    {{ submissionInstructions }}
                  </p>
                </div>
              </div>

              <div class="create-dialog-content">
                <!-- TITLE -->
                <p class="submission-dialog-description">Link to work:</p>
                <v-text-field
                  class="input-field"
                  solo
                  color="cohortAccent"
                  v-model="submissionLink"
                  background-color="white"
                ></v-text-field>
              </div>
            </div>
            <!-- End of v-if="submission" -->

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
              <!-- End action-buttons -->
            </div>

            <!-- End create-dialog-content -->
          </div>

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
  name: "MissionCompletedDialog",
  props: ["task", "on", "attrs"],
  data: () => ({
    submissionRequired: true, //TODO: get this value from creator database
    submissionInstructions:
      "Please paste a Google Drive share link to your completed work with 'Anyone with link can access' settings on", //TODO: get this value from creator database
    dialog: false,
    dialogConfirm: false,
    dialogTitle: "Create a new Mission",
    dialogDescription:
      "Did you completed all the requirements of the Mission? By clicking YES your instructor will be notified.",
    task: {
      title: "",
      description: "",
      duration: "",
      video: "",
      slides: "",
    },
    loading: false,
    disabled: false,
    deleting: false,
    missionCompleted: false,
  }),
  mounted() {
    console.log("MissionCompletedDialog Task = ", this.task);
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
        .update({
          // update tasks array with new task
          tasks: firebase.firestore.FieldValue.arrayUnion(task),
        })
        .then(() => {
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

      // get all tasks array. so can update task with changes.
      // (cant update single task by index in firestore, so have to get all tasks, make the change, then update all the tasks)
      let topicTasks = this.$store.getters.getTasksByTopicId(this.topicId);
      topicTasks[index] = task;

      // Add a new document in collection "courses"
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("topics")
        .doc(this.topicId)
        .update({
          // update tasks array with new task
          tasks: topicTasks,
        })
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
      // get all tasks
      let topicTasks = this.$store.getters.getTasksByTopicId(this.topicId);
      // remove index
      topicTasks.splice(this.index, 1);
      // db set edited array
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("topics")
        .doc(this.topicId)
        .update({
          // update tasks array with new task
          tasks: topicTasks,
        })
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
  // overflow-x: hidden;
  // overflow-y: scroll;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    // border-bottom: 1px solid var(--v-missionAccent-base);

    .dialog-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
    }

    .dialog-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.7rem;
      margin: 0;
      font-style: italic;
    }
  }
}

.action-buttons {
  width: 100%;
  padding: 20px;
}

.submission-create-dialog {
  .submission-dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-cohortAccent-base);
    color: var(--v-cohortAccent-base);

    .submission-dialog-title {
    }
  }
}

.create-dialog-content {
  // width: 33.33%;
  // min-height: 400px;
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

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 0.8rem;
  }
}

.submission-dialog-description {
  color: var(--v-cohortAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;
}

.submission-dialog-description {
  color: var(--v-cohortAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;
}

.mission-edit-button {
  position: absolute;
  top: 10px;
  right: 20px;
  // font-size: 0.5rem;
}

/* width */
*::-webkit-scrollbar {
  width: 10px;
}
/* Track */
*::-webkit-scrollbar-track {
  background: var(--v-background-base);
}
/* Handle */
*::-webkit-scrollbar-thumb {
  background: var(--v-missionAccent-base);
}
/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}
</style>
