<template>
  <div>
    <!-- loading spinner -->
    <div class="d-flex justify-center align-center" v-if="loading && !(studentCourses.length > 0)">
      <v-btn :loading="loading" icon color="galaxyAccent" class="d-flex justify-center align-center"></v-btn>
    </div>
    <div v-if="studentCourses.length > 0">
      <GalaxyProgressionCard v-for="data in studentCourses" :key="data.course.id" :data="data" />
    </div>
    <div v-else>
      <p class="overline missionAccent--text text-center">
        NO GALAXIES CURRENTLY BEING EXPLORED
      </p>
    </div>
  </div>
</template>

<script>
import GalaxyProgressionCard from "@/components/GalaxyProgressionCard.vue";

import { getStudentsCoursesXAPIQuery } from "../lib/veracityLRS";

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
    const sanitisedCourses = await getStudentsCoursesXAPIQuery(this.student);
    console.log("sanitisedCourses: ", this.studentCourses);
    this.studentCourses = sanitisedCourses.filter((a) =>
      this.student.assignedCourses?.some((b) => a.course.id == b)
    );
    console.log("personsCourses: ", this.studentCourses);
    this.loading = false;
  },
  methods: {},
};
</script>

<style lang="scss" scoped>

</style>
