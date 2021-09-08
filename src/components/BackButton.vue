<template>
  <div class="backButton">
    <v-btn :to="toPath" class="ma-1" color="baseAccent" plain>
      <v-icon left>
        mdi-arrow-left
      </v-icon>
      Back to {{toPath.includes("galaxy") ? "Galaxies" : toPath.includes("cohorts") ? "Cohorts" : "?"}}
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
  methods: {},
};
</script>

<style lang="scss" scoped>
.backButton {
  position: absolute;
  bottom: 30px;
  z-index: 2;
}
</style>
