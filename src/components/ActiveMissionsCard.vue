<template>
  <div class="active-mission-card">
    <v-row>
      <div class="mission-card">
        <div
          class="mission-section mission-section-overUnder"
          style="width: 70%"
        >
          <!-- VIDEO -->
          <div class="section-overUnder">
            <a
              v-if="task.video"
              :href="task.video"
              target="_blank"
              class="text-overline text-uppercase"
              >Video</a
            >
            <p
              v-else
              class="text-overline text-uppercase"
              style="color: #707070"
            >
              Video
            </p>
          </div>
          <!-- SLIDES -->
          <div class="section-overUnder">
            <a
              v-if="task.slides"
              :href="task.slides"
              target="_blank"
              class="text-overline text-uppercase"
              >Slides</a
            >
            <p
              v-else
              class="text-overline text-uppercase"
              style="color: #707070"
            >
              Slides
            </p>
          </div>
        </div>

        <!-- SUBMIT WORK -->
        <!-- <div
          class="mission-section d-flex align-center justify-center flex-column"
        > -->
        <div
          class="mission-section mission-section-overUnder"
          style="width: 30%"
        >
          <!-- REQUEST HELP -->
          <div class="section-overUnder flex-column">
            <p class="text-overline text-uppercase text-center">REQUEST HELP</p>
            <RequestHelpDialog :task="task" :taskId="id" :topicId="topicId" />
          </div>
          <!-- MARK AS COMPLETED -->
          <div class="section-overUnder flex-column">
            <p class="text-overline text-uppercase text-center">
              {{ getSubmitTitle }}
            </p>
            <MissionCompletedDialog
              :task="task"
              :taskId="id"
              :topicId="topicId"
              :missionStatus="getTaskStatus"
            />
          </div>
        </div>
      </div>
    </v-row>
    <v-row> </v-row>
  </div>
</template>

<script>
import MissionCompletedDialog from "../components/MissionCompletedDialog";
import RequestHelpDialog from "../components/RequestHelpDialog";

import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "ActiveMissionsCard",
  components: {
    MissionCompletedDialog,
    RequestHelpDialog,
  },
  props: ["task", "id", "topicId"],
  mounted() {},
  computed: {
    ...mapState(["personsTopicsTasks"]),
    ...mapGetters(["person"]),
    getSubmitTitle() {
      if (this.getTaskStatus == "completed") {
        return "COMPLETED";
      } else if (this.getTaskStatus == "inreview") {
        return "IN REVIEW";
      } else if (
        this.getTaskStatus == "active" &&
        this.task.submissionRequired == true
      ) {
        return "SUBMIT WORK";
      } else if (
        this.getTaskStatus == "active" &&
        (this.task.submissionRequired == false || !this.task.submissionRequired)
      ) {
        return "MARK AS COMPLETED";
      } else {
        return;
      }
    },
    getTaskStatus() {
      if (this.teacher) return
      // get topic status eg. unlocked / inreview / completed / locked
      const task = this.personsTopicsTasks.find((task) => task.id === this.id);
      return task.taskStatus;
    },
  },
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

a {
  color: var(--v-missionAccent-base) !important;
}

.active-mission-card {
  border: 1px solid var(--v-baseAccent-base);
  margin: -21px 10px 20px 10px;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  z-index: 200;
  background-color: var(--v-background-base);
}

.mission-card {
  border: 1px solid var(--v-missionAccent-base);
  margin: 50px;
  display: flex;
  width: 100%;
  height: auto;

  .mission-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px solid var(--v-missionAccent-base);
    padding: 10px;
    flex-grow: 1;
  }
  .mission-section:first-child {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: none;
    padding: 20px;
    flex-grow: 1;
  }

  .mission-section-overUnder {
    padding: 0px !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .section-overUnder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 10px;
    }

    .section-overUnder:first-child {
      border-bottom: 1px solid var(--v-missionAccent-base);
    }
  }
}
</style>
