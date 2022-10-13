<template>
  <div class="selected-mission-card">
    <div v-html="task.description" class="task-description pa-2"></div>
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
      <div class="completedContainer">
        <!-- COMPLETED -->

        <div class="text-center completed">
          <p
            class="text-overline text-uppercase"
            :class="{
              'mission-in-review': inreview,
              'mission-completed': completed,
            }"
          >
            {{
              completed
                ? "MISSION COMPLETED"
                : inreview
                ? "SUBMISSION IN REVIEW"
                : "LOCKED"
            }}
          </p>
          <p class="text-overline text-uppercase">
            {{ getStatusAndTimestamp }}
          </p>
        </div>
      </div>
    </v-row>
  </div>
</template>

<script>
import { DateTime } from "luxon";

export default {
  name: "SelectedMissionsCard",
  props: ["task", "inreview", "completed"],
  computed: {
    getStatusAndTimestamp() {
      if (this.completed && this.task.submissionRequired) {
        return (
          "MARKED COMPLETED: " +
          this.humanDate(this.task.taskReviewedAndCompletedTimestamp)
        );
      } else if (this.completed && !this.task.submissionRequired) {
        return "COMPLETED: " + this.humanDate(this.task.taskCompletedTimestamp);
      } else if (this.inreview) {
        return (
          "SUBMITTED: " +
          this.humanDate(this.task.taskSubmittedForReviewTimestamp)
        );
      } else {
        return "LOCKED";
      }
    },
  },
  methods: {
    humanDate(timestamp) {
      return new DateTime.fromSeconds(timestamp.seconds).toFormat(
        "ccc dd LLL t"
      );
    },
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

.selected-mission-card {
  border: 1px solid var(--v-missionAccent-base);
  margin: -21px 10px 0px 10px;
  display: flex;
  flex-direction: column;
  z-index: 200;
  background-color: var(--v-background-base);

  .task-description {
    color: var(--v-missionAccent-base);
    margin: 20px;
  }

  .supporting-materials {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    margin-bottom: 20px;

    .resource-button {
      text-transform: uppercase;
      border: 1px solid var(--v-missionAccent-base);
      margin-bottom: 10px;
      width: 25%;
      text-align: center;
      text-decoration: none;
    }
  }

  .completedContainer {
    display: flex;
    width: 100%;
    color: var(--v-missionAccent-base);
    justify-content: center;
    align-items: center;

    .completed {
      padding: 20px;
      width: 50%;
      border: 1px solid var(--v-missionAccent-base);
    }
  }
}

// .mission-card {
//   border: 1px solid var(--v-missionAccent-base);
//   margin: 50px;
//   display: flex;
//   width: 100%;
//   height: auto;

//   .mission-section {
//     margin: 0px;
//     color: var(--v-missionAccent-base);
//     font-size: 0.9rem;
//     border-left: 1px solid var(--v-missionAccent-base);
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
//     // align-items: center;

//     .section-overUnder {
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//       align-items: center;
//       width: 100%;
//       height: 50%;
//       padding: 10px;
//     }

//     .section-overUnder:first-child {
//       border-bottom: 1px solid var(--v-missionAccent-base);
//     }
//   }
// }

.mission-in-review {
  color: var(--v-cohortAccent-base);
}
.mission-completed {
  color: var(--v-baseAccent-base);
}
</style>
