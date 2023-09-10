<template>
  <div class="bg">
    <Login v-if="componentView == 'login'" />
    <v-btn v-if="componentView == 'login'" :to="{path: '/'}">
      <p  class="overline baseAccent--text landing-content">
          Continue without signing in ->
      </p>
    </v-btn>
    <VerifyEmail v-else-if="componentView == 'verify'" />
    <ResetPassword v-else-if="componentView == 'reset'" />
    <Register v-else-if="componentView == 'register'" />

    <div v-else class="landing-content">
      <p class="gm-title">GALAXY MAPS</p>
      <p class="overline">Galaxy Maps is a new digital learning experience</p>
      <p class="overline">
        Galaxy Maps are learning paths created by the community
      </p>
      <p class="overline">Discover new Galaxies and navigate your learning</p>

      <!-- <v-btn outlined color="baseAccent" class="mt-8" :to="{ path: 'login' }"> -->
      <v-btn outlined color="baseAccent" class="mt-8" to="/login">
        SIGN IN TO GALAXY MAPS
      </v-btn>

      <div class="alpha-release" style="color: #ed254e">
        <p class="overline pa-0 mt-8 mb-0 text-center" style="font-size: 40px">
          ALPHA RELEASE
        </p>
        <p style="font-size: 0.7rem" class="text-center">
          We are still testing for bugs. Please leave us feedback if the
          platform is doing something weird.
        </p>
      </div>
    </div>

    

    <!-- Background maps video -->
    <video id="background-video" autoplay loop muted>
      <!-- <source src="../assets/gm-maps.mp4" type="video/mp4" /> -->
      <source src="../assets/gm-maps-2.mp4" type="video/mp4" />
    </video>
  </div>
</template>

<script>
import Login from "@/components/Landing/Login.vue";
import VerifyEmail from "@/components/Landing/VerifyEmail.vue";
import ResetPassword from "@/components/Landing/ResetPassword.vue";
import Register from "@/components/Landing/Register.vue";

export default {
  name: "LandingPage",
  components: {
    Login,
    VerifyEmail,
    ResetPassword,
    Register,
  },
  data() {
    return {
      componentView: null,
    };
  },
  watch: {
    "$route.name": {
      handler: function (route) {
        console.log("route watch:", route);
        switch (route) {
          case "Login":
            this.componentView = "login";
            break;
          case "Verify":
            this.componentView = "verify";
            break;
          case "Reset":
            this.componentView = "reset";
            break;
          case "Register":
            this.componentView = "register";
            break;
          default:
            break;
        }
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    switch (this.$route.name) {
      case "Login":
        this.componentView = "login";
        break;
      case "Verify":
        this.componentView = "verify";
        break;
      case "Reset":
        this.componentView = "reset";
        break;
      case "Register":
        this.componentView = "register";
        break;
      default:
        break;
    }
  },
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Genos:wght@200&display=swap");

.gm-title {
  font-family: "Genos", sans-serif;
  font-size: 5vw;
  color: var(--v-baseAccent-base);
  letter-spacing: 15px;
}

.bg {
  background: var(--v-background-base);
  // overflow: hidden;
  // overflow-y: hidden; // hide vertical
  // overflow-x: hidden; // hide horizontal
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  height: 100vh;
  width: 100vw;

  overflow-y: hidden;

  .landing-content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 1;
  }
}

#background-video {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 0;
}
</style>
