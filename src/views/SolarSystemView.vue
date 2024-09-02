<template>
  <div id="container" class="bg">
    <!--==== Left section ====-->
    <div id="left-section">
      <SolarSystemInfo
        v-if="!loading"
        :topic="topic"
        :tasks="teacher ? topicTasks : personTasks"
        :teacher="teacher"
        :course="course"
      />
      <AssignedInfo
        v-if="!loading && !draft && peopleInTopic.length"
        :assignCohorts="true"
        :people="peopleInTopic"
        :teacher="teacher"
      />

      <!-- Order change button -->
      <div v-if="!loading" class="save-changes mt-4">
        <v-btn
          v-if="orderChanged"
          outlined
          color="baseAccent"
          @click="saveNewMissionOrder"
          :loading="savingNewMissionOrder"
        >
          <v-icon left> {{ mdiContentSave }} </v-icon>
          SAVE CHANGES
        </v-btn>
      </div>

      <BackButton v-if="!loading" :toPath="'/galaxy/' + courseId" />
    </div>

    <!--==== Main section ====-->
    <div id="main-section">
      <!-- loading spinner -->
      <LoadingSpinner v-if="loading" text="loading solar system" />
      <MissionsList
        v-if="!loading"
        :course="course"
        :topic="topic"
        :tasks="teacher ? sortedTopicTasks : sortedPersonTasks"
        :teacher="teacher"
        :disableCreateMission="orderChanged"
        @task="taskForHelpInfo($event)"
        @missionActivated="missionActivated"
        @missionStarted="missionStarted"
        @missionSubmittedForReview="missionSubmittedForReview"
        @missionCompleted="missionCompleted"
        @taskCreated="taskCreated"
        @taskUpdated="taskUpdated"
        @taskDeleted="taskDeleted"
        @taskOrderChanged="taskOrderChanged"
      />
    </div>

    <!--==== Right section ====-->
    <div id="right-section">
      <RequestForHelpTeacherFrame
        v-if="!loading"
        :courses="[course]"
        :isTeacher="teacher"
        :students="peopleInTopic"
      />
      <SubmissionTeacherFrame
        v-if="!loading && teacher"
        :courses="[course]"
        :students="peopleInTopic"
        class="mt-4"
      />
    </div>

    <!-- Topic completed dialog -->
    <v-dialog v-model="topicCompletedDialog" transition="dialog-bottom-transition" max-width="600">
      <template v-slot:default="topicCompletedDialog">
        <v-card style="border: 1px solid var(--v-baseAccent-base)">
          <v-toolbar color="baseAccent overline" light>nice job!</v-toolbar>
          <v-card-text class="pa-0">
            <div class="overline text-center pa-12 baseAccent--text">
              You have completed this System
            </div>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn small text :to="'/galaxy/' + courseId">&lt;- back to galaxy</v-btn>
            <v-btn
              v-if="showNextSystemButton"
              small
              text
              :loading="unlockingNextTopic"
              @click="nextTopic"
              >next system -></v-btn
            >
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script>
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import SolarSystemInfo from "@/components/SolarSystemView/SolarSystemInfo.vue";
import AssignedInfo from "@/components/Reused/AssignedInfo.vue";
import MissionsList from "@/components/SolarSystemView/MissionsList.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import SubmissionTeacherFrame from "@/components/Reused/SubmissionTeacherFrame.vue";
import RequestForHelpTeacherFrame from "@/components/Reused/RequestForHelpTeacherFrame.vue";
import {
  fetchAllPeopleInCourseByCourseId,
  fetchPersonsTopicByPersonIdCourseIdTopicId,
} from "@/lib/ff";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import useSolarSystemViewStore from "@/store/solarSystemView";
import { mapActions, mapState } from "pinia";
import { mdiContentSave } from "@mdi/js";
import confetti from "canvas-confetti";

