<template>
  <v-container class="pa-0">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- COMPLETED BUTTON (looks like checkbox) -->
          <template v-slot:activator="{ on, attrs }">
            <!-- IF ACTIVE -->
            <v-btn
              v-if="active || declined"
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button"
              :color="active ? 'missionAccent' : 'cohortAccent'"
              icon
              x-large
            >
              <v-icon v-if="task.submissionRequired">
                {{ mdiCloudUploadOutline }}
              </v-icon>
              <v-icon v-else> {{ mdiCheckboxBlankOutline }} </v-icon>
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div v-if="active || declined" class="create-dialog">
            <!-- HEADER -->
            <div v-if="task.submissionRequired" class="dialog-header">
              <p class="dialog-title">
                Submission requirements for:
                <strong
                  ><i>{{ task.title }}</i></strong
                >
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  To complete this task you must submit a response to following instructions
                </p>
              </div>
            </div>

            <!-- HEADER -->
            <div v-else class="dialog-header">
              <p class="dialog-title">
                Have you completed Mission:
                <strong
                  ><i>{{ task.title }}</i></strong
                >
                ?
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  Did you complete all the requirements of the Mission?
                </p>
              </div>
            </div>

            <div class="submission-create-dialog">
              <!-- SUBMISSION FIELDS -->
              <div v-if="task.submissionRequired">
                <div class="submission-dialog-header">
                  <!-- submission message speech bubble -->
                  <div class="d-inline-flex">
                    <div>
                      <v-img
                        class="instructor-image mb-5 ml-5 mr-2"
                        :src="mappedByImageURL"
                      ></v-img>
                    </div>
                    <div class="d-flex flex-column instructor-details">
                      <p class="ma-0">
                        {{ course.mappedBy?.name }}
                      </p>
                      <p class="ma-0" style="font-size: 0.6rem">Instructor</p>
                    </div>
                  </div>
                  <v-row class="d-flex align-center speech-bubble">
                    <p
                      v-html="task.submissionInstructions"
                      class="submission-dialog-description ma-0"
                      style="color: var(--v-cohortAccent-base)"
                    ></p>
                    <!-- <p class="submission-dialog-description ma-0">
                        {{
                          task.submissionInstructions
                            ? task.submissionInstructions
                            : "Please provide a link to your work, showing that you have completed this mission"
                        }}
                      </p> -->
                  </v-row>
                </div>

                <div class="submission-create-dialog-content">
                  <div class="d-flex align-center">
                    <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                    <p class="dialog-description pb-4">
                      submit your response below<br />(include any links to your work if required)
                    </p>
                  </div>
                  <vue-editor
                    v-model="submissionLink"
                    useCustomImageHandler
                    @imageAdded="handleImageAdded"
                    class="mb-8 quill"
                    :class="{ 'active-quill': quillFocused }"
                    :editor-toolbar="customToolbar"
                    @focus="quillFocused = true"
                    @blur="quillFocused = false"
                    style="color: var(--v-cohortAccent-base)"
                  />
                </div>
              </div>
              <!-- End of v-if="submission" -->

              <!-- ACTION BUTTONS -->
              <div class="action-buttons">
                <!-- YES, I HAVE COMPLETED -->
                <v-btn
                  v-if="active && task.submissionRequired"
                  outlined
                  color="baseAccent"
                  @click="submitWorkForReview()"
                  class="mr-2"
                  :loading="loading"
                  :disabled="disabled"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> {{ mdiCloudUploadOutline }} </v-icon>
                  SUBMIT WORK FOR REVIEW
                </v-btn>
                <v-btn
                  v-else-if="declined && task.submissionRequired"
                  outlined
                  color="baseAccent"
                  @click="reSubmitWorkForReview()"
                  class="mr-2"
                  :loading="loading"
                  :disabled="disabled"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> {{ mdiCheck }} </v-icon>
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
                  <v-icon left> {{ mdiCheck }} </v-icon>
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
                  <v-icon left> {{ mdiClose }} </v-icon>
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
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
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
                  <v-icon left> {{ mdiClose }} </v-icon>
                  CLOSE
                </v-btn>
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
import confetti from "canvas-confetti";
import firebase from "firebase/compat/app";
import { db, functions } from "@/store/firestoreConfig";
import { fetchCohortByCohortId, fetchPersonByPersonId } from "@/lib/ff";
import {
  mdiCloudUploadOutline,
  mdiInformationVariant,
  mdiCheck,
  mdiClose,
  mdiCheckboxBlankOutline,
} from "@mdi/js";
import { mapActions, mapState } from "pinia";
import useRootStore from "@/store/index";
import useSolarSystemViewStore from "@/store/solarSystemView";
import {
  submitWorkForReviewXAPIStatement,
  reSubmitWorkForReviewXAPIStatement,
  taskMarkedAsCompletedXAPIStatement,
  topicCompletedXAPIStatement,
} from "@/lib/veracityLRS";
import { VueEditor } from "vue2-editor";

