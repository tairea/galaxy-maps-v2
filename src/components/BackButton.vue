<template>
  <div class="backButton">
    <v-btn :to="toPath" class="ma-1" color="baseAccent" plain>
      <v-icon left>
        mdi-arrow-left
      </v-icon>
      Back to
      {{backToWhat(toPath)}}
    </v-btn>
  </div>
</template>

<script>
export default {
  name: "BackButton",
  props: ["toPath"],
  data() {
    return {};
  },
  mounted() {},
  computed: {},
  methods: {
    backToWhat(path) {
      if(path.includes("galaxies")) {
        return "Galaxies"
      } else if (path.includes("galaxy")) {
        return "Galaxy"
      } else if (path.includes("cohorts")){
        return "Cohorts"
      } else if (path.includes("login")) {
        return "Login"
      } else {
        return "?"
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.backButton {
  position: absolute;
  bottom: 30px;
  z-index: 2;
}
</style>
