<template>
  <div class="request-card">
    <v-expansion-panels flat>
      <v-expansion-panel class="panel">
        <v-expansion-panel-header class="pa-0">
          <!-- Course Image -->
          <v-tooltip bottom color="subBackground">
            <template v-slot:activator="{ on, attrs }">
              <div
                class="submission-image d-flex justify-center align-center"
                v-bind="attrs"
                v-on="on"
              >
                <v-avatar v-if="request.contextCourse.image" size="30">
                  <img
                    v-if="request.contextCourse.image"
                    :src="request.contextCourse.image.url"
                    :alt="request.contextCourse.title"
                    style="object-fit: cover"
                  />
                </v-avatar>
                <div v-else class="imagePlaceholder">
                  {{ first3Letters(request.contextCourse.title) }}
                </div>
              </div>
            </template>
            <div>
              <p class="ma-0 galaxy-tooltip">Galaxy:</p>
              <p
                class="ma-0 galaxy-tooltip"
                style="font-size: 0.8rem; font-weight: 800"
              >
                {{ request.contextCourse.title }}
              </p>
            </div>
          </v-tooltip>

          <!-- Avatar -->
          <v-tooltip v-if="requesterPerson" bottom color="subBackground">
            <template v-slot:activator="{ on, attrs }">
              <div
                class="request-image d-flex justify-center align-center"
                v-bind="attrs"
                v-on="on"
              >
                <v-avatar v-if="requesterPerson" size="30">
                  <img
                    v-if="requesterPerson.image"
                    :src="requesterPerson.image.url"
                    :alt="requesterPerson.firstName"
                    style="object-fit: cover"
                  />
                </v-avatar>
                <div v-else class="imagePlaceholder">
                  {{ first3Letters(requesterPerson.firstName) }}
                </div>
              </div>
            </template>
            <div>
              <p class="ma-0 person-tooltip">Person:</p>
              <p
                class="ma-0 person-tooltip"
                style="font-size: 0.8rem; font-weight: 800; color: white"
              >
                {{ requesterPerson.firstName + " " + requesterPerson.lastName }}
              </p>
            </div>
          </v-tooltip>

          <!-- Course/Topic/Task -->
          <div class="requester-context">
            <p class="requester-context-task">
              {{ request.contextTask.title }}
            </p>
            <p class="requester-context-topic">
              {{ request.contextTopic.label }}
            </p>
            <p class="requester-context-course">
              {{ request.contextCourse.title }}
            </p>
          </div>
          <div class="requester-time">
            {{ getHumanDate(request.requestSubmittedTimestamp) }}
          </div>
          <template v-slot:actions>
            <v-icon color="missionAccent"> </v-icon>
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <div class="d-flex justify-center align-center">
            <p class="requester-msg">"{{ request.requestForHelpMessage }}"</p>
          </div>
          <div class="divider"></div>
          <div class="action-button">
            <RequestForHelpResponseDialog
              :request="request"
              :requesterPerson="requesterPerson"
            />
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
import { dbMixins } from "../mixins/DbMixins";

export default {
  name: "RequestForHelpTeacherPanel",
  mixins: [dbMixins],
  props: ["request"],
  components: {
    RequestForHelpResponseDialog,
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
  async mounted() {
    this.requesterPerson = await this.MXgetPersonByIdFromDB(
      this.request.personId
    );
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
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    // TODO: route to students page
    // routeToStudentsProfile(id) {
    //   console.log("TODO: route to persons page:", id);
    // },
  },
};
</script>

<style lang="scss" scoped>
.request-card {
  width: 100%;
  display: flex;
  margin: 20px 0px;
  padding: 10px;
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 5px;

  .panel {
    background-color: transparent !important;
  }

  .requester-image {
    width: 10%;
  }

  .requester-context {
    margin-left: 10px;
    width: 60%;

    .requester-context-task {
      margin: 0px;
      text-transform: uppercase;
      font-size: 0.8rem;
      color: var(--v-missionAccent-base);
      font-weight: 800;
    }
    .requester-context-topic {
      margin: 0px;
      text-transform: uppercase;
      font-size: 0.6rem;
      color: var(--v-missionAccent-base);
    }
    .requester-context-course {
      margin: 0px;
      text-transform: uppercase;
      font-size: 0.6rem;
      color: var(--v-galaxyAccent-base);
    }
  }

  .requester-time {
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

  .requester-msg {
    margin: 0px;
    margin-top: 16px;
    color: var(--v-missionAccent-base);
    font-style: italic;
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
</style>
