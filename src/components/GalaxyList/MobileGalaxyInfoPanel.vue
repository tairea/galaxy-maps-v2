<template>
  <div v-if="selectedCourse">
    <!-- Mobile panel that slides up from bottom -->
    <div class="mobile-panel" :class="{ 'mobile-panel-open': selectedCourse }">
      <div class="mobile-panel-container">
        <!-- Close button positioned at top right -->
        <v-btn text x-small color="missionAccent" class="close-button" @click="close">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>

        <!-- Header section -->
        <div class="mobile-panel-header">
          <!-- Image and description row -->
          <div class="mobile-content-row">
            <div class="mobile-image-section">
              <v-img
                v-if="hasValidImage"
                class="mobile-galaxy-image"
                :src="selectedCourse.image.url"
                @error="handleImageError"
              ></v-img>
              <div v-else class="mobile-image-placeholder">
                {{ first3Letters(selectedCourse.title) }}
              </div>
            </div>
            <div class="mobile-panel-title">
              <span class="mobile-status-label">{{ courseStatus }} GALAXY</span>
              <h2 class="mobile-course-title">{{ selectedCourse.title }}</h2>
              <div class="mobile-description-section">
                <p ref="description" class="mobile-description missionAccent--text">
                  {{ maybeTruncate(selectedCourse.description) }}
                  <a v-if="readmore" class="mobile-read-more" @click="showFullDescription()">
                    Read more
                  </a>
                </p>
              </div>
            </div>
          </div>
          <!-- Mapped by section -->
          <div class="mobile-panel-content">
            <div class="mobile-mapped-by-section">
              <p class="mobile-mapped-by-label">
                <span class="mappedByTitle">MAPPED BY</span>
              </p>
              <div class="mobile-mapped-by-container">
                <Avatar
                  :personId="selectedCourse.mappedBy.personId"
                  :size="50"
                  :colourBorder="true"
                />
                <span class="mobile-mapped-by-name">{{ selectedCourse.mappedBy.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action button section -->
        <div class="mobile-panel-actions">
          <v-btn
            class="mobile-view-galaxy-btn"
            dark
            large
            color="galaxyAccent"
            outlined
            tile
            @click="routeToGalaxyEdit"
          >
            View Galaxy
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "@/components/Reused/Avatar.vue";
import useRootStore from "@/store/index";
import { mapActions } from "pinia";
import { mdiClose } from "@mdi/js";

export default {
  name: "MobileGalaxyInfoPanel",
  props: ["selectedCourse"],
  components: {
    Avatar,
  },
  data() {
    return {
      readmore: false,
      mdiClose,
    };
  },
  computed: {
    courseStatus() {
      if (!this.selectedCourse) return "";
      return this.selectedCourse.status || "UNLISTED";
    },
    hasValidImage() {
      return this.selectedCourse?.image?.url;
    },
    first3Letters() {
      return (title) => {
        if (!title) return "";
        return title.substring(0, 3).toUpperCase();
      };
    },
    maybeTruncate() {
      return (description) => {
        if (!description) return "";
        if (description.length > 150) {
          this.readmore = true;
          return description.substring(0, 150) + "...";
        }
        return description;
      };
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId"]),
    close() {
      this.$emit("closeInfoPanel");
    },
    closeInfoPanel() {
      this.$emit("closeInfoPanel");
    },
    routeToGalaxyEdit() {
      console.log("route to galaxy", this.selectedCourse.id);
      // save current course to store
      this.setCurrentCourseId(this.selectedCourse.id);
      // route to topic/solar system
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.selectedCourse.id,
        },
      });
    },
    handleImageError() {
      // Handle image loading error
    },
    showFullDescription() {
      // Show full description logic
      if (this.$refs.description) {
        this.$refs.description.innerHTML = this.selectedCourse.description;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// Mobile panel container
.mobile-panel {
  position: fixed;
  bottom: -100vh;
  left: 0;
  right: 0;
  background: var(--v-background-darken1);
  z-index: 400;
  transition: bottom 0.3s ease-out;
  max-height: 80vh;
  overflow: hidden;

  &.mobile-panel-open {
    bottom: 0;
  }

  .mobile-panel-container {
    border: 1px solid var(--v-missionAccent-base);
    margin: 10px;
    position: relative;
  }

  // Close button positioned at top right
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 0px !important;
    z-index: 10;
  }
}

// Header section
.mobile-panel-header {
  //   padding: 20px 20px 0px 20px;
  border-bottom: 1px solid var(--v-missionAccent-base);
  margin-bottom: 90px;
  height: 200px;
  overflow-y: scroll;
  mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 5%,
    black 90%,
    transparent 100%
  );

  // Image and description row (horizontal layout like screenshot)
  .mobile-content-row {
    display: flex;
    flex-direction: row;
    gap: 20px;
    margin: 15px;

    .mobile-image-section {
      flex-shrink: 0;

      .mobile-galaxy-image {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 10px;
      }

      .mobile-image-placeholder {
        width: 120px;
        height: 120px;
        background: var(--v-missionAccent-base);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        border-radius: 10px;
      }
    }

    .mobile-panel-title {
      flex: 1;
      display: flex;
      align-items: flex-start;
      flex-direction: column;

      .mobile-status-label {
        color: var(--v-galaxyAccent-base);
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: block;
        margin-bottom: 5px;
      }

      .mobile-course-title {
        color: var(--v-galaxyAccent-base);
        font-weight: 800;
        font-size: 1.2rem;
        line-height: 1.3;
        margin: 0;
        word-wrap: break-word;
      }

      .mobile-description-section {
        flex: 1;

        .mobile-description {
          color: white;
          font-size: 0.8rem;
          line-height: 1.5;
          margin: 0;

          .mobile-read-more {
            color: var(--v-galaxyAccent-base);
            text-decoration: none;
            border-bottom: 1px solid var(--v-galaxyAccent-base);
            cursor: pointer;
            margin-left: 5px;
          }
        }
      }
    }
  }
}

// Content section
.mobile-panel-content {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
  border-top: 1px solid var(--v-missionAccent-base);

  // Mapped by section styled like PopupGalaxyPreview.vue
  .mobile-mapped-by-section {
    .mobile-mapped-by-label {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin: 0 0 10px 0;
      text-align: center;

      .mappedByTitle {
        color: var(--v-galaxyAccent-base);
        font-size: 0.8rem;
        font-weight: 800;
      }
    }

    .mobile-mapped-by-container {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 10px;

      .mobile-mapped-by-name {
        color: var(--v-missionAccent-base);
        font-size: 0.8rem;
        text-align: center;
      }
    }
  }
}

// Action button section
.mobile-panel-actions {
  padding: 20px;
  text-align: center;
  position: absolute;
  bottom: 0;
  width: 100%;
  border-top: 1px solid var(--v-missionAccent-base);
  background-color: var(--v-background-darken1);

  .mobile-view-galaxy-btn {
    width: 100%;
    height: 50px;
    font-size: 1rem;
    font-weight: 500;
    border-width: 2px;
  }
}

// Responsive adjustments for very small screens
@media (max-width: 480px) {
  .mobile-panel-header {
    .mobile-content-row {
      flex-direction: row;
      gap: 15px;

      .mobile-image-section {
        text-align: center;

        .mobile-galaxy-image,
        .mobile-image-placeholder {
          width: 100px;
          height: 100px;
          margin: 0 auto;
        }
      }
    }
  }
}
</style>
