<template>
  <div class="backButtonDiv">
    <v-btn :to="toPath" class="backButton" color="baseAccent" text>
      <v-icon left> {{ mdiArrowLeft }} </v-icon>
      Back
    </v-btn>
  </div>
</template>

<script>
import { mdiArrowLeft } from "@mdi/js";

export default {
  name: "BackButton",
  props: ["toPath"],
  computed: {},
  data() {
    return {
      mdiArrowLeft,
    };
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
.backButtonDiv {
  margin-top: 15px;
  width: calc(100% - 30px);
  z-index: 999;
}

.backButton {
  border-radius: 0px;
  width: 100%;
}
</style>
