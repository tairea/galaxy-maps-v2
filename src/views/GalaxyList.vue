<template>
  <div class="fullHeight">
    <GalaxyListPanel @courseClicked="courseClicked($event)" />
    <GalaxyListInfoPanel
      :type="courseType"
      :selectedCourse="clickedCourseId"
      @closeInfoPanel="closeInfoPanel"
    />
    <div class="d-flex justify-center button-row">
      <!-- <v-btn
        small
        outlined
        color="missionAccent"
        class="mx-2 galaxy-btn"
        :class="{ focused: learn }"
        @click="whichCoursesToDisplay = 'assigned'"
      >
        LEARN
      </v-btn>
      <v-btn
        small
        outlined
        color="missionAccent"
        class="mx-2 galaxy-btn"
        :class="{ focused: teach }"
        @click="whichCoursesToDisplay = 'my'"
      >
        TEACH
      </v-btn>
      <v-btn
        small
        active
        outlined
        color="missionAccent"
        class="mx-2 galaxy-btn"
        :class="{ focused: discover }"
        @click="whichCoursesToDisplay = 'all'"
      >
        DISCOVER
      </v-btn>
      <v-btn
        v-if="admin"
        small
        active
        outlined
        color="missionAccent"
        class="mx-2 galaxy-btn"
        :class="{ focused: submitted }"
        @click="whichCoursesToDisplay = 'submitted'"
      >
        submitted
      </v-btn> -->
    </div>
    <div class="flexContainer">
      <Galaxies
        ref="galaxyMap"
        :whichCoursesToDisplay="whichCoursesToDisplay"
        :highlightCourse="clickedCourseId"
      />
    </div>
    <div class="buttons">
      <CreateEditDeleteGalaxyDialog :edit="false" v-if="teach" />
      <!-- <DiscoverGalaxyButton />  -->
    </div>
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "../components/CreateEditDeleteGalaxyDialog";
import DiscoverGalaxyButton from "../components/DiscoverGalaxyButton";
import GalaxyListPanel from "../components/GalaxyListPanel";
import GalaxyListInfoPanel from "../components/GalaxyListInfoPanel";
import Galaxies from "../components/Galaxies";

import { mapGetters } from "vuex";

export default {
  name: "GalaxyList",
  props: ["display"],
  components: {
    CreateEditDeleteGalaxyDialog,
    GalaxyListPanel,
    GalaxyListInfoPanel,
    DiscoverGalaxyButton,
    Galaxies,
  },
  data() {
    return {
      loading: true,
      whichCoursesToDisplay: "all",
      clickedCourseId: null,
      courseType: null,
    };
  },
  async mounted() {
    if (this.display) this.whichCoursesToDisplay = this.display;
    else this.whichCoursesToDisplay = "all";
    // TODO: Currently navigates to all galaxies by default, this needs to be improved
    await this.$store.dispatch("bindAllCourses");
  },
  computed: {
    ...mapGetters(["user", "person"]),
    teach() {
      return this.whichCoursesToDisplay === "my";
    },
    learn() {
      return this.whichCoursesToDisplay === "assigned";
    },
    discover() {
      return this.whichCoursesToDisplay === "all";
    },
    submitted() {
      return this.whichCoursesToDisplay === "submitted";
    },
    admin() {
      return this.user.data.admin;
    },
  },
  methods: {
    courseClicked(emittedPayload) {
      this.clickedCourseId = emittedPayload.courseId;
      this.courseType = emittedPayload.type;
    },
    closeInfoPanel() {
      this.clickedCourseId = null;
    },
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

.button-row {
  position: relative;
  top: 80px;
  z-index: 1;
}

.focused {
  background-color: var(--v-missionAccent-darken4);
}

.galaxy-btn {
  background-color: var(--v-background-base);
}
</style>
