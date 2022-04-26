<template>
  <!-- Left panel -->
  <div class="galaxyLeftPanel" :style="galaxySelected ? 'left:0px' : ''">
    <!-- Panel Title Tab -->
    <div class="blackBar">
      <div class="d-flex justify-center align-center">
        <div class="panelTab overline">
          <p v-if="!galaxySelected" style="color: var(--v-galaxyAccent-base)">
            LIST OF GALAXIES
          </p>
          <p v-else style="color: var(--v-missionAccent-base)">
            GALAXY IN VIEW
          </p>
        </div>
      </div>
    </div>

    <!-- 1) List of Galaxies -->
    <SideListOfGalaxies
      ref="list"
      :show="!galaxySelected"
      @courseClicked="courseClicked($event)"
    />

    <!-- 2) Teacher: Galaxy info,Edit,assigned (if mappedby -> route to gview) || Student: Galaxy info,Enrol (if notEnrolled) || Student: Galaxy info,Progress (if Enrolled)  -->
    <SideOverviewOfGalaxy
      :show="galaxySelected"
      :course="getCourseById(courseId)"
      :galaxyListInfoPanel="true"
      @closeInfoPanel="closeInfoPanel"
    />
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import SideListOfGalaxies from "@/components/SideListOfGalaxies.vue";
import SideOverviewOfGalaxy from "@/components/SideOverviewOfGalaxy.vue";

export default {
  name: "GalaxyLeftPanel",
  props: ["selectedCourseId"],
  components: {
    SideListOfGalaxies,
    SideOverviewOfGalaxy,
  },
  data() {
    return {
      galaxySelected: false,
      courseId: null,
    };
  },
  watch: {
    selectedCourseId(newCourseId) {
      if (newCourseId) {
        this.courseClicked({ courseId: newCourseId });
      }
    },
  },
  async mounted() {
    //bind cohorts to get learning maps
    this.$store.dispatch("getCohortsByPersonId", this.person);
  },
  computed: {
    ...mapState(["person", "courses", "cohorts"]),
    ...mapGetters(["getCourseById"]),
  },
  methods: {
    ...mapActions(["getPersonById"]),
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    courseClicked(emittedPayload) {
      this.galaxySelected = true;
      this.courseId = emittedPayload.courseId;
      this.$emit("courseClicked", {
        courseId: emittedPayload.courseId,
        type: emittedPayload.type,
      });
    },
    closeInfoPanel() {
      this.galaxySelected = false;
      this.courseId = null;
      this.$refs.list.allInactive();
      console.log("closing info panel");
      this.$emit("closeInfoPanel");
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxyLeftPanel {
  background: var(--v-background-darken1);
  width: 200px;
  height: 600px;
  position: fixed;
  // bottom: 0px;
  top: calc(50% - 300px);
  left: -200px;
  transition: all 0.3s ease-out;
  z-index: 200;

  .blackBar {
    position: absolute;
    height: 100%;
    top: 0px;
    right: -30px;
    width: 30px;
    background: var(--v-background-darken1);
    // padding: 10px;
    clip-path: polygon(0 0, 100% 0, 100% 95%, 0 100%);
    text-align: right;
    display: flex;
    justify-content: flex-end;
    // border: 1px yellow solid;

    .panelTab {
      width: 100%;
      writing-mode: vertical-rl;
    }
  }

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

.galaxyLeftPanel:hover {
  left: 0px;
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
  background: var(--v-galaxyAccent-base);
}
/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-galaxyAccent-base);
}
</style>
