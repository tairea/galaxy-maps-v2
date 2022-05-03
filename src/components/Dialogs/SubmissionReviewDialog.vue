<template>
  <v-container class="pa-2">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- MARK AS COMPLETED BUTTON (with dialog) -->
          <template v-slot:activator="{ on, attrs }">
            <!-- uncheck icon if not inreview or completed -->
            <v-btn color="cohortAccent" v-bind="attrs" v-on="on" outlined small>
              <!-- <v-icon> mdi-check </v-icon> -->
              <v-icon left> mdi-text-box-search-outline </v-icon>
              View submission
            </v-btn>
          </template>
          <div class="create-dialog">
            <!-- DIALOG HEADER -->
            <div class="dialog-header">
              <p v-if="reviewed" class="dialog-title mb-0">Submission <span :style="status">{{submission.taskSubmissionStatus}}</span></p>
              <p v-else class="dialog-title mb-0">Rewiew submission</p>
            </div>
            <div class="create-dialog-content">
              <!-- Request for help details -->
              <div class="request-details">
               <!-- Context details -->
                <v-row>

                  <div class="ma-5">
                    <v-simple-table>
                      <tr
                        class="dialog-context-description"
                        style="
                          color: var(--v-missionAccent-base);
                          font-weight: 800;
                        "
                      >
                        <td>MISSION:</td>
                        <td>{{ submission.contextTask.title }}</td>
                      </tr>
                      <tr
                        class="dialog-context-description"
                        style="color: var(--v-missionAccent-base)"
                      >
                        <td>System:</td>
                        <td>{{ submission.contextTopic.label }}</td>
                      </tr>
                      <tr
                        class="dialog-context-description"
                        style="color: var(--v-galaxyAccent-base)"
                      >
                        <td>Galaxy:</td>
                        <td>{{ submission.contextCourse.title }}</td>
                      </tr>
                    </v-simple-table>
                  </div>
                </v-row>
              </div>

              <!-- SUBMISSION INSTRUCTIONS -->
              <div class="instructions-info">              
                <v-row class="justify-end align-center mr-4">
                  <p class="dialog-description px-4 pb-0" style="color: var(--v-cohortAccent-base)">
                    Submission Instructions
                  </p>
                  <Avatar :colourBorder="true" :profile="instructor" :size="30" class="pb-2"/> 
                </v-row>
                <div class="mx-4 my-2" style="border:1px solid var(--v-cohortAccent-base);border-radius:5px;">
                  <p class="ma-2 instructions" v-html="submission.contextTask.submissionInstructions"></p>
                </div>                
              </div>

              <!-- STUDENT SUBMISSION -->
              <div class="requester-info">
                <v-row>
                  <div class="requester-image justify-center align-center">
                    <Avatar :colourBorder="true" :profile="requesterPerson" :size="30" />
                  </div>
                  <!-- Message -->
                  <div>
                    <p class="dialog-description pa-1">
                      <span style="font-size: 0.8rem; font-weight: 800"
                        ><i>{{
                          requesterPerson.firstName +
                          " " +
                          requesterPerson.lastName
                        }}</i></span
                      >
                      <i
                        >@
                        {{ getHumanDate(submission.taskSubmittedForReviewTimestamp) }}</i
                      >
                    </p>
                  </div>
                </v-row>
              </div>
              <p class="dialog-help-message speech-bubble" v-html="submission.submissionLink"></p>
              
              <!-- INSTRUCTOR RESPONSE -->
              <div v-if="isTeacher && !reviewed">
                <v-row class="ml-2 checkbox">
                  <v-checkbox 
                    v-model="response" 
                    class="ml-4" 
                    :dark="dark"
                    :light="!dark"
                    color="red"
                  />
                  <p class="dialog-context-description mt-6" style="color: var(--v-cohortAccent-base)">provide the student with feedback</p>
                </v-row>
              </div>
              <div v-if="response" class="ma-5 mt-0">
                 <v-row class="justify-end align-center mr-4">
                  <p class="dialog-description px-4 pb-0" style="color: var(--v-cohortAccent-base)">
                    :stduent feedback
                  </p>
                  <Avatar :colourBorder="true" :profile="instructor" :size="30" class="pb-2"/> 
                </v-row>
                <v-textarea
                  class="input-field"
                  outlined
                  :dark="dark"
                  :light="!dark"
                  v-model="responseMsg"
                  color="cohortAccent"
                ></v-textarea>
              </div>

              <!-- INSTRUCTOR RESPONSE -->
              <div v-if="submission.responseMessage" class="instructor-info">
                <v-row class='justify-end'>
                  <!-- Message -->
                  <div>
                    <p class="dialog-description pa-1">
                      <i>
                        {{ getHumanDate(submission.responseSubmittedTimestamp) }}</i
                      >
                    </p>
                  </div>
                  <div class="requester-image align-center mr-12">
                    <Avatar :colourBorder="true" :profile="instructor" :size="30" />
                  </div>
                </v-row>
              </div>
              <p v-if="submission.responseMessage" class="dialog-help-message teacher-bubble text-end" v-html="submission.responseMessage"></p>
              <!-- Divider -->
            </div>
            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <div class="divider"></div>
              <template v-if="isTeacher && !reviewed">
                <v-btn
                  outlined
                  color="missionAccent"
                  @click="markSubmissionAsCompleted()"
                  class="mr-2"
                  :loading="loading"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> mdi-thumb-up-outline </v-icon>
                  approve
                </v-btn>
                <v-btn
                  outlined
                  color="galaxyAccent"
                  @click="declineSubmission()"
                  class="mr-2"
                  :loading="loading"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> mdi-thumb-down-outline </v-icon>
                  decline
                </v-btn>
              </template>


              <!-- CANCEL -->
              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                @click="close"
              >
                <v-icon left> mdi-close </v-icon>
                Cancel
              </v-btn>
              <!-- End action-buttons -->
            </div>
            <!-- End submission-create-dialog-content -->
          </div>
          <!-- End submission-create-dialog -->
          <!-- End create-dialog -->
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import firebase from "firebase/app";
import moment from "moment";

