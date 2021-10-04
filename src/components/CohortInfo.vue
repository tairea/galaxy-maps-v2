<template>
  <div id="cohort-info">
    <h2 class="cohort-label">Cohort</h2>
    <h1 class="cohort-title">{{ cohort.name }}</h1>
    <!-- <div class="d-flex justify-center align-center"> -->
    <div v-if="cohort.image.url">
      <v-img class="cohort-image" width="auto" :src="cohort.image.url"></v-img>
    </div>
    <!-- </div> -->
    <p class="cohort-description">{{ cohort.description }}</p>
    <div class="d-flex justify-center align-center">
      <Organisation
        v-if="cohort.organisation"
        :organisation="getOrganisationById(cohort.organisation)"
        :size="'0.25em'"
      />
    </div>
    <CreateEditDeleteCohortDialog :edit="true" :cohortToEdit="cohort" />
  </div>
</template>

<script>
import Organisation from "../components/Organisation";
import CreateEditDeleteCohortDialog from "../components/CreateEditDeleteCohortDialog";

import { mapGetters } from "vuex";

export default {
  name: "CohortInfo",
  props: ["cohort"],
  components: {
    Organisation,
    CreateEditDeleteCohortDialog,
  },
  mounted() {},
  computed: {
    ...mapGetters(["getOrganisationById"]),
  },
  data() {
    return {};
  },
};
</script>

<style lang="scss">
#cohort-info {
  width: calc(100% - 30px);
  border: 1px solid var(--v-cohortAccent-base);
  margin-top: 30px;
  padding: 20px;
  position: relative;

  .cohort-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    // ribbon label
    position: absolute;
    top: 0;
    left: -1px;
    background-color: var(--v-cohortAccent-base);
    color: var(--v-background-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
  }

  .cohort-title {
    font-size: 1.2rem;
    color: var(--v-cohortAccent-base);
    font-weight: 600;
    text-transform: uppercase;
    margin: 20px 0px 5px 0px;
  }

  .cohort-description {
    margin-top: 10px;
    color: var(--v-cohortAccent-base);
    // font-size: 0.9rem;
  }
}

h1 {
  color: white;
}
</style>
