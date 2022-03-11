<template>
  <!-- <v-btn
    v-if="activeTask"
    outlined
    x-small
    color="missionAccent"
    @click="routeToTasksSystem()"
    :dark="dark"
    :light="!dark"
    class="pa-5 mb-4 mx-2 missionButton"
  >
    <p class="ma-0">{{ activeTopic.label }}</p>
    <p class="ma-0" style="font-weight: 900; padding: 0px 5px">></p>
    <p class="ma-0" style="font-weight: 900">{{ activeTask.title }}</p>
  </v-btn> -->

  <!-- v-btn above OR custom div button. which is better? -->
  <div class="active-mission-card" @click="routeToTasksSystem()">
    <p class="ma-0">{{ activeTopic.label }}</p>
    <p class="ma-0" style="font-weight: 900; padding: 0px 5px">></p>
    <p class="ma-0" style="font-weight: 900">{{ activeTask.title }}</p>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "ActiveMissions",
  props: ["courseId"],
  components: {},
  data() {
    return {
      activeMissionsData: [],
      activeTopic: null,
      activeTask: null,
    };
  },
  async mounted() {
    // === get active task (from FIRESTORE)
    // const activeMissionsFromDB = await this.$store.dispatch(
    //   "getPersonsActiveTasks",
    //   {
    //     courseId: this.courseId,
    //     personId: this.person.id,
    //   }
    // );
    // this.activeMissionsData = activeMissionsFromDB;

    // === get active task (from XAPI LRS) NOTE: LRS Query only returns 1 active mission. The above firestore method returns all active mission but no topic.
    const course = this.studentsActiveTasks.find(
      (course) => course._id.course == this.courseId
    );

    const topicId = course.lastStatement.topic;
    const taskId = course.lastStatement.task;

    // return taskId;

    const task = await this.$store.dispatch("getTaskByTaskId", {
      courseId: this.courseId,
      topicId: course.lastStatement.topic,
      taskId: course.lastStatement.task,
    });

    const topic = await this.$store.dispatch("getTopicByTopicId", {
      courseId: this.courseId,
      topicId: course.lastStatement.topic,
    });

    this.activeTopic = topic;
    this.activeTask = task;

    // console.log("task:", task);
    // console.log("topic:", topic);

    // return topic.label + " " + task.title;
  },
  computed: {
    ...mapState(["studentCourseDataFromLRS", "studentsActiveTasks"]),
    ...mapGetters(["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    routeToTasksSystem() {
      // save current topic & task to store
      this.$store.commit("setCurrentTopicId", this.activeTopic.id);
      this.$store.commit("setCurrentTopic", this.activeTopic);
      this.$store.commit("setCurrentTaskId", this.activeTask.id);
      this.$store.commit("setCurrentTask", this.activeTask);

      // route to topic/solar system
      // TODO: bug where system route does work (prob to do with vuex-persisted)
      this.$router.push({
        name: "SolarSystemView",
        params: {
          topicId: this.activeTopic.id,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.active-mission-card {
  font-size: 0.6rem;
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 5px;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 10px;
  margin-bottom: 20px;
  text-transform: uppercase;
  cursor: pointer;
}

.mission-button {
  backdrop-filter: blur(2px) !important;
}
</style>
