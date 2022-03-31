<template>
  <v-container class="pa-2">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- HELP RESPONSE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="missionAccent"
              v-bind="attrs"
              v-on="on"
              outlined
              small
            >
              <v-icon left small color="missionAccent"
                >mdi-thumb-down-outline</v-icon
              >
              DECLINE SUBMISSION
              <!-- <v-icon color="missionAccent">mdi-hand-front-left-outline</v-icon> -->
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- DIALOG HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">DECLINE WORK SUBMISSION</p>
              <!-- Request for help details -->
              <div class="request-details d-flex">
                <!-- Avatar -->
                <div class="requester-image d-flex justify-center align-center">
                  <v-avatar v-if="requesterPerson" size="30">
                    <img
                      v-if="requesterPerson.image"
                      :src="requesterPerson.image.url"
                      :alt="requesterPerson.firstName"
                      style="object-fit: cover"
                    />
                  </v-avatar>
                </div>
                <!-- Message -->
                <div class="request-details-person">
                  <p class="dialog-description">
                    <span style="font-size: 0.8rem; font-weight: 800"
                      ><i>{{
                        requesterPerson.firstName +
                        " " +
                        requesterPerson.lastName
                      }}</i></span
                    >
                    submitted the following work
                  </p>
                  <p class="dialog-description">
                    <i
                      >@
                      {{
                        getHumanDate(submission.taskSubmittedForReviewTimestamp)
                      }}</i
                    >
                  </p>
                </div>
                <!-- Context details -->
                <div class="request-details-context">
                  <v-simple-table>
                    <tr
                      class="dialog-context-description"
                      style="
                        color: var(--v-missionAccent-base);
                        font-size: 0.8rem;
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
              </div>
            </div>

            <!-- REQUEST INPUT FIELDS -->
            <div class="create-dialog-content">
              <!-- View submission button -->
              <a
                style="text-decoration: none"
                :href="submission.submissionLink"
                target="_blank"
                class="my-3 d-flex justify-center"
              >
                <v-btn outlined color="cohortAccent" class="mb-4" large>
                  <v-icon left> mdi-text-box-search-outline </v-icon>
                  VIEW SUBMISSION
                </v-btn>
              </a>

              <!-- Divider -->
              <div class="divider"></div>
              <!-- RESPONSE -->
              <p class="dialog-description">
                Please explain why the learner's submission did not meet the
                Mission requirements:
              </p>
              <v-textarea
                class="input-field"
                outlined
                :dark="dark"
                :light="!dark"
                v-model="response"
                color="missionAccent"
              ></v-textarea>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- SUBMIT REQUEST FOR HELP -->
              <v-btn
                outlined
                color="missionAccent"
                @click="declineSubmission()"
                class="mr-2"
                :loading="loading"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon left color="missionAccent"
                  >mdi-alert-octagon-outline</v-icon
                >
                DECLINE SUBMISSION
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
  </v-container>
</template>

<script>
import firebase from "firebase/app";
import moment from "moment";

import { db } from "../store/firestoreConfig";
import { teacherRespondedSubmissionDeclinedXAPIStatement } from "../lib/veracityLRS";
import { dbMixins } from "../mixins/DbMixins";
import { mapState, mapGetters } from "vuex";

export default {
  name: "SubmissionResponseDialog",
  mixins: [dbMixins],
  props: ["submission", "requesterPerson", "on", "attrs"],
  data: () => ({
    dialog: false,
    loading: false,
    deleting: false,
    response: "",
  }),
  mounted() {
    console.log("submission from decline", this.submission);
  },
  computed: {
    ...mapState(["currentCourse", "currentTopic", "currentTask"]),
    ...mapGetters(["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    getHumanDate(ts) {
      return moment(ts.seconds * 1000).format("llll"); //format = Mon, Jun 9 2014 9:32 PM
    },
    declineSubmission() {
      console.log("declining submission: ", this.submission);
      this.loading = true;
      // Add response to request for help
      db.collection("courses")
        .doc(this.submission.contextCourse.id)
        .collection("submissionsForReview")
        .doc(this.submission.id)
        .update({
          responseMessage: this.response,
          taskSubmissionStatus: "declined",
          responseSubmittedTimestamp: new Date(),
          responderPersonId: this.person.id,
        });

      // update students task status
      db.collection("people")
        .doc(this.submission.studentId)
        .collection(this.submission.contextCourse.id)
        .doc(this.submission.contextTopic.id)
        .collection("tasks")
        .doc(this.submission.contextTask.id)
        .update({
          responseMessage: this.response,
          taskStatus: "declined",
          submissionDeclinedTimestamp: new Date(),
          responderPersonId: this.person.id,
        })
        .then(() => {
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
          this.loading = false;
          this.dialog = false;
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
    cancel() {
      this.loading = false;
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

    .request-details {
      width: 100%;

      .requester-image {
        width: 10%;
      }
      .request-details-person {
        width: 50%;
      }
      .request-details-context {
        width: 40%;
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
    // text-transform: uppercase;
    width: 100%;
    // font-size: 0.6rem;
    // border: 1px solid var(--v-missionAccent-base);

    .dialog-help-message {
      font-style: italic;
    }

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

  .dialog-context-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.6rem;
    margin: 0;
    font-style: italic;
  }
}

.action-buttons {
  width: 100%;
  padding: 0px 20px 20px 20px;
}

.speech-bubble {
  position: relative;
  width: auto;
  max-width: 80%;
  padding: 10px 100px;
  margin: 50px auto;
  text-align: center;
  // background-color: #fff;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
  border-radius: 5px;
  border: 2px solid var(--v-missionAccent-base);
}

.speech-bubble:before,
.speech-bubble:after {
  content: "\0020";
  display: block;
  position: absolute;
  top: -10px;
  left: 20px;
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
.theme--light.v-data-table {
  background-color: transparent !important;
}
</style>
