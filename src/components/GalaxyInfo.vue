<template>
  <div id="galaxy-info" :class="draft ? 'draft-border' : 'galaxy-border'" v-if="course">
    <h2 class="galaxy-label"><span v-if="draft">Drafting</span> Galaxy</h2>
    <h1 class="galaxy-title">{{ course.title }}</h1>
    <!-- <div class="d-flex justify-center align-center"> -->
    <v-img v-if="course.image" class="galaxy-image" :src="course.image.url"></v-img>
    <!-- </div> -->
    <p class="galaxy-description">{{ course.description }}</p>
    <CreateEditDeleteGalaxyDialog
      v-if="teacher"
      :edit="true"
      :courseToEdit="course"
    />
  </div>
</template>

<script>

import CreateEditDeleteGalaxyDialog from "../components/CreateEditDeleteGalaxyDialog";

import { mapState } from "vuex";

export default {
  name: "GalaxyInfo",
  props: ["course", "teacher", "draft"],
  components: {
    CreateEditDeleteGalaxyDialog,
  },
  mounted() {},
  computed: {
    ...mapState(["person"]),
  }
};
</script>

<style lang="scss" scoped>
#galaxy-info {
  width: calc(100% - 30px);
  // height: 400px;
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;

  .galaxy-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    // ribbon label
    position: absolute;
    top: 0;
    left: -1px;
    color: var(--v-background-base);
    background-color: var(--v-galaxyAccent-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
  }

  .galaxy-title {
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    margin: 20px 0px 5px 0px;
    color: white;
    color: var(--v-galaxyAccent-base)
  }

  .galaxy-image {
    width: 100%;
  }

  .galaxy-description {
    margin-top: 10px;
    font-size: 0.9rem;
    color: var(--v-galaxyAccent-base)
  }
}

.galaxy-border {
  border: 1px solid var(--v-galaxyAccent-base);
}

.draft-border {
  border: 1px dashed var(--v-galaxyAccent-base);
}

</style>
