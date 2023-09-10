<template>
  <div>
    <p class="label">Missions completed</p>
    <p class="label text-center label-value">{{ calcTaskCompleted }}</p>
  </div>
</template>

<script>
import { DateTime } from "luxon";

export default {
  name: "StudentCompletedTasks",
  props: ["taskData", "timeframe"],
  mounted() {},
  computed: {
    calcTaskCompleted() {
      let tasksCompleted = 0;
      // get task totals for each course
      for (const course of this.taskData) {
        // filter each activity (within timeframe && type == "Task" && state == "Completed" )
        const filteredActivities = course.activities.filter((statement) => {
          return (
            DateTime.fromISO(statement.timeStamp) > DateTime.fromJSDate(this.timeframe.min) &&
            DateTime.fromISO(statement.timeStamp) < DateTime.fromJSDate(this.timeframe.max) &&
            statement.type == "Task" &&
            statement.status == "Completed"
          );
        });
        if (filteredActivities.length > 0) {
          tasksCompleted += filteredActivities.length;
        }
      }
      this.$emit("emitUpTasks", tasksCompleted);
      return tasksCompleted;
    },
  },
};
</script>

<style lang="scss" scoped>
.label {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  text-transform: uppercase;
  margin: 1px;
  font-weight: bold;
}

.label-value {
  font-size: 1.3rem;
  margin: 0px;
  color: var(--v-baseAccent-base);
}
</style>
