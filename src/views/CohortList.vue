<template>
   <v-container class="d-flex justify-center align-center fullHeight">
    <div class="flexContainer">
      <div class="flexRow">
        
        <!-- COHORTS with no attached org -->
        <Cohorts v-for="cohort in getCohortsByOrganisationId(0)" :cohort="cohort" :key="cohort.id" :size="'0.25em'" />
        <!-- ORGANISATIONS -->
        <Organisations v-for="organisation in organisations" :organisation="organisation" :key="organisation.id" :size="'0.25em'" />
          <!-- Their COHORTS -->
          <Cohorts v-for="cohort in getCohortsByOrganisationId(organisation.id)" :cohort="cohort" :key="cohort.id" :size="'0.25em'" />

      </div>
    </div>
    <div class="createButton">
      <CreateCohortButtonDialog />
      <CreateOrganisationButtonDialog />
    </div>
  </v-container>
</template>

<script>
// @ is an alias to /src
import CreateCohortButtonDialog from "../components/CreateCohortButtonDialog";
import CreateOrganisationButtonDialog from "../components/CreateOrganisationButtonDialog";

import { mapGetters } from "vuex";

export default {
  name: "StudentList",
  components: {
    CreateCohortButtonDialog,
    CreateOrganisationButtonDialog,
  },
   mounted() {
    // trigger VuexFire bindCohorts & bindOrganisations in Store
    this.getCohortsAndOrganisations()
  },
  computed: {
    ...mapState(["organisations"]),
    ...mapGetters(["getCohortsByOrganisationId"]),
  },
  methods: {
    getCohortsAndOrganisations () {
      this.$store.dispatch('bindCohorts')
      this.$store.dispatch('bindOrganisations')
    },
  },

};
</script>

<style lang="scss" scoped>
.fullHeight {
  height: 100vh;
  overflow: hidden;
}

.flexContainer {
  height: 100%;
  width: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  // border: solid blue 2px;

  .flexRow {
    display: flex;
    // height: 50%;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    // border: solid pink 2px;

    .box {
      // width: 25%;
      max-width: 25%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      // margin: 10px;
      padding: 2%;
      box-sizing: border-box;
      // border: 1px solid yellow;
    }
  }
}

.createButton {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%, 0%);
}
</style>
