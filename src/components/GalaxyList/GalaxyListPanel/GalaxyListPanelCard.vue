<template>
  <div>
    <!-- COURSE CARD -->
    <div
      class="galaxyCard"
      :style="
        admin
          ? { border: '1px solid var(--v-cohortAccent-base)' }
          : { border: '1px solid var(--v-galaxyAccent-base)' }
      "
      :class="{ 'selected-galaxy': active, 'draft-galaxy': draft }"
    >
      <img
        v-if="hasValidImage"
        class="galaxyCardImage ma-1"
        :src="course.image.url"
        :alt="course.title"
        @error="handleImageError"
      />

      <div v-else class="imagePlaceholder ma-1">
        {{ first3Letters(course.title) }}
      </div>
      <p class="galaxyListPanelContent text-left ma-1" :class="{ 'selected-galaxy': active }">
        {{ course.title }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "GalaxyListPanelCard",
  props: ["course", "active", "admin"],
  components: {},
  data() {
    return {
      imageLoadError: false,
    };
  },
  async mounted() {},
  computed: {
    draft() {
      return this.course.status === "drafting";
    },
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
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    handleImageError() {
      this.imageLoadError = true;
    },
  },
};
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}

.selected-galaxy {
  position: relative;
  background-color: var(--v-galaxyAccent-base);
  color: var(--v-background-base) !important;
  font-weight: 900;
  text-transform: uppercase;
}

.galaxyCard {
  position: relative;
  margin: 10px;
  border: 1px solid var(--v-galaxyAccent-base);
  display: flex;
  cursor: pointer;

  .galaxyCardImage {
    width: 30px;
    height: 30px;
    object-fit: cover;
  }

  .imagePlaceholder {
    width: 30px;
    height: 30px;
    background-color: rgba(200, 200, 200, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.6rem;
  }

  .galaxyListPanelContent {
    color: var(--v-galaxyAccent-base);
    position: relative;
    font-size: 0.8rem;
    letter-spacing: 1px;
    width: calc(100% - 30px);
  }
}

.draft-galaxy {
  border: 1px dashed var(--v-galaxyAccent-base);
}
</style>
