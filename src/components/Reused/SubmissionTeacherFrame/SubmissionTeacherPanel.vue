<template>
  <div class="submission-card" :class="styleByStatus">
    <v-expansion-panels flat v-model="showCard">
      <v-expansion-panel
        v-for="(sub, i) in [submission]"
        :key="i"
        class="panel"
        @change="panelChange()"
      >
        <v-expansion-panel-header ref="panel" class="pa-0">
          <div class="d-flex flex-row">
            <div v-if="showCourseImage">
              <Course :course="submission.contextCourse" class="pa-0" />
            </div>
            <div v-else>
              <Avatar
                v-if="isDashboardView"
                :profile="courseContextProfile"
                size="30"
                :colourBorder="true"
              />
              <Avatar
                v-if="requesterPerson"
                :profile="requesterPerson"
                size="30"
                :colourBorder="true"
                :class="isDashboardView ? 'request-image' : ''"
              />
            </div>
            <div class="submission-time d-flex flex-column align-center ml-auto pl-1">
              <span v-if="reviewed" class="ml-auto mt-1 status-text baseAccent--text">
                {{ submission.taskSubmissionStatus.toUpperCase() }}</span
              >
              <span v-else class="ml-auto mt-1 status-text text-uppercase">...awaiting review</span>
              {{ getHumanDate(submission.taskSubmittedForReviewTimestamp) }}
            </div>
          </div>

          <!-- Course/Topic/Task -->
          <div class="submission-context">
            <p class="submission-context-task">
              {{ submission.contextTask.title }}
            </p>
            <p class="submission-context-topic">
              {{ submission.contextTopic.label }}
            </p>
            <p class="submission-context-course">
              {{ submission.contextCourse.title }}
            </p>
          </div>
          <template v-slot:actions>
            <v-icon color="missionAccent"> </v-icon>
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="panel-content">
          <!-- <div
              class="d-flex flex-column"
            >
              <p class="instructions-label text-end">Instructions</p>
              <p class="instructions-text" v-html="submission.contextTask.submissionInstructions"></p>
              <div class="divider"></div>
              <p class="submission-label text-end">Submission</p>
              <p class="submission-text" v-html="submission.submissionLink"></p>
            </div> -->
          <template>
            <div class="divider"></div>
            <div class="text-center">
              <SubmissionReviewDialog
                :submission="submission"
                :requesterPerson="requesterPerson"
                :isTeacher="isTeacher"
                :reviewed="reviewed"
              />
            </div>
          </template>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import Avatar from "@/components/Reused/Avatar.vue";
import Course from "@/components/Reused/Course.vue";
import SubmissionReviewDialog from "@/components/Dialogs/SubmissionReviewDialog.vue";
import { fetchPersonByPersonId } from "@/lib/ff";
import useRootStore from "@/store/index";
import moment from "moment";
import { mapActions, mapState } from "pinia";

export default {
  name: "SubmissionTeacherPanel",
  props: ["submission", "on", "attrs", "isDashboardView", "isTeacher", "showCourseImage"],
  components: {
    SubmissionReviewDialog,
    Avatar,
    Course,
  },
  data() {
    return {
      requesterPerson: null,
      active: false,
    };
  },
  async mounted() {
    // bind student profile
    this.requesterPerson = await fetchPersonByPersonId(this.submission.studentId);
  },
  computed: {
    ...mapState(useRootStore, ["showPanelCard"]),
    showCard: {
      get: function () {
        if (
          this.showPanelCard?.type === "submission" &&
          this.showPanelCard?.data.id === this.submission.id
        )
          return 0;
        return null;
      },
      // setter
      set: function (newValue) {
        this.setPanelCard({});
      },
    },
    reviewed() {
      return (
        this.submission.taskSubmissionStatus === "completed" ||
        this.submission.taskSubmissionStatus === "declined"
      );
    },
    courseContextProfile() {
      return {
        image: this.submission.contextCourse.image,
        firstName: this.submission.contextCourse.firstName,
        lastName: "",
      };
    },
    styleByStatus() {
      // use a switch statement to return the class name based on some condition
      switch (this.submission.taskSubmissionStatus) {
        case "completed":
          return "completed-submission";
        case "inreview":
          return "inreview-submission";
        case "declined":
          return "declined-submission";
        default:
          return "default-submission";
      }
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setPanelCard"]),
    getHumanDate(ts) {
      return moment((ts.seconds ? ts.seconds : ts._seconds) * 1000).format("llll"); //format = Mon, Jun 9 2014 9:32 PM
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    panelChange() {
      this.active = !this.$refs.panel[0].isActive;
    },
  },
};
</script>

<style lang="scss" scoped>
.panel ::v-deep .v-expansion-panel-header {
  display: block !important;
}

.submission-card {
  width: 100%;
  margin: 20px 0px;
  padding: 10px;
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 5px;

  .panel {
    background-color: transparent !important;
  }

  .submission-context {
    margin-top: 5px;

    .submission-context-task {
      margin: 0px;
      text-transform: uppercase;
      font-size: 0.6rem;
      color: var(--v-missionAccent-base);
      font-weight: 600;
    }

    .submission-context-topic {
      margin: 0px;
      text-transform: uppercase;
      font-size: 0.6rem;
      color: var(--v-missionAccent-base);
    }

    .submission-context-course {
      margin: 0px;
      text-transform: uppercase;
      font-size: 0.6rem;
      color: var(--v-galaxyAccent-base);
    }
  }

  .submission-time {
    margin: 0px;
    font-size: 0.8rem;
    color: var(--v-missionAccent-base);
  }

  .divider {
    border-bottom: 1px solid var(--v-missionAccent-base);
    margin: 20px 0px;
  }

  .submission-text {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.8rem;
  }

  .instructions-text {
    margin: 0px;
    color: var(--v-cohortAccent-base);
    font-size: 0.8rem;
  }
}

.v-expansion-panel-content__wrap {
  padding: 0px !important;
}

.imagePlaceholder {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(200, 200, 200, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.galaxy-tooltip {
  color: var(--v-galaxyAccent-base);
  font-size: 0.6rem;
  text-transform: uppercase;
}

.person-tooltip {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  text-transform: uppercase;
}

.panel-content ::v-deep .v-expansion-panel-content__wrap {
  padding: 0px !important;
}

.reviewed-submission {
  border: 1px solid var(--v-cohortAccent-base);
}

.completed-submission {
  border: 1px solid var(--v-baseAccent-base);
}
.inreview-submission {
  border: 1px solid var(--v-cohortAccent-base);
}
.declined-submission {
  border: 1px solid red;
}
.default-submission {
  border: 1px solid var(--v-missionAccent-base);
}

.instructions-label {
  font-size: 0.6rem;
  color: var(--v-cohortAccent-base);
  font-style: italic;
}

.submission-label {
  font-size: 0.6rem;
  color: var(--v-missionAccent-base);
  font-style: italic;
}

.status-text {
  color: var(--v-cohortAccent-base);
  font-size: 0.6rem;
  position: relative;
  top: -8px;
}

.request-image {
  position: relative;
  left: -10px;
}
</style>