import Avatar from "@/components/Avatar.vue"

import { db, functions } from "@/store/firestoreConfig";
import {
  studentWorkMarkedCompletedXAPIStatement,
  teacherReviewedStudentWorkXAPIStatement,
  teacherRespondedSubmissionDeclinedXAPIStatement
} from "@/lib/veracityLRS";

import { mapState, mapGetters } from "vuex";
import { dbMixins } from "@/mixins/DbMixins";

export default {
  name: "SubmissionReviewDialog",
  mixins: [dbMixins],
  props: ["submission", "requesterPerson", "on", "attrs", "reviewed", "studentReview", "isTeacher"],
  components: {
    Avatar
  },
  data: () => ({
    response: false,
    responseMsg: '',
    dialog: false,
    loading: false,
    instructor: {},
  }),
  async mounted() {
    this.instructor = await this.MXgetPersonByIdFromDB(this.submission.contextCourse.mappedBy.personId)
  },
  computed: {
    ...mapState(["currentCourse", "currentTopic", "currentTask", "personsTopicTasks"]),
    ...mapGetters(["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    declined () {
      return this.submission.taskSubmissionStatus == 'declined'
    },
    completed () {
      return this.submission.taskSubmissionStatus == 'completed'
    },
    status() {
      return this.completed ? 'color:var(--v-baseAccent-base)' : 'color:var(--v-cohortAccent-base)' 
    }
  },
  methods: {
    getHumanDate(ts) {
      return moment(ts.seconds * 1000).format("llll"); //format = Mon, Jun 9 2014 9:32 PM
    },
    markSubmissionAsCompleted() {
      this.loading = true;

      // 1) update submission to completed
      db.collection("courses")
        .doc(this.submission.contextCourse.id)
        .collection("submissionsForReview")
        .doc(this.submission.id)
        .update({
          // update submission to completed
          teacherId: this.person.id,
          taskSubmissionStatus: "completed",
          taskCompletedTimestamp: new Date(),
          responseMessage: this.responseMsg
        });

      // 2) update the task status to complete
      db.collection("people")
        .doc(this.submission.studentId)
        .collection(this.submission.contextCourse.id)
        .doc(this.submission.contextTopic.id)
        .collection("tasks")
        .doc(this.submission.contextTask.id)
        .update({
          // update "people" database with task submission
          teacherId: this.person.id,
          taskStatus: "completed",
          taskReviewedAndCompletedTimestamp: new Date(),
        }).then(() => {
          this.sendResponseToSubmission('completed')
        })
        .then(() => {
          console.log("Task successfully updated as completed!");

          // send xAPI statement to LRS
          // student completed work
          studentWorkMarkedCompletedXAPIStatement(
            this.requesterPerson,
            this.submission.contextTask.id,
            {
              galaxy: this.submission.contextCourse,
              system: this.submission.contextTopic,
              mission: this.submission.contextTask,
            }
          );
          // teacher reviewed work
          teacherReviewedStudentWorkXAPIStatement(
            this.person,
            this.submission.contextTask.id,
            {
              student: this.requesterPerson,
              galaxy: this.submission.contextCourse,
              system: this.submission.contextTopic,
              mission: this.submission.contextTask,
            }
          );

          this.close()

          this.$store.commit("setSnackbar", {
            show: true,
            text: "Student's Mission now marked as completed",
            color: "baseAccent",
          });

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
    async unlockNextTask() {
      console.log("unlocking next task...");
      // 1) get all tasks in this topic
      const currentTasks = await db
        .collection("people")
        .doc(this.submission.studentId)
        .collection(this.submission.contextCourse.id)
        .doc(this.submission.contextTopic.id)
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
    async checkIfAllTasksCompleted() {
      // 1) check how many tasks in store are completed
      const numOfTasksCompleted = this.personsTopicsTasks.filter(
        (obj) => obj.taskStatus === "completed"
      ).length;
      // 2) check if that the same as total
      if (numOfTasksCompleted === this.personsTopicsTasks.length) {
        // TODO: some kind of notification to signal that Topic has been completed
        // all tasks are completed. unlock next topic
        // message telling teacher whats happend

        this.$store.commit("setSnackbar", {
          show: true,
          text:
            this.requesterPerson.firstName +
            " " +
            this.requesterPerson.lastName +
            " completed all tasks for topic " +
            this.submission.contextTopic.label,
          color: "baseAccent",
        });

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
        .doc(this.submission.studentId)
        .collection(this.submission.contextCourse.id)
        .where(
          "prerequisites",
          "array-contains",
          this.submission.contextTopic.id
        )
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            doc.ref
              .update({
                topicStatus: "unlocked", // change status to unlocked
              })
              // route back to map
              .then(() => {
                // message telling teacher whats happend
                this.$store.commit("setSnackbar", {
                  show: true,
                  text:
                    "NEW TOPIC: " +
                    doc.data().label +
                    " UNLOCKED FOR: " +
                    this.requesterPerson.firstName +
                    " " +
                    this.requesterPerson.lastName,
                  color: "baseAccent",
                });
              });
          });
        });
    },
    sendResponseToSubmission(outcome) {
      const data = {
        course: this.submission.contextCourse.title,
        topic: this.submission.contextTopic.label,
        task: this.submission.contextTask.title,
        student: this.requesterPerson.firstName + ' ' + this.requesterPerson.lastName,
        submission: this.submission.submissionLink,
        outcome: outcome,
        message: this.responseMsg,
        teacher: this.person.firstName + ' ' + this.person.lastName,
        email: this.requesterPerson.email
      }
      console.log('send reponse email: ', data)
      const sendResponseToSubmission = functions.httpsCallable("sendResponseToSubmission");
      return sendResponseToSubmission(data)
    },
    declineSubmission() {
      this.loading = true;
      // Add response to request for help
      db.collection("courses")
        .doc(this.submission.contextCourse.id)
        .collection("submissionsForReview")
        .doc(this.submission.id)
        .update({
          responseMessage: this.responseMsg,
          taskSubmissionStatus: "declined",
          responseSubmittedTimestamp: new Date(),
          responderPersonId: this.person.id,
        }).then(() => {
          // update students task status
          db.collection("people")
            .doc(this.submission.studentId)
            .collection(this.submission.contextCourse.id)
            .doc(this.submission.contextTopic.id)
            .collection("tasks")
            .doc(this.submission.contextTask.id)
            .update({
              responseMessage: this.responseMsg,
              taskStatus: "declined",
              submissionDeclinedTimestamp: new Date(),
              responderPersonId: this.person.id,
            })
        }).then(() => {
          this.sendResponseToSubmission('declined')
        }).then(() => {
          console.log(
            "Submitted work declined. It did not meet the mission requirements"
          );

          // teacher assissted student
          teacherRespondedSubmissionDeclinedXAPIStatement(
            this.person,
            this.submission.contextTask.id,
            {
              student: this.requesterPerson,
              galaxy: this.submission.contextCourse,
              system: this.submission.contextTopic,
              mission: this.submission.contextTask,
            }
          );
          this.close()
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Students submitted work declined.Feedback sent to student",
            color: "baseAccent",
          });
          // this.MXbindRequestsForHelp();

          // TODO: update requests. (to remove answered requests)
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Error: " + error,
            color: "pink",
          });
        });
    },
    close() {
      this.loading = false;
      this.disabled = false;
      this.dialog = false;
      this.response = false;
      this.responseMsg = ''
    },
  },
};
</script>

