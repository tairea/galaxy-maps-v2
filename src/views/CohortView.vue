<template>
  <div id="container" class="bg">
    <div id="left-section">
      <CohortInfo :cohort="getCohortById(currentCohortId)" />
      <!-- <MissionsInfo :missions="galaxy.planets"/> -->
      <AssignedInfo :assignCourses="true" :courses="getCoursesInThisCohort(currentCohortId)" />
    </div>
    <div id="main-section">
      <!-- <MissionsList
        :tasks="getTasksByCourseId(currentCourseId)"
        :courseId="currentCourseId"
      /> -->
      <!-- <PeopleList :people="cohort.people"/> -->
    </div>
    <div id="right-section">
      <!-- <div class="galaxy-frame">
        <h2 class="galaxy-label">Map</h2>
        
      </div> -->
    </div>
  </div>
</template>

<script>
import CohortInfo from "../components/CohortInfo";
import AssignedInfo from "../components/AssignedInfo";
import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";
import Galaxy from "../components/Galaxy";

import { mapState, mapGetters } from "vuex";

export default {
  name: "CohortView",
  components: {
    CohortInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    Galaxy,
  },
  props: ["cohortId", "cohortName"],
  mounted() {
    this.bindAll()
  },
  data() {
    return {
      cohort: {}
    };
  },
  computed: {
    ...mapState(["currentCohortId"]),
    ...mapGetters(["getCohortById", "getCoursesInThisCohort"]),
  },
  methods: {
       bindAll () {
      this.$store.dispatch('bindCourses')
      this.$store.dispatch('bindCohorts')
      this.$store.dispatch('bindOrganisations')
    },
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
}

#container {
  height: 100vh;
  width: 100%;
  display: flex;
  overflow: hidden;
  margin: 0 !important;
  // border: 1px solid red;
}

#left-section {
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
}

#main-section {
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid pink;

}

#right-section {
  width: 30%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

.galaxy-frame {
  position: relative;
  width: 100%;
  margin: 30px 20px;
  border: 1px solid var(--v-galaxyAccent-base);

  .galaxy-label {
    // ribbon label
    position: absolute;
    top: 0;
    left: -1px;
    background-color: var(--v-galaxyAccent-base);
    color: var(--v-background-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
  }
}
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
</style>
