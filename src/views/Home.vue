<template>
  <v-app class="bg">
    <NavBar />
    <router-view></router-view>
    <UserBar />
  </v-app>
</template>

<script>
import UserBar from "@/components/Home/UserBar.vue";
import NavBar from "@/components/Home/NavBar.vue";
import useRootStore from "@/store/index";
import { mapState } from "pinia";

export default {
  name: "Home",
  components: {
    UserBar,
    NavBar,
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
  overflow: hidden;
  overflow-y: hidden; // hide vertical
  overflow-x: hidden; // hide horizontal
}
</style>
