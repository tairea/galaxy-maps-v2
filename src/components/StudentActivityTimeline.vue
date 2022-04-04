<template>
  <div :class="activityClass">
    <p :class="activityLabel">ACTIVITY</p>
    <div :class="statementClass">
      <p v-for="(activity, i) in courseAcivities" :key="i" class="ma-0">
        <span v-if="!studentCard">{{ activity.timeStamp.time }} </span>
        <span>{{ activity.timeStamp.date }} </span>
        <span :style="statusClass(activity)"
          >{{ activity.status }} {{ activity.type }}:
        </span>
        <span>{{ activity.title }}</span>
      </p>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { getActivityLogXAPIQuery } from "@/lib/veracityLRS";
import { DateTime } from "luxon";
export default {
  name: "StudentActivityTimeline",
  props: {
    studentCard: { type: Boolean, default: false },
    student: { type: Object },
  },
  data() {
    return {
      studentsActivityLog: [],
    };
  },
  async mounted() {
    this.studentsActivityLog = await getActivityLogXAPIQuery(this.student);
  },
  computed: {
    ...mapGetters(["person"]),
    activityClass() {
      return this.studentCard ? "student-card-log" : "activity-log";
    },
    activityLabel() {
      return this.studentCard ? "student-card-label" : "label";
    },
    statementClass() {
      return this.studentCard ? "student-card-statement" : "statements";
    },
    courseAcivities() {
      const filtered = this.studentsActivityLog.filter(
        (activity) => activity.course
      );
      const sanitised = filtered.map((statement, index) => {
        let [action, title] = statement.description.split(": ");
        let [status, type] = action.split(" ");
        let id = statement.task;

        let isoTime = this.formatTime(statement.timestamp);
        let [time, date] = isoTime.split(/(?<=^\S+)\s/);

        const newStatement = {
          timeStamp: { time, date },
          index,
          status,
          type,
          title,
          id,
          context: statement.context,
        };
        return newStatement;
      });
      return sanitised;
    },
  },
  methods: {
    formatTime(time) {
      return DateTime.fromISO(time).toFormat("ccc dd LLL t ");
    },
    statusClass(activity) {
      switch (activity.status) {
        case "Started":
          return "color: var(--v-baseAccent-base);";
        case "Completed":
          return "color:var(--v-galaxyAccent-base)";
        case "in-review":
          return "color:var(--v-cohortAccent-base)";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.activity-log {
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  font-size: 0.6rem;
  // max-height: 500px;
  max-height: 100%;
  width: 90%;
  margin-left: 5%;
  margin-right: auto;
  margin-bottom: 30px;
  overflow-y: scroll;
  overflow-x: hidden;
}

.label {
  color: var(--v-missionAccent-base);
  margin: 10px 10px 0 20px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
}

.statements {
  padding: 10px 20px;
  font-size: 0.8rem;
}

.student-card-label {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  margin: 0px;
}

.student-card-statement {
  color: var(--v-missionAccent-base);
  max-height: calc(100% - 14px); // overflow of statements
  width: 100%;
  overflow: hidden;
}

.student-card-log {
  font-size: 0.6rem;
  height: 100%;
  padding: 2px;
  transition: all 0.2s ease-in-out;
}

.student-card-log:hover {
  margin: 0px;
  width: 100%;
  transform: scale(1.2);
  font-size: 0.6rem;
  background-color: var(--v-background-base);
  // min-height: 300px;
  position: relative;
  z-index: 10;

  .student-card-statement {
    border: 1px solid var(--v-missionAccent-base);
    box-shadow: 0 0 30px var(--v-missionAccent-base);
    padding: 5px;
    background-color: var(--v-background-base);
    max-height: 200px;
    width: 320px;
    overflow: scroll;
    overflow-x: hidden;
    z-index: 1000;
  }
  /* width */
  ::-webkit-scrollbar {
    width: 2px;
  }
}
</style>
