<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- COMPLETED BUTTON (looks like checkbox) -->
          <template v-slot:activator="{ on, attrs }">
            <!-- uncheck icon if not inreview or completed -->
            <v-btn
              v-if="
                missionStatus != 'inreview' &&
                missionStatus != 'completed' &&
                !resubmission
              "
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button"
              color="missionAccent"
              icon
              x-large
            >
              <v-icon v-if="task.submissionRequired">
                mdi-cloud-upload-outline
              </v-icon>
              <v-icon v-else> mdi-checkbox-blank-outline </v-icon>
            </v-btn>
            <!-- review declined. re-submission -->
            <v-btn
              v-else-if="missionStatus == 'declined' && resubmission"
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button"
              color="missionAccent"
              outlined
              small
            >
              <v-icon small left v-if="task.submissionRequired">
                mdi-cloud-upload-outline
              </v-icon>
              RESUBMIT
            </v-btn>
            <!-- checked icon if inreview or completed -->
            <v-btn
              v-else
              :color="
                missionStatus == 'completed'
                  ? 'baseAccent'
                  : missionStatus == 'inreview'
                  ? 'cohortAccent'
                  : missionStatus == 'declined'
                  ? 'missionAccent'
                  : ''
              "
              v-bind="attrs"
              v-on="on"
              icon
              x-large
            >
              <v-icon> mdi-check </v-icon>
              <!-- <v-icon> mdi-checkbox-outline </v-icon> -->
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div
            v-if="missionStatus != 'inreview' && missionStatus != 'completed'"
            class="create-dialog"
          >
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                Have you completed Mission:
                <strong
                  ><i>{{ task.title }}</i></strong
                >
                ?
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">
                  Did you complete all the requirements of the Mission?<br />By
                  clicking YES your instructor will be notified.
                </p>
              </div>
            </div>

            <div class="submission-create-dialog">
              <!-- SUBMISSION FIELDS -->
              <div v-if="task.submissionRequired">
                <div class="submission-dialog-header">
                  <p class="submission-dialog-title">Submission Requirements</p>
                  <!-- submission message speech bubble -->
                  <v-row>
                    <v-col cols="10">
                      <v-row
                        class="d-flex align-center justify-space-around speech-bubble"
                      >
                        <v-col cols="1" class="pa-0">
                          <v-icon left color="cohortAccent"
                            >mdi-alert-outline</v-icon
                          >
                        </v-col>
                        <v-col cols="11">
                          <p class="submission-dialog-description ma-0">
                            {{
                              task.submissionInstructions
                                ? task.submissionInstructions
                                : "Please provide a link to your work, showing that you have completed this mission"
                            }}
                          </p>
                        </v-col>
                      </v-row>
                    </v-col>
                    <v-col cols="2" class="instructor-details">
                      <div>
                        <v-img
                          class="instructor-image mb-2"
                          :src="mappedByImageURL"
                        ></v-img>
                      </div>
                      <p class="ma-0 text-center">
                        {{ currentCourse.mappedBy.name }}
                      </p>
                      <p
                        class="ma-0 text-center"
                        style="font-size: 0.7rem; font-style: italic"
                      >
                        (Instructor)
                      </p>
                    </v-col>
                  </v-row>
                </div>

                <div class="submission-create-dialog-content">
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
                <!-- YES, I HAVE COMPLETED -->
                <v-btn
                  v-if="task.submissionRequired && !resubmission"
                  outlined
                  color="green darken-1"
                  @click="submitWorkForReview()"
                  class="mr-2"
                  :loading="loading"
                  :disabled="disabled"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> mdi-check </v-icon>
                  SUBMIT WORK FOR REVIEW
                </v-btn>
                <v-btn
                  v-else-if="task.submissionRequired && resubmission"
                  outlined
                  color="green darken-1"
                  @click="reSubmitWorkForReview()"
                  class="mr-2"
                  :loading="loading"
                  :disabled="disabled"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> mdi-check </v-icon>
                  RE-SUBMIT WORK FOR REVIEW
                </v-btn>
                <v-btn
                  v-else
                  outlined
                  color="baseAccent"
                  @click="markAsCompleted()"
                  class="mr-2"
                  :loading="loading"
                  :disabled="disabled"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> mdi-check </v-icon>
                  YES, I HAVE COMPLETED THIS MISSION
                </v-btn>

                <!-- CANCEL -->
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
              <!-- End submission-create-dialog-content -->
            </div>
            <!-- End submission-create-dialog -->
          </div>

          <!-- DIALOG CONTENT IF ALREADY SUBMITTED -->
          <div v-else class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">SUBMISSION COMPLETED</p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">
                  You have already submitted your work for this mission
                </p>
              </div>
            </div>

            <div class="submission-create-dialog">
              <!-- ACTION BUTTONS -->
              <div class="action-buttons">
                <!-- CANCEL -->
                <v-btn
                  outlined
                  :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                  class="ml-2"
                  @click="cancel"
                  :disabled="disabled || loading"
                >
                  <v-icon left> mdi-close </v-icon>
                  CLOSE
                </v-btn>
                <!-- LINK TO WORK -->
                <a
                  :href="task.submissionLink"
                  target="_blank"
                  style="text-decoration: none"
                >
                  <v-btn outlined color="cohortAccent" class="ml-2">
                    <!-- <v-icon left> mdi-close </v-icon> -->
                    VIEW SUBMISSION
                  </v-btn>
                </a>
                <!-- End action-buttons -->
              </div>
              <!-- End submission-create-dialog-content -->
            </div>
            <!-- End submission-create-dialog -->
          </div>
          <!-- End create-dialog -->
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import firebase from "firebase/app";

