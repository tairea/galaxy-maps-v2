<template>
  <div id="assigned-info">
    <h2 class="assigned-label">{{ isMissionView ? "Currently active" : "Assigned to" }}:</h2>
    <!-- ASSIGNED COHORTS INFO -->
    <div v-if="assignCohorts">
      <!-- Cohorts -->
      <div v-if="cohorts && cohorts.length > 0">
        <p class="overline assignedToLabel ma-0">Cohorts</p>
        <v-row class="my-1">
          <Cohort v-for="cohort in cohorts" :cohort="cohort" :key="cohort.id" :tooltip="true" />
        </v-row>
      </div>

      <div v-if="people.length > 0">
        <p class="overline assignedToLabel ma-0">Individuals</p>
        <v-row class="my-4">
          <Avatar
            v-for="person in people"
            :profile="person"
            :key="person.id"
            :size="40"
            :colourBorder="true"
            class="ma-1"
          />
        </v-row>
      </div>

      <p v-if="cohorts && cohorts.length == 0 && people.length == 0" class="assigned-status">
        Nobody is assigned to this Galaxy
      </p>
      <AssignCohortDialog
        v-if="isTeacher && cohorts"
        :assignCohorts="true"
        @newAssignment="addToPeople($event)"
        :cohorts="cohorts"
      />
    </div>

    <!-- ASSIGNED COURSES INFO -->
    <div v-else-if="assignCourses">
      <p class="overline assignedToLabel ma-0">Galaxy Maps</p>
      <div v-if="courses.length > 0">
        <Course v-for="(course, i) in courses" :course="course" :key="i" />
        <!-- Jump to galaxy button -->
        <div v-if="courses.length == 1" class="d-flex justify-center align-center mb-2">
          <v-btn
            outlined
            color="galaxyAccent"
            small
            :to="{
              name: 'GalaxyView',
              params: { courseId: courses[0].id },
            }"
            >Jump to Galaxy</v-btn
          >
        </div>
      </div>
      <p v-else class="assigned-status">No Galaxies assigned to this Cohort</p>
      <AssignCohortDialog v-if="isTeacher && !courseCohort" :assignCourses="true" />
    </div>
  </div>
</template>

<script>
import AssignCohortDialog from "@/components/AssignCohortDialog.vue";
import Course from "@/components/Course.vue";
import Cohort from "@/components/Cohort.vue";
import Organisation from "@/components/Organisation.vue";
import Avatar from "@/components/Avatar.vue";
import { dbMixins } from "@/mixins/DbMixins";
import { getCourseById } from "@/lib/ff";
import useRootStore from "@/store/index";
import { mapState } from "pinia";

export default {
  name: "AssignedInfo",
  mixins: [dbMixins],
  components: {
    Cohort,
    Organisation,
    Avatar,
    Course,
    AssignCohortDialog,
  },
  props: ["assignCohorts", "assignCourses", "cohorts", "organisations", "people", "teacher"],
  data() {
    return {
      courses: [],
    };
  },
  beforeMount() {
    this.getCohortCourses();
  },
  watch: {
    currentCohort() {
      this.getCohortCourses();
    },
  },
  computed: {
    ...mapState(useRootStore, ["person", "currentCohort","getCoursesInThisCohort", "user"]),
    isTeacher() {
      return (
        this.user.data.admin ||
        this.teacher ||
        this.currentCohort.teachers?.includes(this.person.id)
      );
    },
    courseCohort() {
      return this.currentCohort.courseCohort;
    },
    isMissionView() {
      return this.$route.name == "SolarSystemView";
    },
  },
  methods: {
    async getCohortCourses() {
      if (this.assignCourses) {
        let courses = await Promise.all(
          this.currentCohort?.courses.map((courseId) => {
            return getCourseById(courseId);
          }),
        );
        if (courses.length) {
          this.courses = courses;
        }
      }
    },
    addToPeople(person) {
      return this.people.push(person);
    },
  },
};
</script>

<style lang="scss">
#assigned-info {
  width: 100%;
  // height: 400px;
  border: 1px solid var(--v-baseAccent-base);
  margin-top: 30px;
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
