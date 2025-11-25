<template>
  <v-container class="pa-0">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <!-- OPTIONS DIALOG (opens first) -->
        <v-dialog
          v-model="optionsDialog"
          :width="isMobile ? '90%' : '40%'"
          light
          persistent
          style="z-index: 3000"
        >
          <!-- REQUEST HELP BUTTON (activator) -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="missionAccent ma-2" v-bind="attrs" v-on="on" x-large>
              <v-icon color="background">{{ mdiHandFrontLeftOutline }}</v-icon>
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                Need help with
                <strong
                  ><i>{{ task.title }}</i></strong
                >?
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">Choose who you'd like to get help from</p>
              </div>
            </div>

            <!-- OPTIONS CONTENT -->
            <div class="create-dialog-content">
              <div class="creation-options my-12">
                <!-- Ask the AI -->
                <div
                  class="creation-option galaxy-border"
                  @click.stop.prevent="handleAskAI"
                  :class="{ disabled: loading }"
                >
                  <div class="creation-option-icon">
                    <v-icon color="galaxyAccent" :class="{ 'loading-spin': loading }">{{
                      mdiHandFrontLeftOutline
                    }}</v-icon>
                    <v-icon color="galaxyAccent" :class="{ 'loading-spin': loading }">{{
                      mdiArrowRight
                    }}</v-icon>
                    <v-icon color="galaxyAccent" :class="{ 'loading-spin': loading }">{{
                      mdiRobotExcited
                    }}</v-icon>
                  </div>
                  <div class="creation-option-label galaxyAccent--text">Ask the AI</div>
                </div>

                <!-- Ask the Captain -->
                <div
                  class="creation-option base-border"
                  @click.stop.prevent="handleAskCaptain"
                  :class="{ disabled: loading }"
                >
                  <div class="creation-option-icon">
                    <v-icon color="baseAccent" :class="{ 'loading-spin': loading }">{{
                      mdiHandFrontLeftOutline
                    }}</v-icon>
                    <v-icon color="baseAccent" :class="{ 'loading-spin': loading }">{{
                      mdiArrowRight
                    }}</v-icon>
                    <v-avatar v-if="captain && captain.image && captain.image.url" size="40">
                      <v-img :src="captain.image.url"></v-img>
                    </v-avatar>
                    <p v-else>🧑‍✈️</p>
                  </div>
                  <div class="creation-option-label baseAccent--text">Ask the Captain</div>
                </div>
              </div>

              <!-- CANCEL BUTTON -->
              <div class="action-buttons">
                <div class="d-flex align-center justify-center">
                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    @click="cancelOptions"
                    class="ma-4"
                    :disabled="loading"
                    :dark="dark"
                    :light="!dark"
                  >
                    <v-icon left>{{ mdiClose }}</v-icon>
                    Cancel
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </v-dialog>

        <!-- EXISTING REQUEST-FOR-HELP DIALOG (opens when choosing Captain) -->
        <v-dialog
          v-model="dialog"
          :width="isMobile ? '90%' : '40%'"
          light
          persistent
          style="z-index: 3000"
        >
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
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">{{ dialogDescription }}</p>
              </div>
            </div>

            <!-- REQUEST INPUT FIELDS -->
            <div class="create-dialog-content">
              <v-textarea
                class="input-field mt-6"
                outlined
                :dark="dark"
                :light="!dark"
                v-model="requestForHelp"
                label="Enter your question"
                color="missionAccent"
                hide-details
              ></v-textarea>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons" :class="{ mobile: isMobile }">
              <v-btn
                outlined
                color="galaxyAccent"
                @click="submitRequestForHelp(requestForHelp)"
                :loading="loading"
                v-bind="attrs"
                v-on="on"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiCheck }} </v-icon>
                SUBMIT REQUEST FOR HELP
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                @click="cancel"
                :dark="dark"
                :light="!dark"
                :disabled="loading"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
                Cancel
              </v-btn>
            </div>
          </div>
        </v-dialog>

        <!-- AI Conversation Panels removed: panels are controlled by SolarSystemView -->
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {
  fetchCohortByCohortId,
  fetchCourseByCourseId,
  fetchTopicByCourseIdTopicId,
  fetchTaskByCourseIdTopicIdTaskId,
  fetchPersonByPersonId,
} from "@/lib/ff";
import { studentRequestForHelpXAPIStatement } from "@/lib/veracityLRS";
import { db, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import {
  mdiHandFrontLeftOutline,
  mdiInformationVariant,
  mdiCheck,
  mdiClose,
  mdiRobotExcited,
  mdiArrowRight,
} from "@mdi/js";
import { mapActions, mapState } from "pinia";
// Panels are mounted in SolarSystemView and controlled via store triggers

export default {
  name: "RequestHelpDialog",
  components: {},
  props: ["course", "topic", "task", "on", "attrs"],
  data: () => ({
    mdiHandFrontLeftOutline,
    mdiInformationVariant,
    mdiCheck,
    mdiClose,
    mdiRobotExcited,
    mdiArrowRight,
    optionsDialog: false,
    dialog: false,
    dialogDescription:
      "Write what you need help with, then submit, and your Captain will be notified to leave you a response.",
    requestForHelp: "",
    loading: false,
    deleting: false,
    cohort: null,
    captain: null,
    aiPanelOpen: false,
  }),
  async mounted() {
    // FIXME: this won't work if they load the solar system view directly without going
    // through the galaxy view, the currentCohortId could be incorrect or even null
    if (this.currentCohortId) {
      this.cohort = await fetchCohortByCohortId(this.currentCohortId);
    }

    // Fetch captain (mappedBy.personId) for avatar display if available
    try {
      if (this.course && this.course.mappedBy && this.course.mappedBy.personId) {
        this.captain = await fetchPersonByPersonId(this.course.mappedBy.personId);
      }
    } catch (e) {
      console.warn("Failed to fetch captain details:", e);
    }
  },
  watch: {
    course: {
      handler: async function (newVal) {
        try {
          if (newVal && newVal.mappedBy && newVal.mappedBy.personId) {
            this.captain = await fetchPersonByPersonId(newVal.mappedBy.personId);
          }
        } catch (e) {
          console.warn("Failed to fetch captain details on course change:", e);
        }
      },
      deep: true,
    },
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId", "person", "cohorts"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    currentCohort() {
      return this.cohorts.find((cohort) => cohort.id === this.currentCohortId);
    },
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar", "getCohortsByPersonId", "triggerAiAssistant"]),
    handleAskAI() {
      this.optionsDialog = false;
      // Trigger AI assistant via store; SolarSystemView will open the correct panel
      this.triggerAiAssistant("RequestHelpDialog");
    },
    handleAskCaptain() {
      this.optionsDialog = false;
      this.dialog = true;
    },
    cancelOptions() {
      this.optionsDialog = false;
    },
    async submitRequestForHelp(requestForHelp) {
      this.loading = true;
      try {
        // Add a new request for help to the "courses" db
        const docRef = await db
          .collection("courses")
          .doc(this.course.id)
          // .collection("topics")
          // .doc(this.topic.id)
          // .collection("tasks")
          // .doc(this.task.id)
          .collection("requestsForHelp")
          .add({
            // add request for help to database
            contextCourse: this.course,
            contextTopic: this.topic,
            contextTask: this.task,
            personId: this.person.id,
            requestForHelpMessage: this.requestForHelp,
            requestForHelpStatus: "unanswered",
            requestSubmittedTimestamp: new Date(),
          });
        await docRef.update({ id: docRef.id });
        console.log("Request for help add to the database!");
        // send xAPI statement to LRS
        await studentRequestForHelpXAPIStatement(this.person, this.task.id, {
          galaxy: this.course,
          system: this.topic,
          mission: this.task,
        });

        this.setSnackbar({
          show: true,
          text: "Request submitted. You will be notified when your Captain has responded.",
          color: "baseAccent",
        });

        if (this.currentCohort) {
          await Promise.all(
            this.currentCohort.teachers.map((teacherId) =>
              this.emailRequestToTeacher(teacherId, requestForHelp),
            ),
          );
        } else {
          // Filter cohorts that have this.person.id and this.course.id
          const relevantCohorts = this.cohorts.filter(
            (cohort) =>
              cohort.students?.includes(this.person.id) && cohort.courses?.includes(this.course.id),
          );

          if (relevantCohorts.length > 0) {
            const teacherIds = new Set();
            relevantCohorts.forEach((cohort) => {
              cohort.teachers?.forEach((teacherId) => teacherIds.add(teacherId));
            });

            await Promise.all(
              Array.from(teacherIds).map((teacherId) =>
                this.emailRequestToTeacher(teacherId, requestForHelp),
              ),
            );
          } else {
            console.warn("No relevant cohorts found for this student and course");
            this.setSnackbar({
              show: true,
              text: "Unable to notify teachers. Your request has been saved.",
              color: "warning",
            });
          }
        }

        this.requestForHelp = "";
        this.dialog = false;
      } catch (error) {
        console.error("Error submitting request for help: ", error);
        this.setSnackbar({
          show: true,
          text: "Error: " + error,
          color: "error",
        });
      } finally {
        this.loading = false;
      }
    },
    cancel() {
      this.dialog = false;
    },
    async emailRequestToTeacher(teacherId, request) {
      console.log("emailing request: ", request, " to teacher", teacherId);
      const teacher = await fetchPersonByPersonId(teacherId);
      const data = {
        course: this.course.title,
        topic: this.topic.label,
        task: this.task.title,
        student: this.person.firstName + " " + this.person.lastName,
        request: request,
        teacher: teacher.firstName + " " + teacher.lastName,
        email: teacher.email,
        studentEmail: this.person.email,
      };
      console.log("sending email to teacher: ", data);
      const sendRequestForHelp = functions.httpsCallable("sendRequestForHelp");
      try {
        const result = await sendRequestForHelp(data);
        console.log("Email sent successfully:", data);
      } catch (error) {
        console.error("Error sending email:", error);
        throw error; // Rethrow the error to be caught in the calling function
      }
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
      text-transform: none;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &.mobile {
    flex-direction: column;
  }
}

// Creation options styling (inspired by CreateGalaxyOptionsDialog)
.creation-options {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin: 20px 0;
  width: 100%;
}

.creation-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 30px;
  border: 2px solid var(--v-missionAccent-base);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 180px;
  background-color: var(--v-background-base);
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

.galaxy-border {
  border: 2px solid var(--v-galaxyAccent-base);
}

.base-border {
  border: 2px solid var(--v-baseAccent-base);
}

.creation-option-icon {
  font-size: 2.2rem;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  .v-icon {
    font-size: 2.2rem;
    color: var(--v-missionAccent-base);
  }
}

.creation-option-label {
  font-size: 1rem;
  text-transform: uppercase;
  color: var(--v-missionAccent-base);
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
