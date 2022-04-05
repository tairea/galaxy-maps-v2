<template>
  <div class="bg">
    <div class="landing-content">
      <p class="gm-title">GALAXY MAPS</p>
      <p class="overline">Galaxy Maps is a new digital learning experience</p>
      <p class="overline">Galaxy Maps are branching paths of learning</p>
      <p class="overline">Using Galaxy Maps you can navigate your learning</p>

      <v-btn outlined color="baseAccent" class="mt-8" :to="{ path: 'login' }">
        <!-- <v-icon small>
        mdi-account-multiple-plus
      </v-icon> -->
        SIGN IN TO GALAXY MAPS
      </v-btn>
      <!-- Background maps video -->
    </div>
    <video id="background-video" autoplay loop muted>
      <!-- <source src="../assets/gm-maps.mp4" type="video/mp4" /> -->
      <source src="../assets/gm-maps-2.mp4" type="video/mp4" />
    </video>
  </div>
</template>

<script>
export default {
  name: "LandingPage",
  components: {},
  data() {
    return {};
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
