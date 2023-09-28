<template>
  <div>
    <span v-if="cohortView" class="caption" style="color: var(--v-cohortAccent-base)"
      >Organisation</span
    >
    <div
      :class="cohortView ? 'my-1' : ''"
      class="d-flex align-center cursor mt-3"
      @click="editOrg()"
    >
      <img
        v-if="organisation.image"
        :src="organisation.image.url"
        :width="size ? size + 'px' : '30px'"
        :height="size ? size + 'px' : '30px'"
        class="organisation-image"
      />
      <div v-else-if="organisation.name" class="imagePlaceholder">
        {{ first3Letters(organisation.name) }}
      </div>
      <div class="ml-6">
        <span v-if="!hideName" class="overline">{{ organisation.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Organisation",
  props: ["organisation", "hideName", "size"],
  data() {
    return {};
  },
  mounted() {},
  computed: {
    cohortView() {
      return this.$route.name === "CohortView";
    },
  },
  methods: {
    editOrg() {
      this.$emit("editOrg", this.organisation.id);
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
  },
};
</script>

<style lang="scss" scoped>
.cursor {
  cursor: pointer;
  transition: all 0.3s;
}
.cursor:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.organisation-image {
  // width: 100px;
  // height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.imagePlaceholder {
  width: 60px;
  height: 60px;
  // border-radius: 50%;
  background-color: rgba(200, 200, 200, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.overline {
  line-height: 1rem !important;
}
</style>
