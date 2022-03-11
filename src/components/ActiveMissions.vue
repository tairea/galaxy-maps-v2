<template>
  <div v-if="activeMissions.length">
    <div v-for="activeMission in activeMissions" :key="activeMission.id">
      {{ activeMission.title }}
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "ActiveMissions",
  props: ["courseId"],
  components: {},
  data() {
    return {
      activeMissions: "null",
    };
  },
  async mounted() {
    this.activeMissions = await this.$store.dispatch("getPersonsActiveTasks", {
      courseId: this.courseId,
      personId: this.person.id,
    });
    console.log("this.activeMissions:", this.activeMissions);
  },
  computed: {
    ...mapGetters(["person"]),
  },
};
</script>

<style lang="scss" scoped></style>
