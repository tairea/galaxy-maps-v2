<template>
  <div :id="studentOverview ? 'studentOverview' : cohortId">
    <h2 v-if="!studentOverview" class="help-label">Requests for help</h2>

    <div v-if="requests.length > 0">
      <RequestForHelpTeacherPanel
        v-for="request in requests"
        :key="request.id"
        :request="request"
        :isTeacher="isTeacher"
        :isDashboardView="isDashboardView"
        :showCourseImage="showCourseImage"
      />
    </div>
    <div v-if="!loading && requests.length == 0">
      <p class="overline pt-4 text-center mb-0" style="color: var(--v-galaxyAccent-base)">
        NO {{ completedRequestsOnly ? "COMPLETED" : "" }} REQUESTS FOR HELP
      </p>
    </div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center mt-4">
      <v-btn v-if="loading" :loading="loading" icon color="galaxyAccent"></v-btn>
    </div>
  </div>
</template>

<script>
import RequestForHelpTeacherPanel from "@/components/Reused/RequestForHelpTeacherFrame/RequestForHelpTeacherPanel.vue";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "RequestForHelpTeacherFrame",
  components: {
    RequestForHelpTeacherPanel,
  },
  props: [
    "courses",
    "isTeacher",
    "students",
    "noSubmissions",
    "studentOverview",
    "showCourseImage",
    "loading",
    "completedRequestsOnly",
    "allStudentsRequests",
  ],
  data() {
    return {
      unsubscribes: [],
    };
  },
  async mounted() {
    if (this.courses) {
      for (const course of this.courses) {
        // console.log("getting requests for course: ", course);
        const unsubscribe = await this.getRequestsForHelpByCourseId(course.id);
        console.log("help unsubscribe:", unsubscribe);
        this.unsubscribes.push(unsubscribe);
      }
    }
  },
  computed: {
    ...mapState(useRootStore, [
      "teachersRequestsForHelp",
      "user",
      "currentCohort",
      "showPanelCard",
      "currentTopicId",
      "currentTaskId",
    ]),
    isGalaxyView() {
      return this.$route.name == "GalaxyView";
    },
    isCohortView() {
      return this.$route.name == "CohortView";
    },
    isDashboardView() {
      return this.$route.name == "Dashboard";
    },
    isSystemView() {
      return this.$route.name == "SolarSystemView";
    },
    cohortId() {
      return this.noSubmissions ? "student-help-panel" : "help-panel";
    },
    requests() {
      // const requests = this.teachersRequestsForHelp.filter(
      //   (request) => request.requestForHelpStatus == "unanswered"
      // );

      console.log("this.teachersRequestsForHelp", this.teachersRequestsForHelp);
      console.log("this.allStudentsRequests", this.allStudentsRequests);

      // forgot why using this filter - students.some logic.
      // im thinking reuqests are relevant to everyone so why need to filter by specific students
      const requests = (
        this.allStudentsRequests ? this.allStudentsRequests : this.teachersRequestsForHelp
      ).filter((request) =>
        this.students?.some((student) => {
          return student.id ? student.id === request.personId : student === request.personId;
        }),
      );

      let filteredRequests = [];

      // Filter for "completed/answered" only
      if (this.completedRequestsOnly) {
        filteredRequests = requests.filter(
          (request) => request.requestForHelpStatus != "unanswered",
        );
      } else {
        filteredRequests = requests.filter(
          (request) => request.requestForHelpStatus === "unanswered",
        );
      }

      if (this.isTeacher) {
        filteredRequests.sort((a, b) => {
          return a.requestForHelpStatus == "unanswered" ? -1 : 1;
        });
      } else {
        filteredRequests.sort((a, b) => {
          return a.requestForHelpStatus == "unanswered" ? 1 : -1;
        });
      }

      console.log("requests:", requests);
      console.log("filtered requests:", filteredRequests);

      if (this.isCohortView || this.isDashboardView) return filteredRequests;
      else if (this.isGalaxyView) {
        return filteredRequests.filter((request) => request.contextCourse.id == this.courses[0].id);
      } else if (this.isSystemView) {
        const taskRequests = filteredRequests.filter(
          (request) => request.contextTopic.id == this.currentTopicId,
        );
        if (this.isTeacher) return taskRequests;
        else return taskRequests.filter((req) => req.contextTask.id == this.currentTaskId);
      }

      return filteredRequests;
    },
  },
  destroyed() {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
  },
  methods: {
    ...mapActions(useRootStore, ["getRequestsForHelpByCourseId"]),
  },
};
</script>

<style scoped lang="scss">
#help-panel {
  width: 100%;
  border: 1px solid var(--v-galaxyAccent-base);
  margin-top: 30px;
  padding: 20px 15px 20px 20px;
  position: relative;
  backdrop-filter: blur(2px);
  overflow-y: scroll;
  max-height: 40%;
  transition: all 0.2s ease-in-out;
}

#help-panel:hover {
  max-height: 70vh;
}

#student-help-panel {
  width: 100%;
  border: 1px solid var(--v-galaxyAccent-base);
  margin: 30px 0px;
  padding: 20px 10px 20px 20px;
  position: relative;
  backdrop-filter: blur(2px);
  max-height: 100%;
  overflow: scroll;
  overflow-x: hidden;
  transition: all 0.2s ease-in-out;
}

.help-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: 0;
  left: -1px;
  background-color: var(--v-galaxyAccent-base);
  color: var(--v-background-base);
  padding: 0px 20px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
}

*::-webkit-scrollbar {
  width: 5px;
}
/* Track */
*::-webkit-scrollbar-track {
  background: var(--v-background-base);
  margin-top: 1px;
  margin-bottom: 25px;
}
/* Handle */
*::-webkit-scrollbar-thumb {
  background: var(--v-galaxyAccent-base) !important;
}
/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-galaxyAccent-base) !important;
}
</style>
