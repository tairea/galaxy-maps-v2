<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- HELP RESPONSE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="baseAccent" v-bind="attrs" v-on="on" outlined small>
              SUBMIT RESPONSE
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- DIALOG HEADER -->
            <div class="dialog-header">
              <p class="dialog-title mb-0">SUBMIT RESPONSE</p>
            </div>
            <div class="create-dialog-content">
              <!-- Request for help details -->
              <div class="request-details">
                <!-- Context details -->
                <v-row>
                  <div class="request-details-context">
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
                          {{ request.contextCourse.title }}
                        </td>
                        <td width="50px" class="text-center">></td>
                        <td class="d-flex flex-start" style="font-weight: 800">System:</td>
                        <td>{{ request.contextTopic.label }}</td>
                        <td width="50px" class="text-center">></td>
                        <td class="d-flex flex-start" style="font-weight: 800">MISSION:</td>
                        <td class="pl-2">{{ request.contextTask.title }}</td>
                      </tr>
                    </v-simple-table>
                  </div>
                </v-row>
              </div>
              <div class="requester-info">
                <v-row>
                  <div class="requester-image justify-center align-center">
                    <v-avatar v-if="requesterPerson" size="30" style="background-color: grey">
                      <img
                        v-if="requesterPerson.image"
                        :src="requesterPerson.image.url"
                        :alt="requesterPerson.firstName"
                        style="object-fit: cover"
                      />
                      <v-icon :dark="dark" :light="!dark" v-else>{{ mdiAccount }}</v-icon>
                    </v-avatar>
                  </div>
                  <!-- Message -->
                  <div>
                    <p class="dialog-description pa-1">
                      <span style="font-size: 0.8rem; font-weight: 800"
                        ><i>{{
                          requesterPerson.firstName + " " + requesterPerson.lastName
                        }}</i></span
                      >
                      <i>@ {{ getHumanDate(request.requestSubmittedTimestamp) }}</i>
                    </p>
                  </div>
                </v-row>
              </div>
              <!-- REQUEST INPUT FIELDS -->
              <p class="dialog-help-message speech-bubble">
                <!-- Avatar -->

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
                <v-icon left> {{ mdiCheck }} </v-icon>
                SUBMIT RESPONSE
              </v-btn>

              <!-- CANCEL -->
              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-2"
                @click="cancel"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
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
import { db, functions } from "@/store/firestoreConfig";
import {
  fetchCourseByCourseId,
  fetchTaskByCourseIdTopicIdTaskId,
  fetchTopicByCourseIdTopicId,
} from "@/lib/ff";
import { teacherRespondedToRequestForHelpXAPIStatement } from "@/lib/veracityLRS";
import useRootStore from "@/store/index";
import { mdiAccount, mdiCheck, mdiClose } from "@mdi/js";
import moment from "moment";
import { mapActions, mapState } from "pinia";

export default {
  name: "RequestForHelpResponseDialog",
  props: ["request", "requesterPerson", "on", "attrs"],
  data: () => ({
    mdiAccount,
    mdiCheck,
    mdiClose,
    dialog: false,
    dialogDescription:
      "Write what you need help with, then submit, and your instructor will be notified to leave you a response.",
    requestForHelp: "",
    loading: false,
    deleting: false,
    response: "",
    currentCourse: null,
    currentTopic: null,
    currentTask: null,
  }),
  async mounted() {
    this.currentCourse = await fetchCourseByCourseId(this.currentCourseId);
    this.currentTopic = await fetchTopicByCourseIdTopicId(
      this.currentCourseId,
      this.currentTopicId,
    );
    this.currentTask = await fetchTaskByCourseIdTopicIdTaskId(
      this.currentCourseId,
      this.currentTopicId,
      this.currentTaskId,
    );
  },
  computed: {
    ...mapState(useRootStore, ["currentCourseId", "currentTopicId", "currentTaskId", "person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    getHumanDate(ts) {
      return moment((ts.seconds ? ts.seconds : ts._seconds) * 1000).format("llll"); //format = Mon, Jun 9 2014 9:32 PM
    },
    async submitHelpResponse() {
      console.log("updating request: ", this.request);
      this.loading = true;
      // Add response to request for help
      try {
        await db
          .collection("courses")
          .doc(this.request.contextCourse.id)
          .collection("requestsForHelp")
          .doc(this.request.id)
          .update({
            responseMessage: this.response,
            requestForHelpStatus: "answered",
            responseSubmittedTimestamp: new Date(),
            responderPersonId: this.person.id,
          });

        await this.emailResponseToStudent(this.requesterPerson, this.response);

        console.log("Response successfully submitted for review!");

        // teacher assisted student
        await teacherRespondedToRequestForHelpXAPIStatement(
          this.person,
          this.request.contextTask.id,
          {
            student: this.requesterPerson,
            galaxy: this.request.contextCourse,
            system: this.request.contextTopic,
            mission: this.request.contextTask,
          },
        );

        this.requestForHelp = "";
        this.loading = false;
        this.dialog = false;
        this.setSnackbar({
          show: true,
          text: "Response sent to student",
          color: "baseAccent",
        });

        // TODO: update requests. (to remove answered requests)
      } catch (error) {
        console.error("Error writing document: ", error);
        this.setSnackbar({
          show: true,
          text: "Error: " + error,
          color: "pink",
        });
      }
    },
    cancel() {
      this.loading = false;
      this.dialog = false;
    },
    async emailResponseToStudent(student, response) {
      const data = {
        course: this.currentCourse.title,
        topic: this.currentTopic.label,
        task: this.currentTask.title,
        student: student.firstName + " " + student.lastName,
        response: response,
        request: this.request.requestForHelpMessage,
        teacher: this.person.firstName + " " + this.person.lastName,
        email: student.email,
      };
      console.log("email data: ", data);
      const sendResponseToHelp = functions.httpsCallable("sendResponseToHelp");
      return sendResponseToHelp(data);
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

    .dialog-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
    }

    .request-details {
      width: 100%;

      .requester-image {
        width: 10%;
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
    font-size: 0.7rem;
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
  padding: 10px;
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

.requester-info {
  position: relative;
  top: 25px;
  left: 70px;
  margin-top: 40px;
}
</style>
