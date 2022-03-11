<template>
  <v-container class="d-flex flex-column fullHeight">
    <v-row class="cohort-main">
      <v-col>
        <!-- ORGANISATIONS -->
        <div v-if="organisations.length">
          <h3 class="cohort-heading overline baseAccent--text">
            Organisation cohorts
          </h3>
          <v-row class="d-flex flex-column">
            <v-col v-for="organisation in organisations" :key="organisation.id">
              <v-row class="organisation-banner">
                <Organisation
                  @editOrg="editOrgDialog"
                  :organisation="organisation"
                  :size="'0.25em'"
                />
              </v-row>
              <v-row class="mb-6">
                <!-- Their COHORTS -->
                <!-- <Cohort
                  v-for="cohort in getCohortsByOrganisationId(organisation.id)"
                  :cohort="cohort"
                  :key="cohort.id"
                  :size="'0.25em'"
                  :cols="3"
                /> -->
                <CohortPanel
                  v-for="cohort in getCohortsByOrganisationId(organisation.id)"
                  :cohort="cohort"
                  :key="cohort.id"
                />
              </v-row>
            </v-col>
          </v-row>
        </div>
        <!-- COHORTS NOT IN ORGS -->
        <div v-if="cohorts">
          <h3 class="cohort-heading overline baseAccent--text">Cohorts</h3>
          <!-- COHORTS with no attached org -->
          <v-row class="mb-5">
            <v-col>
              <v-row>
                <Cohort
                  v-for="cohort in getCohortsByOrganisationId()"
                  :cohort="cohort"
                  :key="cohort.id"
                  :size="'0.25em'"
                  :cols="3"
                />
              </v-row>
            </v-col>
          </v-row>
        </div>
        <div v-else>
          <h3 class="cohort-heading overline baseAccent--text">
            No Cohorts Found
          </h3>
        </div>
      </v-col>
    </v-row>
    <v-row v-if="user.data.admin" class="cohort-bottom">
      <v-col>
        <CreateEditDeleteCohortDialog />
      </v-col>
      <v-col>
        <CreateEditDeleteOrganisationDialog
          ref="organisationDialog"
          :edit="openOrganisationDialog"
          :organisationToEdit="editingOrgansation"
        />
      </v-col>
      <v-col v-if="person.accountType == 'admin'">
        <CreateAdminDialog />
      </v-col>
    </v-row>

    <!-- Edit Org Dialog -->
    <!-- <EditOrganisationButtonDialog v-if="editingOrgansation" :open="openOrganisationDialog" :organisation="editingOrgansation" @closeOrganisationEditDialog="openOrganisationDialog = false"/> -->
  </v-container>
</template>

<script lang="js">
// @ is an alias to /src
import CreateEditDeleteCohortDialog from "../components/CreateEditDeleteCohortDialog";
import CreateEditDeleteOrganisationDialog from "../components/CreateEditDeleteOrganisationDialog";
import CreateAdminDialog from "../components/CreateAdminDialog";
import EditOrganisationButtonDialog from "../components/EditOrganisationButtonDialog";
import Cohort from "../components/Cohort";
import CohortPanel from "../components/CohortPanel";
import Organisation from "../components/Organisation";

import { mapState, mapGetters, mapActions } from "vuex";

export default {
  name: "CohortList",
  components: {
    CreateEditDeleteCohortDialog,
    CreateEditDeleteOrganisationDialog,
    Cohort,
    Organisation,
    EditOrganisationButtonDialog,
    CreateAdminDialog,
    CohortPanel
  },
  data: () => ({
    openOrganisationDialog: false,
    editingOrgansation: null
  }),
  mounted() {
    // trigger VuexFire bindCohorts & bindOrganisations in Store
    this.getCohortsAndOrganisations();
  },
  computed: {
    ...mapState(["organisations", "cohorts", "person", "user"]),
    ...mapGetters(["getOrganisationById"]),
    cohortView () {
      return this.$route.name === "CohortView"
    }
  },
  methods: {
    ...mapActions(["bindAllCohorts", "bindAllOrganisations", "getCohortsByPersonId"]),
    getCohortsByOrganisationId(id) {
      if (id) {
        return this.cohorts.filter((cohort) => cohort.organisation === id);
      } else {
        return this.cohorts.filter((cohort) => cohort.organisation == "");
      }
    },
    getCohortsAndOrganisations() {
      if (this.user.data.admin){
        this.bindAllCohorts()
        this.bindAllOrganisations();
      } else {
        this.getCohortsByPersonId(this.person)
      }
    },
    editOrgDialog(orgId) {
      this.openOrganisationDialog = true
      console.log("getting org with id = ", orgId)
      this.editingOrgansation = this.getOrganisationById(orgId)
      console.log("got org = ", this.editingOrgansation)
      this.$refs.organisationDialog.openDialog()
    }
  },
};
</script>

<style lang="scss" scoped>
hr {
  border: 1px solid rgba(200, 200, 200, 0.2);
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
    margin-bottom: 10px;
    text-align: start;
  }

  .organisation-banner {
    // border: 1px solid rgba(200, 200, 200, 0.5);
    margin: 0px 1px;
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
