<template>
  <div class="backButtonDiv">
    <v-btn :to="toPath" class="backButton" color="baseAccent" outlined>
      <v-icon left> mdi-arrow-left </v-icon>
      Back to
      {{ backToWhat(toPath) }}
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
    click() {
      console.log('click back button')
    },
    backToWhat(path) {
      if (path.includes("galaxies")) {
        return "Galaxies";
      } else if (path.includes("galaxy")) {
        return "Galaxy";
      } else if (path.includes("cohorts")) {
        return "Cohorts";
      } else if (path.includes("login")) {
        return "Login";
      } else {
        return "?";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.backButtonDiv {
  margin-top: 30px;
  width: calc(100% - 30px);
  z-index: 999;
}
.backButton {
  border-radius: 0px;
  width: 100%;
}
</style>
