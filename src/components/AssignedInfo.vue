<template>
  <div id="assigned-info">
    <h2 class="assigned-label">Assign to {{assignCourses ? "Galaxy Maps" : assignCohorts ? "Cohorts" : "?"}}</h2>

    <!-- ASSIGNED COHORTS INFO -->
    <div v-if="assignCohorts">
      <!-- Cohorts -->
      <div v-if="cohorts.length > 0">
        <Cohort v-for="cohort in cohorts" :cohort="cohort" :key="cohort.id" />
      </div>
      <!-- Organisations -->
      <div v-if="organisations.length > 0">
        <Organisation v-for="organisation in organisations" :organisation="organisation" :key="organisation.id" />
      </div>
      <!-- People -->
      <div v-if="people.length > 0">
        <Person v-for="person in people" :person="person" :key="person.id" />
      </div>

      <p v-if="cohorts.length == 0 && organisations.length == 0 && people.length == 0" class="assigned-status">Nobody is assigned to this Galaxy</p>
      <AssignCohortDialog :assignCohorts="true" />
    </div>

    <!-- ASSIGNED COURSES INFO -->
    <div v-else-if="assignCourses">
      <div v-if="courses.length > 0">
        <Course v-for="course in courses" :course="course" :key="course.id" />
      </div>
      <p v-else class="assigned-status">No Galaxies assigned to this Cohort</p>
      <AssignCohortDialog  :assignCourses="true"  />
    </div>

  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

import AssignCohortDialog from "../components/AssignCohortDialog";
import Course from "../components/Course";
import Cohort from "../components/Cohort";
import Organisation from "../components/Organisation";
import Person from "../components/Person";

export default {
  name: "AssignedInfo",
  props: ["assignCohorts", "assignCourses", "cohorts", "organisations", "people", "courses"],
  components: {
    Cohort,
    Organisation,
    Person,
    Course,
    AssignCohortDialog,
  },
  mounted() {
    console.log("got cohorts FROM ASSIGNED: ", this.cohorts)
  },
  computed: {},
  data() {
    return {};
  },
};
</script>

<style lang="scss">
#assigned-info {
  width: calc(100% - 30px);
  // height: 400px;
  border: 1px solid var(--v-baseAccent-base);
  margin-top: 10%;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;

  .assigned-label {
    font-size: 0.8rem;
    color: var(--v-baseAccent-base);
    font-weight: 400;
    text-transform: uppercase;
    // ribbon label
    position: absolute;
    top: -1px;
    left: -1px;
    background-color: var(--v-baseAccent-base);
    color: var(--v-background-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
  }

  .assigned-status {
    margin-top: 10px;
    color: var(--v-baseAccent-base);
    text-transform: uppercase;
    font-size: 0.8rem;
    text-align: center;
    margin: 20px 0px;
  }
}
</style>
