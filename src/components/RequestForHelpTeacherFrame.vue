<template>
  <div :id="cohortId">
    <h2 class="help-label">Requests for help</h2>

    <div v-if="requests.length > 0">
      <RequestForHelpTeacherPanel
        v-for="request in requests"
        :key="request.id"
        :request="request"
        :isTeacher="isTeacher"
        :isDashboardView="isDashboardView"
      />
    </div>
    <div v-if="!loading && requests.length == 0">
      <p class="overline pt-4 text-center mb-0" style="color: var(--v-galaxyAccent-base)">
        NO REQUESTS FOR HELP
      </p>
    </div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center mt-4">
      <v-btn v-if="loading" :loading="loading" icon color="galaxyAccent"></v-btn>
    </div>
  </div>
</template>

<script>
import RequestForHelpTeacherPanel from "@/components/RequestForHelpTeacherPanel.vue";
import { dbMixins } from "@/mixins/DbMixins";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "RequestForHelpTeacherFrame",
  mixins: [dbMixins],
  components: {
    RequestForHelpTeacherPanel,
  },
  props: ["courses", "isTeacher", "students", "noSubmissions"],
  data() {
    return {
      loading: false,
      unsubscribes: [],
    };
  },
  async mounted() {
    this.loading = true;
    for (const course of this.courses) {
      console.log("getting requests for course: ", course);
      const unsubscribe = await this.getRequestsForHelpByCourseId(course.id);
      this.unsubscribes.push(unsubscribe);
    }
    this.loading = false;
  },
  computed: {
    ...mapState(useRootStore, [
      "teachersRequestsForHelp",
      "user",
      "currentCohort",
      "showPanelCard",
      "currentTopic",
      "currentTask",
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
      const requests = this.teachersRequestsForHelp.filter((request) =>
        this.students?.some((student) => {
          return student.id ? student.id === request.personId : student === request.personId;
        }),
      );
      if (this.isTeacher) {
        requests.sort((a, b) => {
          return a.requestForHelpStatus == "unanswered" ? -1 : 1;
        });
      } else {
        requests.sort((a, b) => {
          return a.requestForHelpStatus == "unanswered" ? 1 : -1;
        });
      }

      if (this.isCohortView || this.isDashboardView) return requests;
      else if (this.isGalaxyView) {
        return requests.filter((request) => request.contextCourse.id == this.courses[0].id);
      } else if (this.isSystemView) {
        const taskRequests = requests.filter(
          (request) => request.contextTopic.id == this.currentTopic.id,
        );
        if (this.isTeacher) return taskRequests;
        else return taskRequests.filter((req) => req.contextTask.id == this.currentTask.id);
      }
      return requests;
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
