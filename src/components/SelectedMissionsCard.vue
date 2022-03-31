<template>
  <div class="selected-mission-card">
    <v-row>
      <div class="mission-card">
        <div
          class="mission-section mission-section-overUnder"
          style="width: 50%"
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
          style="width: 50%"
        >
          <!-- COMPLETED -->

          <div class="text-center">
            <p
              class="text-overline text-uppercase"
              :class="{
                'mission-in-review': getTaskStatus == 'inreview',
                'mission-completed': getTaskStatus == 'completed',
              }"
            >
              {{
                getTaskStatus == "completed"
                  ? "MISSION COMPLETED"
                  : getTaskStatus == "inreview"
                  ? "SUBMISSION IN REVIEW"
                  : getTaskStatus == "declined"
                  ? "SUBMISSION DECLINED"
                  : "LOCKED"
              }}
            </p>
            <p class="text-overline text-uppercase">
              {{ getStatusAndTimestamp }}
            </p>
          </div>
          <!-- View submission -->
          <!-- <div v-if="task.submissionLink" class="section-overUnder">
            <a
              style="text-decoration: none"
              :href="task.submissionLink"
              target="_blank"
            >
              <v-btn outlined color="cohortAccent" class="" small>
                <v-icon left> mdi-text-box-search-outline </v-icon>
                VIEW SUBMISSION
              </v-btn>
            </a>
          </div> -->
        </div>
      </div>
    </v-row>
    <v-row> </v-row>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { DateTime } from "luxon";

export default {
  name: "SelectedMissionsCard",
  components: {},
  props: ["task"],
  mounted() {},
  computed: {
    ...mapState(["personsTopicsTasks"]),
    getTaskStatus() {
      // get topic status eg. unlocked / inreview / completed / locked
      const task = this.personsTopicsTasks.find(
        (task) => task.id === this.task.id
      );
      return task.taskStatus;
    },
    getStatusAndTimestamp() {
      if (this.getTaskStatus == "completed" && this.task.submissionRequired) {
        return (
          "MARKED COMPLETED: " +
          this.humanDate(this.task.taskReviewedAndCompletedTimestamp)
        );
      } else if (
        this.getTaskStatus == "completed" &&
        !this.task.submissionRequired
      ) {
        return "COMPLETED: " + this.humanDate(this.task.taskCompletedTimestamp);
      } else if (this.getTaskStatus == "inreview") {
        return (
          "SUBMITTED: " +
          this.humanDate(this.task.taskSubmittedForReviewTimestamp)
        );
      } else if (this.getTaskStatus == "declined") {
        return `SUBMITTED: ${this.humanDate(
          this.task.taskSubmittedForReviewTimestamp
        )} 
        DECLINED: ${this.humanDate(this.task.submissionDeclinedTimestamp)}`;
      } else {
        return "LOCKED";
      }
    },
  },
  data() {
    return {};
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
    // align-items: center;

    .section-overUnder {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 50%;
      padding: 10px;
    }

    .section-overUnder:first-child {
      border-bottom: 1px solid var(--v-missionAccent-base);
    }
  }
}

.mission-in-review {
  color: var(--v-cohortAccent-base);
}
.mission-completed {
  color: var(--v-baseAccent-base);
}
</style>
