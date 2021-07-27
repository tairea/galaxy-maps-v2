<template>
  <v-container class="d-flex justify-center align-center fullHeight">
    <div class="flexContainer">
      <div class="flexRow">
        <Galaxy v-for="course in courses" :galaxy="course" :key="course.id" />
      </div>
    </div>
    <div class="createButton">
      <CreateGalaxy />
    </div>
  </v-container>
</template>

<script>
import CreateGalaxy from "../components/CreateGalaxy";
import Galaxy from "../components/Galaxy";

import { mapState, mapGetters } from 'vuex'

export default {
  name: "GalaxyList",
  components: {
    CreateGalaxy,
    Galaxy,
  },
  mounted() {
    this.getCourses()
  },
  computed: {
    ...mapGetters(["courses"]),
    courseWidth() {
      console.log("this.courses.length =", this.courses.length);
      var width = 100 / this.courses.length;
      if (width < 25) {
        return "25%";
      } else {
        return width + "%";
      }
    },
  },
  methods: {
    getCourses () {
      this.$store.dispatch('bindCourses')
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
  overflow: scroll;
}

.flexContainer {
  height: 100%;
  width: 80%;
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