export default {
  name: "MissionCompletedDialog",
  components: {
    VueEditor,
  },
  props: [
    "course",
    "topic",
    "task",
    "missionStatus",
    "on",
    "attrs",
    "active",
    "inreview",
    "declined",
    "completed",
  ],
  data: () => ({
    mdiCloudUploadOutline,
    mdiInformationVariant,
    mdiCheck,
    mdiClose,
    mdiCheckboxBlankOutline,
    submissionLink: null,
    dialog: false,
    loading: false,
    disabled: false,
    deleting: false,
    mappedByImageURL: "",
    customToolbar: [
      [{ header: [false, 3, 4, 5] }],
      ["bold", "italic", "underline", "strike"], // toggled buttons
      [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
      ["link", "image"],
      // ["clean"] // remove formatting button
    ],
    quillFocused: false,
    cohort: null,
    xpPointsForThisTask: 100, // task is worth 100xp by default
    xpPointsForThisTopic: 500, // topic is worth 500xp by default
  }),
  async mounted() {
    // get mappedBy image
    if (!this.course.mappedBy.image) {
      this.getMappedByPersonsImage(this.course.mappedBy.personId);
    }
    // FIXME: this won't work if they load the solar system view directly without going
    // through the galaxy view, the currentCohortId could be incorrect or even null
    this.cohort = await fetchCohortByCohortId(this.currentCohortId);
    // console.log("persons topics from mission completed dialog", this.personsTopics);
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId", "courseSubmissions", "personsTopics", "person"]),
    ...mapState(useSolarSystemViewStore, ["personTasks"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    submission() {
      const submissions = this.courseSubmissions.filter(
        (submission) => submission.studentId == this.person.id,
      );
      return submissions.find((submission) => submission.contextTask.id == this.task.id);
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar", "setTopicCompleted", "setNextTopicUnlocked"]),
    async reSubmitWorkForReview() {
      this.loading = true;
      this.disabled = true;

      // 1) add submission to course (for teacher to review)
      try {
        await db
          .collection("courses")
          .doc(this.course.id)
          .collection("submissionsForReview")
          .doc(this.submission.id)
          .update({
            // update "courses" database with task submission
            studentId: this.person.id,
            contextCourse: this.course,
            contextTopic: this.topic,
            contextTask: this.task,
            submissionLink: this.submissionLink,
            taskSubmissionStatus: "inreview",
            taskSubmittedForReviewTimestamp: new Date(),
            responderPersonId: "",
            responseMessage: "",
          });

        console.log("Re-submission successfully submitted for review!");

        // send xAPI statement to LRS
        await reSubmitWorkForReviewXAPIStatement(this.person, this.task.id, {
          galaxy: this.course,
          system: this.topic,
          mission: this.task,
        });

        this.loading = false;
        this.dialog = false;

        this.setSnackbar({
          show: true,
          text: "Submission sent. You will be notified when your instructor has reviewed your work.",
          color: "baseAccent",
        });
      } catch (error) {
        this.setSnackbar({
          show: true,
          text: "Error: " + error,
          color: "baseAccent",
        });

        throw error;
      }

      // 2) Add submission to students task (for students progression)
      await db
        .collection("people")
        .doc(this.person.id)
        .collection(this.course.id)
        .doc(this.topic.id)
        .collection("tasks")
        .doc(this.task.id)
        .update({
          // update "people" database with task submission
          submissionLink: this.submissionLink,
          taskStatus: "inreview",
          taskSubmittedForReviewTimestamp: new Date(),
        });

      if (this.cohort != null) {
        for (const teacherId of this.cohort.teachers) {
          await this.sendTaskSubmission(
            teacherId,
            this.submissionLink,
            this.task.submissionInstructions,
          );
        }
      }

      console.log("Task work successfully re-submitted for review!");

      // unlock next task
      await this.unlockNextTask();

      // check if all tasks/missions are completed
      await this.checkIfAllTasksCompleted();

      this.$emit("missionSubmittedForReview");

      this.loading = false;
      this.disabled = false;
      this.dialog = false;

      // TODO: perhaps only unlock once teacher has reviewed and marked complete. SOLUTION: leave as is. can progress to next task, but cant progress to next topic until all work is reviewed.
    },
    async submitWorkForReview() {
      this.loading = true;
      this.disabled = true;

      // 1) add submission to course (for teacher to review)
      try {
        await db.collection("courses").doc(this.course.id).collection("submissionsForReview").add({
          // update "courses" database with task submission
          studentId: this.person.id,
          contextCourse: this.course,
          contextTopic: this.topic,
          contextTask: this.task,
          submissionLink: this.submissionLink,
          taskSubmissionStatus: "inreview",
          taskSubmittedForReviewTimestamp: new Date(),
        });
        if (this.cohort != null) {
          for (const teacherId of this.cohort.teachers) {
            await this.sendTaskSubmission(
              teacherId,
              this.submissionLink,
              this.task.submissionInstructions,
            );
          }
        }

        console.log("Submission successfully submitted for review!");

        // send xAPI statement to LRS
        await submitWorkForReviewXAPIStatement(this.person, this.task.id, {
          galaxy: this.course,
          system: this.topic,
          mission: this.task,
        });

        this.requestForHelp = "";
        this.loading = false;
        this.dialog = false;

        this.setSnackbar({
          show: true,
          text: "Submission sent. You will be notified when your instructor has reviewed your work.",
          color: "baseAccent",
        });
      } catch (error) {
        this.setSnackbar({
          show: true,
          text: "Error: " + error,
          color: "baseAccent",
        });

        throw error;

        this.loading = false;
        this.dialog = false;
      }

      // 2) Add submission to students task (for students progression)
      await db
        .collection("people")
        .doc(this.person.id)
        .collection(this.course.id)
        .doc(this.topic.id)
        .collection("tasks")
        .doc(this.task.id)
        .update({
          // update "people" database with task submission
          submissionLink: this.submissionLink,
          taskStatus: "inreview",
          taskSubmittedForReviewTimestamp: new Date(),
        });

      console.log("Task work successfully submitted for review!");

      // unlock next task
      await this.unlockNextTask();

      // check if all tasks/missions are completed
      await this.checkIfAllTasksCompleted();

      this.$emit("missionSubmittedForReview");

      this.loading = false;
      this.disabled = false;
      this.dialog = false;

      // TODO: perhaps only unlock once teacher has reviewed and marked complete. SOLUTION: leave as is. can progress to next task, but cant progress to next topic until all work is reviewed.
    },
    async markAsCompleted() {
      this.loading = true;
      this.disabled = true;

      // Add a new document in collection "courses"
      await db
        .collection("people")
        .doc(this.person.id)
        .collection(this.course.id)
        .doc(this.topic.id)
        .collection("tasks")
        .doc(this.task.id)
        .update({
          // update tasks array with new task
          taskStatus: "completed",
          taskCompletedTimestamp: new Date(),
        });

      console.log("Task status successfully written as completed!");

      // send xAPI statement to LRS
      await taskMarkedAsCompletedXAPIStatement(this.person, this.task.id, {
        galaxy: this.course,
        system: this.topic,
        mission: this.task,
      });

      // update XP points total with TASK points. WIP
      console.log(
        "updating XP points: " +
          this.person.xpPointsTotal +
          " + " +
          this.xpPointsForThisTask +
          " = " +
          (this.person.xpPointsTotal + this.xpPointsForThisTask),
      );
      await db
        .collection("people")
        .doc(this.person.id)
        .update({
          xpPointsTotal: firebase.firestore.FieldValue.increment(this.xpPointsForThisTask),
        });

      // unlock next task
      await this.unlockNextTask();

      // check if all tasks/missions are completed
      await this.checkIfAllTasksCompleted();

      this.$emit("missionCompleted");

      this.loading = false;
      this.disabled = false;
      this.dialog = false;
    },
    async unlockNextTask() {
      console.log("unlocking next task...");
      // 1) get all tasks in this topic
      const tasks = await db
        .collection("people")
        .doc(this.person.id)
        .collection(this.course.id)
        .doc(this.topic.id)
        .collection("tasks")
        // order by timestamp is important otherwise index == 0 (in the next step) wont necessarily be the first mission
        .orderBy("taskCreatedTimestamp")
        .get();

      // 2) loops the tasks. the first task to have taskStatus locked, update to unlocked, then return to exit loop
      for (const [index, task] of tasks.docs.entries()) {
        if (task.data().taskStatus == "locked") {
          await task.ref.update({ taskStatus: "unlocked" });
          console.log("NEW TASK UNLOCKED (" + index + ") : " + task.data().title);
          return;
        }
      }
    },
    async checkIfAllTasksCompleted() {
      // 1) check how many tasks in store are completed
      const numOfTasksCompleted = this.personTasks.filter(
        (obj) => obj.taskStatus === "completed",
      ).length;
      // 2) check if that the same as total
      if (numOfTasksCompleted === this.personTasks.length) {
        console.log("Topic Completed! (all tasks in this topic completed)");
        // set topic to completed in store
        this.setTopicCompleted({ completed: true, topicId: this.topic.id });
        // === Basic Cannon
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        await topicCompletedXAPIStatement(this.person, this.topic.id, {
          galaxy: this.course,
          system: this.topic,
        });
        await this.setTopicToCompletedInDB();
        // all tasks are completed. unlock next topic
        await this.unlockNextTopics();
        // topic unlocked. trigger store flag (this is for "next system" button (loading attribute) in galaxy view)
        this.setNextTopicUnlocked(true);
      } else {
        console.log("topic not yet completed...");
        console.log("total tasks = ", this.personTasks.length);
        console.log(
          "completed = ",
          this.personTasks.filter((obj) => obj.taskStatus === "completed").length,
        );
        console.log(
          "in review = ",
          this.personTasks.filter((obj) => obj.taskStatus === "inreview").length,
        );
        console.log(
          "active = ",
          this.personTasks.filter((obj) => obj.taskStatus === "locked").length,
        );
        console.log(
          "locked = ",
          this.personTasks.filter((obj) => obj.taskStatus === "locked").length,
        );
      }
    },
    async unlockNextTopics() {
      //TODO: guard against error (eg. untick "mission copmleted" if unlock fails)

      // ==== all tasks/missions completed. unlock next topics ====
      const querySnapshot = await db
        .collection("people")
        .doc(this.person.id)
        .collection(this.course.id)
        .where("prerequisites", "array-contains", this.topic.id)
        .get();

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        // if has more than one prereq
        if (data.prerequisites.length > 1) {
          console.log("next topic has more than one prerequisite... checking if completed...");
          let prereqsArr = data.prerequisites;
          // minus this completed topic
          prereqsArr = prereqsArr.filter((e) => e !== this.topic.id);
          console.log("prereqs after current one removed:", prereqsArr);
          const prereqsToCompleteCount = prereqsArr.length;
          let prereqsCompletedCount = 0;
          for (const preq of prereqsArr) {
            console.log("checking if prereq " + preq + " is completed...");
            // check if the other preqs are .status completed
            const preqObj = this.personsTopics.filter((topic) => topic.id === preq);
            if (preqObj[0].topicStatus == "completed") {
              console.log("another prereq completed");
              prereqsCompletedCount++;
            }
          }
          // check if preqCounts match. if so, unlock topic
          if (prereqsCompletedCount == prereqsToCompleteCount) {
            await doc.ref.update({ topicStatus: "unlocked" });
            console.log("NEW TOPIC UNLOCKED: " + data.label);
          } else {
            console.log("other prereqs of next topic not completed. next topic not unlocked.");
          }
        } else {
          await doc.ref.update({
            topicStatus: "unlocked", // change status to unlocked
          });
          // route back to map
          console.log("NEW TOPIC UNLOCKED: " + data.label);
          // this.$router.push({
          //   name: "GalaxyView",
          //   params: {
          //     topicId: this.course.id,
          //   },
          // });
        }
      }
    },
    async setTopicToCompletedInDB() {
      await db
        .collection("people")
        .doc(this.person.id)
        .collection(this.course.id)
        .doc(this.topic.id)
        .update({
          // update tasks array with new task
          topicStatus: "completed",
          topicCompletedTimestamp: new Date(),
        });

      // update XP points total with TOPIC points. WIP
      await db
        .collection("people")
        .doc(this.person.id)
        .update({
          xpPointsTotal: firebase.firestore.FieldValue.increment(this.xpPointsForThisTopic),
        });
    },
    cancel() {
      this.dialog = false;
    },
    async getMappedByPersonsImage(personId) {
      const person = await fetchPersonByPersonId(personId);
      this.mappedByImageURL = person.image?.url;
    },
    async sendTaskSubmission(teacherId, submissionResponse, submissionInstructions) {
      const teacher = await fetchPersonByPersonId(teacherId);
      const data = {
        course: this.course.title,
        topic: this.topic.label,
        task: this.task.title,
        student: this.person.firstName + " " + this.person.lastName,
        submission: submissionResponse,
        submissionInstructions: submissionInstructions,
        teacher: teacher.firstName + " " + teacher.lastName,
        email: teacher.email,
      };
      const sendTaskSubmission = functions.httpsCallable("sendTaskSubmission");
      return sendTaskSubmission(data);
    },
    handleImageAdded(file, Editor, cursorLocation) {
      // ceate a storage ref
      var storageRef = storage.ref(
        "submission-images/student-" + this.person.id + "-task-" + this.task.id + "-" + file.name,
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

<style>
.submission-dialog-description > p {
  margin: 10px 0px !important;
}
</style>

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
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;
}

.submission-create-dialog {
  width: 100%;

  .submission-dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
    color: var(--v-cohortAccent-base);
  }

  .submission-create-dialog-content {
    // width: 33.33%;
    // min-height: 400px;
    color: #fff;
    display: flex;
    justify-content: space-around;
    align-items: space-around;
    flex-direction: column;
    padding: 20px;
    width: 100%;
    // font-size: 0.6rem;
    // border: 1px solid var(--v-missionAccent-base);
  }

  .submission-dialog-description {
    color: #fff;
    text-transform: uppercase;
    font-size: 0.7rem;
    padding: 0px 10px;
    font-style: italic;
    width: 100%;
  }

  .speech-bubble {
    position: relative;
    width: auto;
    max-width: 90%;
    padding: 10px;
    margin: 0px 20px 20px 20px;
    text-align: center;
    // background-color: #fff;
    -moz-border-radius: 5px;
    -webkit-border-radius: 5px;
    border-radius: 5px;
    border: 2px solid var(--v-cohortAccent-base);
  }

  // .speech-bubble p {
  //   // font-size: 1.25em;
  // }

  .speech-bubble:before,
  .speech-bubble:after {
    content: "\0020";
    display: block;
    position: absolute;
    top: -20px;
    right: 300px;
    z-index: 2;
    width: 0;
    height: 0;
    overflow: hidden;
    border: solid 10px transparent;
    border-bottom-color: var(--v-cohortAccent-base);
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
  color: var(--v-cohortAccent-base);
  margin: 5px;
  font-size: 0.9rem;
  display: flex;
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
  border: 1px solid var(--v-cohortAccent-base);
}

.active-quill ::v-deep .ql-container {
  border: 1px solid var(--v-cohortAccent-base);
}
</style>
