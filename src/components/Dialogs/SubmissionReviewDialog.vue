<template>
  <v-container class="pa-2">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light persistent>
          <!-- MARK AS COMPLETED BUTTON (with dialog) -->
          <template v-slot:activator="{ on, attrs }">
            <!-- uncheck icon if not inreview or completed -->
            <v-btn color="cohortAccent" v-bind="attrs" v-on="on" outlined small>
              <v-icon left> {{ mdiTextBoxSearchOutline }} </v-icon>
              View submission
            </v-btn>
          </template>
          <div class="create-dialog">
            <!-- DIALOG HEADER -->
            <div class="dialog-header">
              <p v-if="reviewed" class="dialog-title mb-0">
                Submission
                <span :style="status">{{ submission.taskSubmissionStatus }}</span>
              </p>
              <p v-else class="dialog-title mb-0">
                Review submission from
                <strong>{{
                  this.requesterPerson.firstName + " " + this.requesterPerson.lastName
                }}</strong>
              </p>
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
                        style="color: var(--v-missionAccent-base)"
                      >
                        <td
                          class="d-flex flex-start"
                          style="color: var(--v-galaxyAccent-base); font-weight: 800"
                        >
                          Galaxy:
                        </td>
                        <td style="color: var(--v-galaxyAccent-base)">
                          {{ submission.contextCourse.title }}
                        </td>
                        <td width="50px" class="text-center">></td>
                        <td class="d-flex flex-start" style="font-weight: 800">System:</td>
                        <td>{{ submission.contextTopic.label }}</td>
                        <td width="50px" class="text-center">></td>
                        <td class="d-flex flex-start" style="font-weight: 800">MISSION:</td>
                        <td class="pl-2">{{ submission.contextTask.title }}</td>
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
                  <Avatar :colourBorder="true" :profile="instructor" :size="30" class="pb-2" />
                </v-row>
                <div
                  class="mx-4 my-2"
                  style="border: 1px solid var(--v-cohortAccent-base); border-radius: 5px"
                >
                  <p
                    class="ma-2 instructions"
                    v-html="submission.contextTask.submissionInstructions"
                  ></p>
                </div>
              </div>

              <!-- STUDENT SUBMISSION -->
              <div class="requester-info">
                <v-row v-if="requesterPerson">
                  <div class="requester-image justify-center align-center">
                    <Avatar :colourBorder="true" :profile="requesterPerson" :size="30" />
                  </div>
                  <!-- Message -->
                  <div>
                    <p class="dialog-description pa-1">
                      <span style="font-size: 0.8rem; font-weight: 800"
                        ><i>{{
                          requesterPerson.firstName + " " + requesterPerson.lastName
                        }}</i></span
                      >
                      <i>@ {{ getHumanDate(submission.taskSubmittedForReviewTimestamp) }}</i>
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
                  <p
                    class="dialog-context-description mt-6"
                    style="color: var(--v-cohortAccent-base)"
                  >
                    provide the Navigator with feedback
                  </p>
                </v-row>
              </div>
              <div v-if="response" class="ma-5 mt-0">
                <v-row class="justify-end align-center mr-4">
                  <p class="dialog-description px-4 pb-0" style="color: var(--v-cohortAccent-base)">
                    student feedback
                  </p>
                  <Avatar :colourBorder="true" :profile="instructor" :size="30" class="pb-2" />
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
                <v-row class="justify-end">
                  <!-- Message -->
                  <div>
                    <p class="dialog-description pa-1">
                      <i> {{ getHumanDate(submission.responseSubmittedTimestamp) }}</i>
                    </p>
                  </div>
                  <div class="requester-image align-center mr-12">
                    <Avatar :colourBorder="true" :profile="instructor" :size="30" />
                  </div>
                </v-row>
              </div>
              <p
                v-if="submission.responseMessage"
                class="dialog-help-message teacher-bubble text-end"
                v-html="submission.responseMessage"
              ></p>
              <!-- Divider -->
            </div>
            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <div class="divider"></div>
              <template v-if="isTeacher && !reviewed">
                <v-btn
                  outlined
                  color="missionAccent"
                  @click="markSubmissionAsCompleted"
                  class="mr-2"
                  :loading="markingSubmission"
                  :disabled="decliningSubmission"
                >
                  <v-icon left> {{ mdiThumbUpOutline }} </v-icon>
                  approve
                </v-btn>
                <v-btn
                  outlined
                  color="galaxyAccent"
                  @click="declineSubmission"
                  class="mr-2"
                  :loading="decliningSubmission"
                  :disabled="markingSubmission"
                >
                  <v-icon left> {{ mdiThumbDownOutline }} </v-icon>
                  decline
                </v-btn>
              </template>

              <!-- CANCEL -->
              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                @click="close"
                :disabled="markingSubmission || decliningSubmission"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
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
import Avatar from "@/components/Reused/Avatar.vue";
import { db, functions } from "@/store/firestoreConfig";
import { fetchPersonByPersonId, fetchPersonsTasksByPersonIdCourseIdTopicId } from "@/lib/ff";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";
import { mdiTextBoxSearchOutline, mdiThumbUpOutline, mdiThumbDownOutline, mdiClose } from "@mdi/js";
import moment from "moment";
import {
  studentWorkMarkedCompletedXAPIStatement,
  teacherReviewedStudentWorkXAPIStatement,
  teacherRespondedSubmissionDeclinedXAPIStatement,
  topicCompletedXAPIStatement,
} from "@/lib/veracityLRS";

