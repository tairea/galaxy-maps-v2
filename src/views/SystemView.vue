<template>
  <div id="container" class="bg">
    <div id="left-section">
      <GalaxyInfo :course="getCourseById(currentCourseId)" />
      <!-- <MissionsInfo :missions="galaxy.planets"/> -->
      <AssignedInfo
        :assignCohorts="true"
        :cohorts="getCohortsInThisCourse(currentCourseId)"
      />

      <BackButton :toPath="'/galaxy'" />
    </div>
    <div id="main-section">
      <div class="mission-frame">
        <h2 class="mission-label">Map</h2> -->
      
      <MissionsList
        :tasks="getTasksByCourseId(currentCourseId)"
        :courseId="currentCourseId"
      />
    </div>
    <div id="right-section">
      <div class="galaxy-frame">
        <h2 class="galaxy-label">Map</h2>
        <Galaxy :course="getCourseById(currentCourseId)" :size="'0.27em'" />
      </div>
    </div>
  </div>
</template>

<script>
import GalaxyInfo from "../components/GalaxyInfo";
import AssignedInfo from "../components/AssignedInfo";
import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";
import Galaxy from "../components/Galaxy";
import GalaxyMap from "../components/GalaxyMap";
import GalaxyMapsExample from "../components/GalaxyMapsExample";
import BackButton from "../components/BackButton";

import { mapState, mapGetters } from "vuex";

export default {
  name: "SystemView",
  components: {
    GalaxyInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
    Galaxy,
    GalaxyMap,
    BackButton,
    GalaxyMapsExample,
  },
  props: ["courseId", "courseTitle"],
  mounted() {},
  data() {
    return {
      editing: false,
    };
  },
  computed: {
    ...mapState(["currentCourseId"]),
    ...mapGetters([
      "getCourseById",
      "getTasksByCourseId",
      "getCohortsInThisCourse",
    ]),
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
.bg {
  background-color: var(--v-background-base);
  //     background: #0F2027;  /* fallback for old browsers */
  // background: -webkit-radial-gradient(circle, #2C5364, #203A43, #0F2027);  /* Chrome 10-25, Safari 5.1-6 */
  // background: radial-gradient(circle, #2C5364, #203A43, #0F2027); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
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
  width: 15%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
  z-index: 999;
}

#main-section {
  // width: calc(100% - 30px);
  // position: absolute;
  width: 100vw;
  margin: 0px 30px 0 15px;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid pink;
  z-index: 2;

  .map-edit-button {
    margin-top: 30px;
    position: absolute;
    z-index: 2;
  }

  .mission-frame {
    position: relative;
    width: 100%;
    margin: 30px 0px;
    border: 1px solid var(--v-missionAccent-base);
    height: 90%;

    .mission-label {
      font-size: 0.8rem;
      color: var(--v-baseAccent-base);
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: absolute;
      top: 0;
      left: -1px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 15px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
    }
  }
}

#right-section {
  width: 30%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

// .galaxy-frame {
//   position: relative;
//   width: 100%;
//   margin: 30px 20px;
//   border: 1px solid var(--v-galaxyAccent-base);
//   height: 500px;

//   .galaxy-label {
//     // ribbon label
//     position: absolute;
//     top: 0;
//     left: -1px;
//     background-color: var(--v-galaxyAccent-base);
//     color: var(--v-background-base);
//     padding: 0px 15px 0px 5px;
//     clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
//   }
// }
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
