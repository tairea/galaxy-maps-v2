<template>
  <div>
    <!-- requester message -->
    <div class="d-flex request-msg">
      <div class="requester-image">
        <v-avatar v-if="requester" size="30">
          <img
            v-if="requester.image"
            :src="requester.image.url"
            :alt="requester.firstName"
            style="object-fit: cover"
          />
        </v-avatar>
      </div>
      <p class="request-text text-left">
        "{{ request.requestForHelpMessage }}"
      </p>
    </div>
    <!-- divder line -->
    <div style="border-top: 1px solid var(--v-missionAccent-base)"></div>
    <!-- instructor response -->
    <div class="d-flex request-msg">
      <p
        class="response-text text-right"
        style="color: var(--v-galaxyAccent-base)"
      >
        {{
          request.responseMessage
            ? '"' + request.responseMessage + '"'
            : "...waiting for instructors response"
        }}
      </p>
      <div v-if="request.responseMessage" class="requester-image">
        <v-avatar v-if="responder" size="30">
          <img
            v-if="responder.image"
            :src="responder.image.url"
            :alt="responder.firstName"
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
    ...mapState(["currentCourseId", "currentTopicId", "currentTaskId"]),
  },
  async mounted() {
    const requesterPerson = await this.$store.dispatch(
      "getPersonByIdFromDB",
      this.request.personId
    );
    this.requester = requesterPerson;
    const responderPerson = await this.$store.dispatch(
      "getPersonByIdFromDB",
      this.request.responderPersonId
    );
    this.responder = responderPerson;
    console.log("requester person:", this.requester);
    console.log("responder person:", this.responder);
  },
  data() {
    return {
      requester: null,
      responder: null,
    };
  },
  methods: {},
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

  .requester-image {
    width: 10%;
  }

  .request-text {
    width: 90%;
    color: var(--v-missionAccent-base);
    font-size: 0.8rem;
    margin: 0px;
    font-style: italic;
    padding-left: 10px;
  }
  .response-text {
    width: 90%;
    color: var(--v-missionAccent-base);
    font-size: 0.8rem;
    margin: 0px;
    font-style: italic;
    padding-right: 10px;
  }
}
</style>
