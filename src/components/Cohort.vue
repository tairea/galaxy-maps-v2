<template>
  <v-col
    class="d-flex flex-column justify-start align-center cohort"
    :cols="cols"
    @click="routeToCohort(cohort)"
  >
    <v-img
      v-if="cohort.image.url"
      :src="cohort.image.url"
      max-width="60px"
      max-height="60px"
      class="cohort-image"
    ></v-img>
    <div v-else class="imagePlaceholder">{{ first3Letters(cohort.name) }}</div>
    <h3 class="overline">{{ cohort.name }}</h3>
  </v-col>
</template>

<script>
export default {
  name: "Cohort",
  props: ["cohort", "cols"],
  data() {
    return {};
  },
  mounted() {},
  computed: {},
  methods: {
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    routeToCohort(cohort) {
      // on clicking cohort, set its cohortID to Store state (so not relying on router params)
      this.$store.commit("setCurrentCohortId", this.cohort.id);
      // route to Galaxy View (passing params as props)
      this.$router.push({
        name: "CohortView",
        params: {
          cohortName: this.camelize(this.cohort.name),
          cohortId: this.cohort.id,
        },
      });
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.cohort {
  cursor: pointer;

  .cohort-image {
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
