<template>
  <div class="main-wrap">
    <div class="side-col">
      <!-- COHORTS -->
      <!-- only if you made them (eg. are the teacher AKA in cohort.teachers[]) -->
      <div v-if="cohorts" class="cohorts mt-12">
        <Cohort
          ref="cohort"
          v-for="(cohort, cohortIndex) in getCohortsThatPersonIsTeacherIn()"
          :id="'noOrgcohort' + cohortIndex"
          :cohort="cohort"
          :key="cohort.id"
          :size="60"
          :hideNames="true"
          :tooltip="true"
          :studentView="true"
          @click.native="clickedCohort(cohort, 'noOrg', cohortIndex)"
        />
      </div>
      <!-- ORGANISATIONS -->
      <div
        v-for="(organisation, orgIndex) in getOrganisationsThatPersonIsTeacherIn"
        :key="organisation.id"
        class="mission-border mt-6"
      >
        <div class="organisation-banner d-flex flex-column justify-center align-center">
          <Organisation
            @editOrg="editOrgDialog"
            :organisation="organisation"
            :size="60"
            :hideName="false"
          />
        </div>
        <!-- COHORTS BY GROUPED BY ORGANISATION -->
        <!-- i dont think this UI is need yet, especially when we are showing all cohort person is teacher of above -->
        <!-- will become useful when a teacher is selling their maps to multiple organisations and cohorts -->
        <!-- <div class="mb-3 d-flex flex-column justify-center align-center">
          <Cohort
            v-for="(cohort, cohortIndex) in getCohortsByOrganisationId(organisation.id)"
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
        </div> -->
      </div>
      <div v-if="!cohorts">
        <h3 class="cohort-heading overline baseAccent--text">No Cohorts Found</h3>
      </div>

      <!-- SIDEBAR ADMIN BUTTONS -->
      <!-- <div v-if="user.data.admin">
        <v-tooltip right color="subBackground">
          <template v-slot:activator="{ on, attrs }">
            <div v-bind="attrs" v-on="on">
              <CreateEditDeleteCohortDialog :hideText="false" />
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
                :hideText="false"
              />
            </div>
          </template>
          <div class="create-tooltip">CREATE ORGANISATION</div>
        </v-tooltip>
        <div v-if="user.data.admin">
          <CreateAdminDialog />
        </div>
      </div> -->
    </div>
    <v-expand-transition>
      <div v-if="orderedCohorts.length" class="main-col" v-show="expand">
        <!-- Middle chip row -->
        <div class="timeframe-chips">
          <TimeframeFilters @timeframe="setTimeframe($event)" />
        </div>

        <!-- Cohort Panels -->
        <div class="d-flex flex-wrap">
          <CohortPanelV2
            v-for="cohort in selectedCohorts.length > 0 ? selectedCohorts : orderedCohorts"
            :cohort="cohort"
            :key="cohort.id"
            :timeframe="timeframe"
            class="cohort-panel"
          />
        </div>

        <!-- OPEN VERSION -->
        <div class="mb-6">
          <v-tooltip
            top
            color="subBackground"
            v-if="this.user.data.admin || this.person.firstName == 'TaiCollective.nz'"
          >
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <CreateEditDeleteCohortDialog />
              </div>
            </template>
            <div class="create-tooltip">CREATE COHORT</div>
          </v-tooltip>
          <!-- PAY WALL VERSION Create Cohort Button -->
          <v-tooltip v-else bottom color="subBackground">
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <!-- DISABLED -->
                <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on" disabled>
                  <v-icon class="mb-1 mr-2">{{ mdiPlus }}</v-icon>
                  create cohort
                </v-btn>
              </div>
            </template>
            <span v-html="paidFeatureMessage"></span>
          </v-tooltip>
        </div>

        <!-- ADMIN BUTTONS -->
        <div v-if="this.user.data.admin" class="mt-3">
          <!-- CREATE ORGANISATION -->
          <v-tooltip top color="subBackground">
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
          <!-- CREATE ADMIN -->
          <div>
            <CreateAdminDialog />
          </div>
        </div>
      </div>

      <!-- NO COHORTS YET -->
      <div v-else class="no-cohort">
        <p class="overline">you are not in any cohorts yet</p>
        <!-- <p class="overline">start a galaxy to create a cohort</p> -->

        <!-- PAY WALL VERSION Create Cohort Button -->
        <div class="button-container">
          <v-tooltip bottom close-delay="2000" color="subBackground">
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <!-- DISABLED -->
                <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on" disabled>
                  <v-icon class="mb-1 mr-2">{{ mdiPlus }}</v-icon>
                  create cohort
                </v-btn>
              </div>
            </template>
            <span v-html="paidFeatureMessage"></span>
          </v-tooltip>

          <!-- FREELY CREATE COHORTS VERSION -->
          <!-- <v-tooltip right color="subBackground">
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <CreateEditDeleteCohortDialog />
              </div>
            </template>
            <div class="create-tooltip">CREATE COHORT</div>
          </v-tooltip> -->

          <!-- ADIMN: CREATE ORG -->
          <v-tooltip right color="subBackground" v-if="this.user.data.admin">
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on" class="mt-3">
                <CreateEditDeleteOrganisationDialog
                  ref="organisationDialog"
                  :edit="openOrganisationDialog"
                  :organisationToEdit="editingOrgansation"
                  :hideText="false"
                />
              </div>
            </template>
            <div class="create-tooltip">CREATE ORGANISATION</div>
          </v-tooltip>
        </div>
        <!-- Create admin button -->
        <!-- <div v-if="this.user.data.admin">
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
import CreateEditDeleteCohortDialog from "@/components/Dialogs/CreateEditDeleteCohortDialog.vue";
import CreateEditDeleteOrganisationDialog from "@/components/Dialogs/CreateEditDeleteOrganisationDialog.vue";
import CreateAdminDialog from "@/components/Dialogs/CreateAdminDialog.vue";
import EditOrganisationButtonDialog from "@/components/Dialogs/EditOrganisationButtonDialog.vue";
import Cohort from "@/components/Reused/Cohort.vue";
import CohortPanelV2 from "@/components/CohortList/CohortPanelV2.vue";
import TimeframeFilters from "@/components/Reused/TimeframeFilters.vue";
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
    getCohortsThatPersonIsTeacherIn() {
      return this.cohorts.filter((cohort) => cohort.teachers.includes(this.person.id));
    },
    getOrganisationsThatPersonIsTeacherIn() {
      return this.cohorts.filter((cohort) => organisations.people.includes(this.person.id));
    },
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
      this.editingOrgansation = this.getOrganisationById(orgId);
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
      // teacher of these cohorts
      this.orderedCohorts = [...this.getCohortsThatPersonIsTeacherIn()].sort((a, b) =>
        a.teacher ? -1 : 1,
      );

      // student of these cohorts
      this.orderedCohorts = [
        ...this.orderedCohorts,
        ...this.cohorts.filter((cohort) => cohort.students.includes(this.person.id)),
      ];
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
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    overflow-y: scroll;
    overflow-x: hidden;
    // border: 1px solid blue;

    .cohorts {
      width: 50%;
      display: flex;
      flex-wrap: wrap;
      // border: 1px solid yellow;
    }
    .mission-border {
      border: 1px solid var(--v-subBackground-base);
      // margin-bottom: 20px;
      width: 90%;
    }
  }

  .main-col {
    margin-top: 70px;
    width: 80%;
    overflow: scroll;
    overflow-x: hidden;
    // border: 1px solid yellow;
  }

  .cohort-heading {
    border-bottom: 1px solid var(--v-baseAccent-base);
    margin-bottom: 10px;
    text-align: start;
  }

  .organisation-banner {
    // border-bottom: 1px solid rgba(200, 200, 200, 0.5);
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
  //width: calc(50% - 40px); // two panels per row
  width: 100%; // two panels per row
}

.no-cohort {
  font-size: 0.9rem;
  font-weight: 400;
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  // margin-left: auto;
  // margin-right: auto;
  width: 70%;
  .button-container {
    margin-top: 50px;
    height: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
}
</style>
