<template>
  <v-container class="d-flex justify-center align-center fullHeight">
    <div class="flexContainer">
      
        <Galaxy />
      
    </div>
    <div class="createButton">
      <CreateGalaxyButtonDialog />
    </div>
  </v-container>
</template>

<script>
import CreateGalaxyButtonDialog from "../components/CreateGalaxyButtonDialog";
import Galaxy from "../components/Galaxy";

import { db } from "../store/firestoreConfig";

import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyList",
  components: {
    CreateGalaxyButtonDialog,
    Galaxy,
  },
  mounted() {
    // trigger VuexFire bindCourses in Store
    this.bindAll();
    console.log("this.courses", this.courses);
  },
  computed: {
    ...mapGetters(["courses"]),
  },
  methods: {
    bindAll() {
      this.$store.dispatch("bindCourses");
      this.$store.dispatch("bindCohorts");
      this.$store.dispatch("bindOrganisations");
    },
  },
  data() {
    return {};
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

.createButton {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%, 0%);
}
</style>
