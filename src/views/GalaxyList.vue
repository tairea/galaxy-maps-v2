<template>
  <div class="fullHeight">
    <div class="d-flex justify-center button-row">
      <v-btn 
        v-if="enrolled"
        small 
        outlined 
        color="missionAccent" 
        class="mx-2"
        :class="{'focused': enrolled}" 
        @click="whichCoursesToDisplay = 'assigned'"
      >
        ENROLLED
      </v-btn>
      <v-btn 
        small 
        outlined 
        color="missionAccent" 
        class="mx-2"
        :class="{'focused': created}" 
        @click="whichCoursesToDisplay = 'my'"
      >
        CREATED
      </v-btn>
      <v-btn 
        small 
        active 
        outlined 
        color="missionAccent" 
        class="mx-2"
        :class="{'focused': all}" 
        @click="whichCoursesToDisplay = 'all'"
      >
        ALL
      </v-btn>
    </div>
    <div class="flexContainer">
      <Galaxies :whichCoursesToDisplay="whichCoursesToDisplay" />
    </div>
    <div class="buttons">
      <CreateEditDeleteGalaxyDialog :edit="false" v-if="created" />
      <!-- <DiscoverGalaxyButton /> -->
    </div>
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "../components/CreateEditDeleteGalaxyDialog";
import DiscoverGalaxyButton from "../components/DiscoverGalaxyButton";
import Galaxies from "../components/Galaxies";

import { db } from "../store/firestoreConfig";

import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyList",
  components: {
    CreateEditDeleteGalaxyDialog,
    DiscoverGalaxyButton,
    Galaxies,
  },
  data() {
    return {
      loading: true,
      whichCoursesToDisplay: "all"
      // whichCoursesToDisplay: this.$route.params.mineOrAssignedOrAll
      //   ? this.$route.params.mineOrAssignedOrAll
      //   : "", // my, assigned OR all
      // show: "assigned"
    };
  },
  async mounted() {
    if (this.person.assignedCourses) {
      await this.$store.dispatch(
        "getAssignedCourses",
        this.person.assignedCourses
      );
    }
    await this.$store.dispatch("bindAllCourses");
  },
  computed: {
    ...mapGetters(["user", "person"]),
    created() {
      return this.whichCoursesToDisplay === 'my'
    },
    enrolled() {
      return this.whichCoursesToDisplay === 'assigned'
    },
    all() {
      return this.whichCoursesToDisplay === 'all'
    },
    
  }
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

.button-row {
  position: relative;
  top: 80px;
  z-index: 5
}

.focused {
  background-color: var(--v-missionAccent-darken4)
}
</style>
