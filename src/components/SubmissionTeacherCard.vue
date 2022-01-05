<template>
  <div class="submission-card">
    <v-expansion-panels flat>
      <v-expansion-panel class="panel">
        <v-expansion-panel-header class="pa-0">
          <!-- Avatar -->
          <div class="submission-image d-flex justify-center align-center">
            <v-avatar v-if="requesterPerson" size="30">
              <img
                v-if="requesterPerson.image"
                :src="requesterPerson.image.url"
                :alt="requesterPerson.firstName"
                style="object-fit: cover"
              />
            </v-avatar>
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
          <div class="submission-time">
            {{ getHumanDate(submission.taskSubmittedTimestamp) }}
          </div>
          <template v-slot:actions>
            <v-icon color="missionAccent"> </v-icon>
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <div
            class="d-flex justify-center align-center"
            style="padding-top: 16px"
          >
            <!-- View submission button -->
            <a
              style="text-decoration: none"
              :href="submission.submissionLink"
              target="_blank"
            >
              <v-btn outlined color="cohortAccent" class="ma-2" small>
                <v-icon left> mdi-text-box-search-outline </v-icon>
                VIEW SUBMISSION
              </v-btn>
            </a>
          </div>
          <div class="divider"></div>
          <div class="action-button">
            <!-- <RequestForHelpResponseDialog
              :request="request"
              :requesterPerson="requesterPerson"
              @snackbarToggle="snackbarToggle($event)"
            /> -->
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import moment from "moment";

import RequestForHelpResponseDialog from "../components/RequestForHelpResponseDialog";

export default {
  name: "SubmissionTeacherCard",
  props: ["submission"],
  components: {
    RequestForHelpResponseDialog,
  },
  async mounted() {
    const person = await this.$store.dispatch(
      "getPersonByIdFromDB",
      this.request.personId
    );
    this.requesterPerson = person;
  },
  computed: {
    ...mapState([
      // "currentCourseId",
      // "currentTopicId",
      // "currentTaskId",
      "allTasks",
      "people",
    ]),
    ...mapActions(["getTaskByTaskId"]),
  },
  data() {
    return {
      requesterPerson: null,
      topicsTasks: [],
      contextObj: {
        courseId: this.request.courseId,
        topicId: this.request.topicId,
        taskId: this.request.taskId,
      },
    };
  },
  methods: {
    getTask(id) {
      return this.topicsTasks.find((task) => task.id == id);
    },
    getPerson(id) {
      // return this.people.find((person) => person.id === id);
    },
    getHumanDate(ts) {
      return moment(ts.seconds * 1000).format("llll"); //format = Mon, Jun 9 2014 9:32 PM
    },
    snackbarToggle(msg) {
      this.$emit("snackbarToggle", msg);
    },
    // first3Letters(name) {
    //   return name.substring(0, 3).toUpperCase();
    // },
    // TODO: route to students page
    // routeToStudentsProfile(id) {
    //   console.log("TODO: route to persons page:", id);
    // },
  },
};
</script>

<style lang="scss" scoped>
.submission-card {
  width: 100%;
  display: flex;
  margin: 20px 0px;
  padding: 10px;
  border: 1px solid var(--v-cohortAccent-base);
  border-radius: 5px;

  .panel {
    background-color: transparent !important;
  }

  .submission-image {
    width: 10%;
  }

  .submission-context {
    margin-left: 10px;
    width: 60%;

    .submission-context-task {
      margin: 0px;
      text-transform: uppercase;
      font-size: 0.8rem;
      color: var(--v-missionAccent-base);
      font-weight: 800;
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
    text-transform: uppercase;
    font-size: 0.8rem;
    color: var(--v-missionAccent-base);
    width: 30%;
    text-align: right;
  }

  .divider {
    border-bottom: 1px solid var(--v-missionAccent-base);
    margin: 20px 0px;
  }
}

.v-expansion-panel-content__wrap {
  padding: 0px !important;
}
</style>
