<template>
  <div :id="studentOverview ? 'studentOverview' : cohortId">
    <h2 v-if="!studentOverview" class="help-label">
      {{ formatLabel }}
    </h2>

    <div v-if="requests.length > 0">
      <div v-if="dense">
        <RequestForHelpTeacherPanelDense
          v-for="request in requests"
          :key="request.id"
          :request="request"
          :isTeacher="isTeacher"
          :isDashboardView="isDashboardView"
          :showCourseImage="showCourseImage"
        />
      </div>
      <div v-else>
        <RequestForHelpTeacherPanel
          v-for="request in requests"
          :key="request.id"
          :request="request"
          :isTeacher="isTeacher"
          :isDashboardView="isDashboardView"
          :showCourseImage="showCourseImage"
        />
      </div>
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
import RequestForHelpTeacherPanelDense from "@/components/Reused/RequestForHelpTeacherFrame/RequestForHelpTeacherPanelDense.vue";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "RequestForHelpTeacherFrame",
  components: {
    RequestForHelpTeacherPanel,
    RequestForHelpTeacherPanelDense,
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
    "dense",
    "yours",
  ],
  data() {
    return {
      unsubscribes: [],
    };
  },
  async mounted() {
    if (this.courses) {
      for (const course of this.courses) {
        // getRequestsForHelpByCourseId populates this.teachersRequestsForHelp via useRootStore
        const unsubscribe = await this.getRequestsForHelpByCourseId(course.id);
        this.unsubscribes.push(unsubscribe);
      }
      console.log("requests unsubscribes", this.unsubscribes);
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
    formatLabel() {
      if (this.completedSubmissionsOnly) {
        return "COMPLETED Requests";
      } else if (this.yours) {
        return "Your Requests for Help";
      } else {
        return "Requests for help";
      }
    },
    requests() {
      let requests = this.allStudentsRequests
        ? this.allStudentsRequests
        : this.teachersRequestsForHelp;

      // console.log("Initial requests:", requests);

      // filter requests to only show students requests
      if (this.students) {
        requests = requests.filter((request) =>
          this.students?.some((student) => {
            return student.id ? student.id === request.personId : student === request.personId;
          }),
        );
        // console.log("After student filter:", requests);
      }

      // ================== Filter requests ==================
      let filteredRequests = [];
      // Filter for "completed/answered" only
      if (this.completedRequestsOnly) {
        filteredRequests = requests.filter(
          (request) => request.requestForHelpStatus != "unanswered",
        );
      } else if (this.isTeacher) {
        // filter only unanswered requests (teachers only have time for unanswered. and would get very cluttered if showing responsed requests)
        filteredRequests = requests.filter(
          (request) => request.requestForHelpStatus === "unanswered",
        );
      } else {
        // show all requests for students (answered and unanswered)
        filteredRequests = requests;
      }
      // console.log("After status filter:", filteredRequests);

      // ================== Sort requests ==================
      filteredRequests.sort((a, b) => {
        return a.requestForHelpStatus == "unanswered" ? -1 : 1;
      });

      if (this.isDashboardView) {
        // console.log("Returning dashboard view requests:", filteredRequests);
        return filteredRequests;
      }
      // ================== Filter requests based on view ==================
      if (this.isCohortView) {
        // Add debug logs
        // console.log("Courses passed to component:", this.courses);
        // console.log("Filtered requests before course filter:", filteredRequests);

        const filtered = filteredRequests.filter((request) => {
          // console.log("Request course id:", request.contextCourse.id);
          // console.log(
          //   "Matching with courses:",
          //   this.courses?.map((c) => c.id),
          // );
          return this.courses?.some((course) => course.id === request.contextCourse.id);
        });

        // console.log("Requests after course filter:", filtered);
        return filtered;
      }

      if (this.isGalaxyView) {
        return filteredRequests.filter((request) => request.contextCourse.id == this.courses[0].id);
      }

      if (this.isSystemView) {
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
