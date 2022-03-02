<template>
  <div id="cohort-info">
    <h2 class="cohort-label">Cohort</h2>
    <h1 class="cohort-title">{{ currentCohort.name }}</h1>
    <div v-if="cohortImage">
      <v-img
        class="cohort-image"
        width="auto"
        :src="currentCohort.image.url"
      ></v-img>
    </div>
    <p class="cohort-description">{{ currentCohort.description }}</p>
    <div class="d-flex justify-center align-center">
      <Organisation
        v-if="currentCohort.organisation"
        :organisation="org"
        :size="'0.25em'"
      />
    </div>
    <div v-if="teachers.length > 0">
      <p class="overline ma-0" style="color: var(--v-baseAccent-base)">
        Teachers
      </p>
      <v-row class="my-1">
        <Person v-for="person in teachers" :person="person" :key="person.id" />
      </v-row>
    </div>
    <CreateEditDeleteCohortDialog
      v-if="!isStudent"
      :edit="true"
      :cohortToEdit="currentCohort"
    />
  </div>
</template>

<script>
import Organisation from "../components/Organisation";
import CreateEditDeleteCohortDialog from "../components/CreateEditDeleteCohortDialog";
import Person from "../components/Person";

import { mapGetters } from "vuex";
import { dbMixins } from "../mixins/DbMixins";

export default {
  name: "CohortInfo",
  mixins: [dbMixins],
  components: {
    Person,
    Organisation,
    CreateEditDeleteCohortDialog,
  },
  data() {
    return {
      teachers: [],
    };
  },
  mounted() {
    // this is needed incase there is no change in currentCohort to catch with the watch
    if (this.$route.params.cohortId === this.currentCohort.id) {
      this.getTeacherProfiles();
    }
  },
  watch: {
    currentCohort: {
      deep: true,
      handler(newVal, oldVal) {
        if (oldVal.teachers?.length !== newVal.teachers?.length) {
          this.getTeacherProfiles();
        }
      },
    },
  },
  computed: {
    ...mapGetters(["getOrganisationById", "currentCohort", "person"]),
    cohortImage () {
      return this.currentCohort?.image.url
    },
    org() {
      let org = this.getOrganisationById(this.currentCohort.organisation);
      if (org) return org;
      else return {};
    },
    isStudent() {
      return this.person.accountType === "student";
    },
  },
  methods: {
    getTeacherProfiles() {
      if (this.currentCohort.teachers?.length) {
        const teachersArr = this.currentCohort.teachers.filter((a) => {
          return !this.teachers.some((b) => a === b.id);
        });
        teachersArr.forEach(async (id) => {
          const teacher = await this.MXgetPersonByIdFromDB(id);
          this.teachers.push(teacher);
        });
      }
    },
  },
};
</script>

<style lang="scss">
#cohort-info {
  width: calc(100% - 30px);
  border: 1px solid var(--v-baseAccent-base);
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
    background-color: var(--v-baseAccent-base);
    color: var(--v-background-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
  }

  .cohort-title {
    font-size: 1.2rem;
    color: var(--v-baseAccent-base);
    font-weight: 600;
    text-transform: uppercase;
    margin: 20px 0px 5px 0px;
  }

  .cohort-description {
    margin-top: 10px;
    color: var(--v-baseAccent-base);
    // font-size: 0.9rem;
  }
}

h1 {
  color: white;
}
</style>
