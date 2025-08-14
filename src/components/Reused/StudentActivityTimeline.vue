<template>
  <div :class="activityClass">
    <p :class="activityLabel">ACTIVITY</p>
    <div class="d-flex justify-center align-center" v-if="loading">
      <v-btn
        :loading="loading"
        icon
        color="missionAccent"
        class="d-flex justify-center align-center"
      ></v-btn>
    </div>
    <div v-else-if="sortedCourseActivitiesByDates.length > 0" :class="statementClass">
      <div
        v-for="(year, yearIndex) in sortedCourseActivitiesByDates"
        :key="`year-${yearIndex}-${year.year}`"
        class="ma-0"
      >
        <div
          v-for="(date, dateIndex) in year.dates"
          :key="`date-${yearIndex}-${dateIndex}-${date.date}`"
          class="ma-0"
        >
          <!-- DAY, DATE, YEAR -->
          <p class="mt-3 mb-1 border-bottom-missionAccent">{{ formatDate(date.date) }}</p>
          <div
            v-for="(activity, activityIndex) in date.activities"
            :key="`activity-${yearIndex}-${dateIndex}-${activityIndex}-${activity.id || activity.timeStamp.time}`"
            class="ma-0"
          >
            <!-- TIME -->
            <span>{{ activity.timeStamp.time }} - </span>
            <!-- ACTIVITY -->
            <span :style="statusClass(activity)"
              >{{ activityStatusReword(activity.status) }} {{ activityTypeReword(activity.type) }}:
            </span>
            <span>{{ activity.title }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <p class="missionAccent--text text-center overline">NO ACTIVITY DATA</p>
    </div>
  </div>
</template>

<script>
import { fetchStudentActivityLogByPersonId } from "@/lib/ff";
import useRootStore from "@/store/index";
import { DateTime } from "luxon";
import { mapState } from "pinia";

export default {
  name: "StudentActivityTimeline",
  props: {
    studentCard: { type: Boolean, default: false },
    student: { type: Object },
  },
  data() {
    return {
      loading: true,
      studentsActivityLog: [],
      courseActivities: [],
    };
  },
  async mounted() {
    this.studentsActivityLog = await fetchStudentActivityLogByPersonId(this.student.id);
    this.courseActivities = this.sanitiseStudentsActivityLog();
    this.loading = false;
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    activityClass() {
      return this.studentCard ? "student-card-log" : "activity-log";
    },
    activityLabel() {
      return this.studentCard ? "student-card-label" : "label";
    },
    statementClass() {
      return this.studentCard ? "student-card-statement" : "statements";
    },

    sortedCourseActivitiesByDates() {
      let groupedByYear = {};

      // Step 1: Group activities by year
      this.courseActivities.forEach((activity) => {
        const { year, date, time } = activity.timeStamp;
        const dateTime = new Date(`${date} ${year} ${time}`);
        const dateYear = dateTime.toISOString().split("T")[0]; // Format: YYYY-MM-DD

        if (!groupedByYear[year]) {
          groupedByYear[year] = [];
        }

        groupedByYear[year].push({ ...activity, dateTime, dateYear });
      });

      // Step 2: Sort each year's activities by dateTime in descending order
      Object.keys(groupedByYear).forEach((year) => {
        groupedByYear[year].sort((a, b) => b.dateTime - a.dateTime);
      });

      // Step 3: Group by date within each year, already in descending order
      let finalGrouping = {};
      Object.keys(groupedByYear).forEach((year) => {
        finalGrouping[year] = groupedByYear[year].reduce((acc, curr) => {
          const dateKey = curr.dateYear; // Use YYYY-MM-DD format for consistent sorting
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(curr);
          return acc;
        }, {});
      });

      // Step 4: Convert finalGrouping object into the desired array structure with years and dates in descending order
      let finalArray = Object.keys(finalGrouping)
        .sort((a, b) => b.localeCompare(a))
        .map((year) => ({
          year,
          dates: Object.keys(finalGrouping[year])
            .sort((a, b) => b.localeCompare(a))
            .map((date) => ({
              date,
              activities: finalGrouping[year][date],
            })),
        }));

      return finalArray;
    },
  },
  methods: {
    formatTime(time) {
      return DateTime.fromISO(time).toFormat("ccc dd LLL yyyy t ");
    },
    formatDate(date) {
      return DateTime.fromISO(date).toFormat("cccc, LLLL d, yyyy");
    },
    statusClass(activity) {
      switch (activity.status) {
        case "Started":
          if (activity.type === "Task" || activity.type === "Topic") {
            return "color:var(--v-missionAccent-base)";
          } else if (activity.type === "Course" || "Topic") {
            return "color: var(--v-galaxyAccent-base);";
          }
        case "Completed":
          return "color:var(--v-baseAccent-base)";
        case "Student":
          if (activity.type === "requested") {
            return "color:var(--v-galaxyAccent-base)";
          }
        case "Work":
          if (activity.type === "submitted" || activity.type === "declined") {
            return "color:var(--v-cohortAccent-base)";
          } else if (activity.type === "completed") {
            return "color:var(--v-baseAccent-base)";
          }
        case "Teacher":
          if (activity.type === "marked") {
            return "color:var(--v-baseAccent-base)";
          }
      }
    },
    activityStatusReword(status) {
      switch (status) {
        case "Student":
          return "Navigator";
        default:
          return status;
      }
    },
    activityTypeReword(type) {
      switch (type) {
        case "Task":
          return "Mission";
        case "Topic":
          return "System";
        case "Course":
          return "Galaxy Map";
        case "requested":
          return "Requested Help";
        default:
          return type;
      }
    },
    sanitiseStudentsActivityLog() {
      const filtered = this.studentsActivityLog.filter((activity) => activity.course);
      const sanitised = filtered.map((statement, index) => {
        let [action, title] = statement.description.split(": ");
        let [status, type] = action.split(" ");
        let id = statement.task;

        let isoTime = this.formatTime(statement.timestamp);

        let parts = isoTime.split(" "); // Assuming format is now ["Fri", "04", "Nov", "2023", "12:12"]
        let day = parts[0]; // "Fri"
        let date = parts.slice(1, 3).join(" "); // "04 Nov"
        let year = parts[3]; // "2023"
        let time = parts[4]; // "12:12"

        const newStatement = {
          timeStamp: { year, day, date, time },
          index,
          status,
          type,
          title,
          id,
          context: statement,
        };

        return newStatement;
      });
      return sanitised;
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
  // width: 90%;
  // margin-left: 5%;
  // margin-right: auto;
  margin-bottom: 30px;
  overflow-y: auto;
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
  font-size: 0.7rem;
}

.student-card-label {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  margin: 0px;
  font-weight: bold;
}

.student-card-statement {
  color: var(--v-missionAccent-base);
  max-height: calc(100% - 14px); // overflow of statements
  width: 100%;
  overflow: auto;
}

.student-card-log {
  font-size: 0.6rem;
  height: 100%;
  padding: 2.5px 5px;
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
    overflow: auto;
    overflow-x: hidden;
    z-index: 1000;
  }
  /* width */
  ::-webkit-scrollbar {
    width: 2px;
  }
}

.border-bottom-missionAccent {
  border-bottom: 1px solid var(--v-missionAccent-base);
}
</style>
