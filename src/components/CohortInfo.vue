<template>
  <div id="cohort-info">
    <h2 class="cohort-label">Cohort</h2>
    <h1 class="cohort-title">{{ cohort.name }}</h1>
    <div v-if="cohortImage">
      <v-img class="cohort-image" width="auto" :src="cohort.image.url"></v-img>
    </div>
    <p ref="description" class="cohort-description">
      {{ maybeTruncate(cohort.description) }}
      <a style="border-bottom: 1px solid" v-if="readmore" @click="showFullDescription()"
        >Read more</a
      >
    </p>
    <div class="d-flex justify-center align-center">
      <Organisation v-if="cohort.organisation" :organisation="org" :size="40" />
    </div>
    <div v-if="teachers.length > 0">
      <p class="overline ma-0" style="color: var(--v-cohortAccent-base)">Teachers</p>
      <v-row class="my-1 mx-1">
        <Avatar
          v-for="person in teachers"
          :profile="person"
          :key="person.id"
          :size="40"
          :colourBorder="true"
        />
      </v-row>
    </div>
    <CreateEditDeleteCohortDialog v-if="isTeacher" :edit="true" :cohortToEdit="cohort" />
  </div>
</template>

<script>
import Organisation from "@/components/Organisation.vue";
import CreateEditDeleteCohortDialog from "@/components/Dialogs/CreateEditDeleteCohortDialog.vue";
import Avatar from "@/components/Reused/Avatar.vue";
import { fetchCohortByCohortId, fetchPersonByPersonId } from "@/lib/ff";
import useRootStore from "@/store/index";
import { mapState } from "pinia";

export default {
  name: "CohortInfo",
  components: {
    Avatar,
    Organisation,
    CreateEditDeleteCohortDialog,
  },
  data() {
    return {
      cohort: null,
      teachers: [],
      readmore: false,
    };
  },
  async mounted() {
    this.cohort = await fetchCohortByCohortId(this.currentCohortId);
    // this is needed incase there is no change in currentCohortId to catch with the watch
    if (this.$route.params.cohortId === this.currentCohortId) {
      this.getTeacherProfiles();
    }
  },
  watch: {
    currentCohortId: {
      deep: true,
      async handler(newVal, oldVal) {
        const oldCohort = this.cohort;
        this.cohort = await fetchCohortByCohortId(newVal);
        if (oldCohort.teachers?.length !== this.cohort.teachers?.length) {
          this.getTeacherProfiles();
        }
      },
    },
  },
  computed: {
    ...mapState(useRootStore, ["getOrganisationById", "currentCohortId", "person", "user"]),
    cohortImage() {
      return this.cohort?.image?.url;
    },
    org() {
      let org = this.getOrganisationById(this.cohort.organisation);
      if (org) return org;
      else return {};
    },
    isTeacher() {
      return this.user.data.admin || this.cohort.teachers.includes(this.person.id);
    },
  },
  methods: {
    async getTeacherProfiles() {
      if (this.cohort.teachers?.length) {
        const teachersArr = this.cohort.teachers.filter((a) => {
          return !this.teachers.some((b) => a === b.id);
        });
        this.teachers = await Promise.all(teachersArr.map((id) => fetchPersonByPersonId(id)));
      }
    },
    maybeTruncate(value) {
      if (!value) return "";
      if (value.length <= 100) {
        return value;
      } else {
        // show read more button
        this.readmore = true;
        // limit to 100 characters
        return value.substring(0, 100) + "...";
      }
    },
    showFullDescription() {
      this.$refs.description.innerHTML = this.cohort.description;
    },
  },
};
</script>

<style lang="scss">
#cohort-info {
  width: 100%;
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
    font-size: 0.8rem;
  }
}

h1 {
  color: white;
}
</style>
