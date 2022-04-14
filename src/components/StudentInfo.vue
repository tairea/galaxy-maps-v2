<template>
  <div class="d-flex flex-column">
    <StudentAvatar :size="200" />
    <div class="student-info">
      <!-- Student name -->
      <div>
        <p class="student-info-label mt-4">name:</p>
        <p class="student-info-value-main">
          {{ person.firstName + " " + person.lastName }}
        </p>
      </div>
      <!-- Student NSN -->
      <div v-if="person.nsnNumber">
        <p class="student-info-label mt-4">nsn:</p>
        <p class="student-info-value-sub">
          {{ person.nsnNumber }}
        </p>
      </div>
      <!-- Student Email -->
      <div>
        <p class="student-info-label mt-4">email:</p>
        <p class="student-info-value-sub">
          {{ person.email }}
        </p>
      </div>
      <!-- Edit button -->
      <div style="text-align: right">
        <StudentEditDialog />
      </div>
      <!-- Cohorts -->
      <div style="margin-top: 50px">
        <p class="student-info-label">cohorts:</p>
        <div class="d-flex">
          <Cohort
            v-for="cohort in cohorts"
            :cohort="cohort"
            :key="cohort.id"
            :size="60"
            :cols="6"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import StudentAvatar from "../components/StudentAvatar";
import StudentEditDialog from "../components/StudentEditDialog";
import Cohort from "../components/Cohort";

import { mapState, mapActions } from "vuex";

import firebase from "firebase";
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "StudentInfo",
  props: [],
  components: {
    StudentAvatar,
    StudentEditDialog,
    Cohort,
  },
  async mounted() {
    await this.$store.dispatch("getCohortsByPersonId", this.person);
  },
  computed: {
    ...mapState(["person", "cohorts"]),
  },
  data() {
    return {};
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
.student-info {
  .student-info-label {
    margin: 0px;
    text-transform: uppercase;
    color: var(--v-baseAccent-base);
    font-size: 0.7rem;
  }

  .student-info-value-main {
    margin: 0px;
    text-transform: uppercase;
    color: var(--v-baseAccent-base);
    font-size: 1.5rem;
  }

  .student-info-value-sub {
    margin: 0px;
    text-transform: uppercase;
    color: var(--v-baseAccent-base);
    font-size: 0.8rem;
  }

  .mission-edit-button {
    // position: absolute;
    // top: 10px;
    // right: 20px;
    // font-size: 0.5rem;
  }
}
</style>
