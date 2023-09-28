<template>
  <v-container class="pa-0">
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- REQUEST HELP BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="missionAccent" v-bind="attrs" v-on="on" icon x-large>
              <v-icon color="missionAccent">{{ mdiHandFrontLeftOutline }}</v-icon>
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
import { fetchCohortById } from "@/lib/ff";
import { studentRequestForHelpXAPIStatement } from "@/lib/veracityLRS";
import { dbMixins } from "@/mixins/DbMixins";
import { db, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiHandFrontLeftOutline, mdiInformationVariant, mdiCheck, mdiClose } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "RequestHelpDialog",
  mixins: [dbMixins],
  props: ["topicId", "taskId", "task", "on", "attrs"],
  data: () => ({
    mdiHandFrontLeftOutline,
    mdiInformationVariant,
    mdiCheck,
    mdiClose,
    dialog: false,
    dialogDescription:
      "Write what you need help with, then submit, and your instructor will be notified to leave you a response.",
    requestForHelp: "",
    loading: false,
    deleting: false,
    cohort: null,
  }),
  async mounted() {
    this.cohort = await fetchCohortById(this.currentCohortId);
  },
  computed: {
    ...mapState(useRootStore, [
      "currentCourse",
      "currentTopic",
      "currentTask",
      "currentCohortId",
      "person",
    ]),
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
          });
        await docRef.update({ id: docRef.id });
        console.log("Request for help successfully submitted to instructor!");
        // send xAPI statement to LRS
        await studentRequestForHelpXAPIStatement(this.person, this.currentTask.id, {
          galaxy: this.currentCourse,
          system: this.currentTopic,
          mission: this.currentTask,
        });

        this.setSnackbar({
          show: true,
          text: "Request submitted. You will be notified when your instructor has responded.",
          color: "baseAccent",
        });

        if (this.cohort != null) {
          await Promise.all(
            this.cohort.teachers.map((teacherId) =>
              this.emailRequestToTeacher(teacherId, requestForHelp),
            ),
          );
        }

        // await this.bindRequestsForHelp({
        //   courseId: this.currentCourse.id,
        //   topicId: this.currentTopic.id,
        //   taskId: this.currentTask.id,
        // });
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
      const teacher = await this.MXgetPersonByIdFromDB(teacherId);
      const data = {
        course: this.currentCourse.title,
        topic: this.currentTopic.label,
        task: this.currentTask.title,
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
