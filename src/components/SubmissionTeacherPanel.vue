<template>
  <div class="submission-card" :class="reviewed ? 'reviewed-submission':''">
    <v-expansion-panels flat v-model="showCard">
      <v-expansion-panel
        v-for="(sub, i) in [submission]"
        :key="i"
        class="panel"
        @change="panelChange()" 
      >
        <v-expansion-panel-header ref="panel" class="pa-0">
          <div class="d-flex flex-row">
            <Avatar v-if="isDashboardView" :profile="courseContextProfile" size="30" :colourBorder="true"/>
            <Avatar v-if="requesterPerson" :profile="requesterPerson" size="30" :colourBorder="true"  :class="isDashboardView ? 'request-image':''"/>
            <div class="submission-time d-flex flex-column align-center ml-auto pl-1">
              <span v-if="reviewed" class="ml-auto status-text">{{submission.taskSubmissionStatus}}</span>
              <span v-else class="ml-auto status-text">...awaiting review</span>
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
              <!-- <MarkSubmissionCompleted
                :submission="submission"
                :requesterPerson="requesterPerson"
              />
              <SubmissionResponseDialog
                :submission="submission"
                :requesterPerson="requesterPerson"
              /> -->
            </div>
          </template>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import moment from "moment";
import Avatar from "../components/Avatar.vue"

// import MarkSubmissionCompleted from "../components/MarkSubmissionCompleted";
// import SubmissionResponseDialog from "../components/SubmissionResponseDialog";
import SubmissionReviewDialog from "../components/Dialogs/SubmissionReviewDialog";
import { dbMixins } from "../mixins/DbMixins";

export default {
  name: "SubmissionTeacherPanel",
  props: ["submission", "on", "attrs", "isDashboardView", "isTeacher"],
  mixins: [dbMixins],
  components: {
    // MarkSubmissionCompleted,
    // SubmissionResponseDialog,
    SubmissionReviewDialog,
    Avatar
  },
  data() {
    return {
      requesterPerson: null,
      active: false
    };
  },
  async mounted() {
    // bind student profile
    this.requesterPerson = await this.MXgetPersonByIdFromDB(this.submission.studentId);
  },
  computed: {
    ...mapState(["personsTopicsTasks", "showPanelCard"]),
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
        this.$store.commit("setPanelCard", {});
      },
    },
    reviewed() {
      return this.submission.taskSubmissionStatus === 'completed' || this.submission.taskSubmissionStatus === 'declined'
    },
    courseContextProfile() {
      return {
        image: this.submission.contextCourse.image,
        firstName: this.submission.contextCourse.firstName,
        lastName: ''
      }
    }
  },
  methods: {
    getHumanDate(ts) {
      return moment(ts.seconds * 1000).format("llll"); //format = Mon, Jun 9 2014 9:32 PM
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    panelChange() {
      this.active = !this.$refs.panel[0].isActive
    }
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
  font-size:0.6rem;
  position: relative;
  top: -8px
}

.request-image {
  position: relative;
  left: -10px;
}
</style>