<style scoped lang="scss">
.input-field {
  padding-top: 10px;
  border-radius: 5px;
  font-size: 0.9rem
}

.checkbox ::v-deep .primary--text {
    color: var(--v-cohortAccent-base) !important;
    caret-color: var(--v-cohortAccent-base) !important;
}

.checkbox ::v-deep .v-input--selection-controls__input .v-icon {
  color: var(--v-cohortAccent-base) !important;
  caret-color: var(--v-cohortAccent-base) !important;
}
// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  display: flex;
  flex-wrap: wrap;
  overflow-x: hidden;
  overflow-y: scroll;
  width: 100%;

  .create-dialog-content {
    width: 100%
  }

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);

    .dialog-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
    }
  }

  .request-details {
    width: 100%;
  }

  .requester-image {
    width: 10%;
  }

  .dialog-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.7rem;
    margin: 0;
    font-style: italic;
  }

  .dialog-context-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.8rem;
    margin: 0;
    font-style: italic;
  }
}

.submission-create-dialog {
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
    margin: 0;
    font-style: italic;
  }
}

.action-buttons {
  width: 100%;
  padding: 20px;
}

.requester-info {
  position: relative;
  top: 25px;
  left: 30px;
  margin-top: 20px;
}

.instructor-info {
  position: relative;
  top: 25px;
  left: 30px;
  margin-top: 20px;
}

