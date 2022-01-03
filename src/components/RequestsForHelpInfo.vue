<template>
  <div id="ss-info">
    <h2 class="ss-label">Requests for Help</h2>
    <p class="overline requestsLabel ma-0">Re: {{ activeMission.title }}</p>

    <div v-for="request in requestsForHelp" :key="request.id" class="request">
      <div class="d-flex">
        <div class="requester-image">
          <v-avatar size="30">
            <img
              v-if="getPerson(request.requestForHelpPersonId).image"
              :src="getPerson(request.requestForHelpPersonId).image.url"
              :alt="getPerson(request.requestForHelpPersonId).firstName"
              style="object-fit: cover"
            />
          </v-avatar>
        </div>
        <p class="request-text">{{ request.requestForHelpMessage }}</p>
      </div>
    </div>
    <!-- <h1 class="ss-title">{{ topic.label }}</h1>
    <p class="galaxy-description">Part of the</p>
    <h1 class="galaxy-title">{{ getCourseById(currentCourseId).title }}</h1>
    <p class="galaxy-description">Galaxy</p> -->
  </div>
</template>

<script>
import SolarSystem from "../components/SolarSystem";

import { mapState, mapGetters } from "vuex";

export default {
  name: "RequestsForHelpInfo",
  props: ["activeMission"],
  components: {
    SolarSystem,
  },
  computed: {
    ...mapState([
      "currentCourseId",
      "currentTopicId",
      "currentTaskId",
      "requestsForHelp",
      "people",
    ]),
  },
  async mounted() {
    // bind requests for help
    await this.$store.dispatch("bindRequestsForHelp", {
      courseId: this.currentCourseId,
      topicId: this.currentTopicId,
      taskId: this.currentTaskId,
    });

    // check if requests are binded
    console.log("from store requestsForHelp: ", this.requestsForHelp);
    console.log("from store people: ", this.people);
  },
  data() {
    return {
      requesterPerson: null,
    };
  },
  methods: {
    getPerson(id) {
      return this.people.find((person) => person.id === id);
    },
  },
};
</script>

<style lang="scss" scoped>
#ss-info {
  width: calc(100% - 30px);
  // height: 400px;
  border: 1px solid var(--v-missionAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
  height: auto;
}

h1 {
  color: white;
}

.ss-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: 0;
  left: -1px;
  background-color: var(--v-missionAccent-base);
  color: var(--v-background-base);
  padding: 0px 20px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
}

.requestsLabel {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base);
  border-bottom: 1px solid var(--v-missionAccent-base);
}

.request {
  margin: 10px 0px;
  border: 1px solid var(--v-missionAccent-base);
  padding: 10px;

  .request-text {
    color: var(--v-missionAccent-base);
    font-size: 0.8rem;
    margin: 0px;
    font-style: italic;
    padding-left: 10px;
  }
}
</style>
