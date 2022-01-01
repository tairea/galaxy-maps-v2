<template>
  <div class="active-mission-card">
    <!-- <p class="text-overline text-uppercase text-center">
        {{
          getTopicStatus == "completed"
            ? "COMPLETED"
            : getTopicStatus == "inreview"
            ? "IN REVIEW"
            : "COMPLETED?"
        }}
      </p>
      <div class="d-flex align-center justify-center">
        <MissionCompletedDialog
          :task="task"
          :taskId="id"
          :topicId="topicId"
          :missionStatus="getTopicStatus"
        />
      </div> -->
  </div>
</template>

<script>
import MissionCompletedDialog from "../components/MissionCompletedDialog";

import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "MissionsCard",
  components: {
    MissionCompletedDialog,
  },
  props: ["active"],
  mounted() {},
  computed: {
    ...mapState([]),
    ...mapGetters(["person"]),
  },
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

a {
  color: var(--v-missionAccent-base) !important;
}

.active-mission-card {
  border: 1px solid var(--v-baseAccent-base);
  margin: -20px 10px 20px 10px;
  display: flex;
  height: 300px;
}
</style>
