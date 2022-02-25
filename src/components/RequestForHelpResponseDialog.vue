<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- HELP RESPONSE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="baseAccent" v-bind="attrs" v-on="on" outlined small>
              SUBMIT RESPONSE
              <!-- <v-icon color="missionAccent">mdi-hand-front-left-outline</v-icon> -->
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- DIALOG HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">SUBMIT RESPONSE</p>
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
                    asked the following question
                  </p>
                  <p class="dialog-description">
                    <i
                      >@
                      {{ getHumanDate(request.requestSubmittedTimestamp) }}</i
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
                      <td>{{ request.contextTask.title }}</td>
                    </tr>
                    <tr
                      class="dialog-context-description"
                      style="color: var(--v-missionAccent-base)"
                    >
                      <td>System:</td>
                      <td>{{ request.contextTopic.label }}</td>
                    </tr>
                    <tr
                      class="dialog-context-description"
                      style="color: var(--v-galaxyAccent-base)"
                    >
                      <td>Galaxy:</td>
                      <td>{{ request.contextCourse.title }}</td>
                    </tr>
                  </v-simple-table>
                </div>
              </div>
            </div>

            <!-- REQUEST INPUT FIELDS -->
            <div class="create-dialog-content">
              <p class="dialog-help-message speech-bubble">
                "{{ request.requestForHelpMessage }}"
              </p>

              <!-- Divider -->
              <div class="divider"></div>
              <!-- RESPONSE -->
              <p class="dialog-description">Enter your response:</p>
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
                color="baseAccent"
                @click="submitHelpResponse()"
                class="mr-2"
                :loading="loading"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon left> mdi-check </v-icon>
                SUBMIT RESPONSE
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
import { teacherRespondedToRequestForHelpXAPIStatement } from "../store/veracityLRS";

import { mapState, mapGetters } from "vuex";

export default {
  name: "RequestForHelpResponseDialog",
  props: ["request", "requesterPerson", "on", "attrs"],
  data: () => ({
    dialog: false,
    dialogDescription:
      "Write what you need help with, then submit, and your instructor will be notified to leave you a response.",
    requestForHelp: "",
    loading: false,
    deleting: false,
    response: "",
  }),
  mounted() {},
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
    submitHelpResponse() {
      this.loading = true;
      // Add response to request for help
      db.collection("courses")
        .doc(this.request.contextCourse.id)
        .collection("requestsForHelp")
        .doc(this.request.id)
        .update({
          responseMessage: this.response,
          requestForHelpStatus: "answered",
          responseSubmittedTimestamp: new Date(),
          responderPersonId: this.person.id,
        })
        .then(() => {
          console.log("Response successfully submitted for review!");

          // teacher assissted student
          teacherRespondedToRequestForHelpXAPIStatement(
            this.person.email,
            this.request.contextTask.id,
            {
              student: this.requesterPerson,
              galaxy: this.request.contextCourse,
              system: this.request.contextTopic,
              mission: this.request.contextTask,
            }
          );

          this.requestForHelp = "";
          this.loading = false;
          this.dialog = false;

          this.$emit(
            "snackbarToggle",
            "Response submitted to Mission for students to see."
          );

          // TODO: update requests. (to remove answered requests)
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
.speech-bubble p {
  // font-size: 1.25em;
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
