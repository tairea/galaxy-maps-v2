<template>
  <div class="backButtonDiv" v-if="from">
    <v-btn :to="from" class="backButton" color="baseAccent" text>
      <v-icon left> mdi-arrow-left </v-icon>
      Back to
      {{ backToWhat(from) }}
    </v-btn>
  </div>
</template>

<script>
import { mapState } from 'vuex';
export default {
  name: "BackButton",
  props: ["toPath"],
  computed: {
    ...mapState(['from'])
  },
  methods: {
    backToWhat(path) {
      if (path.includes("galaxies")) {
        return "Galaxies";
      } else if (path.includes("galaxy")) {
        return "Galaxy";
      } else if (path.includes("cohorts")) {
        return "Cohorts";
      } else if (path.includes("login")) {
        return "Login";
      } else if (path.includes("dashboard")) {
        return "Dashboard";
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
