<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- MARK AS COMPLETED BUTTON (with dialog) -->
          <template v-slot:activator="{ on, attrs }">
            <!-- uncheck icon if not inreview or completed -->
            <v-btn color="baseAccent" v-bind="attrs" v-on="on" outlined small>
              <!-- <v-icon> mdi-check </v-icon> -->
              <!-- <v-icon> mdi-checkbox-outline </v-icon> -->
              MARK AS COMPLETED
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">Is the submission completed?</p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">
                  Has
                  <strong
                    ><i>{{
                      requesterPerson.firstName + " " + requesterPerson.lastName
                    }}</i></strong
                  >
                  completed the submission requirements for this mission?
                </p>
              </div>
            </div>

            <!-- End of v-if="submission" -->

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <v-btn
                outlined
                color="baseAccent"
                @click="markSubmissionAsCompleted()"
                class="mr-2"
                :loading="loading"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon left> mdi-check </v-icon>
                YES,
                {{ requesterPerson.firstName + " " + requesterPerson.lastName }}
                HAS COMPLETED THIS MISSION
              </v-btn>

              <!-- CANCEL -->
              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-2"
                @click="cancel"
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

import { db } from "../store/firestoreConfig";
import {
  studentWorkMarkedCompletedXAPIStatement,
  teacherReviewedStudentWorkXAPIStatement,
} from "../store/veracityLRS";

import { mapState, mapGetters } from "vuex";

export default {
  name: "MarkSubmissionCompleted",
  props: ["submission", "requesterPerson", "on", "attrs"],
  data: () => ({
    submissionLink: null,
    dialog: false,
    loading: false,
  }),
  mounted() {
    // console.log("MissionCompletedDialog Task = ", this.task);
    console.log(
      "this.personsTopicsTasks from MarkSubmissionCompleted.vue: ",
      this.personsTopicsTasks
    );
  },
  computed: {
    ...mapState(["personsTopicsTasks"]),
    ...mapGetters(["person"]),
  },
  methods: {
    markSubmissionAsCompleted() {
      this.loading = true;

      console.log("currentCourse", this.submission.contextCourse);
      console.log("currentTopic", this.submission.contextTopic);
      console.log("currentTask", this.submission.contextTask);
      console.log("person", this.person);

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

          this.loading = false;
          this.disabled = false;
          this.dialog = false;

          this.$emit(
            "snackbarToggle",
            "Student's Mission now marked as completed"
          );

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
        // snackbar message telling teacher whats happend
        this.$emit(
          "snackbarToggle",
          this.requesterPerson.firstName +
            " " +
            this.requesterPerson.lastName +
            " completed all tasks for topic " +
            this.submission.contextTopic.label
        );

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
                // snackbar message telling teacher whats happend
                this.$emit(
                  "snackbarToggle",
                  "NEW TOPIC: " +
                    doc.data().label +
                    " UNLOCKED FOR: " +
                    this.requesterPerson.firstName +
                    " " +
                    this.requesterPerson.lastName
                );
              });
          });
        });
    },
    cancel() {
      this.dialog = false;
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
</style>