export default {
  name: "SolarSystemView",
  components: {
    LoadingSpinner,
    SolarSystemInfo,
    AssignedInfo,
    MissionsList,
    BackButton,
    RequestForHelpTeacherFrame,
    SubmissionTeacherFrame,
  },
  props: ["courseId", "topicId"],
  data() {
    return {
      mdiContentSave,
      activeMission: null,
      task: null,
      unsubscribes: [],
      peopleInTopic: [],
      loading: true,
      orderChanged: false,
      newMissionOrder: [],
      savingNewMissionOrder: false,
      updateViaKey: 0,
      currentTask: null,
      topicCompletedDialog: false,
      unlockingNextTopic: true, // default to loading
      showNextSystemButton: true,
    };
  },
  async mounted() {
    this.setCurrentCourseId(this.courseId);
    this.setCurrentTopicId(this.topicId);

    // load Topic & course data
    await this.loadTopic(this.courseId, this.topicId);

    if (this.teacher) {
      await this.refreshTasks();
    } else {
      await this.refreshPersonTopicsAndTasks(this.person.id);
    }

    await this.getPeopleInTopic();

    // set active task
    this.task = this.getActiveMission();

    this.loading = false;
  },
  watch: {
    topicCompleted(topic) {
      console.log("topic completed (from watch)", topic);
      if (topic.topicId == this.topicId && topic.completed == true) {
        // yooo topic is completed
        this.setTopicCompleted();
      }
    },
    nextTopicUnlockedFlag(flag) {
      console.log("a/next topic was unclocked (from watch)", flag);
      if (flag == true) {
        this.unlockingNextTopic = false; // template flag false will stop the loading spinner on next button
      }
      this.setNextTopicUnlocked(false); // reset store flag back to false
    },
    $route(to, from) {
      // Called whenever the route changes
      // Check if the route change is relevant to this component
      if (to.name === "SolarSystemView" && to.params.topicId !== from.params.topicId) {
        // reload the page
        this.$router.go();
      }
    },
  },
  computed: {
    ...mapState(useRootStore, ["person", "user", "topicCompleted", "nextTopicUnlockedFlag"]),
    ...mapState(useSolarSystemViewStore, [
      "course",
      "topic",
      "topicTasks",
      "personTopics",
      "personTasks",
    ]),
    draft() {
      return this.course.status === "drafting";
    },
    teacher() {
      return this.course.mappedBy?.personId === this.person.id || this.user.data.admin;
    },
    sortedTopicTasks() {
      if (this.topicTasks.some((task) => task.orderIndex != null)) {
        console.log("tasks have orderIndex, sorting by orderIndex");
        return this.topicTasks.sort((a, b) => a.orderIndex - b.orderIndex);
      } else {
        console.log("tasks do not have orderIndex, sorting by timestamp:");
        return this.topicTasks.sort((a, b) => {
          if (a.taskCreatedTimestamp._seconds) {
            return a.taskCreatedTimestamp._seconds - b.taskCreatedTimestamp._seconds;
          } else if (a.taskCreatedTimestamp.seconds) {
            return a.taskCreatedTimestamp.seconds - b.taskCreatedTimestamp.seconds;
          } else {
            return a.taskCreatedTimestamp - b.taskCreatedTimestamp;
          }
        });
      }
    },
    sortedPersonTasks() {
      if (this.personTasks.some((task) => task.orderIndex != null)) {
        console.log("tasks have orderIndex, sorting by orderIndex");
        return this.personTasks.sort((a, b) => a.orderIndex - b.orderIndex);
      } else {
        console.log("tasks do not have orderIndex, sorting by timestamp");
        return this.personTasks.sort((a, b) => {
          if (a.taskCreatedTimestamp._seconds) {
            return a.taskCreatedTimestamp._seconds - b.taskCreatedTimestamp._seconds;
          } else if (a.taskCreatedTimestamp.seconds) {
            return a.taskCreatedTimestamp.seconds - b.taskCreatedTimestamp.seconds;
          } else {
            return a.taskCreatedTimestamp - b.taskCreatedTimestamp;
          }
        });
      }
    },
  },
  methods: {
    ...mapActions(useRootStore, [
      "setCurrentCourseId",
      "setCurrentTopicId",
      "setCurrentTaskId",
      "setNextTopicUnlocked",
      "setStartMissionLoading",
    ]),
    ...mapActions(useSolarSystemViewStore, [
      "loadTopic",
      "refreshTopic",
      "refreshTasks",
      "updateTaskOrderIndexes",
      "refreshPersonTopicsAndTasks",
    ]),
    taskForHelpInfo(task) {
      this.task = task;
    },
    getActiveMission() {
      const activeMissionObj = this.personTasks.find((taskObj) => {
        return taskObj.taskStatus == "active" || taskObj.taskStatus == "declined";
      });
      if (activeMissionObj) {
        this.activeMission = true;
        // set as current/active task (if not already?)
        this.setCurrentTaskId(activeMissionObj.id);
        this.currentTask = activeMissionObj;
      } else {
        return;
      }
      // console.log("active mission:", activeMissionObj);
      return activeMissionObj;
    },
    async getPeopleInTopic() {
      console.log("5, getting people in topic");
      const people = [];
      const peopleInCourse = await fetchAllPeopleInCourseByCourseId(this.courseId);
      await Promise.all(
        peopleInCourse.map(async (person) => {
          const personsTopic = await fetchPersonsTopicByPersonIdCourseIdTopicId(
            person.id,
            this.courseId,
            this.topicId,
          );
          if (personsTopic.topicStatus == "active") {
            people.push(person);
          }
        }),
      );
      this.peopleInTopic = people;
    },
    async missionStarted(taskId) {
      console.log("mission started", taskId);
      await this.refreshTopic();
      await this.refreshPersonTopicsAndTasks(this.person.id);
      // change startMissionLoading to false (for use in StartMissionDialogV.vue)
      this.setStartMissionLoading(false);
    },
    async missionSubmittedForReview(taskId) {
      console.log("mission submitted for review", taskId);
      await this.refreshPersonTopicsAndTasks(this.person.id);
    },
    async missionCompleted(taskId) {
      console.log("mission completed", taskId);
      await this.refreshTopic();
      await this.refreshPersonTopicsAndTasks(this.person.id);
    },
    async taskCreated(task) {
      console.log("task created", task);
      await this.refreshTasks();
    },
    async taskUpdated(task) {
      console.log("task updated", task);
      await this.refreshTasks();
    },
    async taskDeleted(task) {
      console.log("task deleted", task);
      await this.refreshTasks();
    },
    taskOrderChanged(event) {
      this.orderChanged = true;
      const value = event;
      const orderChanges = [];

      for (let i = 0; i < value.length; i++) {
        console.log(
          value[i].title +
            " " +
            value[i].orderIndex +
            "===" +
            this.topicTasks[i].title +
            " " +
            this.topicTasks[i].orderIndex,
        );
        value[i].orderIndex = i;
        orderChanges.push(value[i]);
      }
      console.log("orderchanges", orderChanges);
      this.newMissionOrder = orderChanges;
    },
    async saveNewMissionOrder() {
      this.savingNewMissionOrder = true;

      await this.updateTaskOrderIndexes(
        this.newMissionOrder.map((task) => ({ taskId: task.id, orderIndex: task.orderIndex })),
      );

      this.savingNewMissionOrder = false;
      this.orderChanged = false;
    },

    setTopicCompleted() {
      console.log("topic completed");
      this.getPeopleInTopic();
      this.topicCompletedDialog = true;
      // === Basic Cannon
      // confetti({
      //   particleCount: 100,
      //   spread: 70,
      //   origin: { y: 0.6 },
      // });
      // === Fireworks
      var duration = 15 * 1000;
      var animationEnd = Date.now() + duration;
      var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      var interval = setInterval(() => {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: this.randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: this.getGMColours(),
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: this.randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: this.getGMColours(),
        });
      }, 250);
    },
    randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    },
    getGMColours() {
      let colours = [];
      if (this.$vuetify.theme.isDark) {
        colours = [
          this.$vuetify.theme.themes.dark.missionAccent,
          this.$vuetify.theme.themes.dark.baseAccent,
          // this.$vuetify.theme.themes.dark.galaxyAccent,
        ];
      } else {
        colours = [
          this.$vuetify.theme.themes.light.missionAccent,
          this.$vuetify.theme.themes.light.baseAccent,
          // this.$vuetify.theme.themes.light.galaxyAccent,
        ];
      }
      return colours;
    },

    // TODO: next topic button (from 'system complete' dialog) NOT working
    nextTopic() {
      // get next topic
      const unlockedTopics = this.personTopics.filter((topic) => {
        return topic.topicStatus == "unlocked";
      });

      // this ensures we arn't going to try navigate to the current unlocked topic
      const nextTopic = unlockedTopics.find((topic) => topic.id !== this.topicId);

      console.log("next topic", nextTopic);

      // set next topic as current topic
      this.setCurrentTopicId(nextTopic.id);

      console.log("router pushing to: /galaxy/" + this.courseId + "/system/" + nextTopic.id);

      // route to page with topicId
      this.$router.push({
        name: "SolarSystemView",
        params: {
          courseId: this.courseId,
          topicId: nextTopic.id,
        },
      });
    },
    missionActivated() {
      // push person if they dont already exist in peopleInTopic
      if (!this.peopleInTopic.find((person) => person.id === this.person.id)) {
        this.peopleInTopic.push(this.person);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
}
#container {
  height: 100vh;
  width: 100%;
  display: flex;
  overflow: hidden;
  margin: 0 !important;
  padding: 30px 20px 0px;
}

#left-section {
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  overflow-y: scroll;
  padding-bottom: 50px;
}
#main-section {
  width: 60%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid pink;
}
#right-section {
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-direction: column;
}

.galaxy-frame {
  position: relative;
  width: 100%;
  margin: 30px 20px;
  border: 1px solid var(--v-galaxyAccent-base);
  .galaxy-label {
    // ribbon label
    position: absolute;
    top: 0;
    left: -1px;
    background-color: var(--v-galaxyAccent-base);
    color: var(--v-background-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
  }
}

/* width */
::-webkit-scrollbar {
  width: 0px;
}

/* Track */
::-webkit-scrollbar-track {
  background: var(--v-background-base);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--v-background-base);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--v-background-base);
}
</style>
