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
    </div>
  </div>
</template>

<script>
import PopupGalaxyPreview from "@/components/GalaxyList/GalaxyListInfoPanel/PopupGalaxyPreview.vue";

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
    closeInfoPanel() {
      this.$emit("closeInfoPanel");
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
      height: 99%;
      width: 99.5%;
      overflow-y: auto;
      overflow-x: hidden;
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
