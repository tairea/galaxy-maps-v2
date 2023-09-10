<template>
  <div class="main-wrap">
    <!-- <div class="side-col">
      <div v-if="cohorts">
        <v-row class="mb-5">
          <v-col>
            <v-row>
              <Cohort
                ref="cohort"
                v-for="(cohort, cohortIndex) in getCohortsByOrganisationId()"
                :id="'noOrgcohort' + cohortIndex"
                :cohort="cohort"
                :key="cohort.id"
                :size="40"
                :hideNames="true"
                :tooltip="true"
                :studentView="true"
                @click.native="clickedCohort(cohort, 'noOrg', cohortIndex)"
              />
            </v-row>
          </v-col>
        </v-row>
      </div>
      <div
        v-for="(organisation, orgIndex) in organisations"
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
          <Cohort
            v-for="(cohort, cohortIndex) in getCohortsByOrganisationId(
              organisation.id
            )"
            ref="cohort"
            :id="'org' + orgIndex + 'cohort' + cohortIndex"
            :cohort="cohort"
            :key="cohort.id"
            :size="40"
            :hideNames="true"
            :tooltip="true"
            :studentView="true"
            style="cursor: pointer"
            @click.native="clickedCohort(cohort, orgIndex, cohortIndex)"
          />
        </div>
      </div>
      <div v-if="!cohorts">
        <h3 class="cohort-heading overline baseAccent--text">
          No Cohorts Found
        </h3>
      </div>

      <div v-if="user.data.admin">
        <v-tooltip right color="subBackground">
          <template v-slot:activator="{ on, attrs }">
            <div v-bind="attrs" v-on="on">
              <CreateEditDeleteCohortDialog :hideText="true" />
            </div>
          </template>
          <div class="create-tooltip">CREATE COHORT</div>
        </v-tooltip>
        <v-tooltip right color="subBackground">
          <template v-slot:activator="{ on, attrs }">
            <div v-bind="attrs" v-on="on">
              <CreateEditDeleteOrganisationDialog
                ref="organisationDialog"
                :edit="openOrganisationDialog"
                :organisationToEdit="editingOrgansation"
                :hideText="true"
              />
            </div>
          </template>
          <div class="create-tooltip">CREATE ORGANISATION</div>
        </v-tooltip>
        <div v-if="person.accountType == 'admin'">
          <CreateAdminDialog />
        </div>
      </div>
    </div> -->
    <v-expand-transition>
      <div v-if="cohorts.length" class="main-col" v-show="expand">
        <!-- Middle chip row -->

        <div class="timeframe-chips">
          <TimeframeFilters @timeframe="setTimeframe($event)" />
        </div>
        <div class="d-flex flex-wrap">
          <CohortPanelV2
            v-for="cohort in selectedCohorts.length > 0 ? selectedCohorts : orderedCohorts"
            :cohort="cohort"
            :key="cohort.id"
            :timeframe="timeframe"
            class="cohort-panel"
          />
        </div>
        <v-row justify="center" class="mb-12">
          <!-- PAY WALL VERSION Create Cohort Button -->
          <!-- <v-tooltip top close-delay="2000" color="subBackground">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                outlined
                color="baseAccent"
                v-bind="attrs"
                v-on="on"
                class="mb-8"
              >
                <v-icon class="mb-1 mr-2">{{ mdiPlus }}</v-icon>
                create cohort
              </v-btn>
            </template>
            <span v-html="paidFeatureMessage"></span>
          </v-tooltip> -->

          <!-- OPEN VERSION -->
          <v-tooltip top color="subBackground">
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <CreateEditDeleteCohortDialog />
              </div>
            </template>
            <div class="create-tooltip">CREATE COHORT</div>
          </v-tooltip>
          <!-- <v-tooltip top color="subBackground">
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on" class="ml-4">
                <CreateEditDeleteOrganisationDialog
                  ref="organisationDialog"
                  :edit="openOrganisationDialog"
                  :organisationToEdit="editingOrgansation"
                />
              </div>
            </template>
            <div class="create-tooltip">CREATE ORGANISATION</div>
          </v-tooltip>
          <div v-if="person.accountType == 'admin'">
            <CreateAdminDialog />
          </div> -->
        </v-row>
      </div>
      <div v-else class="no-cohort">
        <p class="overline">create or start a galaxy to join a cohort</p>
        <p class="overline" style="text-align: center"><strong>OR</strong></p>

        <!-- PAY WALL VERSION Create Cohort Button -->
        <!-- <v-tooltip bottom close-delay="2000" color="subBackground">
          <template v-slot:activator="{ on, attrs }">
            <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon class="mb-1 mr-2">{{ mdiPlus }}</v-icon>
              create cohort
            </v-btn>
          </template>
          <span v-html="paidFeatureMessage"></span>
        </v-tooltip> -->
        <!-- OPEN VERSION -->
        <v-tooltip right color="subBackground">
          <template v-slot:activator="{ on, attrs }">
            <div v-bind="attrs" v-on="on">
              <CreateEditDeleteCohortDialog />
            </div>
          </template>
          <div class="create-tooltip">CREATE COHORT</div>
        </v-tooltip>
        <!-- <v-tooltip right color="subBackground">
          <template v-slot:activator="{ on, attrs }">
            <div v-bind="attrs" v-on="on">
              <CreateEditDeleteOrganisationDialog
                ref="organisationDialog"
                :edit="openOrganisationDialog"
                :organisationToEdit="editingOrgansation"
                :hideText="true"
              />
            </div>
          </template>
          <div class="create-tooltip">CREATE ORGANISATION</div>
        </v-tooltip>
        <div v-if="person.accountType == 'admin'">
          <CreateAdminDialog />
        </div> -->
      </div>
      <!-- <p>create or start a galaxy to join a cohort</p> -->
    </v-expand-transition>
  </div>

  <!-- Edit Org Dialog -->
  <!-- <EditOrganisationButtonDialog v-if="editingOrgansation" :open="openOrganisationDialog" :organisation="editingOrgansation" @closeOrganisationEditDialog="openOrganisationDialog = false"/> -->
