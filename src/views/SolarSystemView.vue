<template>
  <div id="container" class="bg" :class="{ mobile: isMobile }">
    <!--==== Left section ====-->
    <div id="left-section" v-if="!isMobile">
      <SolarSystemInfo
        v-if="!loading"
        :topic="topic"
        :tasks="teacher ? topicTasks : personTasks"
        :teacher="teacher"
        :course="course"
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

      <AssignedInfo
        v-if="!loading && !draft && peopleInTopic.length"
        :assignCohorts="true"
        :people="peopleInTopic"
        :teacher="teacher"
      />
      <div v-if="!loading && !draft && loadingPeople" class="pa-4 text-center">
        <v-progress-circular
          indeterminate
          size="20"
          color="missionAccent"
          class="mr-2"
        ></v-progress-circular>
        <p class="overline missionAccent--text">Loading other Navigators in this Star System...</p>
      </div>
    </div>

    <!--==== Main section ====-->
    <div id="main-section" :class="{ mobile: isMobile }">
      <!-- loading spinner -->
      <LoadingSpinner v-if="loading" text="loading star system" />

      <!-- Mobile solar system info panel -->
      <MobileSolarSystemInfo
        v-if="isMobile && !loading"
        :course="course"
        :topic="topic"
        :tasks="teacher ? sortedTopicTasks : sortedPersonTasks"
        :teacher="teacher"
        @infoMinimised="infoIsMinimised = $event"
      />

      <MissionsList
        v-if="!loading"
        :course="course"
        :topic="topic"
        :tasks="teacher ? sortedTopicTasks : sortedPersonTasks"
        :teacher="teacher"
        :disableCreateMission="orderChanged"
        :infoIsMinimised="infoIsMinimised"
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

      <v-btn v-if="topicJustCompleted" small text @click="nextTopic" style="bottom: 50px"
        >next system -></v-btn
      >
    </div>

    <!--==== Right section ====-->
    <div id="right-section" v-if="!isMobile">
      <RequestForHelpTeacherFrame
        v-if="!loading"
        :courses="[course]"
        :isTeacher="teacher"
        :students="peopleInTopic"
        :loadingStudents="loadingPeople"
      />
      <SubmissionTeacherFrame
        v-if="!loading && teacher"
        :isTeacher="teacher"
        :courses="[course]"
        :students="peopleInTopic"
        :loadingStudents="loadingPeople"
        class="mt-4"
      />
      <AiConversationPanelDesktop
        ref="aiConversationDesktop"
        :course="course"
        :topic="topic"
        :topicTasks="personTasks"
        :loading="loading"
      />
    </div>

    <!-- AI Conversation Panel -->
    <AiConversationPanel
      v-if="isMobile"
      ref="aiConversationPanel"
      :course="course"
      :task="task"
      :isOpen="aiPanelOpen"
      :isMobile="isMobile"
      :loading="loading"
      @open="openAIAssistant"
      @close="closeAIAssistant"
      @stop-toggle="onStopToggle"
    />

    <!-- Topic completed dialog -->
    <v-dialog v-model="topicCompletedDialog" transition="dialog-bottom-transition" max-width="600">
      <template v-slot:default="topicCompletedDialog">
        <v-card style="border: 1px solid var(--v-baseAccent-base)">
          <v-toolbar color="baseAccent overline" light>Great work, Navigator!</v-toolbar>
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
            <v-btn v-else small text :to="'/galaxy/' + courseId">No other unlocked Systems</v-btn>
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
import MobileSolarSystemInfo from "@/components/SolarSystemView/MobileSolarSystemInfo.vue";
import AiConversationPanel from "@/components/Reused/AiConversationPanel.vue";
import AiConversationPanelDesktop from "@/components/Reused/AiConversationPanelDesktop.vue";
import {
  fetchAllPeopleInCourseByCourseId,
  fetchPersonsTopicByPersonIdCourseIdTopicId,
} from "@/lib/ff";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import useSolarSystemViewStore from "@/store/solarSystemView";
import { mapActions, mapState } from "pinia";
import { mdiContentSave, mdiRobotExcited } from "@mdi/js";
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
    MobileSolarSystemInfo,
    AiConversationPanel,
    AiConversationPanelDesktop,
  },
  props: ["courseId", "topicId"],
  data() {
    return {
      mdiContentSave,
      mdiRobotExcited,
      activeMission: null,
      task: null,
      unsubscribes: [],
      peopleInTopic: [],
      loading: true,
      loadingPeople: true,
      orderChanged: false,
      newMissionOrder: [],
      savingNewMissionOrder: false,
      updateViaKey: 0,
      currentTask: null,
      topicCompletedDialog: false,
      topicJustCompleted: false,
      unlockingNextTopic: true, // default to loading
      showNextSystemButton: true,
      infoIsMinimised: false,
      aiPanelOpen: false,
    };
  },
  async mounted() {
    const startTime = performance.now();
    console.log("🚀 SolarSystemView mounted() started");

    const step1Start = performance.now();
    this.setCurrentCourseId(this.courseId);
    this.setCurrentTopicId(this.topicId);
    console.log(
      `⏱️ Step 1 (setCurrentCourseId/TopicId): ${((performance.now() - step1Start) / 1000).toFixed(3)}s`,
    );

    // load Topic & course data
    const step2Start = performance.now();
    await this.loadTopic(this.courseId, this.topicId);
    console.log(`⏱️ Step 2 (loadTopic): ${((performance.now() - step2Start) / 1000).toFixed(3)}s`);

    const step3Start = performance.now();
    if (this.teacher) {
      await this.refreshTasks();
    } else {
      await this.refreshPersonTopicsAndTasks(this.person.id);
    }
    console.log(
      `⏱️ Step 3 (refreshTasks/refreshPersonTopicsAndTasks): ${((performance.now() - step3Start) / 1000).toFixed(3)}s`,
    );

    // set active task
    const step4Start = performance.now();
    this.task = this.getActiveMission();
    console.log(
      `⏱️ Step 4 (getActiveMission): ${((performance.now() - step4Start) / 1000).toFixed(3)}s`,
    );

    this.loading = false;
    console.log(`🎯 Total mounted() time: ${((performance.now() - startTime) / 1000).toFixed(3)}s`);

    // Load people in topic asynchronously after UI is shown (non-blocking)
    this.getPeopleInTopic();

    // Watch for AI assistant trigger to open appropriate panel
    this.$watch(
      () => this.aiAssistantTrigger?.ts,
      async () => {
        if (!this.aiAssistantTrigger?.requested) return;
        if (this.isMobile) {
          await this.openAIAssistant();
        } else {
          // Desktop: open AiConversationPanelDesktop via its API
          await this.$nextTick();
          const desktopPanel = this.$refs?.aiConversationDesktop;
          if (desktopPanel && typeof desktopPanel.openPanel === "function") {
            desktopPanel.openPanel();
          }
        }
        // Clear trigger
        this.clearAiAssistantTrigger();
      },
      { immediate: false },
    );
  },
  watch: {
    personTasks: {
      handler(newTasks) {
        // Update the task when personTasks change (e.g., when a mission is started)
        this.task = this.getActiveMission();
      },
      deep: true,
    },
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
    ...mapState(useRootStore, ["aiAssistantTrigger"]),
    draft() {
      return this.course.status === "drafting";
    },
    teacher() {
      const startTime = performance.now();
      const result =
        this.course.mappedBy?.personId === this.person.id ||
        this.user.data.admin ||
        (this.course?.collaboratorIds && this.course.collaboratorIds.includes(this.person.id));
      console.log(
        `⏱️ teacher computed: ${((performance.now() - startTime) / 1000).toFixed(3)}s (result: ${result})`,
      );
      return result;
    },
    sortedTopicTasks() {
      const startTime = performance.now();
      if (this.topicTasks.some((task) => task.orderIndex != null)) {
        console.log("tasks have orderIndex, sorting by orderIndex");
        const result = this.topicTasks.sort((a, b) => a.orderIndex - b.orderIndex);
        console.log(
          `⏱️ sortedTopicTasks (by orderIndex): ${((performance.now() - startTime) / 1000).toFixed(3)}s`,
        );
        return result;
      } else {
        console.log("tasks do not have orderIndex, sorting by timestamp:");
        const result = this.topicTasks.sort((a, b) => {
          if (a.taskCreatedTimestamp._seconds) {
            return a.taskCreatedTimestamp._seconds - b.taskCreatedTimestamp._seconds;
          } else if (a.taskCreatedTimestamp.seconds) {
            return a.taskCreatedTimestamp.seconds - b.taskCreatedTimestamp.seconds;
          } else {
            return a.taskCreatedTimestamp - b.taskCreatedTimestamp;
          }
        });
        console.log(
          `⏱️ sortedTopicTasks (by timestamp): ${((performance.now() - startTime) / 1000).toFixed(3)}s`,
        );
        return result;
      }
    },
    sortedPersonTasks() {
      const startTime = performance.now();
      if (this.personTasks.some((task) => task.orderIndex != null)) {
        console.log("tasks have orderIndex, sorting by orderIndex");
        const result = this.personTasks.sort((a, b) => a.orderIndex - b.orderIndex);
        console.log(
          `⏱️ sortedPersonTasks (by orderIndex): ${((performance.now() - startTime) / 1000).toFixed(3)}s`,
        );
        return result;
      } else {
        console.log("tasks do not have orderIndex, sorting by timestamp");
        const result = this.personTasks.sort((a, b) => {
          if (a.taskCreatedTimestamp._seconds) {
            return a.taskCreatedTimestamp._seconds - b.taskCreatedTimestamp._seconds;
          } else if (a.taskCreatedTimestamp.seconds) {
            return a.taskCreatedTimestamp.seconds - b.taskCreatedTimestamp.seconds;
          } else {
            return a.taskCreatedTimestamp - b.taskCreatedTimestamp;
          }
        });
        console.log(
          `⏱️ sortedPersonTasks (by timestamp): ${((performance.now() - startTime) / 1000).toFixed(3)}s`,
        );
        return result;
      }
    },
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  methods: {
    ...mapActions(useRootStore, [
      "setCurrentCourseId",
      "setCurrentTopicId",
      "setCurrentTaskId",
      "setNextTopicUnlocked",
      "setStartMissionLoading",
      "clearAiAssistantTrigger",
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
      const startTime = performance.now();
      console.log("🔍 getActiveMission called, personTasks:", this.personTasks);
      const activeMissionObj = this.personTasks.find((taskObj) => {
        console.log("🔍 Checking task:", taskObj.id, "status:", taskObj.taskStatus);
        return taskObj.taskStatus == "active" || taskObj.taskStatus == "declined";
      });
      if (activeMissionObj) {
        this.activeMission = true;
        // set as current/active task (if not already?)
        this.setCurrentTaskId(activeMissionObj.id);
        this.currentTask = activeMissionObj;
        console.log("✅ Found active mission:", activeMissionObj);
      } else {
        console.log("❌ No active mission found");
        this.activeMission = false;
        return null;
      }
      console.log(
        `⏱️ getActiveMission time: ${((performance.now() - startTime) / 1000).toFixed(3)}s`,
      );
      return activeMissionObj;
    },
    async getPeopleInTopic() {
      const startTime = performance.now();
      console.log("5, getting people in topic");
      const people = [];

      const step1Start = performance.now();
      const peopleInCourse = await fetchAllPeopleInCourseByCourseId(this.courseId);
      console.log(
        `⏱️ getPeopleInTopic - fetchAllPeopleInCourseByCourseId: ${((performance.now() - step1Start) / 1000).toFixed(3)}s (found ${peopleInCourse.length} people)`,
      );

      const step2Start = performance.now();
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
      console.log(
        `⏱️ getPeopleInTopic - fetchPersonsTopicByPersonIdCourseIdTopicId (${peopleInCourse.length} calls): ${((performance.now() - step2Start) / 1000).toFixed(3)}s`,
      );

      this.peopleInTopic = people;
      this.loadingPeople = false;
      console.log(
        `🎯 getPeopleInTopic total time: ${((performance.now() - startTime) / 1000).toFixed(3)}s (found ${people.length} active people)`,
      );
    },
    async missionStarted(taskId) {
      console.log("🚀 missionStarted called with taskId:", taskId);
      await this.refreshTopic();
      await this.refreshPersonTopicsAndTasks(this.person.id);

      // Add a small delay to ensure database changes are reflected
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update the task to reflect the new active mission
      console.log("🔄 Updating task after mission start...");
      this.task = this.getActiveMission();
      console.log("📋 Updated task:", this.task);

      // change startMissionLoading to false (for use in StartMissionDialogV.vue)
      this.setStartMissionLoading(false);
    },
    async missionSubmittedForReview(taskId) {
      console.log("mission submitted for review", taskId);
      await this.refreshPersonTopicsAndTasks(this.person.id);
      // Update the task to reflect any changes
      this.task = this.getActiveMission();
    },
    async missionCompleted(taskId) {
      console.log("mission completed", taskId);
      await this.refreshTopic();
      await this.refreshPersonTopicsAndTasks(this.person.id);
      // Update the task to reflect any changes
      this.task = this.getActiveMission();
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
      this.topicJustCompleted = true;
      this.getPeopleInTopic();
      this.topicCompletedDialog = true;
      // === Basic Cannon
      // confetti({
      //   particleCount: 100,
      //   spread: 70,
      //   origin: { y: 0.6 },
      // });

      // === Fireworks
      // const duration = 15 * 1000;
      // const animationEnd = Date.now() + duration;
      // const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      // var interval = setInterval(() => {
      //   const timeLeft = animationEnd - Date.now();

      //   if (timeLeft <= 0) {
      //     return clearInterval(interval);
      //   }

      //   const particleCount = 50 * (timeLeft / duration);
      //   // since particles fall down, start a bit higher than random
      //   confetti({
      //     ...defaults,
      //     particleCount,
      //     origin: { x: this.randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      //     colors: this.getGMColours(),
      //   });
      //   confetti({
      //     ...defaults,
      //     particleCount,
      //     origin: { x: this.randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      //     colors: this.getGMColours(),
      //   });
      // }, 250);
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

      if (!nextTopic) {
        console.log("no next topic");
        this.showNextSystemButton = false;
        return;
      } else {
        // set next topic as current topic
        this.setCurrentTopicId(nextTopic.id);

        console.log("router pushing to: /galaxy/" + this.courseId + "/star/" + nextTopic.id);

        // route to page with topicId
        this.$router.push({
          name: "SolarSystemView",
          params: {
            courseId: this.courseId,
            topicId: nextTopic.id,
          },
        });
      }
    },
    missionActivated() {
      // push person if they dont already exist in peopleInTopic
      if (!this.peopleInTopic.find((person) => person.id === this.person.id)) {
        this.peopleInTopic.push(this.person);
      }
    },
    async openAIAssistant() {
      this.aiPanelOpen = true;
      console.log("AI Assistant panel opened");

      // Wait for the component to be rendered, then initialize
      await this.$nextTick();
      if (this.$refs.aiConversationPanel) {
        await this.$refs.aiConversationPanel.openPanel();
      }
    },
    async closeAIAssistant() {
      // The child component already handles disconnection via closePanel()
      // when the close button is clicked, so we just need to update the UI state
      this.aiPanelOpen = false;
      console.log("AI Assistant panel closed");
    },
    onStopToggle(isStopped) {
      console.log("AI Assistant stopped:", isStopped);
      // TODO: Implement stop/start functionality
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

  &.mobile {
    padding: 0px;
    height: calc(var(--vh, 1vh) * 100) !important;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

#left-section {
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  overflow-y: auto;
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
  &.mobile {
    width: 100%;
    height: auto;
    min-height: auto;
    flex: 1;
  }
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