import useRootStore from "@/store/index";

export default {
  name: "SubmissionReviewDialog",
  props: ["submission", "requesterPerson", "on", "attrs", "reviewed", "studentReview", "isTeacher"],
  components: {
    Avatar,
  },
  data: () => ({
    mdiTextBoxSearchOutline,
    mdiThumbUpOutline,
    mdiThumbDownOutline,
    mdiClose,
    response: false,
    responseMsg: "",
    dialog: false,
    loading: false,
    instructor: {},
    xpPointsForCompletedSubmission: 250,
    personsTopicsTasks: [],
    markingSubmission: false,
    decliningSubmission: false,
  }),
  async mounted() {
    this.instructor = await fetchPersonByPersonId(this.submission.contextCourse.mappedBy.personId);
    // get students tasks related to this submission (used for unlocking next topic)
    this.personsTopicsTasks = await fetchPersonsTasksByPersonIdCourseIdTopicId(
      this.submission.studentId,
      this.submission.contextCourse.id,
      this.submission.contextTopic.id,
    );
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    declined() {
      return this.submission.taskSubmissionStatus == "declined";
    },
    completed() {
      return this.submission.taskSubmissionStatus == "completed";
    },
    status() {
      return this.completed ? "color:var(--v-baseAccent-base)" : "color:var(--v-cohortAccent-base)";
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    getHumanDate(ts) {
      if (!ts) return;
      return moment((ts.seconds ? ts.seconds : ts._seconds) * 1000).format("llll"); //format = Mon, Jun 9 2014 9:32 PM
    },
    async markSubmissionAsCompleted() {
      this.markingSubmission = true;

      try {
        // 1) update submission to completed
        console.log("1) updating submission status to: completed");
        await db
          .collection("courses")
          .doc(this.submission.contextCourse.id)
          .collection("submissionsForReview")
          .doc(this.submission.id)
          .update({
            // update submission to completed
            teacherId: this.person.id,
            taskSubmissionStatus: "completed",
            taskCompletedTimestamp: new Date(),
            responseMessage: this.responseMsg,
            responseSubmittedTimestamp: new Date(),
          });

        // 2) update the task status to complete
        console.log("2) updating mission status to: completed");
        await db
          .collection("people")
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
          });

        // update this.personsTopicsTasks with newly completed tasks status
        this.personsTopicsTasks = await fetchPersonsTasksByPersonIdCourseIdTopicId(
          this.submission.studentId,
          this.submission.contextCourse.id,
          this.submission.contextTopic.id,
        );

        console.log("3) sending email to learner with outcome: completed");
        await this.sendResponseToSubmission("completed");

        // send xAPI statement to LRS
        // student completed work
        console.log("4) XP log updated...");
        await studentWorkMarkedCompletedXAPIStatement(
          this.requesterPerson,
          this.submission.contextTask.id,
          {
            galaxy: this.submission.contextCourse,
            system: this.submission.contextTopic,
            mission: this.submission.contextTask,
          },
        );
        // teacher reviewed work
        console.log("5) XP log updated...");
        await teacherReviewedStudentWorkXAPIStatement(this.person, this.submission.contextTask.id, {
          student: this.requesterPerson,
          galaxy: this.submission.contextCourse,
          system: this.submission.contextTopic,
          mission: this.submission.contextTask,
        });

        // give XP points
        console.log("6) XP points given... ");
        await db
          .collection("people")
          .doc(this.submission.studentId)
          .update({
            xpPointsTotal: firebase.firestore.FieldValue.increment(
              this.xpPointsForCompletedSubmission,
            ),
          });

        this.setSnackbar({
          show: true,
          text:
            this.requesterPerson.firstName +
            " " +
            this.requesterPerson.lastName +
            "'s Mission status changed to: Completed",
          color: "baseAccent",
        });

        // unlock next task
        console.log("7) Unlocking next mission...");
        await this.unlockNextTask();

        // check if all tasks/missions are completed
        console.log("8) Checking if all system's missions are completed...");
        await this.checkIfAllTasksCompleted();

        // wait till unlock checks are completed before closing dialog
        console.log("9) mission updates finished");
      } catch (error) {
        // end of try
        console.error("Error updating submission:", error);
        this.setSnackbar({
          show: true,
          text: "Error updating submission: " + error,
          color: "pink",
        });
      } finally {
        this.markingSubmission = false;
        this.loading = false;
        this.disabled = false;
        this.dialog = false;
        this.response = false;
        this.responseMsg = "";
      }

      // TODO: perhaps only unlock once teacher has reviewed and marked complete. SOLUTION: leave as is. can progress to next task, but cant progress to next topic until all work is reviewed.
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

      console.log("7a) Mission data collected...");

      // 2) loops the tasks. the first task to have taskStatus locked, update to unlocked, then return to exit loop
      for (const [index, task] of currentTasks.docs.entries()) {
        if (task.data().taskStatus == "locked") {
          await task.ref.update({ taskStatus: "unlocked" });
          console.log("7b) New mission unlocked: (" + index + ") : " + task.data().title);
          this.setSnackbar({
            show: true,
            text:
              this.requesterPerson.firstName +
              " " +
              this.requesterPerson.lastName +
              "'s Next Mission Unlocked",
            color: "baseAccent",
          });
          return;
        } else {
          console.log("7b) No more missions in this system to unlock...");
        }
      }
    },
    async checkIfAllTasksCompleted() {
      // 1) check how many tasks in store are completed
      const numOfTasksCompleted = this.personsTopicsTasks.filter(
        (obj) => obj.taskStatus === "completed",
      ).length;

      console.log(
        "8a) Navigator has completed ",
        numOfTasksCompleted,
        " out of ",
        this.personsTopicsTasks.length,
        " missions",
      );

      // 2) check if that the same as total
      if (numOfTasksCompleted === this.personsTopicsTasks.length) {
        console.log("8b) System completed");
        // TODO: some kind of notification to signal that Topic has been completed
        // all tasks are completed. unlock next topic
        // message telling teacher whats happend

        this.setSnackbar({
          show: true,
          text:
            this.requesterPerson.firstName +
            " " +
            this.requesterPerson.lastName +
            " completed all Missions in System: " +
            this.submission.contextTopic.label,
          color: "baseAccent",
        });

        console.log("8c) Updating system status...");
        await this.setTopicToCompletedInDB();

        console.log("8d) Unlocking next System...");
        await this.unlockNextTopics();
      } else {
        console.log("8b) System not yet complete...");
        console.log("Total System Missions = ", this.personsTopicsTasks.length);
        console.log(
          "Missions completed = ",
          this.personsTopicsTasks.filter((obj) => obj.taskStatus === "completed").length,
        );
        console.log(
          "Missions in review = ",
          this.personsTopicsTasks.filter((obj) => obj.taskStatus === "inreview").length,
        );
        console.log(
          "Missions active = ",
          this.personsTopicsTasks.filter((obj) => obj.taskStatus === "active").length,
        );
        console.log(
          "Missions unlocked = ",
          this.personsTopicsTasks.filter((obj) => obj.taskStatus === "unlocked").length,
        );
        console.log(
          "Missions locked = ",
          this.personsTopicsTasks.filter((obj) => obj.taskStatus === "locked").length,
        );
      }
    },
    async unlockNextTopics() {
      // ==== all tasks/missions completed. unlock next topics ====

      // check if prerequisites are met
      const querySnapshot = await db
        .collection("people")
        .doc(this.submission.studentId)
        .collection(this.submission.contextCourse.id)
        .where("prerequisites", "array-contains", this.submission.contextTopic.id)
        .get();

      for (const doc of querySnapshot.docs) {
        const prerequisites = doc.data().prerequisites;

        if (prerequisites.length > 1) {
          console.log(
            "8d-i) Multiple prerequisites found. Checking if all prerequisites are completed...",
          );

          //loop prerequisites, and get topic from db.collection("people").doc(this.submission.studentId).collection(this.submission.contextCourse.id) and check if it is completed
          let completedPrerequisitesCount = 0;
          for (const prerequisite of prerequisites) {
            // get prereq topic from db
            console.log("8d-ii) Checking if prerequisite " + prerequisite + " is completed...");
            const topicDoc = await db
              .collection("people")
              .doc(this.submission.studentId)
              .collection(this.submission.contextCourse.id)
              .doc(prerequisite)
              .get();

            if (topicDoc.exists) {
              const topicData = topicDoc.data();
              if (topicData.topicStatus === "completed") {
                console.log("topic status is completed.");
                completedPrerequisitesCount++;
              } else {
                console.log("topic status is not completed. It is: ", topicData.topicStatus);
              }
            } else {
              console.log("Prerequisite Topic does not exist.");
            }
          }

          if (completedPrerequisitesCount === prerequisites.length) {
            console.log("8d-iii) All prerequisites completed. Unlocking next System...");
            await doc.ref.update({
              topicStatus: "unlocked", // change status to unlocked
            });

            console.log("8d-iv) Next System found. System Unlocked");

            // message telling teacher whats happend
            this.setSnackbar({
              show: true,
              text:
                "System: " +
                doc.data().label +
                " Unlocked for: " +
                this.requesterPerson.firstName +
                " " +
                this.requesterPerson.lastName,
              color: "baseAccent",
            });
          } else {
            console.log("8d-iii) Not all prerequisites completed. System remains locked");
          }
        } else if (prerequisites.length === 1) {
          console.log("8d-i) Only one prereq...");
          // get prereq topic from db
          console.log("8d-ii) Checking if prerequisite " + prerequisite + " is completed...");
          const topicDoc = await db
            .collection("people")
            .doc(this.submission.studentId)
            .collection(this.submission.contextCourse.id)
            .doc(prerequisites[0])
            .get();

          if (topicDoc.exists) {
            const topicData = topicDoc.data();
            if (topicData.topicStatus === "completed") {
              console.log("topic status is completed.");
              await doc.ref.update({
                topicStatus: "unlocked", // change status to unlocked
              });
              // message telling teacher whats happend
              this.setSnackbar({
                show: true,
                text:
                  "System: " +
                  doc.data().label +
                  " Unlocked for: " +
                  this.requesterPerson.firstName +
                  " " +
                  this.requesterPerson.lastName,
                color: "baseAccent",
              });
            } else {
              console.log("topic status is not completed. It is: ", topicData.topicStatus);
            }
          } else {
            console.log("Prerequisite Topic " + prerequisites[0] + "does not exist.");
          }
        }
      }
    },
    sendResponseToSubmission(outcome) {
      const data = {
        course: this.submission.contextCourse.title,
        topic: this.submission.contextTopic.label,
        task: this.submission.contextTask.title,
        firstName: this.requesterPerson.firstName,
        lastName: this.requesterPerson.lastName,
        submission: this.submission.submissionLink,
        outcome: outcome,
        message: this.responseMsg,
        teacher: this.person.firstName + " " + this.person.lastName,
        email: this.requesterPerson.email,
      };
      const sendResponseToSubmission = functions.httpsCallable("sendResponseToSubmission");
      console.log("3a) Email sent: ", data);
      return sendResponseToSubmission(data);
    },
    async declineSubmission() {
      this.decliningSubmission = true;

      try {
        // Add response to request for help
        await db
          .collection("courses")
          .doc(this.submission.contextCourse.id)
          .collection("submissionsForReview")
          .doc(this.submission.id)
          .update({
            responseMessage: this.responseMsg,
            taskSubmissionStatus: "declined",
            responseSubmittedTimestamp: new Date(),
            responderPersonId: this.person.id,
          });

        // update students task status
        await db
          .collection("people")
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
          });

        await this.sendResponseToSubmission("declined");

        console.log("Submitted work declined. It did not meet the mission requirements");

        // teacher assissted student
        await teacherRespondedSubmissionDeclinedXAPIStatement(
          this.person,
          this.submission.contextTask.id,
          {
            student: this.requesterPerson,
            galaxy: this.submission.contextCourse,
            system: this.submission.contextTopic,
            mission: this.submission.contextTask,
          },
        );

        this.setSnackbar({
          show: true,
          text:
            this.requesterPerson.firstName +
            " " +
            this.requesterPerson.lastName +
            "'s submitted work declined. Feedback sent to Navigator.",
          color: "baseAccent",
        });

        // TODO: update requests. (to remove answered requests)
      } catch (error) {
        this.setSnackbar({
          show: true,
          text: "Error: " + error,
          color: "pink",
        });

        throw error;
      } finally {
        // close logic
        this.disabled = false;
        this.dialog = false;
        this.response = false;
        this.responseMsg = "";
        this.decliningSubmission = false;
      }
    },
    async setTopicToCompletedInDB() {
      await db
        .collection("people")
        .doc(this.submission.studentId)
        .collection(this.submission.contextCourse.id)
        .doc(this.submission.contextTopic.id)
        .update({
          // update tasks array with new task
          topicStatus: "completed",
          topicCompletedTimestamp: new Date(),
        });
      console.log("8c-i) System status updated to: completed");

      await topicCompletedXAPIStatement(this.requesterPerson, this.submission.contextTopic.id, {
        galaxy: this.submission.contextCourse,
        system: this.submission.contextTopic,
      });
      console.log("8c-ii) XP log updated...");
    },
    close() {
      console.log("closing dialog");
    },
  },
};
</script>

<style scoped lang="scss">
.input-field {
  padding-top: 10px;
  border-radius: 5px;
  font-size: 0.9rem;
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
    width: 100%;
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

.instructions-info {
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
