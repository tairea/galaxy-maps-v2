<template>
  <div id="galaxy-info">
    <h2 class="galaxy-label">Galaxy</h2>
    <h1 class="galaxy-title">{{ galaxy.name }}</h1>
    <!-- <v-img class="galaxy-image" width="auto" :src="galaxy.image"></v-img> -->
    <p class="galaxy-description">{{ galaxy.description }}</p>
  </div>
</template>

<script>
export default {
  name: "GalaxyInfo",
  props: ["galaxy"],
  mounted() {
    console.log(this.galaxy)
  },
  data() {
    return {
      // galaxy: {
      //   title: "Web Development",
      //   image:
      //     "https://cdn.mos.cms.futurecdn.net/8Y8jVFchXJF6TPpQ6i6weW-320-80.jpg",
      //     description: "Web development foundations course"
      // },
    };
  },
};
</script>

<style lang="scss">
#galaxy-info {
  width: calc(100% - 30px);
  // height: 400px;
  border: 1px solid var(--v-galaxyAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-neon-base);
  position: relative;
}

h1 {
  color: white;
}

.galaxy-label {
  font-size: 0.8rem;
  color: var(--v-neon-base);
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: 0;
  left: -1px;
  background-color: var(--v-galaxyAccent-base);
  color: var(--v-background-base);
  padding: 0px 15px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
}

.galaxy-title {
  font-size: 1.2rem;
  color: var(--v-galaxyAccent-base);
  font-weight: 600;
  text-transform: uppercase;
  margin: 20px 0px 5px 0px;
}

.galaxy-description {
  margin-top: 10px;
  color: var(--v-galaxyAccent-base);
  font-size: 0.9rem;
}
</style>
