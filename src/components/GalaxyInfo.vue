<template>
  <div
    id="galaxy-info"
    :class="draft ? 'draft-border' : 'galaxy-border'"
    v-if="course"
  >
    <!-- Label -->
    <h2 class="galaxy-label"><span v-if="draft">Drafting</span> Galaxy</h2>
    <!-- Map Name  -->
    <h1 class="galaxy-title">{{ course.title }}</h1>
    <!-- Status -->
    <p class="galaxy-status overline mb-0">
      Status: <span class="font-weight-black">{{ course.status }}</span>
    </p>
    <!-- Visibility -->
    <p
      v-if="course.status === 'submitted'"
      class="galaxy-status overline mb-0 in-review"
    >
      awaiting review
    </p>
    <p v-else class="galaxy-status overline mb-0">
      Visibility:
      <span class="font-weight-black">{{ visibility }}</span>
    </p>
    <!-- Map Image -->
    <v-img
      v-if="course.image"
      class="galaxy-image mt-2"
      :src="course.image.url"
    ></v-img>
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
    visibility() {
      return this.course.public ? "Public" : "Private";
    },
  },
};
</script>

<style lang="scss" scoped>
#galaxy-info {
  width: 100%;
  // height: 400px;
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;
  color: var(--v-galaxyAccent-base);

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
    margin: 5px 0px 5px 0px;
    color: var(--v-galaxyAccent-base);
  }

  .galaxy-image {
    width: 100%;
  }

  .galaxy-description {
    margin-top: 10px;
    font-size: 0.8rem;
    color: var(--v-galaxyAccent-base);
  }
}

.galaxy-border {
  border: 1px solid var(--v-galaxyAccent-base);
}

.draft-border {
  border: 1px dashed var(--v-galaxyAccent-base);
}

.galaxy-status {
  font-size: 0.6rem !important;
  line-height: 1rem !important;
}

.in-review {
  color: var(--v-cohortAccent-base);
}
</style>
