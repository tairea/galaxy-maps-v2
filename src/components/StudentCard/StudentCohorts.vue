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
          cols="4"
          :size="20"
        />
      </v-row>
  </div>
</template>
<script>
import Cohort from "../Cohort.vue"
import { getStudentCohortsById } from "@/lib/ff"

export default {
  name: "StudentCohorts",
  props: ["student"],
  components: {
    Cohort
  },
  data () {
    return {
      cohorts: []
    }
  },
  async mounted () {
    this.cohorts = await getStudentCohortsById(this.student.id)
  }
}
</script>
<style scoped>
.label {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  margin: 1px;
}
</style>