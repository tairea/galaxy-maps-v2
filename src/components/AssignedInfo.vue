<template>
  <div id="assigned-info">
    <h2 class="assigned-label">Assigned to:</h2>

    <!-- ASSIGNED COHORTS INFO -->
    <div v-if="assignCohorts">
      <!-- Cohorts -->
      <div v-if="cohorts.length > 0">
        <p class="overline assignedToLabel ma-0">Cohorts</p>
        <v-row class="my-1">
          <Cohort
            v-for="cohort in cohorts"
            :cohort="cohort"
            :key="cohort.id"
            :tooltip="true"
          />
        </v-row>
      </div>

      <div v-if="people.length > 0">
        <p class="overline assignedToLabel ma-0">Individuals</p>
        <v-row class="my-4">
          <Person v-for="person in people" :person="person" :key="person.id" />
        </v-row>
      </div>

      <p
        v-if="cohorts.length == 0 && people.length == 0"
        class="assigned-status"
      >
        Nobody is assigned to this Galaxy
      </p>
      <AssignCohortDialog :assignCohorts="true" />
    </div>

    <!-- ASSIGNED COURSES INFO -->
    <div v-else-if="assignCourses">
      <div v-if="courses.length > 0">
        <Course v-for="(course, i) in courses" :course="course" :key="i" />
      </div>
      <p v-if="cohortTeacher" class="assigned-status">No Galaxies assigned to this Cohort</p>
      <AssignCohortDialog :assignCourses="true" />
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
import { dbMixins } from "../mixins/DbMixins"
import { getCourseById } from "../lib/ff";

export default {
  name: "AssignedInfo",
  mixins: [dbMixins],
  components: {
    Cohort,
    Organisation,
    Person,
    Course,
    AssignCohortDialog,
  },
  props: ["assignCohorts", "assignCourses", "cohorts", "organisations", "people"],
  data () {
    return {
      courses: [],
    };
  },
  beforeMount () {
    this.getCohortCourses()
  },
  watch: {
    currentCohort() {
      this.getCohortCourses();
    },
  },
  computed: {
    ...mapState(["person", "currentCohort"]),
    ...mapGetters(["getCoursesInThisCohort"]),
    cohortTeacher() {
      return this.currentCohort.teachers.some(id => id === this.person.id)
    }
  },
  methods: {
    async getCohortCourses () {
      let courses = await Promise.all(this.currentCohort?.courses.map(courseId => {
        return getCourseById(courseId)
      }))
      if (courses.length) {
        this.courses = courses;
      }
    },
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

  .assignedToLabel {
    font-size: 0.8rem;
    color: var(--v-baseAccent-base);
    border-bottom: 1px solid var(--v-baseAccent-base);
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
