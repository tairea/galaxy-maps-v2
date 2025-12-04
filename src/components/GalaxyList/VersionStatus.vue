<template>
  <div class="version">
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <p class="version-text overline" v-bind="attrs" v-on="on">Beta Release</p>
      </template>
      <p class="ma-1 overline" style="font-size: 0.6rem !important">
        This is an early Beta preview release. <br />
        We are building out in the open, so you may experience some bugs, but we are actively
        working on them.<br />
        Let us know if you find any bugs or have any feedback. <br />
        <span class="overline ma-0" style="font-size: 0.7rem !important"
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
      versionNumber: "0.2512.01", // [version.yearMonth.patch]
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
  z-index: 300;

  .version-text {
    margin: 0px;
    font-size: 0.6rem !important;
  }
}
</style>