import { db } from "../store/firestoreConfig";
import {
  submitWorkForReviewXAPIStatement,
  reSubmitWorkForReviewXAPIStatement,
  taskMarkedAsCompletedXAPIStatement,
  topicCompletedXAPIStatement,
} from "../lib/veracityLRS";

import { dbMixins } from "../mixins/DbMixins";

import { mapState, mapGetters } from "vuex";

export default {
  name: "MissionCompletedDialog",
  mixins: [dbMixins],
  props: [
    "topicId",
    "taskId",
    "task",
    "missionStatus",
    "on",
    "attrs",
    "resubmission",
    "submission",
  ],
  data: () => ({
    submissionLink: null,
    dialog: false,
    loading: false,
    disabled: false,
    deleting: false,
    mappedByImageURL: "",
  }),
  mounted() {
    // get mappedBy image
    if (!this.currentCourse.mappedBy.image) {
      this.getMappedByPersonsImage(this.currentCourse.mappedBy.personId);
    }
    console.log("from resub", this.task);
  },
  computed: {
    ...mapState([
      "currentCourse",
      "currentTopic",
      "currentTask",
      "personsTopicsTasks",
    ]),
    ...mapGetters(["person"]),
  },
  methods: {
    reSubmitWorkForReview() {
      this.loading = true;
      this.disabled = true;

      // format submission url with "http://"
      if (this.submissionLink) {
        if (!/^https?:\/\//i.test(this.submissionLink)) {
          this.submissionLink = "http://" + this.submissionLink;
        }
      }

      // console.log("submitting...");
      // console.log("person...", this.person);
      // console.log("course...", this.currentCourse);
      // console.log("topic...", this.currentTopic);
      // console.log("task...", this.currentTask);

      // 1) add submission to course (for teacher to review)
      db.collection("courses")
        .doc(this.currentCourse.id)
        // .collection("topics")
        // .doc(this.topicId)
        // .collection("tasks")
        // .doc(this.taskId)
        .collection("submissionsForReview")
        .doc(this.submission.id)
        .update({
          // update "courses" database with task submission
          studentId: this.person.id,
          contextCourse: this.currentCourse,
          contextTopic: this.currentTopic,
          contextTask: this.task,
          submissionLink: this.submissionLink,
          taskSubmissionStatus: "inreview",
          taskSubmittedForReviewTimestamp: new Date(),
          responderPersonId: "",
          responseMessage: "",
        })
        .then(() => {
          console.log("Re-submission successfully submitted for review!");

          // send xAPI statement to LRS
          reSubmitWorkForReviewXAPIStatement(this.person, this.task.id, {
            galaxy: this.currentCourse,
            system: this.currentTopic,
            mission: this.task,
          });

          this.loading = false;
          this.dialog = false;

          this.$store.commit("setSnackbar", {
            show: true,
            text: "Link submitted. You will be notified when your instructor has reviewd your work.",
            color: "baseAccent",
          });
        })
        .catch((error) => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Error: " + error,
            color: "baseAccent",
          });
          console.error("Error writing document: ", error);
        });

      // 2) Add submission to students task (for students progression)
      db.collection("people")
        .doc(this.person.id)
        .collection(this.currentCourse.id)
        .doc(this.currentTopic.id)
        .collection("tasks")
        .doc(this.task.id)
        .update({
          // update "people" database with task submission
          submissionLink: this.submissionLink,
          taskStatus: "inreview",
          taskSubmittedForReviewTimestamp: new Date(),
        })
        .then(() => {
          console.log("Task work successfully re-submitted for review!");
          this.loading = false;
          this.disabled = false;
          this.dialog = false;

          // unlock next task
          this.unlockNextTask();

          // check if all tasks/missions are completed
          this.checkIfAllTasksCompleted();

          // TODO: perhaps only unlock once teacher has reviewed and marked complete. SOLUTION: leave as is. can progress to next task, but cant progress to next topic until all work is reviewed.
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    submitWorkForReview() {
      this.loading = true;
      this.disabled = true;

      // format submission url with "http://"
      if (this.submissionLink) {
        if (!/^https?:\/\//i.test(this.submissionLink)) {
          this.submissionLink = "http://" + this.submissionLink;
        }
      }

      // console.log("submitting...");
      // console.log("person...", this.person);
      // console.log("course...", this.currentCourse);
      // console.log("topic...", this.currentTopic);
      // console.log("task...", this.currentTask);

      // 1) add submission to course (for teacher to review)
      db.collection("courses")
        .doc(this.currentCourse.id)
        // .collection("topics")
        // .doc(this.topicId)
        // .collection("tasks")
        // .doc(this.taskId)
        .collection("submissionsForReview")
        .add({
          // update "courses" database with task submission
          studentId: this.person.id,
          contextCourse: this.currentCourse,
          contextTopic: this.currentTopic,
          contextTask: this.currentTask,
          submissionLink: this.submissionLink,
          taskSubmissionStatus: "inreview",
          taskSubmittedForReviewTimestamp: new Date(),
        })
        .then((docRef) => {
          docRef.update({ id: docRef.id });
          console.log("Submission successfully submitted for review!");

          // send xAPI statement to LRS
          submitWorkForReviewXAPIStatement(this.person, this.currentTask.id, {
            galaxy: this.currentCourse,
            system: this.currentTopic,
            mission: this.currentTask,
          });

          this.requestForHelp = "";
          this.loading = false;
          this.dialog = false;

          this.$store.commit("setSnackbar", {
            show: true,
            text: "Link submitted. You will be notified when your instructor has reviewd your work.",
            color: "baseAccent",
          });
        })
        .catch((error) => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Error: " + error,
            color: "baseAccent",
          });
          console.error("Error writing document: ", error);
        });

      // 2) Add submission to students task (for students progression)
      db.collection("people")
        .doc(this.person.id)
        .collection(this.currentCourse.id)
        .doc(this.currentTopic.id)
        .collection("tasks")
        .doc(this.currentTask.id)
        .update({
          // update "people" database with task submission
          submissionLink: this.submissionLink,
          taskStatus: "inreview",
          taskSubmittedForReviewTimestamp: new Date(),
        })
        .then(() => {
          console.log("Task work successfully submitted for review!");
          this.loading = false;
          this.disabled = false;
          this.dialog = false;

          // unlock next task
          this.unlockNextTask();

          // check if all tasks/missions are completed
          this.checkIfAllTasksCompleted();

          // TODO: perhaps only unlock once teacher has reviewed and marked complete. SOLUTION: leave as is. can progress to next task, but cant progress to next topic until all work is reviewed.
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    markAsCompleted() {
      this.loading = true;
      this.disabled = true;

      // Add a new document in collection "courses"
      db.collection("people")
        .doc(this.person.id)
        .collection(this.currentCourse.id)
        .doc(this.currentTopic.id)
        .collection("tasks")
        .doc(this.currentTask.id)
        .update({
          // update tasks array with new task
          taskStatus: "completed",
          taskCompletedTimestamp: new Date(),
        })
        .then(() => {
          console.log("Task status successfully written as completed!");
          // send xAPI statement to LRS
          taskMarkedAsCompletedXAPIStatement(this.person, this.currentTask.id, {
            galaxy: this.currentCourse,
            system: this.currentTopic,
            mission: this.currentTask,
          });
        })
        .then(() => {
          // unlock next task
          this.unlockNextTask();
        })
        .then(() => {
          // check if all tasks/missions are completed
          this.checkIfAllTasksCompleted();
        })
        .then(() => {
          this.loading = false;
          this.disabled = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    async unlockNextTask() {
      console.log("unlocking next task...");
      // 1) get all tasks in this topic
      const currentTasks = await db
        .collection("people")
        .doc(this.person.id)
        .collection(this.currentCourse.id)
        .doc(this.currentTopic.id)
        .collection("tasks")
        // order by timestamp is important otherwise index == 0 (in the next step) wont necessarily be the first mission
        .orderBy("taskCreatedTimestamp")
        .get();

      // 2) loops the tasks. the first task to have taskStatus locked, update to unlocked, then return to exit loop
      for (const [index, task] of currentTasks.docs.entries()) {
        if (task.data().taskStatus == "locked") {
          task.ref.update({ taskStatus: "unlocked" });
          console.log(
            "NEW TASK UNLOCKED (" + index + ") : " + task.data().title
          );
          return;
        }
      }
    },
    checkIfAllTasksCompleted() {
      // 1) check how many tasks in store are completed
      const numOfTasksCompleted = this.personsTopicsTasks.filter(
        (obj) => obj.taskStatus === "completed"
      ).length;
      // 2) check if that the same as total
      if (numOfTasksCompleted === this.personsTopicsTasks.length) {
        console.log("Topic Completed! (all tasks in this topic completed)");
        // TODO: some kind of notification to UI signal that Topic has been completed
        topicCompletedXAPIStatement(this.person, this.currentTopic.id, {
          galaxy: this.currentCourse,
          system: this.currentTopic,
        });
        // all tasks are completed. unlock next topic
        this.unlockNextTopics();
      } else {
        console.log("topic not yet completed...");
        console.log("total tasks = ", this.personsTopicsTasks.length);
        console.log(
          "completed = ",
          this.personsTopicsTasks.filter(
            (obj) => obj.taskStatus === "completed"
          ).length
        );
        console.log(
          "in review = ",
          this.personsTopicsTasks.filter((obj) => obj.taskStatus === "inreview")
            .length
        );
        console.log(
          "active = ",
          this.personsTopicsTasks.filter((obj) => obj.taskStatus === "locked")
            .length
        );
        console.log(
          "locked = ",
          this.personsTopicsTasks.filter((obj) => obj.taskStatus === "locked")
            .length
        );
      }
    },
    unlockNextTopics() {
      // ==== all tasks/missions completed. unlock next topics ====
      db.collection("people")
        .doc(this.person.id)
        .collection(this.currentCourse.id)
        .where("prerequisites", "array-contains", this.currentTopic.id)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            doc.ref
              .update({
                topicStatus: "unlocked", // change status to unlocked
              })
              // route back to map
              .then(() => {
                console.log("NEW TOPIC UNLOCKED: " + doc.data().label);
              });
          });
        });
    },
    cancel() {
      this.dialog = false;
    },
    async getMappedByPersonsImage(personId) {
      const person = await this.MXgetPersonByIdFromDB(personId);
      this.mappedByImageURL = person.image.url;
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
    border-bottom: 1px solid var(--v-missionAccent-base);

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

.submission-create-dialog {
  width: 100%;

  .submission-dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-cohortAccent-base);
    color: var(--v-cohortAccent-base);
  }

  .submission-create-dialog-content {
    // width: 33.33%;
    // min-height: 400px;
    display: flex;
    justify-content: space-around;
    align-items: space-around;
    flex-direction: column;
    color: var(--v-cohortAccent-base);
    padding: 20px;
    text-transform: uppercase;
    width: 100%;
    // font-size: 0.6rem;
    // border: 1px solid var(--v-missionAccent-base);
  }

  .submission-dialog-description {
    color: var(--v-cohortAccent-base);
    text-transform: uppercase;
    font-size: 0.7rem;
    padding: 0px 10px;
    font-style: italic;
  }

  .speech-bubble {
    position: relative;
    width: auto;
    max-width: 90%;
    padding: 10px;
    margin: 40px auto;
    text-align: center;
    // background-color: #fff;
    -moz-border-radius: 5px;
    -webkit-border-radius: 5px;
    border-radius: 5px;
    border: 2px solid var(--v-missionAccent-base);
  }
  // .speech-bubble p {
  //   // font-size: 1.25em;
  // }

  .speech-bubble:before,
  .speech-bubble:after {
    content: "\0020";
    display: block;
    position: absolute;
    top: 20px;
    right: -10px;
    z-index: 2;
    width: 0;
    height: 0;
    overflow: hidden;
    border: solid 10px transparent;
    border-left: 0;
    border-bottom-color: var(--v-missionAccent-base);
  }
  .speech-bubble:before {
    top: -30px;
    z-index: 1;
    border-bottom-color: rgba(0, 0, 0, 0.095);
  }
}

.action-buttons {
  width: 100%;
  padding: 20px;
}

.instructor-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.instructor-details {
  color: var(--v-missionAccent-base);
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
