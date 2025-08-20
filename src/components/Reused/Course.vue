<template>
  <v-col
    class="d-flex flex-column justify-start align-center course"
    :cols="cols"
    @click="routeToCourse(course)"
  >
    <v-tooltip v-if="tooltip" bottom color="subBackground">
      <template v-slot:activator="{ on, attrs }">
        <div class="d-flex justify-center align-center" v-bind="attrs" v-on="on">
          <v-avatar size="40">
            <img
              v-if="hasValidImage"
              :src="course.image.url"
              :alt="course.title"
              style="object-fit: cover"
              @error="handleImageError"
            />
            <div v-else class="imagePlaceholder">
              {{ first3Letters(course.title) }}
            </div>
          </v-avatar>
        </div>
      </template>
      <div>
        <p class="ma-0 person-tooltip" style="font-size: 0.8rem; font-weight: 800">
          {{ course.title }}
        </p>
      </div>
    </v-tooltip>
    <div v-else>
      <v-img
        v-if="hasValidImage"
        :src="course.image.url"
        max-width="60px"
        max-height="60px"
        class="course-image"
        @error="handleImageError"
      ></v-img>
      <div v-else class="imagePlaceholder">{{ first3Letters(course.title) }}</div>
      <p class="title text-center pt-2 mb-0">{{ course.title }}</p>
    </div>
  </v-col>
</template>

<script>
import useRootStore from "@/store/index";
import { mapActions } from "pinia";

export default {
  name: "Course",
  props: ["course", "cols", "tooltip"],
  data() {
    return {
      imageLoadError: false,
    };
  },
  mounted() {},
  computed: {
    hasValidImage() {
      return (
        this.course.image &&
        this.course.image.url &&
        this.course.image.url.trim() !== "" &&
        !this.imageLoadError
      );
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId"]),
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    handleImageError() {
      this.imageLoadError = true;
    },
    routeToCourse(course) {
      // on clicking course, set its courseID to Store state (so not relying on router params)
      this.setCurrentCourseId(this.course.id);
      // route to Galaxy View (passing params as props)
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.course.id,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.course {
  cursor: pointer;

  .title {
    font-size: 0.65rem !important;
    font-weight: 500;
    line-height: 1rem;
    text-transform: uppercase;
    font-family: "Roboto", sans-serif !important;
  }

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
