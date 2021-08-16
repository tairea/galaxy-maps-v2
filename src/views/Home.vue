<template>
  <v-app class="bg">
    
    <NavBar />  
    <router-view></router-view>
    <UserBar/>

  </v-app>
</template>

<script>
// @ is an alias to /src
import UserBar from "../components/UserBar";
import NavBar from "../components/NavBar";

export default {
  name: "Home",
  components: {
    UserBar,
    NavBar,
  },
  data() {
    return {
      activeTab: `/home/galaxy`,
      tabs: [
        { id: 1, name: "GALAXIES", route: `/galaxy` },
        { id: 2, name: "SCHOOLS", route: `/schools` },
        { id: 3, name: "ALL STUDENTS", route: `/students` },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
  overflow: hidden;
}

</style>
