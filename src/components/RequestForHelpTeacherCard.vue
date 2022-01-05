<template>
  <div v-if="topicsTasks.length > 0">
    <!-- Avatar -->
    <div class="requester-image">
      <v-avatar size="30">
        <!-- <img
          v-if="getPerson(request.requestForHelpPersonId).image"
          :src="getPerson(request.requestForHelpPersonId).image.url"
          :alt="getPerson(request.requestForHelpPersonId).firstName"
          style="object-fit: cover"
        /> -->
      </v-avatar>
    </div>
    <!-- Course/Topic/Task -->
    <div class="requester-context">
      <p class="requester-context-task">{{ getTask(request.taskId).title }}</p>
    </div>
    <div class="requester-time">
      {{ formatTimestamp(request.requestSubmittedTimestamp) }}
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "RequestForHelpTeacherCard",
  props: ["request"],
  async mounted() {
    // bind tasks by topic
    this.topicsTasks = await this.$store.dispatch(
      "bindTasksByTopicId",
      this.contextObj
    );

    // console.log("this.topicsTasks", this.topicsTasks);
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
    formatTimestamp(ts) {
      return new Date(ts.seconds * 1000).toLocaleString();
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

<style lang="scss" scoped></style>
