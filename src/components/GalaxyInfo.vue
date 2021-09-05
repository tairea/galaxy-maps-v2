<template>
  <div id="galaxy-info">
    <h2 class="galaxy-label">Galaxy</h2>
    <h1 class="galaxy-title">{{ course.title }}</h1>
    <p class="galaxy-description">{{ course.description }}</p>
    <v-img class="galaxy-image" :src="course.image.url"></v-img>
    <EditGalaxyButtonDialog :course="course" />
  </div>
</template>

<script>

import EditGalaxyButtonDialog from "../components/EditGalaxyButtonDialog";

export default {
  name: "GalaxyInfo",
  props: ["course"],
  components: {
    EditGalaxyButtonDialog
  },
  mounted() {},
  data() {
    return {};
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
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);

  .galaxy-image {
    // --- CIRCLE IMAGE ---
    // border-radius: 50%;
    // width: 200px !important;
    // height: 200px !important;
    // margin: auto;
    // max-width: 60px;
    margin-bottom: 20px;
  }
}

h1 {
  color: white;
}

.galaxy-label {
  font-size: 0.8rem;
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
  // margin-top: 10px;
  color: var(--v-galaxyAccent-base);
  // font-size: 0.9rem;
}
</style>
