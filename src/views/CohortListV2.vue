<template>
  <div class="main-wrap">
    <div class="side-col">
      <!-- <h3 class="cohort-heading overline baseAccent--text text-center">Orgs</h3> -->
      <div
        v-for="organisation in organisations"
        :key="organisation.id"
        class="mission-border"
      >
        <div
          class="organisation-banner d-flex flex-column justify-center align-center"
        >
          <Organisation
            @editOrg="editOrgDialog"
            :organisation="organisation"
            :size="50"
            :hideName="true"
          />
        </div>
        <div class="mb-3 d-flex flex-column justify-center align-center">
          <!-- Their COHORTS -->
          <Cohort
            v-for="cohort in getCohortsByOrganisationId(organisation.id)"
            :cohort="cohort"
            :key="cohort.id"
            :size="40"
            :hideNames="true"
            :tooltip="true"
          />
        </div>
      </div>
      <!-- COHORTS NOT IN ORGS -->
      <div v-if="cohorts">
        <!-- <h3 class="cohort-heading overline baseAccent--text text-center">
          Cohorts
        </h3> -->
        <!-- COHORTS with no attached org -->
        <v-row class="mb-5">
          <v-col>
            <v-row>
              <Cohort
                v-for="cohort in getCohortsByOrganisationId()"
                :cohort="cohort"
                :key="cohort.id"
                :size="40"
                :hideNames="true"
                :tooltip="true"
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

      <!-- Create buttons -->
      <div v-if="user.data.admin">
        <div>
          <CreateEditDeleteCohortDialog :hideText="true" />
        </div>
        <div>
          <CreateEditDeleteOrganisationDialog
            ref="organisationDialog"
            :edit="openOrganisationDialog"
            :organisationToEdit="editingOrgansation"
            :hideText="true"
          />
        </div>
        <div v-if="person.accountType == 'admin'">
          <CreateAdminDialog />
        </div>
      </div>
    </div>
    <div class="main-col">
      <!-- Middle chip row -->

      <div class="d-flex flex-wrap">
        <CohortPanelV2
          v-for="cohort in cohorts"
          :cohort="cohort"
          :key="cohort.id"
          :timeframe="timeframe"
        />
      </div>
    </div>
    <div class="d-flex justify-center align-center timeframe-chips">
      <TimeframeFilters @timeframe="setTimeframe($event)" />
    </div>
  </div>

  <!-- Edit Org Dialog -->
  <!-- <EditOrganisationButtonDialog v-if="editingOrgansation" :open="openOrganisationDialog" :organisation="editingOrgansation" @closeOrganisationEditDialog="openOrganisationDialog = false"/> -->
</template>

<script lang="js">
// @ is an alias to /src
import CreateEditDeleteCohortDialog from "../components/CreateEditDeleteCohortDialog";
import CreateEditDeleteOrganisationDialog from "../components/CreateEditDeleteOrganisationDialog";
import CreateAdminDialog from "../components/CreateAdminDialog";
import EditOrganisationButtonDialog from "../components/EditOrganisationButtonDialog";
import Cohort from "../components/Cohort";
import CohortPanelV2 from "../components/CohortPanelV2";
import TimeframeFilters from "../components/TimeframeFilters";
import Organisation from "../components/Organisation";

import { mapState, mapGetters, mapActions } from "vuex";

export default {
  name: "CohortListV2",
  components: {
    CreateEditDeleteCohortDialog,
    CreateEditDeleteOrganisationDialog,
    Cohort,
    Organisation,
    EditOrganisationButtonDialog,
    CreateAdminDialog,
    CohortPanelV2,
    TimeframeFilters
  },
  data: () => ({
    openOrganisationDialog: false,
    editingOrgansation: null,
    timeframe: {}
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
    },
    setTimeframe(timeframeEmitted) {
      console.log("setting timeframe from emitter:", timeframeEmitted)
      this.timeframe = timeframeEmitted
    }
  },
};
</script>

<style lang="scss" scoped>
hr {
  border: 1px solid rgba(200, 200, 200, 0.2);
}

.timeframe-chips {
  position: absolute;
  top: 15px;
  right: 5%;
}

.main-wrap {
  height: 100vh;
  width: 100%;
  display: flex;
  // border: 1px solid blue;
  overflow: hidden; /* Hide horizontal scrollbar */

  .side-col {
    width: 10%;
    // border: 1px solid blue;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: scroll;
    overflow-x: hidden;

    .mission-border {
      border: 1px solid var(--v-subBackground-base);
      margin-bottom: 20px;
      width: 80px;
    }
  }

  .main-col {
    margin-top: 50px;
    width: 90%;
    // border: 1px solid red;
    overflow: scroll;
    overflow-x: hidden;
  }

  .cohort-heading {
    border-bottom: 1px solid var(--v-baseAccent-base);
    margin-bottom: 10px;
    text-align: start;
  }

  .organisation-banner {
    border-bottom: 1px solid rgba(200, 200, 200, 0.5);
    margin: 0px 20px;
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
  background: var(--v-missionAccent-base);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}
</style>
