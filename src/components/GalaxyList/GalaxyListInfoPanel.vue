<template>
  <div class="galaxyInfoPanel" :style="selectedCourse ? 'right: 0px' : ''">
    <div class="panelContent">
      <div class="panelContentInner">
        <PopupGalaxyPreview
          v-if="selectedCourse"
          :course="selectedCourse"
          class="popupPanel"
          :galaxyListInfoPanel="true"
          @closeInfoPanel="closeInfoPanel"
        />
      </div>
      <div class="ss-actions-container">
        <div class="ss-actions py-4">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PopupGalaxyPreview from "@/components/GalaxyList/GalaxyListInfoPanel/PopupGalaxyPreview.vue";
import useRootStore from "@/store/index";
import { mapActions } from "pinia";

export default {
  name: "GalaxyListInfoPanel",
  props: ["selectedCourse"],
  components: {
    PopupGalaxyPreview,
  },
  data() {
    return {};
  },
  computed: {},
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId"]),
    closeInfoPanel() {
      this.$emit("closeInfoPanel");
    },
    routeToGalaxyEdit() {
      console.log("route to galaxy", this.selectedCourse.id);
      // save current course to store
      this.setCurrentCourseId(this.selectedCourse.id);
      // route to topic/solar system
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.selectedCourse.id,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxyInfoPanel {
  background: var(--v-background-darken1);
  width: 250px;
  height: 600px;
  position: fixed;
  top: calc(50% - 300px);
  right: -250px;
  transition: all 0.3s ease-out;
  z-index: 200;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 95%);

  .panelContent {
    height: calc(100% - 40px);
    width: auto;
    margin: 20px 0px 30px 20px;
    background: var(--v-missionAccent-base);
    margin-right: -2px;
    position: relative;

    .panelContentInner {
      position: relative;
      height: 85%;
      width: 99.5%;
      overflow-y: auto;
      overflow-x: hidden;

      mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
      -webkit-mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        black 5%,
        black 95%,
        transparent 100%
      );
    }

    .ss-actions-container {
      position: absolute;
      bottom: 0;
      width: 100%;

      .ss-actions {
        border-top: 1px solid var(--v-missionAccent-base);
        // min-width: 20vw;
        // min-height: 10vh;
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
          z-index: 3;
        }
      }
    }

    .galaxyListPanelLabel {
      color: var(--v-galaxyAccent-base);
      position: relative;
      border-bottom: 1px solid var(--v-galaxyAccent-base);
    }

    .galaxyListPanelContent {
      color: var(--v-galaxyAccent-base);
      position: relative;
      font-size: 0.6rem;
      letter-spacing: 1px;
    }
  }

  .panelContent:before {
    content: "";
    width: 99%;
    height: calc(100% - 2px);
    background: var(--v-background-darken1);
    display: block;
    position: absolute;
    top: 1px;
    left: 1px;
  }
  .panelContent,
  .panelContent:before {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0% 95%);
  }
}

.galaxyListPanel:hover {
  left: 0px;
}

*::-webkit-scrollbar {
  width: 5px;
}
/* Track */
*::-webkit-scrollbar-track {
  background: var(--v-background-base);
  margin-top: 1px;
  margin-bottom: 25px;
}
/* Handle */
*::-webkit-scrollbar-thumb {
  background: var(--v-missionAccent-base);
}
/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}
</style>
