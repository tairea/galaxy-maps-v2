<template>
  <div
    id="mobile-galaxy-info"
    :class="getBorderClass()"
    :style="{ border: isMinimized ? 'none' : '1px solid var(--v-galaxyAccent-base)' }"
    v-if="course"
  >
    <div class="mobile-panel-container">
      <!-- Header section with minimize toggle -->
      <div class="mobile-panel-header">
        <!-- Clickable Label with Arrow for minimize -->
        <div class="mobile-galaxy-label" @click="toggleMinimize">
          <div v-if="!isMinimized"><span v-if="draft">Drafting</span> Galaxy</div>
          <div v-else>
            {{ truncateTitle(course.title) }}
          </div>
          <v-icon class="arrow" color="var(--v-background-base)">{{
            isMinimized ? mdiMenuDown : mdiMenuUp
          }}</v-icon>
        </div>

        <!-- Collapsible Content -->
        <div class="mobile-galaxy-content" :class="{ minimized: isMinimized }">
          <!-- Image and description row -->
          <div class="mobile-content-row">
            <div class="mobile-image-section">
              <v-img
                v-if="course.image"
                class="mobile-galaxy-image"
                :src="course.image.url"
                @error="handleImageError"
              ></v-img>
              <div v-else class="mobile-image-placeholder">
                {{ first3Letters(course.title) }}
              </div>
            </div>
            <div class="mobile-panel-title">
              <h1 class="mobile-galaxy-title">{{ course.title }}</h1>
              <!-- Status -->
              <p v-if="teacher" class="mobile-galaxy-status">
                Status: <span class="font-weight-black">{{ course.status }}</span>
              </p>
              <!-- Visibility -->
              <p v-if="course.status === 'submitted'" class="mobile-galaxy-status in-review">
                awaiting review
              </p>
              <p v-if="teacher" class="mobile-galaxy-status">
                Visibility: <span class="font-weight-black">{{ visibility }}</span>
              </p>
              <p v-if="course.presentationOnly" class="mobile-galaxy-status">
                <span class="font-weight-black baseAccent--text">Presentation Map</span>
              </p>
            </div>
          </div>

          <!-- Description section -->
          <div class="mobile-description-section">
            <p ref="description" class="mobile-description">
              {{ maybeTruncate(course.description) }}
              <a v-if="readmore" class="mobile-read-more" @click="showFullDescription()">
                Read more
              </a>
            </p>
          </div>

          <!-- Copy link button for unlisted galaxies -->
          <div v-if="teacher && course.visibility == 'unlisted'" class="mobile-actions-section">
            <v-btn
              @click="copyLink"
              color="baseAccent"
              outlined
              small
              style="width: 100%"
              class="mb-2"
            >
              <v-icon left>{{ mdiLink }}</v-icon>
              Copy link
            </v-btn>
          </div>

          <!-- Edit button for teachers -->
          <div v-if="teacher" class="mobile-edit-section">
            <CreateEditDeleteGalaxyDialog
              :edit="true"
              :courseToEdit="course"
              @preSaveUpdate="forwardPreSaveUpdate"
            />

            <!-- Publish galaxy under edit button (always for teacher on mobile when allowed) -->
            <div class="mobile-publish-section" v-if="showPublish">
              <PublishGalaxy :course="course" :courseTasks="courseTasks || []" />
            </div>

            <div v-if="shouldShowEditButtons">
              <!-- Planets collapse button -->
              <div class="mobile-planets-section">
                <v-btn
                  outlined
                  color="missionAccent"
                  x-small
                  @click="togglePlanetsCollapse"
                  width="95%"
                >
                  <v-icon small>{{ isPlanetsCollapsed ? mdiChevronDown : mdiChevronUp }}</v-icon>
                  {{ isPlanetsCollapsed ? "Expand Planets" : "Collapse Planets" }}
                </v-btn>
              </div>

              <!-- Print draft button -->

              <PdfDownloader
                :ai-generated-galaxy-map="aiGeneratedGalaxyMap"
                :bound-course="boundCourse"
                :is-galaxy-info-minimized="isGalaxyInfoMinimized"
                :expand-all-planets="expandAllPlanets"
                :get-star-index="getStarIndex"
                :transformed-star-details="transformedStarDetails"
                :network-ref="networkRef"
                @toggle-minimize="toggleMinimize"
              />

              <v-btn color="missionAccent" outlined x-small width="95%" @click="downloadGalaxyJson">
                <v-icon x-small class="mr-1">{{ mdiDownload }}</v-icon>
                Download JSON
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "@/components/Dialogs/CreateEditDeleteGalaxyDialog.vue";
import PdfDownloader from "@/components/Reused/PdfDownloader.vue";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
import {
  mdiLink,
  mdiMenuUp,
  mdiMenuDown,
  mdiChevronDown,
  mdiChevronUp,
  mdiDownload,
} from "@mdi/js";
import { getFriendlyErrorMessage } from "@/lib/utils";
import PublishGalaxy from "@/components/GalaxyView/PublishGalaxy.vue";

