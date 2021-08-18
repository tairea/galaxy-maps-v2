<template>
  <v-container class="d-flex flex-column fullHeight">
    <v-row class="cohort-main">
      <v-col>
        <h3 class="cohort-heading overline baseAccent--text">
          Cohorts (No Organisation)
        </h3>
        <!-- COHORTS with no attached org -->
        <v-row class="mb-5">
          <v-col>
            <v-row>
              <Cohort
                v-for="cohort in getCohortsByOrganisationId(0)"
                :cohort="cohort"
                :key="cohort.id"
                :size="'0.25em'"
                :cols="3"
              />
            </v-row>
          </v-col>
        </v-row>

        <!-- ORGANISATIONS -->
        <h3 class="cohort-heading overline baseAccent--text">Organisation > Cohorts</h3>
        <v-row class="d-flex flex-column">
          <v-col v-for="organisation in organisations" :key="organisation.id">
            <v-row>
              <Organisation :organisation="organisation" :size="'0.25em'" />
              <hr width="95%" class="ml-4" />
            </v-row>
            <v-row class="mb-6">
              <!-- Their COHORTS -->
              <Cohort
                v-for="cohort in getCohortsByOrganisationId(organisation.id)"
                :cohort="cohort"
                :key="cohort.id"
                :size="'0.25em'"
                :cols="3"
              />
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row class="cohort-bottom">
      <v-col>
        <CreateCohortButtonDialog />
        <CreateOrganisationButtonDialog />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// @ is an alias to /src
import CreateCohortButtonDialog from "../components/CreateCohortButtonDialog";
import CreateOrganisationButtonDialog from "../components/CreateOrganisationButtonDialog";
import Cohort from "../components/Cohort";
import Organisation from "../components/Organisation";

import { mapState, mapGetters } from "vuex";

export default {
  name: "CohortList",
  components: {
    CreateCohortButtonDialog,
    CreateOrganisationButtonDialog,
    Cohort,
    Organisation,
  },
  mounted() {
    // trigger VuexFire bindCohorts & bindOrganisations in Store
    this.getCohortsAndOrganisations();
  },
  computed: {
    ...mapState(["organisations"]),
    ...mapGetters(["getCohortsByOrganisationId"]),
  },
  methods: {
    getCohortsAndOrganisations() {
      this.$store.dispatch("bindCohorts");
      this.$store.dispatch("bindOrganisations");
    },
  },
};
</script>

<style lang="scss" scoped>
hr {
  border: 1px solid rgba(200, 200, 200, 0.3);
}

.fullHeight {
  height: 100vh;
  width: 50%;
  overflow: hidden;
  // border: 1px solid blue;
}

.cohort-main {
  height: 80%;
  margin-top: 9%;
  overflow: scroll;
  overflow-x: hidden; /* Hide horizontal scrollbar */
  // border: 1px solid red;

  .cohort-heading {
    border-bottom: 1px solid var(--v-baseAccent-base);
    margin-bottom: 20px;
  }
}

// ---- SCROLLBAR STYLES ----
/* width */
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: var(--v-background-base);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--v-baseAccent-base);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--v-baseAccent-base);
}
</style>
