<template>
  <div id="container" class="bg">
    <div id="left-section">
      <GalaxyInfo :course="getCourseById(courseId)"/>
      <!-- <MissionsInfo :missions="galaxy.planets"/> -->
      <AssignedInfo />
    </div>
    <div id="main-section">
      <MissionsList :tasks="getTasksByCourseId(courseId)" :courseId="courseId"/>
    </div>
    <div id="right-section"></div>
  </div>
</template>

<script>
import GalaxyInfo from "../components/GalaxyInfo";
import AssignedInfo from "../components/AssignedInfo";
import MissionsInfo from "../components/MissionsInfo";
import MissionsList from "../components/MissionsList";

import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyView",
  components: {
    GalaxyInfo,
    AssignedInfo,
    MissionsInfo,
    MissionsList,
  },
  props: ["courseName","courseId"],
  mounted() {
    console.log("course id is:",this.courseId);
    console.log("course name is:",this.courseName);
  },
  data() {
    return {

    };
  },
  computed: {
    ...mapGetters(['getCourseById','getTasksByCourseId']),
  },
  methods: {},
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
  overflow: scroll;
  margin: 0 !important;
  // border: 1px solid red;
}

#left-section,
#right-section {
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
}

#main-section {
  width: 60%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid pink;
}
</style>
