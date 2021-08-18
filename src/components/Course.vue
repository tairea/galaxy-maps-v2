<template>
  <v-col
    class="d-flex flex-column justify-start align-center course"
    :cols="cols"
    @click="routeToCourse(course)"
  >
    <v-img
      v-if="course.image.url"
      :src="course.image.url"
      max-width="60px"
      max-height="60px"
      class="course-image"
    ></v-img>
    <div v-else class="imagePlaceholder">{{ first3Letters(course.title) }}</div>
    <h3 class="overline">{{ course.title }}</h3>
  </v-col>
</template>

<script>
export default {
  name: "Course",
  props: ["course", "cols"],
  data() {
    return {};
  },
  mounted() {},
  computed: {},
  methods: {
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    routeToCourse(course) {
      // on clicking course, set its courseID to Store state (so not relying on router params)
      this.$store.commit("setCurrentCourseId", this.course.id);
      // route to Galaxy View (passing params as props)
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseTitle: this.camelize(this.course.title),
          courseId: this.course.id,
        },
      });
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.course {
  cursor: pointer;

  .course-image {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }

  .imagePlaceholder {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: rgba(200, 200, 200, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
