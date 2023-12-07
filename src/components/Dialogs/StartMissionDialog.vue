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
              <v-icon x-large>{{ mdiPlay }}</v-icon>
            </v-btn>
          </template>

          <!-- DIALOG CONTENT -->
          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">ARE YOU SURE YOU WANT TO START MISSION?</p>
              <div v-if="task.duration" class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  This mission is estmated to take
                  <strong
                    ><i>{{ task.duration ? task.duration : "UKNOWN" }} minutes</i></strong
                  >
                  to complete. <br />Your time to complete this mission will begin once you click
                  'start mission'
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
                  <v-icon left> {{ mdiCheck }} </v-icon>
                  YES, START MISSION
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
import { fetchCourseByCourseId, fetchTopicByCourseIdTopicId } from "@/lib/ff";
import { startTaskXAPIStatement, startTopicXAPIStatement } from "@/lib/veracityLRS";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiPlay, mdiInformationVariant, mdiCheck, mdiClose } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "StartMissionDialog",
  props: ["task", "topicId", "on", "attrs", "topicActive"],
  data: () => ({
    mdiPlay,
    mdiInformationVariant,
    mdiCheck,
    mdiClose,
    dialog: false,
    loading: false,
    currentCourse: null,
    currentTopic: null,
  }),
  computed: {
    ...mapState(useRootStore, ["currentCourseId", "currentTopicId", "person"]),
  },
  async mounted() {
    this.currentCourse = await fetchCourseByCourseId(this.currentCourseId);
    this.currentTopic = await fetchTopicByCourseIdTopicId(
      this.currentCourseId,
      this.currentTopicId,
    );
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentTaskId"]),
    async startMission() {
      this.loading = true;

      // set as current/active task
      this.setCurrentTaskId(this.task.id);

      const topic = db
        .collection("people")
        .doc(this.person.id)
        .collection(this.currentCourse.id)
        .doc(this.topicId);

      // update taskStatus to active
      await topic.collection("tasks").doc(this.task.id).update({
        taskStatus: "active",
        taskStartedTimestamp: new Date(),
      });

      if (!this.topicActive) {
        await topic.update({
          topicStatus: "active",
          topicStartedTimeStamp: new Date(),
        });
      }

      console.log("Topic status successfully written as Active!");
      if (!this.topicActive) {
        await startTopicXAPIStatement(this.person, {
          galaxy: this.currentCourse,
          system: this.currentTopic,
        });
      }

      console.log("Task status successfully written as Active!");
      await startTaskXAPIStatement(this.person, this.task.id, {
        galaxy: this.currentCourse,
        system: this.currentTopic,
        mission: this.task,
      });

      this.loading = false;
      this.dialog = false;
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