.theme--light.v-data-table {
  background-color: transparent !important;
}

.instructions-info{
  margin-top: 10px;
  color: var(--v-missionAccent-base);
  font-size: 0.8rem;
}

.speech-bubble {
  position: relative;
  width: auto;
  padding: 10px;
  margin: 50px 15px 20px;
  // background-color: #fff;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
  border-radius: 5px;
  border: 2px solid var(--v-missionAccent-base);
  font-size: 0.8rem;
}

.speech-bubble:before,
.speech-bubble:after {
  content: "\0020";
  display: block;
  position: absolute;
  top: -10px;
  left: 15px;
  z-index: 2;
  width: 0;
  height: 0;
  overflow: hidden;
  border: solid 10px transparent;
  border-top: 0;
  border-bottom-color: var(--v-missionAccent-base);
}
.speech-bubble:before {
  top: -30px;
  z-index: 1;
  border-bottom-color: rgba(0, 0, 0, 0.095);
}

.teacher-bubble {
  position: relative;
  width: auto;
  padding: 10px;
  margin: 50px 15px 20px;
  // background-color: #fff;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
  border-radius: 5px;
  border: 2px solid var(--v-cohortAccent-base);
  font-size: 0.8rem;
}

.teacher-bubble:before,
.teacher-bubble:after {
  content: "\0020";
  display: block;
  position: absolute;
  top: -10px;
  right: 0px;
  z-index: 2;
  width: 0;
  height: 0;
  overflow: hidden;
  border: solid 10px transparent;
  border-top: 0;
  border-bottom-color: var(--v-cohortAccent-base);
}
.teacher-bubble:before {
  top: -30px;
  z-index: 1;
  border-bottom-color: rgba(0, 0, 0, 0.095);
}



</style>
