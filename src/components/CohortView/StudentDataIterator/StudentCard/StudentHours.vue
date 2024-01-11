<template>
  <div>
    <p class="label">active hours</p>
    <div v-for="courseId in courses" :key="courseId" class="d-flex justify-center align-center">
      <div v-if="timeData.length > 0" class="active-hours-box">
        <p class="label">{{ getCourseName(courseId) }}</p>
        <p class="label text-center label-value">{{ calcHours(courseId) }}</p>
      </div>
      <div v-else>
        <p class="label text-center label-value">0</p>
      </div>
    </div>
  </div>
</template>

<script>
import { DateTime } from "luxon";
import { fetchCourseByCourseId } from "@/lib/ff";

export default {
  name: "StudentHours",
  props: ["timeData", "timeframe", "courses"],
  data() {
    return {
      coursesContext: [],
    };
  },
  async mounted() {
    let courses = await Promise.all(
      this.courses.map((courseId) => {
        return fetchCourseByCourseId(courseId);
      }),
    );
    if (courses.length) {
      this.coursesContext = courses;
    }

    // if no timeData then emitNoHours
    if (this.timeData.length == 0) {
      this.$emit("emitUpHours", 0);
    }
  },
  computed: {
    // === old calcHours. (just keeping incase new one doesnt pan out lol ^_^)
    // calcHours() {
    //   let time = 0;
    //   switch (this.timeframe.type) {
    //     case "day":
    //       const dayRes = this.timeData[0].activity.find((day) => {
    //         const statement = DateTime.fromISO(day.dayISOTimestamp).toMillis();
    //         let timeframe = DateTime.fromJSDate(this.timeframe.max).toISODate();
    //         timeframe = DateTime.fromISO(timeframe).toMillis();
    //         return statement == timeframe;
    //       });
    //       if (dayRes) {
    //         time = dayRes.minutesActiveTotal;
    //       }
    //       break;
    //     case "week":
    //     case "month":
    //       const result = this.timeData[0].activity
    //         .filter((day) => {
    //           return (
    //             DateTime.fromISO(day.dayISOTimestamp) > DateTime.fromJSDate(this.timeframe.min) &&
    //             DateTime.fromISO(day.dayISOTimestamp) < DateTime.fromJSDate(this.timeframe.max)
    //           );
    //         })
    //         .reduce((sum, activity) => sum + activity.minutesActiveTotal, 0);
    //       time = result;
    //       break;
    //     default:
    //   }
    //   const timeAsHoursRounded = Math.round((time / 60) * 10) / 10; // change from mins to hours with 1 decimal place
    //   // emit hours
    //   this.$emit("emitUpHours", timeAsHoursRounded);
    //   return timeAsHoursRounded;
    // },
    getCourseName() {
      return (courseId) => {
        let course = this.coursesContext.find((course) => course.id === courseId);
        return course?.title;
      };
    },
  },
  methods: {
    calcHours(viewedCourseId) {
      let statements = this.timeData[0].activity;

      let courseTimes = new Map();
      let currentCourseId = null;
      let loginTimestamp = null;

      for (let statement of statements) {
        let timestamp = new Date(statement.timestamp);

        // Check if the statement outside timeframe. if it is. skip/continue
        if (
          timestamp < DateTime.fromJSDate(this.timeframe.min) ||
          timestamp > DateTime.fromJSDate(this.timeframe.max)
        ) {
          continue;
        }

        // think code calcs the time spent on each galaxy/course (thanks copilot)
        if (statement.verb === "logged in to Galaxy") {
          let courseId = statement.courseId;

          if (currentCourseId !== null) {
            let timeSpent = timestamp - loginTimestamp;
            courseTimes.set(currentCourseId, (courseTimes.get(currentCourseId) || 0) + timeSpent);
          }
          currentCourseId = courseId;
          loginTimestamp = timestamp;
        } else if (statement.verb === "logged out" && currentCourseId !== null) {
          let timeSpent = timestamp - loginTimestamp;
          courseTimes.set(currentCourseId, (courseTimes.get(currentCourseId) || 0) + timeSpent);
          currentCourseId = null;
        }
      }

      // Convert the time spent to hours
      let courseTimesInHours = new Map();
      for (let [courseId, timeSpent] of courseTimes) {
        let timeSpentInHours = (timeSpent / (1000 * 60 * 60)).toFixed(1);
        courseTimesInHours.set(courseId, timeSpentInHours);
      }

      // courseTimesInHours is hours for all courses,
      // only return the hours for current course
      if (courseTimesInHours.has(viewedCourseId)) {
        //
        let hoursForCourse = courseTimesInHours.get(viewedCourseId);
        console.log(`Hours for course ${viewedCourseId}: ${hoursForCourse}`);
        // emit hours up to parent component for sorting
        this.$emit("emitUpHours", hoursForCourse);
        return hoursForCourse;
      } else {
        console.log(`No data for course ${viewedCourseId}`);
      }
    },
    emitNoHours() {
      this.$emit("emitUpHours", 0);
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

.active-hours-box {
  // border: 1px pink solid;
}
</style>
