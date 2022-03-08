<template>
  <v-col
    :cols="cols"
    @click="!studentView ? routeToCohort(cohort) : null"
    class="d-flex flex-column justify-start align-center cohort"
    :style="!studentView ? 'cursor: pointer;' : ''"
  >
    <div
      class="d-flex flex-column justify-start align-center cohort"
      v-if="!tooltip"
    >
      <v-img
        v-if="cohort.image.url"
        :src="cohort.image.url"
        max-width="60px"
        max-height="60px"
        class="cohort-image"
      ></v-img>
      <div v-else class="imagePlaceholder">
        {{ first3Letters(cohort.name) }}
      </div>
      <h3 class="overline cohort-name">{{ cohort.name }}</h3>
    </div>
    <v-tooltip v-else bottom>
      <template v-slot:activator="{ on, attrs }">
        <div v-bind="attrs" v-on="on">
          <v-img
            v-if="cohort.image.url"
            :src="cohort.image.url"
            max-width="40px"
            max-height="40px"
            class="cohort-image"
          ></v-img>
          <div v-else class="imagePlaceholder cohort-name">
            {{ first3Letters(cohort.name) }}
          </div>
        </div>
      </template>
      <h3 class="overline">{{ cohort.name }}</h3>
    </v-tooltip>
  </v-col>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "Cohort",
  props: ["cohort", "cols", "tooltip", "studentView"],
  data() {
    return {};
  },
  methods: {
    ...mapActions(["setCurrentCohort"]),
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    async routeToCohort() { 
      // this.$store.commit("setCurrentCohort", {})
      await this.setCurrentCohort(this.cohort);
      // console.log('cohort set: ', cohort)
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
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.cohort {
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

  .cohort-name {
    text-align: center;
    font-size: 0.65rem !important;
    line-height: 1rem;
    padding-top: 10px;
  }
}
</style>
