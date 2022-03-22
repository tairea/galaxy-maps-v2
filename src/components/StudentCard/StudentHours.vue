<template>
  <div>
    <p class="label text-center">hours active This {{ this.timeframe.type }}</p>
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
          const weekRes = this.timeData[0].activity
            .filter((day) => {
              return (
                DateTime.fromISO(day.dayISOTimestamp) >
                  DateTime.fromJSDate(this.timeframe.min) &&
                DateTime.fromISO(day.dayISOTimestamp) <
                  DateTime.fromJSDate(this.timeframe.max)
              );
            })
            .reduce((sum, activity) => sum + activity.minutesActiveTotal, 0);
          time = weekRes;
          break;

        case "fortnight":
          const fortnightRes = this.timeData[0].activity
            .filter((day) => {
              return (
                DateTime.fromISO(day.dayISOTimestamp) >
                  DateTime.fromJSDate(this.timeframe.min) &&
                DateTime.fromISO(day.dayISOTimestamp) <
                  DateTime.fromJSDate(this.timeframe.max)
              );
            })
            .reduce((sum, activity) => sum + activity.minutesActiveTotal, 0);
          time = fortnightRes;
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
  color: var(--v-baseAccent-base);
  font-size: 0.6rem;
  text-transform: uppercase;
  margin: 0px;
  margin-top: 5px;
}

.label-value {
  font-size: 1.3rem;
  margin: 0px;
}
</style>
