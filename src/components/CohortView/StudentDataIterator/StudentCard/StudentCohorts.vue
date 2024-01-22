<template>
  <div>
    <p class="label text-uppercase">cohorts</p>
    <v-row class="ma-0">
      <Cohort
        v-for="cohort in cohorts"
        :cohort="cohort"
        :key="cohort.id"
        :tooltip="true"
        :studentCardView="true"
        cols="2"
        :size="20"
      />
    </v-row>
  </div>
</template>

<script>
import Cohort from "@/components/Reused/Cohort.vue";
import { fetchStudentCohortsByPersonId } from "@/lib/ff";

export default {
  name: "StudentCohorts",
  props: ["student"],
  components: {
    Cohort,
  },
  data() {
    return {
      cohorts: [],
    };
  },
  async mounted() {
    this.cohorts = await fetchStudentCohortsByPersonId(this.student.id);
  },
};
</script>

<style scoped>
.label {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  margin: 1px;
  font-weight: bold;
}
</style>
