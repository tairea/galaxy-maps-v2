<template>
  <div v-if="activeMissions">
    <div v-for="activeMission in activeMissions" :key="activeMission.id">
      {{ acitveMission.title }}
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "ActiveMissions",
  props: ["courseId"],
  components: {},
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
  data() {
    return {
      activeMissions: "null",
    };
  },
};
</script>

<style lang="scss" scoped></style>
