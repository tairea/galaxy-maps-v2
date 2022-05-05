<template>
  <div id="container" class="bg">
    <!--==== Left section ====-->
    <div id="left-section">
      <SolarSystemInfo
        :topic="currentTopic"
        :tasks="teacher ? topicsTasks : personsTopicsTasks"
        :teacher="teacher"
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

      <BackButton :toPath="{ path: '/galaxy/' + currentCourseId }" />
    </div>

    <!--==== Main section ====-->
    <div id="main-section">
      <MissionsList
        :tasks="teacher ? topicsTasks : personsTopicsTasks"
        :topicId="currentTopicId"
        :teacher="teacher"
        @task="taskForHelpInfo($event)"
        @missionActivated="peopleInTopic.push(person)"
        @topicCompleted="getPeopleInTopic"
      />
    </div>

    <!--==== Right section ====-->
    <div id="right-section">
      <RequestsForHelpTeacherFrame :courses="[currentCourse]" :isTeacher="teacher" :students="peopleInTopic"/>
      <SubmissionTeacherFrame :courses="[currentCourse]" :isTeacher="teacher" :students="teacher ? peopleInTopic : [person]" class="mt-4"/> 
      <!-- <SubmissionInfo v-if="task && task.submissionRequired == true" :task="task" :submissions="submissions" /> -->
    </div>
  </div>
</template>

<script>
import SolarSystemInfo from "../components/SolarSystemInfo";
import AssignedInfo from "../components/AssignedInfo";
import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";
import SubmissionInfo from "../components/SubmissionInfo";
import SolarSystem from "../components/SolarSystem";
import BackButton from "../components/BackButton";
import SubmissionTeacherFrame from "../components/SubmissionTeacherFrame";
import RequestsForHelpTeacherFrame from '../components/RequestForHelpTeacherFrame.vue'

import { mapState, mapGetters } from "vuex";
import { getPersonsTopicById } from "../lib/ff";


export default {
  name: "SolarSystemView",
  components: {
    SolarSystemInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    SubmissionInfo,
    // RequestsForHelpInfo,
    SolarSystem,
    BackButton,
    RequestsForHelpTeacherFrame,
    SubmissionTeacherFrame
  },
  props: ["topicId"],
  data() {
    return {
      activeMission: null,
      task: null,
      unsubscribes: [],
      peopleInTopic: []
    };
  },
  async mounted() {
    this.getPeopleInTopic()
    if (this.teacher) {
      //store bindTasksByTopicId
      await this.$store.dispatch("bindTasksByTopicId", {
        courseId: this.currentCourseId,
        topicId: this.currentTopicId,
      });
    } else {
      // store bindPersonsTasksByTopicId
      await this.$store.dispatch("bindPersonsTasksByTopicId", {
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
  },
  watch: {
    personsCurrentTopic() {
      this.getPeopleInTopic()
    }
  },
  computed: {
    ...mapState([
      "currentCourseId",
      "currentTopicId",
      "currentTaskId",
      "currentCourse",
      "currentTopic",
      "currentTask",
      "topicsTasks",
      "personsTopicsTasks",
      "personsTopics",
      "peopleInCourse"
    ]),
    ...mapGetters([
      "person",
      "getPersonsTopicById",
      "getTopicById",
      "getTasksByTopicId",
      "user",
    ]),
    draft() {
      return this.currentCourse.status === "drafting";
    },
    teacher() {
      return (
        this.currentCourse?.mappedBy?.personId === this.person.id ||
        this.user.data.admin
      );
    },
    personsCurrentTopic() {
      return this.personsTopics.find(topic => topic.id == this.currentTopicId)
    }
  },
  methods: {
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
        this.$store.commit("setCurrentTaskId", activeMissionObj.id);
        this.$store.commit("setCurrentTask", activeMissionObj);
      } else {
        return;
      }
      // console.log("active mission:", activeMissionObj);
      return activeMissionObj;
    },
    async getPeopleInTopic () {
      console.log('4, getting people in topic')
      let people = []
      this.peopleInCourse.forEach(async person => {
        let personsTopic = await getPersonsTopicById(person.id, this.currentCourse.id, this.currentTopic.id)
        if (personsTopic.topicStatus == 'active') people.push(person)
      })
      this.peopleInTopic = people
    }
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
  padding: 0px 20px
  // border: 1px solid red;
}

#left-section {
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
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
