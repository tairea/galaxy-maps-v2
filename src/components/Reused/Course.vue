<template>
  <v-col
    class="d-flex flex-column justify-start align-center course"
    :cols="cols"
    @click="routeToCourse(course)"
    @mouseenter="showDeleteIcon = true"
    @mouseleave="showDeleteIcon = false"
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
    <div v-else class="d-flex flex-column justify-center align-center course-content">
      <div class="course-image-container">
        <v-img
          v-if="hasValidImage"
          :src="course.image.url"
          max-width="60px"
          max-height="60px"
          class="course-image"
          @error="handleImageError"
        ></v-img>
        <div v-else class="imagePlaceholder">{{ first3Letters(course.title) }}</div>

        <!-- Delete icon overlay -->
        <v-btn
          v-if="showDeleteIcon && showDeleteButton"
          icon
          x-small
          color="error"
          class="delete-icon"
          @click.stop="showDeleteDialog"
        >
          <v-icon>{{ mdiDelete }}</v-icon>
        </v-btn>
      </div>
      <p class="title text-center pt-2 mb-0">{{ formattedTitle }}</p>
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDeleteCourseDialog
      :dialog="deleteDialog"
      :course="course"
      :cohortId="cohortId"
      @close="deleteDialog = false"
      @cancel="deleteDialog = false"
      @courseDeleted="onCourseDeleted"
    />
  </v-col>
</template>

<script>
import useRootStore from "@/store/index";
import { mapActions } from "pinia";
import { mdiDelete } from "@mdi/js";
import ConfirmDeleteCourseDialog from "@/components/Dialogs/ConfirmDeleteCourseDialog.vue";

export default {
  name: "Course",
  props: ["course", "cols", "tooltip", "cohortId", "showDeleteButton"],
  components: {
    ConfirmDeleteCourseDialog,
  },
  data() {
    return {
      imageLoadError: false,
      showDeleteIcon: false,
      deleteDialog: false,
      mdiDelete,
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
    formattedTitle() {
      const title = this.course.title;
      if (!title) return "";

      // Create a temporary span to measure text width
      const span = document.createElement("span");
      span.style.visibility = "hidden";
      span.style.position = "absolute";
      span.style.whiteSpace = "nowrap";
      span.style.fontSize = "0.65rem";
      span.style.fontWeight = "500";
      span.style.fontFamily = "Roboto, sans-serif";
      span.textContent = title;

      document.body.appendChild(span);
      const textWidth = span.offsetWidth;
      document.body.removeChild(span);

      // If text is longer than 100px, add line breaks
      if (textWidth > 100) {
        // Split into words and create lines that fit within 100px
        const words = title.split(" ");
        const lines = [];
        let currentLine = "";

        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + (currentLine ? " " : "") + words[i];
          const testSpan = document.createElement("span");
          testSpan.style.visibility = "hidden";
          testSpan.style.position = "absolute";
          testSpan.style.whiteSpace = "nowrap";
          testSpan.style.fontSize = "0.65rem";
          testSpan.style.fontWeight = "500";
          testSpan.style.fontFamily = "Roboto, sans-serif";
          testSpan.textContent = testLine;

          document.body.appendChild(testSpan);
          const testWidth = testSpan.offsetWidth;
          document.body.removeChild(testSpan);

          if (testWidth > 100 && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        return lines.join("\n");
      }

      return title;
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
    showDeleteDialog() {
      this.deleteDialog = true;
    },
    onCourseDeleted(courseId) {
      this.$emit("courseDeleted", courseId);
    },
  },
};
</script>

<style lang="scss" scoped>
.course {
  cursor: pointer;
  position: relative;

  .course-content {
    position: relative;
  }

  .course-image-container {
    position: relative;
    display: inline-block;
  }

  .delete-icon {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 10;
    background-color: white !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .title {
    font-size: 0.65rem !important;
    font-weight: 500;
    line-height: 1.2rem;
    text-transform: uppercase;
    font-family: "Roboto", sans-serif !important;
    white-space: pre-line;
    word-wrap: break-word;
    max-width: 100px;
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
