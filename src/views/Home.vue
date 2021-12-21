<template>
  <v-app class="bg">
    
    <NavBar :userType="userType()" />  
    <router-view></router-view>
    <UserBar/>

  </v-app>
</template>

<script>
// @ is an alias to /src
import UserBar from "../components/UserBar";
import NavBar from "../components/NavBar";

import { mapGetters } from "vuex";

export default {
  name: "HomeLearner",
  components: {
    UserBar,
    NavBar,
  },
  mounted() {
    console.log("have we got the person?",this.person)
  },
  computed: {
    ...mapGetters(["person"]),
  },
  data() {
    return {
      
    };
  },
  methods: {
    userType() {
      console.log("usertype is:",this.person)
      //return either user, teacher, student
      return "student"
    }
  }
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
