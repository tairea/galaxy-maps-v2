<template>
  <v-app class="bg">
    <NavBar :userType="userType()" />
    <router-view></router-view>
    <UserBar />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import UserBar from "@/components/UserBar.vue";
import NavBar from "@/components/NavBar.vue";

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
  },
})
export default class Home extends HomeBase {
  userType() {
    console.log("usertype is:", this.person);
    //return either user, teacher, student
    return "student";
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
