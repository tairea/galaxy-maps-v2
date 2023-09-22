<template>
  <div v-if="!loading" id="container" class="bg">
    <!--==== Left section ====-->
    <div id="left-section">
      <SolarSystemInfo
        :topic="getTopicById(currentTopicId)"
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

      <!-- Order change button -->
      <div class="save-changes mt-4">
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

      <BackButton :toPath="'/galaxy/' + currentCourseId" />
    </div>

    <!--==== Main section ====-->
    <div id="main-section">
      <MissionsList
        :tasks="teacher ? sortedTopicsTasks : sortedPersonsTopicsTasks"
        :topicId="currentTopicId"
        :teacher="teacher"
        :disableCreateMission="orderChanged"
        @task="taskForHelpInfo($event)"
        @missionActivated="peopleInTopic.push(person)"
        @topicCompleted="getPeopleInTopic"
        @orderChanged="missionOrderChanged"
      />
    </div>

    <!--==== Right section ====-->
    <div id="right-section">
      <RequestForHelpTeacherFrame
        :courses="[getCourseById(currentCourseId)]"
        :isTeacher="teacher"
        :students="peopleInTopic"
      />
      <SubmissionTeacherFrame
        :courses="[getCourseById(currentCourseId)]"
        :isTeacher="teacher"
        :students="teacher ? peopleInTopic : [person]"
        class="mt-4"
      />
    </div>
  </div>
</template>

<script>
import SolarSystemInfo from "@/components/SolarSystemInfo.vue";
import AssignedInfo from "@/components/AssignedInfo.vue";
import MissionsInfo from "@/components/MissionsInfo.vue";
import MissionsList from "@/components/MissionsList.vue";
import SolarSystem from "@/components/SolarSystem.vue";
import BackButton from "@/components/BackButton.vue";
import SubmissionTeacherFrame from "@/components/SubmissionTeacherFrame.vue";
import RequestForHelpTeacherFrame from "@/components/RequestForHelpTeacherFrame.vue";
import { getPersonsTopicById } from "@/lib/ff";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
import { mdiContentSave } from "@mdi/js";
import { db } from "@/store/firestoreConfig";

export default {
  name: "SolarSystemView",
  components: {
    SolarSystemInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    SolarSystem,
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
    };
  },
  async mounted() {
    await this.bindCourses({ owner: null });
    await this.bindCourseTopics(this.courseId);
    this.setCurrentCourseId(this.courseId);
    this.setCurrentTopicId(this.topicId);
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
      "currentTask",
      "topicsTasks",
      "personsTopicsTasks",
      "personsTopics",
      "peopleInCourse",
      "person",
      "getPersonsTopicById",
      "getCourseById",
      "getTopicById",
      "getTasksByTopicId",
      "user",
    ]),
    draft() {
      return this.getCourseById(this.currentCourseId).status === "drafting";
    },
    teacher() {
      return (
        this.getCourseById(this.currentCourseId)?.mappedBy?.personId === this.person.id ||
        this.user.data.admin
      );
    },
    personsCurrentTopic() {
      return this.personsTopics.find((topic) => topic.id == this.currentTopicId);
    },
    sortedTopicsTasks() {
      if (this.topicsTasks.some((task) => task.orderIndex != null)) {
        console.log("tasks have orderIndex, sorting by orderIndex");
        return this.topicsTasks.sort((a, b) => a.orderIndex - b.orderIndex);
      } else {
        console.log("tasks do not have orderIndex, sorting by timestamp:");
        return this.topicsTasks.sort((a, b) => a.taskCreatedTimestamp - b.taskCreatedTimestamp);
      }
    },
    sortedPersonsTopicsTasks() {
      if (this.personsTopicsTasks.some((task) => task.orderIndex != null)) {
        console.log("tasks have orderIndex, sorting by orderIndex");
        return this.personsTopicsTasks.sort((a, b) => a.orderIndex - b.orderIndex);
      } else {
        console.log("tasks do not have orderIndex, sorting by timestamp");
        return this.personsTopicsTasks.sort(
          (a, b) => a.taskCreatedTimestamp - b.taskCreatedTimestamp,
        );
      }
    },
  },
  methods: {
    ...mapActions(useRootStore, [
      "bindCourses",
      "bindCourseTopics",
      "bindPersonsTasksByTopicId",
      "bindTasksByTopicId",
      "setCurrentCourseId",
      "setCurrentTopicId",
      "setCurrentTask",
      "setCurrentTaskId",
      "updateTopicTasks",
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
        this.setCurrentTask(activeMissionObj);
      } else {
        return;
      }
      // console.log("active mission:", activeMissionObj);
      return activeMissionObj;
    },
    async getPeopleInTopic() {
      let people = [];
      this.peopleInCourse.forEach(async (person) => {
        let personsTopic = await getPersonsTopicById(
          person.id,
          this.getCourseById(this.currentCourseId).id,
          this.getTopicById(this.currentTopicId).id,
        );
        if (personsTopic.topicStatus == "active") people.push(person);
      });
      this.peopleInTopic = people;
    },
    missionOrderChanged(event) {
      this.orderChanged = true;
      let value = event;
      let orderChanges = [];

      for (let i = 0; i < value.length; i++) {
        console.log(
          value[i].title +
            " " +
            value[i].orderIndex +
            "===" +
            this.topicsTasks[i].title +
            " " +
            this.topicsTasks[i].orderIndex,
        );
        if (value[i].orderIndex === this.topicsTasks[i].orderIndex) {
          continue;
        } else {
          value[i].orderIndex = i;
          orderChanges.push(value[i]);
        }
      }
      console.log("orderchanges", orderChanges);
      this.newMissionOrder = orderChanges;
    },
    async saveNewMissionOrder() {
      this.savingNewMissionOrder = true;

      for (let i = 0; i < this.newMissionOrder.length; i++) {
        await db
          .collection("courses")
          .doc(this.currentCourseId)
          .collection("topics")
          .doc(this.currentTopicId)
          .collection("tasks")
          .doc(this.newMissionOrder[i].id)
          .set(this.newMissionOrder[i]);
        console.log("db update done for: ", this.newMissionOrder[i].title);
      }

      // bind again because i think i brake the binding with updateTopicTasks
      // await this.bindTasksByTopicId({
      //   courseId: this.currentCourseId,
      //   topicId: this.currentTopicId,
      // });

      this.savingNewMissionOrder = false;
      this.orderChanged = false;
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
