<template>
  <div
    class="topicListPanel"
    :style="
      show
        ? 'right: 0px; transition-delay: 0.3s'
        : 'right: -200px; transition-delay: 0.3s'
    "
  >
    <div class="panelContent">
      <div class="panelContentInner">
        <p class="topicListPanelLabel overline mx-4">SYSTEMS</p>
        <p class="galaxyListPanelLabel overline mx-4">In this GALAXY</p>
        <ul>
          <li
            class="text-caption missionAccent--text"
            v-for="topic in topics"
            :key="topic.id"
          >
            {{ topic.label }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import GalaxyListPanelCard from "@/components/GalaxyListPanelCard.vue";

export default {
  name: "SideListOfGalaxies",
  components: {
    GalaxyListPanelCard,
  },
  props: ["topics", "show"],
  data() {
    return {};
  },
  async mounted() {},
  computed: {},
  methods: {
    panelTransitioned() {
      console.log("list panel transitioned");
      // this.galaxyOverview = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.topicListPanel {
  // background: var(--v-background-darken1);
  width: 200px;
  height: 600px;
  position: absolute;
  // bottom: 0px;
  top: calc(50% - 300px);
  // right: -200px;
  transition: all 0.3s ease-out;
  z-index: 200;

  .panelContent {
    height: calc(100% - 40px);
    width: auto;
    margin: 20px 0px 30px 0px;
    background: var(--v-missionAccent-base);
    // border: 1px solid var(--v-galaxyAccent-base);

    margin-right: -2px;
    // margin-left: 10px;
    position: relative;

    .panelContentInner {
      position: relative;
      height: 99%;
      width: 99.5%;
      overflow-y: scroll;
      overflow-x: hidden;

      .topicListPanelLabel {
        color: var(--v-missionAccent-base);
        position: relative;
        border-bottom: 1px solid var(--v-missionAccent-base);
      }

      .topicListPanelContent {
        color: var(--v-missionAccent-base);
        position: relative;
        font-size: 0.6rem;
        letter-spacing: 1px;
      }
    }
  }

  .panelContent:before {
    content: "";
    width: 99%;
    height: calc(100% - 2px);
    // height: 100%;
    background: var(--v-background-darken1);
    display: block;
    position: absolute;
    top: 1px;
    left: 1px;
  }
  .panelContent,
  .panelContent:before {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 95%);
  }
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
