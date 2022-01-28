<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- REQUEST HELP BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="missionAccent" v-bind="attrs" v-on="on" icon x-large>
              <v-icon color="missionAccent">mdi-hand-front-left-outline</v-icon>
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- DIALOG HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                What do you need help with? For mission:
                <strong
                  ><i>{{ task.title }}</i></strong
                >
                ?
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">{{ dialogDescription }}</p>
              </div>
            </div>

            <!-- REQUEST INPUT FIELDS -->
            <div class="create-dialog-content">
              <!-- TITLE -->
              <p class="dialog-description">Enter your question:</p>
              <v-textarea
                class="input-field"
                solo
                v-model="requestForHelp"
                background-color="white"
              ></v-textarea>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- SUBMIT REQUEST FOR HELP -->
              <v-btn
                outlined
                color="green darken-1"
                @click="submitRequestForHelp()"
                class="mr-2"
                :loading="loading"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon left> mdi-check </v-icon>
                SUBMIT REQUEST FOR HELP
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

            <!-- End submission-create-dialog -->
          </div>

          <!-- End create-dialog -->
        </v-dialog>
      </v-col>
    </v-row>

    <!-- Request submitted Snackbar -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMsg }}
      <template v-slot:action="{ attrs }">
        <v-btn color="pink" text v-bind="attrs" @click="snackbar = false">
          OK
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import firebase from "firebase/app";

import { db } from "../store/firestoreConfig";
import { sendStudentXAPIStatement } from "../store/veracityLRS";

import { mapState, mapGetters } from "vuex";

export default {
  name: "RequestHelpDialog",
  props: ["topicId", "taskId", "task", "on", "attrs"],
  data: () => ({
    dialog: false,
    dialogDescription:
      "Write what you need help with, then submit, and your instructor will be notified to leave you a response.",
    requestForHelp: "",
    snackbar: false,
    snackbarMsg: "",
    loading: false,
    deleting: false,
  }),
  mounted() {},
  computed: {
    ...mapState(["currentCourse", "currentTopic", "currentTask"]),
    ...mapGetters(["person"]),
  },
  methods: {
    submitRequestForHelp() {
      this.loading = true;
      // Add a new request for help to the "courses" db
      db.collection("courses")
        .doc(this.currentCourse.id)
        // .collection("topics")
        // .doc(this.topicId)
        // .collection("tasks")
        // .doc(this.taskId)
        .collection("requestsForHelp")
        .add({
          // add request for help to database
          // TODO: currentCourse, currentTopic, currentTask in store
          contextCourse: this.currentCourse,
          contextTopic: this.currentTopic,
          contextTask: this.currentTask,
          personId: this.person.id,
          requestForHelpMessage: this.requestForHelp,
          requestForHelpStatus: "unanswered",
          requestSubmittedTimestamp: new Date(),
        })
        .then((docRef) => {
          docRef.update({ id: docRef.id });
          console.log("Request for help successfully submitted to instructor!");
          // send xAPI statement to LRS
          sendStudentXAPIStatement(
            this.person.email,
            "http://id.tincanapi.com/verb/requested-attention",
            // this.currentTask.id
            {
              galaxyName: this.currentCourse.title,
              systemName: this.currentTopic.label,
              missionName: this.currentTask.title,
            }
          );
          this.requestForHelp = "";
          this.loading = false;
          this.dialog = false;

          this.snackbarMsg =
            "Request submitted. You will be notified when your instructor has responded.";
          this.snackbar = true;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          this.snackbarMsg = "Error: " + error;
          this.snackbar = true;
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

  .dialog-description {
    color: var(--v-missionAccent-base);
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
