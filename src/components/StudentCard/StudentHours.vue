<template>
  <div>
    <p class="label">active hours</p>
    <p class="label text-center label-value">{{ calcHours }}</p>
  </div>
</template>

<script>
import { DateTime } from "luxon";

export default {
  name: "StudentHours",
  props: ["timeData", "timeframe"],
  mounted() {},
  computed: {
    calcHours() {
      let time = 0;
      switch (this.timeframe.type) {
        case "day":
          const dayRes = this.timeData[0].activity.find((day) => {
            const statement = DateTime.fromISO(day.dayISOTimestamp).toMillis();
            let timeframe = DateTime.fromJSDate(this.timeframe.max).toISODate();
            timeframe = DateTime.fromISO(timeframe).toMillis();
            return statement == timeframe;
          });
          if (dayRes) {
            time = dayRes.minutesActiveTotal;
          }
          break;
        case "week":
        case "month":
          const result = this.timeData[0].activity
            .filter((day) => {
              return (
                DateTime.fromISO(day.dayISOTimestamp) >
                  DateTime.fromJSDate(this.timeframe.min) &&
                DateTime.fromISO(day.dayISOTimestamp) <
                  DateTime.fromJSDate(this.timeframe.max)
              );
            })
            .reduce((sum, activity) => sum + activity.minutesActiveTotal, 0);
          time = result;
          break;
        default:
      }
      const timeAsHoursRounded = Math.round((time / 60) * 10) / 10; // change from mins to hours with 1 decimal place
      // emit hours
      this.$emit("emitUpHours", timeAsHoursRounded);
      return timeAsHoursRounded;
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
