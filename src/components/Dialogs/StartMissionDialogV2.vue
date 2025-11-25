<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-btn
          v-bind="attrs"
          v-on="on"
          class="mission-edit-button"
          color="missionAccent"
          outlined
          large
          @click="startMission()"
          :loading="startMissionLoading"
        >
          <v-icon x-large>{{ mdiPlay }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { startMission } from "@/lib/ff";
import useRootStore from "@/store/index";
import { mdiPlay, mdiInformationVariant, mdiCheck, mdiClose } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  // V2 of the start mission button bypasses the start popup dialog and just starts the mission
  name: "StartMissionDialogV2",
  props: ["course", "topic", "task", "on", "attrs", "topicActive"],
  data: () => ({
    mdiPlay,
    mdiInformationVariant,
    mdiCheck,
    mdiClose,
    dialog: false,
    loading: false,
  }),
  computed: {
    ...mapState(useRootStore, ["person", "startMissionLoading"]),
  },
  async mounted() {},
  methods: {
    ...mapActions(useRootStore, ["setCurrentTaskId", "setStartMissionLoading"]),
    async startMission() {
      try {
        this.setStartMissionLoading(true);

        // set as current/active task
        this.setCurrentTaskId(this.task.id);

        // Call the cloud function to start the mission
        await startMission(this.course.id, this.topic.id, this.task.id, this.topicActive);

        console.log("Mission started successfully!");
        this.$emit("missionStarted");
      } catch (error) {
        console.error("Error starting mission:", error);
      } finally {
        this.loading = false;
        // this.setStartMissionLoading(false);
        this.dialog = false;
      }
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
