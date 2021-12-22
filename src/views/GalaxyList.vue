<template>
  <div class="fullHeight">
    <div class="flexContainer">
      <Galaxy :whichCoursesToDisplay="whichCoursesToDisplay" />
    </div>
    <div v-if="whichCoursesToDisplay != 'assigned'" class="buttons">
      <CreateEditDeleteGalaxyDialog :edit="false" />
      <DiscoverGalaxyButton />
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
  mounted() {
    // trigger VuexFire bindCourses in Store
    this.bindAll(); // <== DO WE NEED TO BIND HERE?? (eg. courses needed for popup in galaxy.vue)
    // console.log("this.courses", this.courses);
  },
  computed: {
    ...mapGetters(["courses", "user", "person"]),
  },
  data() {
    return {
      loading: true,
      whichCoursesToDisplay: this.$route.params.mineOrAssignedOrAll
        ? this.$route.params.mineOrAssignedOrAll
        : "",  // my, assigned OR all
    };
  },
  methods: {
    bindAll() {
      // this.$store.dispatch("bindAllCourses");
      this.$store.dispatch("bindCoursesByPersonId", this.user.data.id);
      this.$store.dispatch("bindAllCohorts");
      this.$store.dispatch("bindAllOrganisations");
      this.$store.dispatch("bindAllPeople");
      // this.$store.dispatch("getPersonById", this.user.data.id); // already dispatched on main.js
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
</style>
