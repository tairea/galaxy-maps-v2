<template>
  <div> 
    <!-- COURSE CARD -->
    <div class="galaxyCard" :class="{ 'selected-galaxy': active, 'draft-galaxy': draft}">
      <img
        v-if="course.image.url"
        class="galaxyCardImage"
        :src="course.image.url"
      />
      <div v-else class="imagePlaceholder">
        {{ first3Letters(course.title) }}
      </div>
      <p
        class="galaxyListPanelContent text-left ma-1"
        :class="{ 'selected-galaxy': active }"
      >
        {{ course.title }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "GalaxyListPanel",
  props: ["course", "active"],
  components: {},
  data() {
    return {};
  },
  async mounted() {},
  computed: {
    draft() {
      return this.course.status === 'drafting'
    }
  },
  methods: {
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
  },
};
</script>

<style lang="scss" scoped>
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
    font-size: 0.6rem;
    letter-spacing: 1px;
  }
}

.draft-galaxy {
  border: 1px dashed var(--v-galaxyAccent-base);

}
</style>
