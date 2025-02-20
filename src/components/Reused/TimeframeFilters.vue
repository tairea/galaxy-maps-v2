<template>
  <div class="d-flex mb-2">
    <v-chip
      v-if="!noArrows"
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      outlined
      x-small
      @click="previous"
      :disabled="chipAllTimeActive"
    >
      &lt;
    </v-chip>
    <v-chip
      v-if="earliestDate"
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      :input-value="chipAllTimeActive"
      outlined
      x-small
      @click="timeframeAllTime"
    >
      <v-icon v-if="chipAllTimeActive" left>
        {{ mdiCircleSmall }}
      </v-icon>
      all time
    </v-chip>
    <v-chip
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      :input-value="chipMonthActive"
      outlined
      x-small
      @click="timeframeMonth"
    >
      <v-icon v-if="chipMonthActive" left>
        {{ mdiCircleSmall }}
      </v-icon>
      month
    </v-chip>
    <v-chip
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      outlined
      x-small
      :input-value="chipWeekActive"
      @click="timeframeWeek"
    >
      <v-icon v-if="chipWeekActive" left>
        {{ mdiCircleSmall }}
      </v-icon>
      Week
    </v-chip>
    <v-chip
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      outlined
      x-small
      :input-value="chipDayActive"
      @click="timeframeDay"
    >
      <v-icon v-if="chipDayActive" left>
        {{ mdiCircleSmall }}
      </v-icon>
      Day
    </v-chip>

    <!-- custom date -->
    <v-menu
      ref="menu"
      v-model="menu"
      :close-on-content-click="false"
      transition="scale-transition"
      offset-y
      max-width="290px"
      min-width="auto"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-chip
          class="my-2 mx-1 custom-chip"
          color="missionAccent"
          outlined
          x-small
          :input-value="chipCustomActive"
          @click="timeframeCustom"
        >
          <v-icon v-if="chipCustomActive" left>
            {{ mdiCircleSmall }}
          </v-icon>
          Custom
        </v-chip>
      </template>
      <v-date-picker 
        v-model="datePickerRange" 
        no-title 
        range 
        @input="rangeChosen"
      >
        <v-spacer></v-spacer>
        <div v-if="datePickerRange.length === 2" class="pa-2">
          <div 
            v-if="isSameDay"
            class="d-flex mb-2"
          >
            <v-text-field
              v-model="timeRange[0]"
              label="Start time"
              type="time"
              class="mr-2"
              dense
              outlined
            ></v-text-field>
            <v-text-field
              v-model="timeRange[1]"
              label="End time"
              type="time"
              dense
              outlined
            ></v-text-field>
          </div>
          <v-btn
            color="primary"
            text
            block
            @click="rangeWithTimeChosen"
          >
            Apply {{ isSameDay ? 'with time' : 'range' }}
          </v-btn>
        </div>
      </v-date-picker>
    </v-menu>
    <v-chip
      v-if="!noArrows"
      class="my-2 mx-1 custom-chip"
      color="missionAccent"
      outlined
      x-small
      @click="next"
      :disabled="chipAllTimeActive"
    >
      &gt;
    </v-chip>
    <span color="missionAccent" v-if="showDate" class="caption pa-2 date">{{ date }}</span>
  </div>
</template>

<script>
import { mdiCircleSmall } from "@mdi/js";

