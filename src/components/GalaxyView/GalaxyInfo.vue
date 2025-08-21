<template>
  <div id="galaxy-info" :class="getBorderClass()" v-if="course">
    <!-- Clickable Label with Arrow -->
    <h2 class="galaxy-label" @click="toggleMinimize" :class="{ minimized: isMinimized }">
      <div v-if="!isMinimized"><span v-if="draft">Drafting</span> Galaxy</div>
      <div v-else>
        {{ course.title }}
      </div>
      <v-icon class="arrow" color="var(--v-background-base)">{{
        isMinimized ? mdiMenuDown : mdiMenuUp
      }}</v-icon>
    </h2>

    <!-- Collapsible Content -->
    <div class="galaxy-content mt-2" :class="{ minimized: isMinimized }">
      <!-- Map Name  -->
      <h1 class="galaxy-title">{{ course.title }}</h1>
      <!-- Status -->
      <p v-if="teacher" class="galaxy-status overline mb-0">
        Status: <span class="font-weight-black">{{ course.status }}</span>
      </p>
      <!-- Visibility -->
      <p v-if="course.status === 'submitted'" class="galaxy-status overline mb-0 in-review">
        awaiting review
      </p>
      <p v-if="teacher" class="galaxy-status overline mb-0">
        Visibility:
        <span class="font-weight-black">{{ visibility }}</span>
      </p>
      <p v-if="course.presentationOnly" class="galaxy-status overline mb-0">
        <span class="font-weight-black baseAccent--text">Presentation Map</span>
      </p>
      <!-- Map Image -->
      <img v-if="course.image" class="galaxy-image mt-2" :src="course.image.url" />
      <p ref="description" class="galaxy-description">
        <!-- {{ course.description }} -->
        {{ maybeTruncate(course.description) }}
        <a style="border-bottom: 1px solid" v-if="readmore" @click="showFullDescription()"
          >Read more</a
        >
      </p>
      <v-btn
        v-if="teacher && course.visibility == 'unlisted'"
        @click="copyLink"
        color="baseAccent"
        outlined
        small
        style="width: 100%"
        class="mb-2"
      >
        <v-icon left> {{ mdiLink }} </v-icon>
        Copy link
      </v-btn>
      <CreateEditDeleteGalaxyDialog
        v-if="teacher"
        :edit="true"
        :courseToEdit="course"
        @preSaveUpdate="forwardPreSaveUpdate"
      />
    </div>
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "@/components/Dialogs/CreateEditDeleteGalaxyDialog.vue";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
import { mdiLink, mdiMenuUp, mdiMenuDown } from "@mdi/js";
import { getFriendlyErrorMessage } from "@/lib/utils";

export default {
  name: "GalaxyInfo",
  props: ["course", "teacher", "draft"],
  components: {
    CreateEditDeleteGalaxyDialog,
  },
  mounted() {},
  data() {
    return {
      mdiLink,
      mdiMenuUp,
      mdiMenuDown,
      readmore: false,
      isMinimized: false,
    };
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    visibility() {
      if (this.course.public) return "public";
      else if (this.course.visibility) return this.course.visibility;
      else return "private";
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
    getBorderClass() {
      if (this.draft) {
        return this.isMinimized ? "draft-border-minimized" : "draft-border";
      }
      return "galaxy-border";
    },
    maybeTruncate(value) {
      if (!value) return "";
      if (value.length <= 100) {
        return value;
      } else {
        // show read more button
        this.readmore = true;
        // limit to 100 characters
        return value.substring(0, 100) + "...";
      }
    },
    showFullDescription() {
      this.$refs.description.innerHTML = this.course.description;
    },
    copyLink() {
      const currentUrl = this.$router.currentRoute.fullPath;
      navigator.clipboard
        // .writeText(window.location.origin + currentUrl)
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
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
        });
    },
  },
};
</script>

<style lang="scss" scoped>
#galaxy-info {
  width: 100%;
  // height: 400px;
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
  color: var(--v-galaxyAccent-base);

  .galaxy-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    // ribbon label
    position: absolute;
    top: 0;
    left: -1px;
    color: var(--v-background-base);
    background-color: var(--v-galaxyAccent-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
    cursor: pointer; /* Add cursor pointer for clickability */
    display: flex; /* Use flexbox for arrow alignment */
    align-items: center;
    gap: 5px; /* Space between text and arrow */
    width: fit-content; /* Dynamic width based on content */
    min-width: 120px; /* Minimum width to ensure readability */
    box-sizing: border-box; /* Include padding in width calculation */

    &.minimized {
      width: fit-content; /* Keep dynamic width when minimized */
      border: none; /* Remove any borders when minimized */
      box-shadow: none; /* Remove any shadows when minimized */
    }
  }

  .galaxy-label .arrow {
    font-size: 0.6rem;
    transition: transform 0.3s ease;
    flex-shrink: 0; /* Prevent arrow from shrinking */
  }

  .galaxy-content {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
    max-height: 1000px; /* Set a reasonable max height for expanded state */
  }

  .galaxy-content.minimized {
    max-height: 0;
    opacity: 0;
    margin: 0;
    padding: 0;
    width: 150px;
  }

  .galaxy-title {
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    margin: 5px 0px 5px 0px;
    color: var(--v-galaxyAccent-base);
  }

  .galaxy-image {
    width: 100%;
  }

  .galaxy-description {
    margin-top: 10px;
    font-size: 0.8rem;
    color: var(--v-galaxyAccent-base);
    font-style: italic;
  }
}

.galaxy-border {
  border: 1px solid var(--v-galaxyAccent-base);
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
</style>
