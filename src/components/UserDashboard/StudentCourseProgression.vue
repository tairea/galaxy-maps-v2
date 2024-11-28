<template>
  <div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center" v-if="loading && !(studentCourses.length > 0)">
      <v-btn
        :loading="loading"
        icon
        color="galaxyAccent"
        class="d-flex justify-center align-center"
      ></v-btn>
    </div>
    <div v-else-if="studentCourses.length > 0">
      <GalaxyProgressionCard v-for="data in studentCourses" :key="data.course.id" :data="data" />
    </div>
    <div v-else>
      <p class="overline missionAccent--text text-center">NO GALAXIES CURRENTLY BEING EXPLORED</p>
    </div>
  </div>
</template>

<script>
import GalaxyProgressionCard from "@/components/UserDashboard/StudentCourseProgression/GalaxyProgressionCard.vue";
import { fetchStudentCoursesActivityByPersonId } from "@/lib/ff";

export default {
  name: "StudentCourseProgression",
  props: ["student"],
  components: {
    GalaxyProgressionCard,
  },

  data() {
    return {
      loading: false,
      studentCourses: [],
    };
  },
  computed: {},
  async mounted() {
    this.loading = true;
    const sanitisedCourses = await fetchStudentCoursesActivityByPersonId(this.student.id);
    console.log("sanitisedCourses: ", this.studentCourses);
    this.studentCourses = sanitisedCourses.filter((a) =>
      this.student.assignedCourses?.some((b) => a.course.id == b),
    );

    // Precompute the most recent activity timestamp for each course
    let coursesWithMaxTimestamp = this.studentCourses.map((course) => ({
      ...course,
      mostRecentTimestamp: Math.max(
        ...course.activities.map((activity) => new Date(activity.timeStamp).getTime()),
      ),
    }));

    // Sort based on the precomputed most recent activity timestamp
    coursesWithMaxTimestamp.sort((a, b) => b.mostRecentTimestamp - a.mostRecentTimestamp);

    this.studentCourses = coursesWithMaxTimestamp;

    console.log("personsCourses: ", this.studentCourses);
    this.loading = false;
  },
  methods: {},
};
</script>

<style lang="scss" scoped></style>
