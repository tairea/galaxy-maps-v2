<template>
  <div class="fullHeight">
    <div class="d-flex justify-center button-row">
      <v-btn 
        small 
        outlined 
        color="missionAccent" 
        class="mx-2"
        :class="{'focused': learn}" 
        @click="whichCoursesToDisplay = 'assigned'"
      >
        LEARN
      </v-btn>
      <v-btn 
        small 
        outlined 
        color="missionAccent" 
        class="mx-2"
        :class="{'focused': teach}" 
        @click="whichCoursesToDisplay = 'my'"
      >
        TEACH
      </v-btn>
      <v-btn 
        small 
        active 
        outlined 
        color="missionAccent" 
        class="mx-2"
        :class="{'focused': discover}" 
        @click="whichCoursesToDisplay = 'all'"
      >
        DISCOVER
      </v-btn>
    </div>
    <div class="flexContainer">
      <Galaxies :whichCoursesToDisplay="whichCoursesToDisplay" />
    </div>
    <div class="buttons">
      <CreateEditDeleteGalaxyDialog :edit="false" v-if="teach" />
      <!-- <DiscoverGalaxyButton /> -->
    </div>
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "../components/CreateEditDeleteGalaxyDialog";
import DiscoverGalaxyButton from "../components/DiscoverGalaxyButton";
import Galaxies from "../components/Galaxies";

import { mapGetters } from "vuex";

export default {
  name: "GalaxyList",
  props: ['display'],
  components: {
    CreateEditDeleteGalaxyDialog,
    DiscoverGalaxyButton,
    Galaxies,
  },
  data() {
    return {
      loading: true,
      whichCoursesToDisplay: "all"
    };
  },
  async mounted() {
    if (this.display) this.whichCoursesToDisplay = this.display
    // TODO: Currently navigates to all galaxies by default, this needs to be improved
    await this.$store.dispatch("bindAllCourses");
  },
  computed: {
    ...mapGetters(["user", "person"]),
    teach() {
      return this.whichCoursesToDisplay === 'my'
    },
    learn() {
      return this.whichCoursesToDisplay === 'assigned'
    },
    discover() {
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
  z-index: 1
}

.focused {
  background-color: var(--v-missionAccent-darken4)
}
</style>
