<template>
  <div id="cohort-info">
    <h2 class="cohort-label">Cohort</h2>
    <h1 class="cohort-title">{{ cohort.name }}</h1>
    <div v-if="cohort.image.url">
      <v-img class="cohort-image" width="auto" :src="cohort.image.url"></v-img>
    </div>
    <p class="cohort-description">{{ cohort.description }}</p>
    <div class="d-flex justify-center align-center">
      <Organisation
        v-if="cohort.organisation"
        :organisation="org"
        :size="'0.25em'"
      />
    </div>
    <div v-if="teachers.length > 0">
      <p class="overline ma-0" style="color: var(--v-cohortAccent-base);">Teachers</p>
      <v-row class="my-1">
        <Person v-for="person in teachers" :person="person" :key="person.id" />
      </v-row>
    </div>
    <CreateEditDeleteCohortDialog :edit="true" :cohortToEdit="cohort" />
  </div>
</template>

<script>
import Organisation from "../components/Organisation";
import CreateEditDeleteCohortDialog from "../components/CreateEditDeleteCohortDialog";
import Person from "../components/Person"

import { mapGetters, mapActions } from "vuex";

export default {
  name: "CohortInfo",
  props: ["cohort"],
  components: {
    Person,
    Organisation,
    CreateEditDeleteCohortDialog,
  },
  data() {
    return {
      teachers: []
    };
  },
  mounted() {
    this.getTeacherProfiles()
  },
  computed: {
    ...mapGetters(["getOrganisationById"]),
    org () {
      let org = this.getOrganisationById(this.cohort.organisation)
      if (org) return org 
      else return {}
    }
  },
  methods: {
    ...mapActions(['getPersonByIdFromDB']),
    getTeacherProfiles () {
      if (!this.cohort.teachers.length) return
      this.cohort.teachers.forEach(async id => {
        const teacher = await this.getPersonByIdFromDB(id)
        this.teachers.push(teacher)
      })
    },
  }
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
