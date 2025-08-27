<template>
  <div>
    <p class="label">active hours</p>
    <div class="d-flex justify-space-around">
      <!-- ==== Below code shows an hour value for each course ===== -->
      <!-- <div v-for="course in courses" :key="course.id" class="d-flex justify-center align-center">
        <div class="active-hours-box">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <p class="label text-center label-value" v-bind="attrs" v-on="on">
                {{ calcHours(course.id).toFixed(0) }}
              </p>
            </template>
            <p class="label">{{ course.title }}</p>
            <p class="label text-center label-value">{{ calcHours(course.id).toFixed(2) }}</p>
            <p class="label">Hours active</p>
          </v-tooltip>
        </div>
      </div> -->

      <!-- ==== Below code shows a single hour value for all courses ===== -->
      <div class="d-flex justify-center align-center">
        <div class="active-hours-box">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <p class="label text-center label-value" v-bind="attrs" v-on="on">
                {{ calcAllHours() }}
              </p>
            </template>
            <div class="d-flex flex-column">
              <div v-for="course in courses" :key="course.id">
                <p class="label">{{ course.title }}</p>
                <p class="label text-center label-value">{{ calcHours(course.id) }}</p>
                <!-- <p class="label">Hours active</p> -->
                <div class="bottom-border-missionAccent"></div>
              </div>
            </div>
          </v-tooltip>
        </div>
      </div>
    </div>
    <div v-if="courses.length === 0" class="d-flex justify-center align-center">
      <div>
        <p class="label text-center label-value">0</p>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchCourseByCourseId } from "@/lib/ff";

export default {
  name: "StudentHours",
  props: ["timeData", "timeframe", "courseIds"],
  data() {
    return {
      courses: [],
    };
  },
  async mounted() {
    const existingCourses = this.timeData
      .map((courseHourData) => courseHourData.course)
      .filter((course) => this.courseIds.some((courseId) => courseId === course.id));
    const missingCourseIds = this.courseIds.filter(
      (courseId) => !existingCourses.some((course) => course.id === courseId),
    );
    const remainingCourses = await Promise.all(
      missingCourseIds.map((courseId) => fetchCourseByCourseId(courseId)),
    );
    this.courses = [...existingCourses, ...remainingCourses];
  },
  computed: {},
  methods: {
    calcHours(courseId) {
      const courseHours =
        this.timeData.find((courseHourData) => courseHourData.course.id === courseId)?.hours ?? 0;
      const wholeHours = Math.floor(courseHours);
      const decimalPart = courseHours - wholeHours;
      const remainderMinutes = Math.round(decimalPart * 60);

      // Format the result to display the minutes correctly (e.g. 1.75 returns 1.45 aka 1 hour 45 minutes)
      const formattedMinutes = remainderMinutes < 10 ? `0${remainderMinutes}` : remainderMinutes;
      const formattedHours = `${wholeHours}H ${formattedMinutes}M`;

      return formattedHours;
    },
    calcAllHours() {
      const allHours = this.timeData.reduce((acc, courseHourData) => acc + courseHourData.hours, 0);
      const wholeHours = Math.floor(allHours);
      const decimalPart = allHours - wholeHours;
      const remainderMinutes = Math.round(decimalPart * 60);

      // Format the result to display the minutes correctly (e.g. 1.75 returns 1.45 aka 1 hour 45 minutes)
      const formattedMinutes = remainderMinutes < 10 ? `0${remainderMinutes}` : remainderMinutes;
      const formattedHours = `${wholeHours}H ${formattedMinutes}M`;

      // emitup for sort by hours
      this.$emit("emitUpHours", formattedHours);

      return formattedHours;
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
  font-size: 0.9rem;
  margin: 0px;
  color: var(--v-baseAccent-base);
}

.active-hours-box {
  // border: 1px pink solid;
}

.bottom-border-missionAccent {
  border-bottom: 1px solid var(--v-missionAccent-base);
  margin: 5px 0px;
}
</style>
