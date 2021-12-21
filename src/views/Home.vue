<template>
  <v-app class="bg">
    <NavBar />
    <router-view></router-view>
    <UserBar />

    <p>Yoza</p>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import UserBar from "@/components/UserBar.vue";
import NavBar from "@/components/NavBar.vue";

@Component({
  components: {
    UserBar,
    NavBar,
  },
})
export default class Home extends Vue {
  activeTab = `/home/galaxy`;
  tabs = [
    { id: 1, name: "GALAXIES", route: `/galaxy` },
    { id: 2, name: "SCHOOLS", route: `/schools` },
    { id: 3, name: "ALL STUDENTS", route: `/students` },
  ];
}
</script>
