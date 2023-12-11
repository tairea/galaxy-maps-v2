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
        :tasks="teacher ? topicsTasks : personsTopicsTasks"
        :topicId="currentTopicId"
        :topic="topic"
        :teacher="teacher"
        @task="taskForHelpInfo($event)"
        @missionActivated="peopleInTopic.push(person)"
        @topicCompleted="getPeopleInTopic"
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
      console.log("4, getting people in topic");
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
