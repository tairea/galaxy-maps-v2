<template>
  <div
    id="galaxy-info"
    :class="draft ? 'draft-border' : 'galaxy-border'"
    v-if="course"
    :style="{ height: height + '%', overflow: descriptionOverflow ? 'scroll' : '' }"
  >
    <!-- Label -->
    <h2 class="galaxy-label"><span v-if="draft">Drafting</span> Galaxy</h2>
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
    <v-img v-if="course.image" class="galaxy-image mt-2" :src="course.image.url"></v-img>
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
    <CreateEditDeleteGalaxyDialog v-if="teacher" :edit="true" :courseToEdit="course" />
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "@/components/Dialogs/CreateEditDeleteGalaxyDialog.vue";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
import { mdiLink } from "@mdi/js";

export default {
  name: "GalaxyInfo",
  props: ["course", "teacher", "draft", "height", "descriptionOverflow"],
  components: {
    CreateEditDeleteGalaxyDialog,
  },
  mounted() {},
  data() {
    return {
      mdiLink,
      readmore: false,
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
            text: err.message,
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
  overflow-y: auto;

  // Add custom scrollbar styles
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--v-galaxyAccent-base);
    // border-radius: 4px;
  }

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
  }

  .galaxy-title {
    font-size: 1.2rem;
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

.galaxy-status {
  font-size: 0.6rem !important;
  line-height: 1rem !important;
}

.in-review {
  color: var(--v-cohortAccent-base);
}
</style>
