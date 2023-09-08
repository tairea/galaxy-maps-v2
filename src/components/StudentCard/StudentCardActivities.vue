<template>
  <div :class="activityClass">
    <p :class="activityLabel">ACTIVITY</p>
    <div class="px-3">
      <p
        v-for="activity in studentsActivityLog"
        :key="activity.id"
        class="ma-0"
      >
        {{ formatTime(activity.timestamp) + ": " + activity.description }}
      </p>
    </div>
  </div>
</template>

<script>
import { getActivityLogXAPIQuery } from "@/lib/veracityLRS.js";
import { DateTime } from "luxon";
import { mapGetters } from "vuex";

export default {
  name: "StudentActivityTimeline",
  props: {
    studentCard: { type: Boolean, default: false },
  },
  data() {
    return {
      studentsActivityLog: ["hello"],
    };
  },
  async mounted() {
    this.studentsActivityLog = await getActivityLogXAPIQuery(this.person);
  },
  computed: {
    ...mapGetters(["person"]),
    activityClass() {
      if (this.studentCard) return "student-card-log";
      return "activity-log";
    },
    activityLabel() {
      if (this.studentCard) return "student-card-label";
      return "label";
    },
    courseAcivities() {
      console.log("studentsActivityLog: ", this.studentsActivityLog);
      return this.studentsActivityLog.filter();
    },
  },
  data() {
    return {};
  },
  methods: {
    formatTime(time) {
      return DateTime.fromISO(time).toFormat("tt ccc dd LLL   ");
    },
  },
};
</script>

<style lang="scss" scoped>
.activity-log {
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  font-size: 0.6rem;
  max-height: 150px;
  width: 80%;
  margin-left: 5%;
  margin-right: auto;
  margin-bottom: 30px;
  overflow-y: scroll;
  overflow-x: hidden;
}

.label {
  color: var(--v-missionAccent-base);
  font-size: 0.7rem;
  margin: 10px;
}

.student-card-log {
  font-size: 0.6rem;
  max-height: 50px;
}

.student-card-label {
  color: var(--v-missionAccent-base);
  font-size: 0.5rem;
  margin: 0px;
}
</style>
