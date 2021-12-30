<template>
  <div class="mission-card">
    <div class="mission-section mission-number-section">
      <p class="text-overline text-uppercase">Mission</p>
      <p style="font-size: 50px; text-align: center">{{ index + 1 }}</p>
    </div>
    <div class="mission-section mission-main-section">
      <!-- TITLE -->
      <h1 class="mission-title">{{ task.title }}</h1>
      <!-- DESCRIPTION -->
      <p>{{ task.description }}</p>
      <!-- EDIT BUTTON -->
      <div v-if="person.accountType != 'student'">
        <CreateEditDeleteMissionDialog
          :edit="true"
          :taskToEdit="task"
          :index="index"
          :topicId="topicId"
        />
      </div>
    </div>
    <div class="mission-section mission-section-overUnder">
      <!-- VIDEO -->
      <div class="section-overUnder">
        <a
          v-if="task.video"
          :href="task.video"
          target="_blank"
          class="text-overline text-uppercase"
          >Video</a
        >
        <p v-else class="text-overline text-uppercase" style="color: #707070">
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
        <p v-else class="text-overline text-uppercase" style="color: #707070">
          Slides
        </p>
      </div>
    </div>
    <div class="mission-section">
      <!-- DURATION -->
      <p class="text-overline text-uppercase">Duration:</p>
      <p style="font-size: 30px; text-align: center">
        {{ task.duration }}
      </p>
    </div>

    <!-- COMPLETION -->
    <div
      v-if="person.accountType == 'student'"
      class="mission-section"
      :class="{
        'topic-in-review': getTopicStatus == 'inreview',
        'topic-completed': getTopicStatus == 'completed',
      }"
    >
      <p class="text-overline text-uppercase">
        {{
          getTopicStatus == "completed"
            ? "COMPLETED"
            : getTopicStatus == "inreview"
            ? "IN REVIEW"
            : "COMPLETED?"
        }}
      </p>
      <div class="d-flex align-center justify-center">
        <MissionCompletedDialog
          :task="task"
          :topicId="topicId"
          :missionStatus="getTopicStatus"
        />
      </div>
    </div>
    <div v-else class="mission-section">
      <p class="text-overline text-uppercase">Analytics:</p>
      <v-btn color="missionAccent" outlined> PREVIEW </v-btn>
      <v-btn color="missionAccent" outlined class="mt-2"> SEE FULL </v-btn>
    </div>

    <!-- Completed Dialog -->

    <!-- EDIT MISSION DIALOG-->
  </div>
</template>

<script>
import CreateEditDeleteMissionDialog from "../components/CreateEditDeleteMissionDialog";
import MissionCompletedDialog from "../components/MissionCompletedDialog";

import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "MissionsCard",
  components: {
    CreateEditDeleteMissionDialog,
    MissionCompletedDialog,
  },
  props: ["task", "index", "topicId"],
  mounted() {},
  computed: {
    ...mapState(["currentCourseId", "personsTopics"]),
    ...mapGetters(["person"]),
    getTopicStatus() {
      if (this.person.accountType != "student") {
        return;
      }
      // get topic status eg. inreview / completed / introduction / locked
      const topic = this.personsTopics.find(
        (topic) => topic.id === this.topicId
      );
      return topic.status;
    },
  },
  data() {
    return {
      editing: false,
    };
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

.mission-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;

  .mission-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    padding: 20px;
    flex-grow: 1;
  }

  .topic-in-review {
    border: 1px solid var(--v-cohortAccent-base);
    color: var(--v-cohortAccent-base);
  }

  .topic-completed {
    border: 1px solid var(--v-baseAccent-base);
    color: var(--v-baseAccent-base);
  }

  .mission-main-section {
    // flex-grow: 4 !important;
    width: 50%;
    position: relative;

    .mission-edit-button {
      // position: absolute;
      // bottom: 10px;
      // left: 10px;
      font-size: 0.7rem;
    }
  }

  .mission-title {
    font-size: 1.2rem;
    color: var(--v-missionAccent-base);
    font-weight: 600;
    text-transform: uppercase;
    margin: 5px 0px;
  }

  .mission-number-section {
    flex-grow: 0 !important;
    flex-shrink: 1 !important;
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
      border-bottom: 1px dashed var(--v-missionAccent-base);
    }
  }
}
</style>
