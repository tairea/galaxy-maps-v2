<template>
  <div :id="isCohortView">
    <h2 class="help-label">Requests for help</h2>

    <div v-if="unansweredRequests.length > 0">
      <RequestForHelpTeacherPanel
        v-for="request in unansweredRequests"
        :key="request.id"
        :request="request"
      />
    </div>
    <div v-if="!loading && unansweredRequests.length == 0">
      <p
        class="overline pt-4 text-center"
        style="color: var(--v-galaxyAccent-base)"
      >
        NO REQUESTS FOR HELP
      </p>
    </div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center mt-4">
      <v-btn
        v-if="loading"
        :loading="loading"
        icon
        color="galaxyAccent"
      ></v-btn>
    </div>
  </div>
</template>
<script>
import RequestForHelpTeacherPanel from "../components/RequestForHelpTeacherPanel";
import { mapState, mapGetters } from "vuex";
import { dbMixins } from "../mixins/DbMixins";

export default {
  name: "RequestForHelpTeacherFrame",
  mixins: [dbMixins],
  components: {
    RequestForHelpTeacherPanel,
  },
  props: ["courses"],
  data() {
    return {
      loading: false,
      unsubscribes: [],
    };
  },
  computed: {
    ...mapState(["teachersRequestsForHelp", "user"]),
    isCohortView() {
      return this.$route.name == "CohortView"
        ? "cohort-help-panel"
        : "help-panel";
    },
    unansweredRequests() {
      return this.teachersRequestsForHelp.filter(
        (request) => request.requestForHelpStatus == "unanswered"
      );
    },
  },
  async mounted() {
    this.loading = true;
    for (const course of this.courses) {
      const unsubscribe = await this.$store.dispatch(
        "getRequestsForHelpByCourseId",
        course.id
      );
      this.unsubscribes.push(unsubscribe);
    }
    this.loading = false;
  },
  destroyed() {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
  },
  methods: {},
};
</script>
<style scoped lang="scss">
#help-panel {
  width: calc(100% - 30px);
  height: 80%;
  border: 1px solid var(--v-galaxyAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  // z-index: 3;
  overflow-y: scroll;
}

#cohort-help-panel {
  width: calc(100% - 30px);
  border: 1px solid var(--v-galaxyAccent-base);
  margin: 30px 15px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  // z-index: 3;
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
</style>
