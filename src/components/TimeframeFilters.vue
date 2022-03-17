<template>
  <div class="d-flex">
    <v-chip
      v-if="!noArrows"
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      outlined
      x-small
      @click="previous"
    >
      <
    </v-chip>
    <v-chip
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      outlined
      x-small
      :input-value="chipDayActive"
      filter
      filter-icon="mdi-circle-small"
      @click="timeframeDay"
    >
      Day
    </v-chip>
    <v-chip
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      outlined
      x-small
      :input-value="chipWeekActive"
      filter
      filter-icon="mdi-circle-small"
      @click="timeframeWeek"
    >
      Week
    </v-chip>
    <v-chip
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      :input-value="chipFortnightActive"
      filter
      filter-icon="mdi-circle-small"
      outlined
      x-small
      @click="timeframeFortnight"
    >
      Fortnight
    </v-chip>
    <v-chip
      v-if="!noArrows"
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      outlined
      x-small
      @click="next"
    >
      >
    </v-chip>
  </div>
</template>

<script>
export default {
  name: "Timeframefilters",
  props: ["noArrows"],
  components: {},
  data() {
    return {
      timeframe: {
        min: this.previousDays(7),
        max: new Date(),
        unit: "day",
        type: "week",
      }, // by default show past 7 days
      chipActiveType: "week",
      chipDayActive: false,
      chipWeekActive: true,
      chipFortnightActive: false,
    };
  },

  async mounted() {
    this.$emit("timeframe", this.timeframe);
  },
  computed: {},
  methods: {
    timeframeFortnight() {
      this.chipActiveType = "fortnight";
      this.chipDayActive = false;
      this.chipWeekActive = false;
      this.chipFortnightActive = true;
      this.timeframe = {
        min: this.previousDays(14),
        max: new Date(),
        unit: "day",
        type: "fortnight",
      };
      this.$emit("timeframe", this.timeframe);
    },
    timeframeWeek() {
      this.chipActiveType = "week";
      this.chipDayActive = false;
      this.chipFortnightActive = false;
      this.chipWeekActive = true;
      this.timeframe = {
        min: this.previousDays(7),
        max: new Date(),
        unit: "day",
        type: "week",
      };
      this.$emit("timeframe", this.timeframe);
    },
    timeframeDay() {
      this.chipActiveType = "day";
      this.chipFortnightActive = false;
      this.chipWeekActive = false;
      this.chipDayActive = true;
      this.timeframe = {
        min: this.getStartDay(),
        max: this.getEndDay(),
        unit: "hour",
        type: "day",
      };
      this.$emit("timeframe", this.timeframe);
    },
    getStartDay() {
      let startDay = new Date().setHours(0);
      startDay = new Date(startDay).setMinutes(0);
      startDay = new Date(startDay);
      return startDay;
    },
    getEndDay() {
      let endDay = new Date().setHours(23);
      endDay = new Date(endDay).setMinutes(59);
      endDay = new Date(endDay);
      return endDay;
    },
    previous() {
      let previousTimeframe = {};
      switch (this.chipActiveType) {
        case "day":
          // change min max by 1 day
          previousTimeframe = {
            min: this.previousDays(1, this.timeframe.min),
            max: this.previousDays(1, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = previousTimeframe;
          this.$emit("timeframe", this.timeframe);
          break;
        case "week":
          // change min max by 7 day
          previousTimeframe = {
            min: this.previousDays(7, this.timeframe.min),
            max: this.previousDays(7, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = previousTimeframe;
          this.$emit("timeframe", this.timeframe);
          break;
        case "fortnight":
          // change min max by 14 day
          previousTimeframe = {
            min: this.previousDays(14, this.timeframe.min),
            max: this.previousDays(14, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = previousTimeframe;
          this.$emit("timeframe", this.timeframe);
          break;
        default:
          break;
      }
    },
    next() {
      let nextTimeframe = {};
      switch (this.chipActiveType) {
        case "day":
          // change min max by 1 day
          nextTimeframe = {
            min: this.nextDays(1, this.timeframe.min),
            max: this.nextDays(1, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = nextTimeframe;
          this.$emit("timeframe", this.timeframe);
          break;
        case "week":
          // change min max by 7 day
          nextTimeframe = {
            min: this.nextDays(7, this.timeframe.min),
            max: this.nextDays(7, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = nextTimeframe;
          this.$emit("timeframe", this.timeframe);
          break;
        case "fortnight":
          // change min max by 14 day
          nextTimeframe = {
            min: this.nextDays(14, this.timeframe.min),
            max: this.nextDays(14, this.timeframe.max),
            unit: this.timeframe.unit,
            type: this.timeframe.type,
          };
          this.timeframe = nextTimeframe;
          this.$emit("timeframe", this.timeframe);
          break;
        default:
          break;
      }
    },
    previousDays(num, start) {
      if (!start) {
        var d = new Date();
      } else {
        var d = new Date(start);
      }
      d.setDate(d.getDate() - num);
      return d;
    },
    nextDays(num, start) {
      if (!start) {
        var d = new Date();
      } else {
        var d = new Date(start);
      }
      d.setDate(d.getDate() + num);
      return d;
    },
  },
};
</script>

<style lang="scss" scoped>
.custom-chip {
  padding: 10px;
  text-transform: uppercase;
}
</style>
