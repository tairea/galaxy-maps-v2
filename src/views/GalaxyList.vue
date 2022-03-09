<template>
  <div class="fullHeight">
    <div class="flexContainer">
      <Galaxy :whichCoursesToDisplay="whichCoursesToDisplay" />
    </div>
    <div v-if="whichCoursesToDisplay != 'assigned'" class="buttons">
      <CreateEditDeleteGalaxyDialog :edit="false" v-if="myGalaxiesPath" />
      <!-- <DiscoverGalaxyButton /> -->
    </div>
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "../components/CreateEditDeleteGalaxyDialog";
import DiscoverGalaxyButton from "../components/DiscoverGalaxyButton";
import Galaxy from "../components/Galaxy";

import { db } from "../store/firestoreConfig";

import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyList",
  components: {
    CreateEditDeleteGalaxyDialog,
    DiscoverGalaxyButton,
    Galaxy,
  },
  async mounted() {
    // if account type student, bind assignedCourses to store.courses
    // else if account type teacher, bind all courses to store.courses
    if (this.person.accountType == "student") {
      await this.$store.dispatch(
        "getAssignedCourses",
        this.person.assignedCourses
      );
      console.log("this.courses from assigned galaxies view", this.courses);
    } else {
      await this.$store.dispatch("bindAllCourses");
    }
  },
  computed: {
    ...mapGetters(["user", "person"]),
    myGalaxiesPath() {
      return this.$route.path.includes("/my");
    },
  },
  data() {
    return {
      loading: true,
      whichCoursesToDisplay: this.$route.params.mineOrAssignedOrAll
        ? this.$route.params.mineOrAssignedOrAll
        : "", // my, assigned OR all
    };
  },
};
</script>

<style lang="scss" scoped>
.fullHeight {
  height: 100vh;
  overflow: hidden;
}

.flexContainer {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  // border: solid blue 2px;

  .flexRow {
    display: flex;
    // height: 50%;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    // border: solid pink 2px;

    .box {
      // width: 25%;
      max-width: 25%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      // margin: 10px;
      padding: 2%;
      box-sizing: border-box;
      // border: 1px solid yellow;
    }
  }
}

.buttons {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%, 0%);
  display: flex;
}
</style>
