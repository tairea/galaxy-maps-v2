<template>
  <div class="version">
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <p class="version-text overline" v-bind="attrs" v-on="on">Alpha Release</p>
      </template>
      <p class="ma-1">
        This is an early Alpha preview release. <br /><span
          class="overline ma-0"
          style="font-size: 0.7rem !important"
          >Version: {{ versionNumber }}</span
        >
      </p>
    </v-tooltip>
  </div>
</template>

<script>
export default {
  name: "VersionStatus",
  data() {
    return {
      versionNumber: "0.2406.01", // [version.yearMonth.patch]
    };
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
.version {
  position: fixed;
  bottom: 0px;
  left: 10px;
  width: 150px;
  // height: 50px;
  // background-color: blue;
  color: gray;

  .version-text {
    margin: 0px;
    font-size: 0.6rem !important;
  }
}
</style>
