<template>
  <!-- Right panel -->
  <div
    class="galaxyRightPanel"
    :style="
      show
        ? 'right: 0px; transition-delay: 0.3s'
        : 'right: -230px; transition-delay: 0.3s'
    "
  >
    <!-- Panel Title Tab -->
    <!-- <div class="blackBar">
      <div class="d-flex justify-center align-center">
        <div class="panelTab overline">
          <p v-if="!selectedGalaxy" style="color: var(--v-galaxyAccent-base)">
            LIST OF GALAXIES
          </p>
          <p v-else style="color: var(--v-missionAccent-base)">
            GALAXY IN VIEW
          </p>
        </div>
      </div>
    </div> -->

    <!-- List of galaxies -->
    <SideListOfSystems
      :show="true"
      :topics="topics"
      @courseClicked="courseClicked($event)"
    />
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import GalaxyListPanelCard from "@/components/GalaxyListPanelCard.vue";
import SideListOfSystems from "@/components/SideListOfSystems.vue";

export default {
  name: "GalaxyRightPanel",
  props: ["selectedCourseId", "show"],
  components: {
    GalaxyListPanelCard,
    SideListOfSystems,
  },
  data() {
    return {};
  },
  async mounted() {},
  watch: {
    async selectedCourseId(newCourseId) {
      //bind topics each time a map is selected
      if (newCourseId) {
        console.log("course id is", newCourseId);
        await this.$store.dispatch("bindCourseTopics", newCourseId);
      }
    },
  },
  computed: {
    ...mapState(["topics"]),
  },
  methods: {
    closeInfoPanel() {
      this.selectedGalaxy = false;
      this.courseId = null;
      this.$refs.list.allInactive();
      console.log("closing info panel");
      this.$emit("closeInfoPanel");
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxyRightPanel {
  background: var(--v-background-darken1);
  width: 230px;
  height: 600px;
  position: fixed;
  // bottom: 0px;
  top: calc(50% - 300px);
  // right: -230px;
  transition: all 0.3s ease-out;
  z-index: 200;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 95%);

  // .blackBar {
  //   position: absolute;
  //   height: 100%;
  //   top: 0px;
  //   left: -30px;
  //   width: 30px;
  //   background: var(--v-background-darken1);
  //   // padding: 10px;
  //   clip-path: polygon(0 0, 100% 0, 100% 95%, 0 100%);
  //   text-align: right;
  //   display: flex;
  //   justify-content: flex-end;
  //   // border: 1px yellow solid;

  //   .panelTab {
  //     width: 100%;
  //     writing-mode: vertical-rl;
  //   }
  // }

  // .galaxyOverviewPanel {
  //   position: absolute;
  //   height: 99%;
  //   width: 99.5%;
  //   overflow-y: scroll;
  //   overflow-x: hidden;
  //   transition: all 0.3s ease-out;
  //   border: 1px solid var(--v-missionAccent-base);
  //   margin: 20px 0px 30px 0px;
  // }
}

.galaxyRightPanel:hover {
  right: 0px;
}

.galaxyListPanel:hover {
  right: 0px;
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
  background: var(--v-galaxyAccent-base);
}
/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-galaxyAccent-base);
}
</style>
