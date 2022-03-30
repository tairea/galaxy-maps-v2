<template>
  <div class="help-info" v-if="requests.length > 0">
    <!-- <div v-if="requestsForHelp.length > 0" id="ss-info"> -->

    <h2 class="ss-label">Requests for Help</h2>
    <p class="overline requestsLabel">Re: {{ task.title }}</p>

    <div v-for="request in requests" :key="request.id" class="request">
      <RequestsForHelpStudentCard :request="request" />
    </div>
  </div>
</template>

<script>
import RequestsForHelpStudentCard from "../components/RequestsForHelpStudentCard";

export default {
  name: "RequestsForHelpInfo",
  props: ["requests", "task"],
  components: {
    RequestsForHelpStudentCard,
  },
  computed: {},
  async mounted() {},
  data() {
    return {};
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
h1 {
  color: white;
}

.help-info {
  width: calc(100% - 30px);
  max-height: calc(100% - 60px);
  border: 1px solid var(--v-missionAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
  overflow: scroll;
  overflow-x: hidden;
}

.help-info ::-webkit-scrollbar {
  display: none;
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
