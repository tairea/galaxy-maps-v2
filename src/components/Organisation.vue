<template>
  <v-container>
    <span
      v-if="cohortView"
      class="caption"
      style="color: var(--v-cohortAccent-base)"
      >Organisation</span
    >
    <v-row :class="cohortView ? 'my-1' : ''">
      <v-col
        class="d-flex justify-center align-center cursor"
        @click="editOrg()"
      >
        <v-img
          v-if="organisation.image"
          :src="organisation.image.url"
          :max-width="size ? size + 'px' : '30px'"
          :max-height="size ? size + 'px' : '30px'"
          class="organisation-image"
        ></v-img>
        <div v-else-if="organisation.name" class="imagePlaceholder">
          {{ first3Letters(organisation.name) }}
        </div>
        <span v-if="!hideName" class="ml-6 overline">{{
          organisation.name
        }}</span>
      </v-col>
    </v-row>
  </v-container>
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
  // object-fit: cover;
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

.overline {
  line-height: 1rem !important;
}
</style>
