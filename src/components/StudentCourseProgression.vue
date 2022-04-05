<template>
  <div>
    <!-- loading spinner -->
    <div
      class="d-flex justify-center align-center"
      v-if="loading && !(santisedCourses.length > 0)"
    >
      <v-btn
        :loading="loading"
        icon
        color="galaxyAccent"
        class="d-flex justify-center align-center"
      ></v-btn>
    </div>
    <div v-if="santisedCourses">
      <GalaxyProgressionCard
        v-for="data in santisedCourses"
        :key="data.course.id"
        :data="data"
      />
    </div>
    <div v-else><p class="overline galaxyAccent">NO ENROLLED GALAXIES</p></div>
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
      santisedCourses: [],
    };
  },
  computed: {},
  async mounted() {
    this.loading = true;
    this.santisedCourses = await getStudentsCoursesXAPIQuery(this.student);
    this.loading = false;
  },
  methods: {},
};
</script>

<style lang="scss" scoped></style>
