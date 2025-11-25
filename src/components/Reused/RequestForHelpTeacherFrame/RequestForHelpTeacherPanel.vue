<template>
  <div class="request-card" :class="responderPerson ? 'response-card' : ''">
    <v-expansion-panels flat v-model="showCard">
      <v-expansion-panel
        @change="panelChange()"
        v-for="(sub, i) in [request]"
        :key="request.id"
        class="panel"
      >
        <v-expansion-panel-header class="pa-0" ref="panel">
          <!-- Course Image -->
          <div class="d-flex flex-row">
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
            <Avatar
              v-if="responderPerson && !active"
              :profile="responderPerson"
              size="30"
              :colourBorder="true"
              :class="isDashboardView ? 'respond-image' : 'request-image'"
            />
            <div
              v-if="responderPerson"
              class="requester-time d-flex flex-column align-center ml-auto"
            >
              <span class="ml-auto status-text">responded</span>
              {{ getHumanDate(request.responseSubmittedTimestamp) }}
            </div>
            <div v-else class="requester-time d-flex flex-column align-center ml-auto">
              <span class="ml-auto status-text cohortAccent--text">...awaiting response</span>
              {{ getHumanDate(request.requestSubmittedTimestamp) }}
            </div>
          </div>
          <div v-if="!active" class="requester-context">
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
        </v-expansion-panel-header>
        <v-expansion-panel-content class="panel-content">
          <div class="d-flex align-start">
            <p class="requester-msg">"{{ request.requestForHelpMessage }}"</p>
          </div>
          <template v-if="!responderPerson">
            <div v-if="isTeacher">
              <div class="divider"></div>
              <RequestForHelpResponseDialog :request="request" :requesterPerson="requesterPerson" />
            </div>
          </template>
          <template v-else>
            <div class="divider"></div>
            <div class="d-flex align-start justify-end">
              <span class="requester-msg">"{{ request.responseMessage }}"</span>
              <Avatar :profile="responderPerson" size="30" :colourBorder="true" class="ml-2" />
            </div>
          </template>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import Avatar from "@/components/Reused/Avatar.vue";
import RequestForHelpResponseDialog from "@/components/Dialogs/RequestForHelpResponseDialog.vue";
import { fetchPersonByPersonId } from "@/lib/ff";
import useRootStore from "@/store/index";
import moment from "moment";
import { mapActions, mapState } from "pinia";

export default {
  name: "RequestForHelpTeacherPanel",
  props: ["request", "isTeacher", "isDashboardView"],
  components: {
    RequestForHelpResponseDialog,
    Avatar,
  },
  data() {
    return {
      requesterPerson: null,
      responderPerson: null,
      topicsTasks: [],
      contextObj: {
        courseId: this.request.courseId,
        topicId: this.request.topicId,
        taskId: this.request.taskId,
      },
      active: false,
    };
  },
  async mounted() {
    this.requesterPerson = await fetchPersonByPersonId(this.request.personId);
    if (this.request.responderPersonId)
      this.responderPerson = await fetchPersonByPersonId(this.request.responderPersonId);
  },
  watch: {
    async request() {
      if (this.request.responderPersonId)
        this.responderPerson = await fetchPersonByPersonId(this.request.responderPersonId);
    },
  },
  computed: {
    ...mapState(useRootStore, ["people", "showPanelCard"]),
    showCard: {
      get: function () {
        if (
          this.showPanelCard?.type === "request" &&
          this.showPanelCard?.data.id === this.request.id
        )
          return 0;
        return null;
      },
      set: function (newValue) {
        this.setPanelCard({});
      },
    },
    courseContextProfile() {
      const course = this.request.contextCourse;
      return {
        image: course.image,
        firstName: course.title,
        lastName: "",
      };
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setPanelCard"]),
    getTask(id) {
      return this.topicsTasks.find((task) => task.id == id);
    },
    getPerson(id) {
      // return this.people.find((person) => person.id === id);
    },
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

.request-card {
  width: 100%;
  margin: 20px 0px;
  padding: 10px;
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 5px;
  height: auto;

  .panel {
    background-color: transparent !important;
  }

  .requester-context {
    margin-top: 5px;

    .requester-context-task {
      margin: 0px;
      text-transform: uppercase;
      font-size: 0.6rem;
      color: var(--v-missionAccent-base);
      font-weight: 600;
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
    font-size: 0.8rem;
    color: var(--v-missionAccent-base);
  }

  .waiting-response {
    margin: 0px;
    font-size: 0.8rem;
    color: var(--v-galaxyAccent-base);
  }

  .divider {
    border-bottom: 1px solid var(--v-missionAccent-base);
    margin: 20px 0px;
  }

  .requester-msg {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-style: italic;
    font-size: 0.8rem;
  }
}

.panel-content ::v-deep .v-expansion-panel-content__wrap {
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

.request-image {
  position: relative;
  left: -10px;
}

.respond-image {
  position: relative;
  left: -20px;
}

.response-card {
  border: 1px solid var(--v-galaxyAccent-base);
}

.status-text {
  color: var(--v-galaxyAccent-base);
  font-size: 0.6rem;
  position: relative;
  top: -8px;
  text-transform: uppercase;
}
</style>
