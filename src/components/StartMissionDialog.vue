<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- COMPLETED BUTTON (looks like checkbox) -->
          <template v-slot:activator="{ on, attrs }">
            <!-- uncheck icon if not inreview or completed -->
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button"
              color="missionAccent"
              outlined
              large
            >
              <v-icon x-large>mdi-play</v-icon>
            </v-btn>
          </template>

          <!-- DIALOG CONTENT -->
          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                ARE YOU SURE YOU WANT TO START MISSION?
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">
                  This mission is estmated to take
                  <strong
                    ><i
                      >{{ task.duration ? task.duration : "UKNOWN" }} minutes</i
                    ></strong
                  >
                  to complete. Your time to complete this mission will begin
                  once you click 'start mission'
                </p>
              </div>
            </div>

            <div class="submission-create-dialog">
              <!-- ACTION BUTTONS -->
              <div class="action-buttons">
                <v-btn
                  outlined
                  color="baseAccent"
                  @click="startMission()"
                  class="mr-2"
                  :loading="loading"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon left> mdi-check </v-icon>
                  YES, START MISSION
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
          </div>
          <!-- End create-dialog -->
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import firebase from "firebase/app";

import { db } from "../store/firestoreConfig";
import { startTaskXAPIStatement } from "../lib/veracityLRS";

import { mapState, mapGetters } from "vuex";

export default {
  name: "StartMissionDialog",
  props: ["task", "topicId", "on", "attrs"],
  data: () => ({
    dialog: false,
    loading: false,
  }),
  mounted() {},
  computed: {
    ...mapState(["currentCourse", "currentTopic", "currentTask"]),
    ...mapGetters(["person"]),
  },
  methods: {
    startMission() {
      this.loading = true;

      // set as current/active task
      this.$store.commit("setCurrentTaskId", this.task.id);
      this.$store.commit("setCurrentTask", this.task);

      // update taskStatus to active
      db.collection("people")
        .doc(this.person.id)
        .collection(this.currentCourse.id)
        .doc(this.topicId)
        .collection("tasks")
        .doc(this.task.id)
        .update({
          taskStatus: "active",
          taskStartedTimestamp: new Date(),
        })
        .then(() => {
          console.log("Task status successfully written as Active!");
          startTaskXAPIStatement(this.person, this.currentTask.id, {
            galaxy: this.currentCourse,
            system: this.currentTopic,
            mission: this.currentTask,
          });
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
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

.action-buttons {
  width: 100%;
  padding: 20px;
}
</style>
