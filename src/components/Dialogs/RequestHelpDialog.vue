<template>
  <v-container class="pa-0">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- REQUEST HELP BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="missionAccent ma-2" v-bind="attrs" v-on="on" x-large>
              <v-icon color="background">{{ mdiHandFrontLeftOutline }}</v-icon>
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
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">{{ dialogDescription }}</p>
              </div>
            </div>

            <!-- REQUEST INPUT FIELDS -->
            <div class="create-dialog-content">
              <!-- TITLE -->
              <!-- <p class="dialog-description">Enter your question:</p> -->
              <v-textarea
                class="input-field mt-6"
                outlined
                :dark="dark"
                :light="!dark"
                v-model="requestForHelp"
                label="Enter your question"
                color="missionAccent"
              ></v-textarea>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- SUBMIT REQUEST FOR HELP -->
              <v-btn
                outlined
                color="baseAccent"
                @click="submitRequestForHelp(requestForHelp)"
                class="mr-2"
                :loading="loading"
                v-bind="attrs"
                v-on="on"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiCheck }} </v-icon>
                SUBMIT REQUEST FOR HELP
              </v-btn>

              <!-- CANCEL -->
              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-2"
                @click="cancel"
                :dark="dark"
                :light="!dark"
                :disabled="loading"
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
import { mdiHandFrontLeftOutline, mdiInformationVariant, mdiCheck, mdiClose } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "RequestHelpDialog",
  props: ["course", "topic", "task", "on", "attrs"],
  data: () => ({
    mdiHandFrontLeftOutline,
    mdiInformationVariant,
    mdiCheck,
    mdiClose,
    dialog: false,
    dialogDescription:
      "Write what you need help with, then submit, and your Captain will be notified to leave you a response.",
    requestForHelp: "",
    loading: false,
    deleting: false,
    cohort: null,
  }),
  async mounted() {
    // FIXME: this won't work if they load the solar system view directly without going
    // through the galaxy view, the currentCohortId could be incorrect or even null
    if (this.currentCohortId) {
      this.cohort = await fetchCohortByCohortId(this.currentCohortId);
    }
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId", "person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
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
        console.log("Request for help successfully submitted to instructor!");
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

        if (this.cohort != null) {
          await Promise.all(
            this.cohort.teachers.map((teacherId) =>
              this.emailRequestToTeacher(teacherId, requestForHelp),
            ),
          );
        }

        this.requestForHelp = "";
        this.loading = false;
        this.dialog = false;
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
      this.dialog = false;
    },
    async emailRequestToTeacher(teacherId, request) {
      const teacher = await fetchPersonByPersonId(teacherId);
      const data = {
        course: this.course.title,
        topic: this.topic.label,
        task: this.task.title,
        student: this.person.firstName + " " + this.person.lastName,
        request: request,
        teacher: teacher.firstName + " " + teacher.lastName,
        email: teacher.email,
      };
      const sendRequestForHelp = functions.httpsCallable("sendRequestForHelp");
      return sendRequestForHelp(data);
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
}
</style>
