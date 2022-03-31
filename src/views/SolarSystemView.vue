<template>
  <div id="container" class="bg">
    <div id="left-section">
      <SolarSystemInfo
        :topic="
          teacher ? 
            getTopicById(currentTopicId) :
            getPersonsTopicById(currentTopicId)
        "
        :tasks="
          teacher ? topicsTasks : personsTopicsTasks
        "
        :teacher="teacher"
      />
      <!-- <MissionsInfo :missions="galaxy.planets"/> -->
      <AssignedInfo
        v-if="!draft && teacher"
        :assignCohorts="true"
        :people="peopleInCourse"
        :cohorts="cohortsInCourse"
      />

      <BackButton :toPath="{ path: '/galaxy/' + currentCourseId}" />
    </div>
    <div id="main-section">
      <MissionsList
        :tasks="
          teacher ? topicsTasks : personsTopicsTasks
        "
        :topicId="currentTopicId"
        :teacher="teacher"
      />
    </div>
    <div id="right-section">
      <!-- <div class="galaxy-frame">
        <h2 class="galaxy-label">Map</h2>
        <SolarSystem :topic="getTopicById(currentTopicId)" :size="'0.25em'" />
      </div> -->
      <RequestsForHelpInfo v-if="activeMission" :requests="requestsForHelp" />
    </div>
  </div>
</template>

<script>
import SolarSystemInfo from "../components/SolarSystemInfo";
import AssignedInfo from "../components/AssignedInfo";
import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";
import RequestsForHelpInfo from "../components/RequestsForHelpInfo";
import SolarSystem from "../components/SolarSystem";
import BackButton from "../components/BackButton";

import { mapState, mapGetters } from "vuex";

export default {
  name: "SolarSystemView",
  components: {
    SolarSystemInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    RequestsForHelpInfo,
    SolarSystem,
    BackButton,
  },
  props: ["topicId"],
  async mounted() {
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
      console.log("persons topic tasks: ", this.personsTopicsTasks);
    }

    // bind requests for help
    await this.$store.dispatch("bindRequestsForHelp", {
      courseId: this.currentCourseId,
      topicId: this.currentTopicId,
      taskId: this.currentTaskId,
    });

    // check if requests are binded
    console.log("from store requestsForHelp: ", this.requestsForHelp);

    this.getActiveMission();

    // console.log("setCurrentTaskId: ", this.activeMission.id);
    // this.$store.commit("setCurrentTaskId", this.activeMission.id);
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
      "requestsForHelp",
      "peopleInCourse",
      "cohortsInCourse",
    ]),
    ...mapGetters([
      "person",
      "getPersonsTopicById",
      "getTopicById",
      "getTasksByTopicId",
      "user"
    ]),
    draft() {
      return this.currentCourse.status === "drafting"
    },
    teacher() {
      return this.currentCourse?.mappedBy?.personId === this.person.id || this.user.data.admin
    }
  },
  data() {
    return {
      activeMission: null,
    };
  },
  methods: {
    getActiveMission() {
      const activeMissionObj = this.personsTopicsTasks.find((taskObj) => {
        return taskObj.taskStatus == "active";
      });
      if (activeMissionObj) {
        this.activeMission = true;
        // set as current/active task (if not already?)
        this.$store.commit("setCurrentTaskId", activeMissionObj.id);
        this.$store.commit("setCurrentTask", activeMissionObj);
      }
      return activeMissionObj;
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
