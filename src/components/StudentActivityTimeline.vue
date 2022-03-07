<template></template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "StudentActivityTimeline",
  props: [],
  components: {},
  mounted() {},
  computed: {
    ...mapGetters(["person"]),
  },
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped></style>
