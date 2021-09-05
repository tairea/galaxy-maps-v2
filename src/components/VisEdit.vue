<template>
 
</template>

<script>

import { mapState, mapGetters } from "vuex";

export default {
  name: "VisEdit",
  components: {

  },
  props: ["courseId", "courseTitle"],
  mounted() {},
  data() {
    return {
      fab: "",
    };
  },
  computed: {
    ...mapState(["currentCourseId"]),
    ...mapGetters([
      "getCourseById",
      "getTasksByCourseId",
      "getCohortsInThisCourse",
    ]),
  },
  methods: {},
};
</script>

<style lang="scss" scoped>

</style>