export default {
  name: "Timeframefilters",
  props: ["noArrows", "showDate", "earliestDate"],
  components: {},
  data() {
    return {
      mdiCircleSmall,
      timeframe: {
        min: this.previousDays(30),
        max: new Date(),
        unit: "day",
        type: "month",
      }, // by default show past 7 days
      chipActiveType: "month",
      chipDayActive: false,
      chipWeekActive: false,
      chipFortnightActive: false,
      chipMonthActive: true,
      chipAllTimeActive: false,
      chipCustomActive: false,
      menu: false,
      datePickerRange: [
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10),
        new Date().toISOString().substr(0, 10),
      ],
      timeRange: ['00:00', '23:59'],
    };
  },

  async mounted() {
    this.$emit("timeframe", this.timeframe);
  },
  computed: {
    date() {
      let min = this.timeframe.min.toString().split(" ").slice(1, 3).join(" ");
      let max = this.timeframe.max.toString().split(" ").slice(1, 3).join(" ");

      switch (this.timeframe.type) {
        case "day":
          return min;
          break;
        case "week":
        case "month":
          return min + " - " + max;
        default:
      }
    },
    computedDateFormatted() {
      return this.formatDate(this.datePickerRange);
    },
    isSameDay() {
      if (this.datePickerRange.length !== 2) return false;
      const [start, end] = this.datePickerRange;
      return start === end;
    },
  },
  methods: {
    timeframeAllTime() {
      this.chipActiveType = "allTime";
      this.chipDayActive = false;
      this.chipWeekActive = false;
      this.chipFortnightActive = false;
      this.chipMonthActive = false;
      this.chipAllTimeActive = true;
      this.chipCustomActive = false;
      this.timeframe = {
        min: this.earliestDate, // 8640000000000000 is the smallest date in js
        max: new Date(),
        unit: "month",
        type: "allTime",
      };
      this.$emit("timeframe", this.timeframe);
    },
    timeframeMonth() {
      this.chipActiveType = "month";
      this.chipDayActive = false;
      this.chipWeekActive = false;
      this.chipFortnightActive = false;
      this.chipMonthActive = true;
      this.chipAllTimeActive = false;
      this.chipCustomActive = false;
      this.timeframe = {
        min: this.previousDays(30),
        max: new Date(),
        unit: "day",
        type: "month",
      };
      this.$emit("timeframe", this.timeframe);
    },
    timeframeWeek() {
      this.chipActiveType = "week";
      this.chipDayActive = false;
      this.chipWeekActive = true;
      this.chipFortnightActive = false;
      this.chipMonthActive = false;
      this.chipAllTimeActive = false;
      this.chipCustomActive = false;
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
      this.chipDayActive = true;
      this.chipWeekActive = false;
      this.chipFortnightActive = false;
      this.chipMonthActive = false;
      this.chipAllTimeActive = false;
      this.chipCustomActive = false;
      this.timeframe = {
        min: this.getStartDay(),
        max: this.getEndDay(),
        unit: "hour",
        type: "day",
      };
      this.$emit("timeframe", this.timeframe);
    },
    timeframeCustom() {
      this.menu = true;
      this.chipActiveType = "custom";
      this.chipDayActive = false;
      this.chipWeekActive = false;
      this.chipFortnightActive = false;
      this.chipMonthActive = false;
      this.chipAllTimeActive = false;
      this.chipCustomActive = true;
    },
    rangeWithTimeChosen() {
      if (this.datePickerRange.length === 2) {
        const [startDate, endDate] = this.datePickerRange;
        
        if (this.isSameDay) {
          // If same day, use the time range
          const [startTime, endTime] = this.timeRange;
          const [startHour, startMinute] = startTime.split(':');
          const [endHour, endMinute] = endTime.split(':');
          
          // Create date with local timezone
          const startDateTime = new Date(startDate + 'T00:00:00');
          startDateTime.setHours(parseInt(startHour), parseInt(startMinute));
          
          const endDateTime = new Date(endDate + 'T00:00:00');
          endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
          
          this.timeframe = {
            min: startDateTime,
            max: endDateTime,
            unit: 'hour',
            type: 'custom',
          };
        } else {
          // If different days, use start of first day to end of last day
          const startDateTime = new Date(startDate + 'T00:00:00');
          startDateTime.setHours(0, 0, 0);
          
          const endDateTime = new Date(endDate + 'T23:59:59');
          
          this.timeframe = {
            min: startDateTime,
            max: endDateTime,
            unit: 'day',
            type: 'custom',
          };
        }
        
        this.$emit('timeframe', this.timeframe);
        this.menu = false;
      }
    },
    rangeChosen(range) {
      console.log("range chosen", range);
      if (this.datePickerRange.length === 2) {
        // Don't close menu - wait for time selection
        // this.menu = false;
      }
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
        case "month":
          // change min max by 30 day
          previousTimeframe = {
            min: this.previousDays(30, this.timeframe.min),
            max: this.previousDays(30, this.timeframe.max),
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
        case "month":
          // change min max by 30 day
          nextTimeframe = {
            min: this.nextDays(30, this.timeframe.min),
            max: this.nextDays(30, this.timeframe.max),
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
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`;
    },
    parseDate(date) {
      if (!date) return null;
      console.log("parsing date:", date);

      const [month, day, year] = date.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.custom-chip {
  padding: 10px;
  text-transform: uppercase;
  background-color: var(--v-primary-base) !important;
}

.date {
  color: var(--v-missionAccent-base);
}
</style>
