<template>
  <div class="backButtonDiv" :class="{ mobile: mobile }">
    <v-btn :to="dynamicPath || toPath" class="backButton" color="baseAccent" text>
      <v-icon left> {{ mdiArrowLeft }} </v-icon>
      <span v-if="showText">Back</span>
    </v-btn>
  </div>
</template>

<script>
import { mdiArrowLeft } from "@mdi/js";

export default {
  name: "BackButton",
  props: {
    toPath: {
      type: String,
      default: "/",
    },
    dynamicPath: {
      type: String,
      default: null,
    },
    mobile: {
      type: Boolean,
      default: false,
    },
    showText: {
      type: Boolean,
      default: true,
    },
  },
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
  margin-top: 20px;
  width: calc(100% - 30px);
  z-index: 190;

  &.mobile {
    margin-top: 0;
    width: auto;

    .backButton {
      width: auto;
      min-width: 48px;
      height: 48px;
      border-radius: 50%;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  }
}

.backButton {
  border-radius: 0px;
  width: 100%;
}
</style>
