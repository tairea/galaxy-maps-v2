<template>
  <div>
    <!-- requester message -->
    <div class="d-flex request-msg">
      <div class="requester-image">
        <v-avatar size="30">
          <img
            v-if="requesterPerson.image"
            :src="requesterPerson.image.url"
            :alt="requesterPerson.firstName"
            style="object-fit: cover"
          />
        </v-avatar>
      </div>
      <p class="request-text">"{{ request.requestForHelpMessage }}"</p>
    </div>
    <!-- divder line -->
    <div style="border-top: 1px solid var(--v-missionAccent-base)"></div>
    <!-- instructor response -->
    <div class="d-flex request-msg">
      <p
        class="request-text text-center"
        style="color: var(--v-galaxyAccent-base)"
      >
        {{
          request.requestForHelpResponse
            ? request.requestForHelpResponse
            : "...waiting for instructors response"
        }}
      </p>
      <div v-if="request.requestForHelpResponse" class="requester-image">
        <v-avatar size="30">
          <img
            v-if="requesterPerson.image"
            :src="requesterPerson.image.url"
            :alt="requesterPerson.firstName"
            style="object-fit: cover"
          />
        </v-avatar>
      </div>
    </div>
  </div>
</template>

<script>
import SolarSystem from "../components/SolarSystem";

import { mapState, mapGetters } from "vuex";

export default {
  name: "RequestsForHelpStudentCard",
  props: ["request"],
  components: {
    SolarSystem,
  },
  computed: {
    ...mapState([
      "currentCourseId",
      "currentTopicId",
      "currentTaskId",

      "people",
    ]),
    requestsForThisTask() {
      return this.requests.filter(
        (request) => request.taskId == this.activeMission.id
      );
    },
  },
  async mounted() {
    // console.log("active mission is:", this.activeMission);
    // console.log("from store people: ", this.people);
    const person = await this.$store.dispatch(
      "getPersonByIdFromDB",
      this.request.personId
    );
    console.log("person who requested this question:", person);
    this.requesterPerson = person;
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
  margin-bottom: 20px;
}

.request {
  margin: 10px 0px;
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 5px;

  .request-msg {
    padding: 10px;
  }

  .request-text {
    color: var(--v-missionAccent-base);
    font-size: 0.8rem;
    margin: 0px;
    font-style: italic;
    padding-left: 10px;
  }
}
</style>