export default {
  name: "MobileGalaxyInfoPanel",
  props: [
    "course",
    "teacher",
    "draft",
    "minimized",
    "isPlanetsCollapsed",
    "aiGeneratedGalaxyMap",
    "boundCourse",
    "isGalaxyInfoMinimized",
    "expandAllPlanets",
    "getStarIndex",
    "transformedStarDetails",
    "networkRef",
    "courseTasks",
    "showPublish",
  ],
  components: {
    CreateEditDeleteGalaxyDialog,
    PdfDownloader,
    PublishGalaxy,
  },
  data() {
    return {
      mdiLink,
      mdiMenuUp,
      mdiMenuDown,
      mdiChevronDown,
      mdiChevronUp,
      mdiDownload,
      readmore: false,
      isMinimized: false,
    };
  },
  watch: {
    minimized: {
      immediate: true,
      handler(newVal) {
        this.isMinimized = newVal;
      },
    },
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    visibility() {
      if (this.course.public) return "public";
      else if (this.course.visibility) return this.course.visibility;
      else return "private";
    },
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    first3Letters() {
      return (title) => {
        if (!title) return "";
        return title.substring(0, 3).toUpperCase();
      };
    },
    shouldShowEditButtons() {
      const currentRouteName = this.$route.name;
      return currentRouteName === "AiGalaxyEdit" || currentRouteName === "AiGalaxyEditWithCourse";
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    forwardPreSaveUpdate(payload) {
      this.$emit("preSaveUpdate", payload);
    },
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.$emit("minimised", this.isMinimized);
    },
    maybeTruncate(value) {
      if (!value) return "";
      if (value.length <= 150) {
        return value;
      } else {
        // show read more button
        this.readmore = true;
        // limit to 150 characters for mobile
        return value.substring(0, 150) + "...";
      }
    },
    truncateTitle(title) {
      if (!title) return "";
      if (title.length > 15) {
        return title.substring(0, 15) + "...";
      }
      return title;
    },
    showFullDescription() {
      if (this.$refs.description) {
        this.$refs.description.innerHTML = this.course.description;
      }
    },
    copyLink() {
      const currentUrl = this.$router.currentRoute.fullPath;
      navigator.clipboard
        .writeText("https://galaxymaps.io" + currentUrl)
        .then(() => {
          this.setSnackbar({
            show: true,
            text: "Map link copied to clipboard",
            color: "baseAccent",
          });
        })
        .catch((err) => {
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(err.code),
            color: "pink",
          });
        });
    },
    downloadGalaxyJson() {
      if (!this.aiGeneratedGalaxyMap) {
        this.setSnackbar({
          show: true,
          text: "No galaxy map available to download",
          color: "pink",
        });
        return;
      }

      const sanitizedMap = this.getSanitizedGalaxyMap();
      const jsonString = JSON.stringify(sanitizedMap, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `${this.getDownloadFileName()}-galaxy-map.json`;

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    getSanitizedGalaxyMap() {
      const source = this.aiGeneratedGalaxyMap || {};
      const clone = JSON.parse(JSON.stringify(source));
      const { history, idInDatabase, questions, status, tokens, ...rest } = clone;
      return rest;
    },
    getDownloadFileName() {
      const baseTitle = this.course && this.course.title ? this.course.title : "galaxy-map";
      const normalized = baseTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return normalized || "galaxy-map";
    },

    handleImageError() {
      // Handle image loading error
    },
    getBorderClass() {
      if (this.draft) {
        return this.isMinimized ? "draft-border-minimized" : "draft-border";
      }
      return "galaxy-border";
    },
    togglePlanetsCollapse() {
      this.$emit("togglePlanetsCollapse");
    },
  },
};
</script>

