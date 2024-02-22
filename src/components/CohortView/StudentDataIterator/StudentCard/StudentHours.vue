<template>
  <div>
    <p class="label">active hours</p>
    <div v-for="course in courses" :key="course.id" class="d-flex justify-center align-center">
      <div class="active-hours-box">
        <p class="label">{{ course.title }}</p>
        <!-- calcHours is rounded. Maybe add a tooltip with full hours with decimal places -->
        <p class="label text-center label-value">{{ calcHours(course.id).toFixed(0) }}</p>
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
      this.$emit("emitUpHours", courseHours);
      return courseHours;
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
