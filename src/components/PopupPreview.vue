<template>
  <!-- POPUP -->
  <!-- follow drag -> :style="{ top: getCoords.y - 100 + 'px', left: getCoords.x + 30 + 'px' }" -->
  <div ref="popup" class="ss-info-panel">
    <div class="ss-details">
      <div>
        <p class="info-panel-label mb-2">
          <span class="galaxyColour">Galaxy:</span>
          <br />
          <span style="color: white">{{ course.title }}</span>
        </p>
        <v-img v-if="course.image.url" class="galaxy-image" :src="course.image.url"></v-img>
        <!-- <p class="info-panel-label">
          X: <span style="color: white">{{ currentNode.x }}</span>
        </p>
        <p class="info-panel-label">
          Y: <span style="color: white">{{ currentNode.y }}</span>
        </p> -->
      </div>

      <!-- <v-btn
        class="map-button"
        fab
        dark
        small
        color="baseAccent"
        outlined
        tile
        title="Edit"
        @click="routeToGalaxyEdit"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn> -->

      <v-btn
        text
        x-small
        color="missionAccent"
        class="close-button"
        @click="close"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <div class="ss-makers">
      <div class="left">
        <div v-if="course.contentBy.image">
          <v-img
            class="contentBy-image mb-2"
            :src="course.contentBy.image.url"
          ></v-img>
        </div>
        <p class="ma-0">
          Content By:
        </p>
        <a :href="course.contentBy.source"
          ><span style="color: white">{{ course.contentBy.name }}</span></a
        >
      </div>
      <div class="right">
        <div v-if="course.mappedBy.image">
          <v-img
           
            class="mappedBy-image"
            :src="course.mappedBy.image.url"
          ></v-img>
        </div>
        <p class="ma-0">Mapped By:</p>
        <span style="color: white">{{ course.mappedBy.name }}</span>
      </div>
    </div>

    <div class="ss-preview">
      <v-btn
        class="view-ss-button pa-5"
        dark
        small
        color="galaxyAccent"
        outlined
        tile
        title="View Galaxy"
        @click="routeToGalaxyEdit"
      >
        View Galaxy
      </v-btn>

      <v-btn
        class="view-ss-button pa-5"
        dark
        small
        color="missionAccent"
        outlined
        tile
        title="View Analytics"
        @click="routeToGalaxyAnalytics"
      >
        View Analytics
      </v-btn>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "PopupPreview",
  components: {},
  props: ["course"],
  async mounted() {},
  computed: {
    // ...mapState(["currentCourseId"]),
  },
  data() {
    return {};
  },
  methods: {
    close() {
      this.$emit("togglePopup", false);
    },
    routeToGalaxyEdit() {
      console.log("route to galaxy", this.course.id);
      // save current topic to store
      // this.$store.commit("setCurrentCourseId", this.currentCourseId);
      // route to topic/solar system
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.course.id,
        },
      });
    },
    routeToGalaxyAnalytics() {
      console.log("route to galaxy analytics", this.currentCourseId);

      // this.$router.push({
      //   name: "GalaxyView",
      //   params: {
      //     topicId: this.currentCourseId,
      //   },
      // });
    },
  },
};
</script>

<style lang="scss" scoped>
// POPUP
.ss-info-panel {
  // background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  position: absolute;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  z-index: 3;
  width: 300px;

  .info-panel-label {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 1.1rem;
  }

  .galaxy-image {
    width: 100%;
  }

  .contentBy-image {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 0px;
    padding: 0px !important;
  }

  .ss-makers {
    font-size: 0.8rem;
    color: var(--v-missionAccent-base);
    text-transform: uppercase;

    min-height: 10vh;
    border-top: 1px solid var(--v-missionAccent-base);
    display: flex;

    .left,
    .right {
      width: 100%;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .right {
      border-left: 1px solid var(--v-missionAccent-base);
    }
  }

  .ss-preview {
    border-top: 1px solid var(--v-missionAccent-base);
    // min-width: 20vw;
    min-height: 20vh;
    // position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: hidden;

    .view-ss-button {
      width: 80%;
      margin: 5px;
      // position: absolute;
      // bottom: 20px; // matches 20px padding of ss-details
      background-color: var(--v-background-base);
    }
  }
  .ss-details {
    padding: 20px;
  }
}

.centeredFocus {
  margin-top: -100px;
  margin-left: 50px;
}

.galaxyColour {
  color: var(--v-galaxyAccent-base);
  font-weight: 800;
}
</style>