<style lang="scss" scoped>
// Mobile panel container
#mobile-galaxy-info {
  width: 100%;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
  color: var(--v-galaxyAccent-base);
  &.minimized {
    border: none;
  }

  .mobile-panel-container {
    position: relative;
    backdrop-filter: blur(2px);
  }
}

// Header section
.mobile-panel-header {
  height: auto;

  // Galaxy label with minimize functionality
  .mobile-galaxy-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    position: absolute;
    top: 0;
    left: -1px;
    color: var(--v-background-base);
    background-color: var(--v-galaxyAccent-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    width: fit-content;
    min-width: 120px;
    box-sizing: border-box;
    z-index: 5;

    &.minimized {
      width: fit-content;
      border: none;
      box-shadow: none;
    }

    .arrow {
      font-size: 0.6rem;
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }
  }

  // Collapsible content
  .mobile-galaxy-content {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
    max-height: 1000px;

    &.minimized {
      max-height: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
    }
  }

  // Image and description row
  .mobile-content-row {
    display: flex;
    flex-direction: row;
    gap: 20px;
    margin: 0px 15px;
    margin-top: 30px;

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
        background: var(--v-galaxyAccent-base);
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

      .mobile-galaxy-title {
        color: var(--v-galaxyAccent-base);
        font-weight: 800;
        font-size: 1.2rem;
        line-height: 1.3;
        margin: 0 0 10px 0;
        word-wrap: break-word;
        text-transform: uppercase;
      }

      .mobile-galaxy-status {
        font-size: 0.6rem !important;
        line-height: 1rem !important;
        color: var(--v-galaxyAccent-base);
        margin: 2px 0;
        text-transform: uppercase;

        &.in-review {
          color: var(--v-cohortAccent-base);
        }
      }
    }
  }

  // Description section
  .mobile-description-section {
    margin: 5px 15px 10px 15px;

    .mobile-description {
      color: var(--v-galaxyAccent-base);
      font-size: 0.8rem;
      line-height: 1.5;
      margin: 0;
      font-style: italic;

      .mobile-read-more {
        color: var(--v-galaxyAccent-base);
        text-decoration: none;
        border-bottom: 1px solid var(--v-galaxyAccent-base);
        cursor: pointer;
        margin-left: 5px;
      }
    }
  }

  // Actions section
  .mobile-actions-section,
  .mobile-edit-section,
  .mobile-planets-section,
  .mobile-print-section,
  .mobile-publish-section {
    margin: 15px;
  }

  .mobile-edit-section {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .v-btn {
      width: 100%;
    }
  }
}

.galaxy-border {
  border: 1px solid var(--v-galaxyAccent-base);
  &.minimized {
    border: none;
  }
}

.draft-border {
  border: 1px dashed var(--v-galaxyAccent-base);
}

.draft-border-minimized {
  border: none;
}

.galaxy-status {
  font-size: 0.6rem !important;
  line-height: 1rem !important;
}

.in-review {
  color: var(--v-cohortAccent-base);
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
