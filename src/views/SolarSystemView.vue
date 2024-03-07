<template>
  <div v-if="!loading" id="container" class="bg">
    <!--==== Left section ====-->
    <div id="left-section">
      <SolarSystemInfo
        :topic="getTopicById(currentTopicId)"
        :tasks="teacher ? topicsTasks : personsTopicsTasks"
        :teacher="teacher"
        :course="course"
      />
      <!-- <SolarSystemInfo
        :topic="
          teacher ? 
            getTopicById(currentTopicId) :
            getPersonsTopicById(currentTopicId)
        "
        :tasks="teacher ? topicsTasks : personsTopicsTasks"
        :teacher="teacher"
      /> -->
      <AssignedInfo
        v-if="!draft && peopleInTopic.length"
        :assignCohorts="true"
        :people="peopleInTopic"
      />

      <BackButton :toPath="'/galaxy/' + currentCourseId" />
    </div>

    <!--==== Main section ====-->
    <div id="main-section">
      <MissionsList
        :topic="topic"
        :tasks="teacher ? topicsTasks : personsTopicsTasks"
        :teacher="teacher"
        @task="taskForHelpInfo($event)"
        @missionActivated="peopleInTopic.push(person)"
      />
    </div>

    <!--==== Right section ====-->
    <div id="right-section">
      <RequestForHelpTeacherFrame
        :courses="[course]"
        :isTeacher="teacher"
        :students="peopleInTopic"
      />
      <SubmissionTeacherFrame
        v-if="teacher"
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
            <v-btn small text :to="'/galaxy/' + currentCourseId">&lt;- back to galaxy</v-btn>
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
import SolarSystemInfo from "@/components/SolarSystemView/SolarSystemInfo.vue";
import AssignedInfo from "@/components/Reused/AssignedInfo.vue";
import MissionsList from "@/components/SolarSystemView/MissionsList.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import SubmissionTeacherFrame from "@/components/Reused/SubmissionTeacherFrame.vue";
import RequestForHelpTeacherFrame from "@/components/Reused/RequestForHelpTeacherFrame.vue";
import {
  fetchAllPeopleInCourseByCourseId,
  fetchCourseByCourseId,
  fetchPersonsTopicByPersonIdCourseIdTopicId,
  fetchTopicByCourseIdTopicId,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
import confetti from "canvas-confetti";

export default {
  name: "SolarSystemView",
  components: {
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
      course: null,
      topic: null,
      activeMission: null,
      task: null,
      unsubscribes: [],
      peopleInTopic: [],
      loading: true,
      currentTask: null,
      topicCompletedDialog: false,
      unlockingNextTopic: true, // default to loading
      showNextSystemButton: true,
    };
  },
  async mounted() {
    await this.bindCourseTopics(this.courseId);
    this.setCurrentCourseId(this.courseId);
    this.setCurrentTopicId(this.topicId);

    this.course = await fetchCourseByCourseId(this.currentCourseId);
    this.topic = await fetchTopicByCourseIdTopicId(this.currentCourseId, this.currentTopicId);

    this.getPeopleInTopic();

    if (this.teacher) {
      //store bindTasksByTopicId
      await this.bindTasksByTopicId({
        courseId: this.currentCourseId,
        topicId: this.currentTopicId,
      });
    } else {
      // store bindPersonsTasksByTopicId
      await this.bindPersonsTasksByTopicId({
        personId: this.person.id,
        courseId: this.currentCourseId,
        topicId: this.currentTopicId,
      });
    }

    // check if requests are binded
    // console.log("from store requestsForHelp: ", this.requestsForHelp);

    // set active task
    this.task = this.getActiveMission();
    // filter help for active task
    // this.requests = this.requestsForHelp.filter(
    //   (request) => request.contextTask.id == this.currentTaskId
    // );

    this.loading = false;
  },
  watch: {
    personsCurrentTopic() {
      this.getPeopleInTopic();
    },
    topicCompleted(topic) {
      console.log("topic completed (from watch)", topic);
      if (topic.topicId == this.currentTopicId && topic.completed == true) {
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
  },
  computed: {
    ...mapState(useRootStore, [
      "currentCourseId",
      "currentTopicId",
      "currentTaskId",
      "topicsTasks",
      "personsTopicsTasks",
      "personsTopics",
      "person",
      "getPersonsTopicById",
      "getTopicById",
      "getTasksByTopicId",
      "user",
      "topicCompleted",
      "nextTopicUnlockedFlag",
    ]),
    draft() {
      return this.course.status === "drafting";
    },
    teacher() {
      return this.course.mappedBy?.personId === this.person.id || this.user.data.admin;
    },
    personsCurrentTopic() {
      return this.personsTopics.find((topic) => topic.id == this.currentTopicId);
    },
  },
  methods: {
    ...mapActions(useRootStore, [
      "bindCourseTopics",
      "bindPersonsTasksByTopicId",
      "bindTasksByTopicId",
      "setCurrentCourseId",
      "setCurrentTopicId",
      "setCurrentTaskId",
      "setNextTopicUnlocked",
    ]),
    taskForHelpInfo(task) {
      this.task = task;
    },
    getActiveMission() {
      const activeMissionObj = this.personsTopicsTasks.find((taskObj) => {
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
            this.currentCourseId,
            this.currentTopicId,
          );
          if (personsTopic.topicStatus == "active") {
            people.push(person);
          }
        }),
      );
      this.peopleInTopic = people;
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
    nextTopic() {
      // get next topic
      const unlockedTopics = this.personsTopics.filter((topic) => {
        return topic.topicStatus == "unlocked";
      });

      // this ensures we arn't going to try navigate to the current unlocked topic
      const nextTopic = unlockedTopics.find((topic) => topic.id !== this.currentTopicId);

      // set next topic as current topic
      this.setCurrentTopicId(nextTopic.id);

      console.log("router pushing to: /galaxy/" + this.currentCourseId + "/system/" + nextTopic.id);

      // route to page with topicId
      this.$router.push({
        name: "SolarSystemView",
        params: {
          courseId: this.currentCourseId,
          topicId: nextTopic.id,
        },
      });
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
