<template>
  <div class="active-mission-card">
    <div v-html="task.description" class="task-description"></div>
    <v-row class="pb-8">
      <div v-if="task.video || task.slides" class="supporting-materials">
        <p class="text-overline missionAccent--text">Supporting Materials</p>
        <!-- VIDEO -->
        <a
          v-if="task.video"
          :href="task.video"
          target="_blank"
          class="resource-button text-overline"
          >Video</a
        >
        <!-- SLIDES -->
        <a
          v-if="task.slides"
          :href="task.slides"
          target="_blank"
          class="resource-button text-overline"
          >Slides</a
        >
      </div>

      <!-- REQUEST HELP -->
      <div class="mission-actions">
        <div class="action-button">
          <p class="text-overline text-uppercase text-center" style="line-height: 1rem">
            REQUEST HELP
          </p>
          <RequestHelpDialog :course="course" :topic="topic" :task="task" :taskId="task.id" />
        </div>

        <!-- MARK AS COMPLETED -->
        <div class="action-button">
          <p class="text-overline text-uppercase text-center" style="line-height: 1rem">
            {{ getSubmitTitle }}
          </p>
          <MissionCompletedDialog
            :course="course"
            :topic="topic"
            :task="task"
            :active="active"
            :declined="declined"
            @missionSubmittedForReview="$emit('missionSubmittedForReview')"
            @missionCompleted="$emit('missionCompleted')"
          />
        </div>
      </div>
    </v-row>
  </div>
</template>

<script>
import MissionCompletedDialog from "@/components/Dialogs/MissionCompletedDialog.vue";
import RequestHelpDialog from "@/components/Dialogs/RequestHelpDialog.vue";
import useRootStore from "@/store/index";
import { mapState } from "pinia";

export default {
  name: "ActiveMissionsCard",
  components: {
    MissionCompletedDialog,
    RequestHelpDialog,
  },
  props: ["course", "topic", "task", "active", "declined", "inreview", "completed"],
  computed: {
    ...mapState(useRootStore, ["courseSubmissions", "person"]),
    getSubmitTitle() {
      if (this.active && this.task.submissionRequired == true) {
        return "SUBMIT WORK";
      } else if (this.declined && this.task.submissionRequired == true) {
        return "RESUBMIT WORK";
      } else if (
        this.active &&
        (this.task.submissionRequired == false || !this.task.submissionRequired)
      ) {
        return "MARK AS COMPLETED";
      } else {
        return;
      }
    },
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

.active-mission-card {
  border: 1px solid var(--v-galaxyAccent-base);
  margin: -21px 10px 0px 10px;
  display: flex;
  flex-direction: column;
  // min-height: 300px;
  z-index: 200;
  background-color: var(--v-background-base);

  .task-description {
    color: var(--v-missionAccent-base);
    padding: 20px;
  }

  .supporting-materials {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .resource-button {
      text-transform: uppercase;
      border: 1px solid var(--v-missionAccent-base);
      margin-bottom: 10px;
      width: 25%;
      text-align: center;
      text-decoration: none;
    }
  }

  .mission-actions {
    display: flex;
    width: 100%;
    color: var(--v-missionAccent-base);
    margin-top: 20px;

    .action-button {
      width: 50%;
    }
  }

  // background-image: repeating-linear-gradient(
  //   45deg,
  //   var(--v-baseAccent-base) 10px,
  //   var(--v-baseAccent-base) 12px,
  //   transparent 12px,
  //   transparent 20px
  // );
}

// .mission-card {
//   border: 1px solid var(--v-missionAccent-base);
//   margin: 50px;
//   display: flex;
//   width: 100%;
//   height: auto;
//   background-color: var(--v-background-base);

//   .mission-section {
//     margin: 0px;
//     color: var(--v-missionAccent-base);
//     font-size: 0.9rem;
//     border-left: 1px solid var(--v-missionAccent-base);
//     padding: 10px;
//     flex-grow: 1;
//   }
//   .mission-section:first-child {
//     margin: 0px;
//     color: var(--v-missionAccent-base);
//     font-size: 0.9rem;
//     border-left: none;
//     padding: 20px;
//     flex-grow: 1;
//   }

//   .mission-section-overUnder {
//     padding: 0px !important;
//     display: flex;
//     flex-direction: column;
//     justify-content: center;
//     align-items: center;

//     .section-overUnder {
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       width: 100%;
//       height: 100%;
//       padding: 10px;
//     }

//     .section-overUnder:first-child {
//       border-bottom: 1px solid var(--v-missionAccent-base);
//     }
//   }
// }
</style>
