<template>
  <div
    class="mission-card"
    :class="{ lockedOpacity: getTaskStatus == 'locked' }"
  >
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
          :taskId="id"
          :index="index"
          :topicId="topicId"
        />
      </div>
    </div>

    <!-- <div class="mission-section mission-section-overUnder">
      
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
    </div> -->

    <div class="mission-section mission-section-overUnder">
      <!-- DURATION -->
      <div class="section-overUnder d-flex justify-center flex-column">
        <p class="text-overline text-uppercase text-center">Duration:</p>
        <!-- <p style="font-size: 30px; text-align: center"> -->
        <p class="text-center">
          {{ task.duration }}
        </p>
      </div>
      <div class="section-overUnder d-flex justify-center flex-column">
        <p class="text-overline text-uppercase text-center">SUBMISSION REQ:</p>
        <p :style="[task.submissionRequired ? { color: '#FAF200' } : '']">
          {{ task.submissionRequired ? "YES" : "NO" }}
        </p>
      </div>
    </div>

    <!-- MISSION STATUS -->
    <div
      v-if="person.accountType == 'student'"
      class="mission-section d-flex justify-center align-center flex-column"
      style="width: 20%"
      :class="{
        'topic-in-review': getTaskStatus == 'inreview',
        'topic-completed': getTaskStatus == 'completed',
        'topic-active': getTaskStatus == 'active',
      }"
    >
      <p class="text-overline text-uppercase text-center">
        {{
          getTaskStatus == "completed"
            ? "COMPLETED"
            : getTaskStatus == "inreview"
            ? "IN REVIEW"
            : getTaskStatus == "unlocked"
            ? "START MISSION"
            : getTaskStatus == "active"
            ? "ACTIVE MISSION"
            : "LOCKED"
        }}
      </p>

      <div v-if="getTaskStatus == 'unlocked'" class="d-flex justify-center">
        <!-- Start Mission button -->
        <StartMissionDialog :topicId="topicId" :taskId="id" :task="task" :topicActive="topicActive"/>
      </div>
      <div
        v-else-if="getTaskStatus == 'completed' || getTaskStatus == 'inreview'"
        class="d-flex justify-center"
      >
        <!-- Start Mission button -->
        <MissionCompletedDialog
          :topicId="topicId"
          :taskId="id"
          :task="task"
          :missionStatus="getTaskStatus"
          @missionActivated="$emit('missionActivated')"
        />
      </div>
      <div v-else-if="getTaskStatus == 'active'" class="d-flex justify-center">
        <!-- no icon -->
      </div>

      <div v-else class="d-flex justify-center align-center">
        <v-btn color="missionAccent" icon large>
          <v-icon large>mdi-lock-outline</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- ANALYTICS (for type teacher) -->
    <div v-else class="mission-section">
      <p class="text-overline text-uppercase text-center">Analytics:</p>
      <div class="d-flex justify-center flex-column mt-2">
        <v-btn color="missionAccent" outlined x-small> OVERVIEW </v-btn>
        <v-btn color="missionAccent" outlined class="mt-2" x-small>
          SEE FULL
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import CreateEditDeleteMissionDialog from "../components/CreateEditDeleteMissionDialog";
import StartMissionDialog from "../components/StartMissionDialog";
import MissionCompletedDialog from "../components/MissionCompletedDialog";

import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "MissionsCard",
  components: {
    CreateEditDeleteMissionDialog,
    StartMissionDialog,
    MissionCompletedDialog,
  },
  props: ["task", "id", "index", "topicId", "topicActive"],
  mounted() {},
  computed: {
    ...mapState([
      "currentCourseId",
      "personsTopics",
      "topicsTasks",
      "personsTopicsTasks",
    ]),
    ...mapGetters(["person"]),
    getTaskStatus() {
      if (this.person.accountType != "student") {
        return;
      }
      // get topic status eg. unlocked / inreview / completed / locked
      const task = this.personsTopicsTasks.find((task) => task.id === this.id);
      return task.taskStatus;
    },
  },
  data() {
    return {
      editing: false,
      activeTask: false,
      panel: [],
    };
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

a {
  color: var(--v-missionAccent-base) !important;
}

.lockedOpacity {
  opacity: 0.4;
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

  .topic-completed,
  .topic-active {
    border: 1px solid var(--v-baseAccent-base);
    color: var(--v-baseAccent-base);
  }

  // .topic-active {
  //   border-top: 1px solid var(--v-baseAccent-base);
  //   border-right: 1px solid var(--v-baseAccent-base);
  //   border-left: 1px solid var(--v-baseAccent-base);
  //   border-bottom: 3px solid var(--v-background-base);
  //   color: var(--v-baseAccent-base);
  //   z-index: 101;
  // }

  .mission-main-section {
    // flex-grow: 4 !important;
    width: 40%;
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

.active-mission-card {
  border: 1px solid var(--v-baseAccent-base);
  margin: 20px 10px;
  display: flex;
}
</style>