</template>

<script lang="js">
// @ is an alias to /src
import CreateEditDeleteCohortDialog from "@/components/CreateEditDeleteCohortDialog.vue";
import CreateEditDeleteOrganisationDialog from "@/components/CreateEditDeleteOrganisationDialog.vue";
import CreateAdminDialog from "@/components/CreateAdminDialog.vue";
import EditOrganisationButtonDialog from "@/components/EditOrganisationButtonDialog.vue";
import Cohort from "@/components/Cohort.vue";
import CohortPanelV2 from "@/components/CohortPanelV2.vue";
import TimeframeFilters from "@/components/TimeframeFilters.vue";
import Organisation from "@/components/Organisation.vue";
import useRootStore from "@/store/index";
import { mdiPlus } from "@mdi/js";
import { mapActions, mapState } from "pinia";

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
    TimeframeFilters,
  },
  props: ["on", "attrs"],
  data: () => ({
    mdiPlus,
    openOrganisationDialog: false,
    editingOrgansation: null,
    timeframe: {},
    cohortLength: 0,
    currentIndex: 0,
    currentIndexCount: 0,
    selectedIndexs: [],
    selectedCohorts: [],
    unselectedCohorts: [],
    orderedCohorts: [],
    expand: false,
    paidFeatureMessage: `<div class="ma-2"><p class="text-center">Paid feature.</p><p class="text-center">Contact us to upgrade: <a href="mailto:base@galaxymaps.io">base@galaxymaps.io</a></p></div>`,
  }),
  watch: {
    cohorts() {
      this.orderCohorts();
    },
  },
  async mounted() {
    // trigger VuexFire bindCohorts & bindOrganisations in Store
    await this.getCohortsAndOrganisations();
    this.orderCohorts();
    this.expand = true;
  },
  computed: {
    ...mapState(useRootStore, [
      "organisations",
      "cohorts",
      "person",
      "user",
      "getOrganisationById",
    ]),
    cohortView() {
      return this.$route.name === "CohortView";
    },
    getIndex() {
      this.currentIndexCount = this.currentIndexCount + 1;
      return this.currentIndexCount;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["bindAllCohorts", "bindAllOrganisations", "getCohortsByPersonId"]),
    getCohortsByOrganisationId(id) {
      if (id) {
        return this.cohorts.filter((cohort) => cohort.organisation === id);
      } else {
        return this.cohorts.filter((cohort) => cohort.organisation == "");
      }
    },
    async getCohortsAndOrganisations() {
      if (this.user.data.admin) {
        await this.bindAllCohorts();
        await this.bindAllOrganisations();
      } else {
        await this.getCohortsByPersonId(this.person);
      }
    },
    editOrgDialog(orgId) {
      this.openOrganisationDialog = true;
      console.log("getting org with id = ", orgId);
      this.editingOrgansation = this.getOrganisationById(orgId);
      console.log("got org = ", this.editingOrgansation);
      this.$refs.organisationDialog.openDialog();
    },
    setTimeframe(timeframeEmitted) {
      this.timeframe = timeframeEmitted;
    },
    clickedCohort(cohort, orgIndex, cohortIndex) {
      // remap cohort ids (eg. :id=org2cohort2) to indexs that match cohortEls indexs
      // org0cohort0 should be 0 - org2cohort2 should be org0.length + org1.length + 2
      const numOrgs = this.organisations.length;
      // save num of orgs and cohorts to this multi-dimensional array
      const orgsCohortsArr = [];

      // cohorts without orgs
      // this querys all id's with noOrg (eg. id="noOrg...")
      // important no orgs pushes first as no org cohorts render first
      orgsCohortsArr.push(document.querySelectorAll("[id^=noOrg]").length);

      // orgs with cohorts
      for (var i = 0; i < numOrgs; i++) {
        // this querys all id's with org and number (eg. id="org1...", id="org2...")
        orgsCohortsArr.push(document.querySelectorAll("[id^=org" + i + "]").length);
      }

      // log multi-dim arr of orgs and cohorts
      // console.log("orgsCohortsArr",orgsCohortsArr)

      let mappedIndex = 0;
      if (orgIndex == "noOrg") {
        mappedIndex = cohortIndex;
      } else if (orgIndex == 0) {
        let sum = 0;
        sum += orgsCohortsArr[0];
        mappedIndex = sum + cohortIndex;
      } else {
        //test cases: org1cohort2 , org3cohort2
        let sum = 0;
        sum += orgsCohortsArr[0]; // sum noOrg cohorts first
        for (var x = 0; x < orgIndex; x++) {
          sum += orgsCohortsArr[x + 1]; // plus 1 because noOrgs is first index
        }
        mappedIndex = sum + cohortIndex;
      }

      const index = mappedIndex;

      // get all avatar elements
      const cohortEls = this.$refs.cohort;
      // console.log("cohortEls",cohortEls)
      this.cohortLength = cohortEls.length;
      // loop cohort els
      for (var i = 0; i < cohortEls.length; i++) {
        // add index to selected if not already. else remove
        if (i == index && !this.selectedIndexs.includes(index)) {
          this.selectedIndexs.push(index);
          this.selectedCohorts.push(cohort);
        }
        // remove
        else if (i == index && this.selectedIndexs.includes(index)) {
          this.selectedIndexs = this.selectedIndexs.filter((item) => item !== index);
          this.selectedCohorts = this.selectedCohorts.filter(
            (selectedCohort) => selectedCohort.id !== cohort.id,
          );
          this.unselectedCohorts.push(cohort);
        }

        //anyone not in selectedCohorts becomes unselected (this is used to hide data in chart)
        this.unselectedCohorts = this.diffTwoArraysOfObjects(this.cohorts, this.selectedCohorts);

        // add dim to all cohort els
        for (var y = 0; y < cohortEls.length; y++) {
          cohortEls[y].$el.classList.add("dim");
        }
        //remove dim for selected cohort els
        for (var x = 0; x < this.selectedIndexs.length; x++) {
          cohortEls[this.selectedIndexs[x]].$el.classList.remove("dim");
        }
      }
    },
    diffTwoArraysOfObjects(array1, array2) {
      return array1.filter((object1) => {
        return !array2.some((object2) => {
          return object1.id === object2.id;
        });
      });
    },
    orderCohorts() {
      this.orderedCohorts = [...this.cohorts].sort((a, b) => (a.teacher ? -1 : 1));
    },
  },
};
</script>

<style lang="scss" scoped>
hr {
  border: 1px solid rgba(200, 200, 200, 0.2);
}

.main-wrap {
  height: 100vh;
  width: 80%;
  display: flex;
  margin: auto;
  overflow: hidden;

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
    margin-top: 70px;
    width: 100%;
    overflow: scroll;
    overflow-x: hidden;
    // border: 1px solid red;
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

.dim {
  filter: opacity(30%);
}

.create-tooltip {
  color: var(--v-baseAccent-base);
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

.timeframe-chips {
  display: flex;
  justify-content: center;
}

.cohort-panel {
  width: calc(50% - 40px);
}

.no-cohort {
  font-size: 0.9rem;
  font-weight: 400;
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  color: var(--v-missionAccent-base);
}
</style>
