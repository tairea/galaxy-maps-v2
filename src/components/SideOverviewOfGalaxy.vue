<template>
  <div
    class="galaxyInfoPanel"
    :style="
      show
        ? 'left: 0px; transition-delay: 0.3s;'
        : 'left:-200px; transition-delay: 0s;'
    "
  >
    <div class="panelContent">
      <div class="panelContentInner">
        <PopupGalaxyPreview
          v-if="course"
          :course="course"
          class="popupPanel"
          :galaxyListInfoPanel="true"
          @closeInfoPanel="closeInfoPanel"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import GalaxyListPanelCard from "@/components/GalaxyListPanelCard.vue";
import PopupGalaxyPreview from "@/components/PopupGalaxyPreview.vue";

export default {
  name: "SideOverviewOfGalaxy",
  props: ["course", "show"],
  components: {
    GalaxyListPanelCard,
    PopupGalaxyPreview,
  },
  data() {
    return {
      allCourses: [],
      selectedGalaxy: false,
      activeLearning: null,
      activeTeaching: null,
      activePublic: null,
    };
  },
  async mounted() {},
  computed: {
    ...mapState(["person", "courses", "cohorts"]),
    ...mapGetters(["getCourseById"]),
  },
  methods: {
    closeInfoPanel() {
      console.log("closing info panel");
      this.$emit("closeInfoPanel");
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxyInfoPanel {
  // background: var(--v-background-darken1);
  width: 200px;
  height: 600px;
  position: absolute;
  // bottom: 0px;
  top: calc(50% - 300px);
  // left: -200px;
  transition: all 0.3s ease-out;
  z-index: 200;

  .panelContent {
    height: calc(100% - 40px);
    width: auto;
    margin: 20px 0px 30px 0px;
    background: var(--v-missionAccent-base);
    margin-left: -2px;
    // margin-left: 10px;
    position: relative;

    .panelContentInner {
      position: relative;
      height: 99%;
      width: 99.5%;
      overflow-y: scroll;
      overflow-x: hidden;
    }
  }

  .panelContent:before {
    content: "";
    width: 99%;
    height: calc(100% - 2px);
    // height: 100%;
    background: var(--v-background-darken1);
    // background: var(--v-background-base);
    display: block;
    position: absolute;
    top: 1px;
    left: 1px;
  }
  .panelContent,
  .panelContent:before {
    clip-path: polygon(0 0, 100% 0, 100% 95%, 85% 100%, 0% 100%);
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
