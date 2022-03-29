<template>
  <div class="help-info" v-if="workForThisTask.length > 0">
    <!-- <div v-if="requestsForHelp.length > 0" id="ss-info"> -->

    <h2 class="ss-label">Submitted Work</h2>
    <p class="overline requestsLabel">Re: {{ currentTask.title }}</p>

    <div v-for="work in workForThisTask" :key="work.id" class="request">
      <SubmissionStudentCard :work="work" />
    </div>
  </div>
</template>

<script>
import SubmissionStudentCard from "../components/SubmissionStudentCard";

import { mapState, mapGetters } from "vuex";

export default {
  name: "SubmittedWorkInfo",
  props: [],
  components: {
    SubmissionStudentCard,
  },
  computed: {
    ...mapState([
      "person",
      "currentTask",
      "currentCourseId",
      "studentsSubmissions",
    ]),
    workForThisTask() {
      return this.studentsSubmissions.filter(
        (work) => work.contextTask.id == this.currentTaskId
      );
    },
  },
  async mounted() {
    console.log("active mission is:", this.currentTask);
    await this.$store.dispatch("getSubmittedWorkByStudentAndTaskId", {
      courseId: this.currentCourseId,
      studentId: this.person.id,
      taskId: this.currentTask,
    });
    console.log("studentsSubmissions: ", this.studentsSubmissions);
  },
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
