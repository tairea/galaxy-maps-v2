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
        <p v-if="topic" class="topicListPanelLabel overline mx-4">SYSTEM</p>
           <p class="systemListTopic-text">
                {{ topic.label }}
              </p>
        <p class="topicListPanelLabel overline mx-4">MISSIONS</p>
          <div
            class="systemListCard"
            v-for="(task, index) in tasks"
            :key="task.id"
          >
              <div class="d-flex ml-2">
                <div class="systemListCard-number">{{index+1}}</div>

              <p class="systemListCard-text">
                {{ task.title }}
              </p>
              </div>
              <p class="systemListCard-text text-uppercase" :class="getStatusColour(task.taskStatus)">
                {{ task.taskStatus }}
              </p>
            
          </div>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import GalaxyListPanelCard from "@/components/GalaxyListPanelCard.vue";

export default {
  name: "SideListOfSystemsTasks",
  components: {
    GalaxyListPanelCard,
  },
  props: ["topic", "tasks", "show"],
  data() {
    return {};
  },
  async mounted() {
    console.log("topic in side:", this.topic);
  },
  computed: {},
  methods: {
    panelTransitioned() {
      console.log("list panel transitioned");
      // this.galaxyOverview = true;
    },
    getStatusColour(status) {
      if (status == "completed") {
        return "baseColour";
      } else if (status == "inreview") {
        return "cohortColour";
      } else {
        return "missionColour";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.topicListPanel {
  // background: var(--v-background-darken1);
  width: 370px;
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

      .topicListPanelContent,
      .systemListCard {
        color: var(--v-missionAccent-base);
        position: relative;
        font-size: 0.6rem;
        letter-spacing: 1px;
      }

      .systemListCard {
        position: relative;
        border: 1px solid var(--v-missionAccent-base);
        margin: 5px 10px;
        height: 50px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .systemListCard-number {
          border: 1px solid var(--v-missionAccent-base);
          width: 20px;
          height: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .systemListCard-text {
          position: relative;
          height: 100%;
          display: flex;
          justify-content: left;
          align-items: center;
          // border: 1px solid yellow;
          margin: 0px 10px;
        }
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

.baseColour {
  color: var(--v-baseAccent-base) !important;
}
.cohortColour {
  color: var(--v-cohortAccent-base) !important;
}
.missionColour {
  color: var(--v-missionAccent-base) !important;
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
