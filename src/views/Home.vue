<template>
  <v-app class="bg">
    <NavBar :userType="userType()" />
    <router-view :key="$route.fullPath"></router-view>
    <SnackBar />
    <UserBar />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import UserBar from "@/components/UserBar.vue";
import NavBar from "@/components/NavBar.vue";
import SnackBar from "@/components/SnackBar.vue"

import { mapGetters } from "vuex";

const HomeBase = Vue.extend({
  computed: {
    ...mapGetters(["person"]),
  },
});

@Component({
  components: {
    UserBar,
    NavBar,
    SnackBar
  },
})
export default class Home extends HomeBase {
  userType() {
    //return either user, teacher, student
    return this.person.accountType;
  }
}
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
  overflow: hidden;
  overflow-y: hidden; // hide vertical
  overflow-x: hidden; // hide horizontal
}
</style>
