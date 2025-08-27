<template>
  <div class="fullHeight">
    <GalaxyListPanel
      ref="listPanel"
      @courseClicked="courseClicked($event)"
      @createGalaxy="showDialog = true"
      class="hidden-sm-and-down"
    />
    <!-- Desktop info panel -->
    <GalaxyListInfoPanel
      :selectedCourse="selectedCourse"
      @closeInfoPanel="closeInfoPanel"
      class="hidden-sm-and-down"
    />
    <!-- Mobile info panel -->
    <MobileGalaxyInfoPanel
      :selectedCourse="selectedCourse"
      @closeInfoPanel="closeInfoPanel"
      class="hidden-md-and-up"
    />
    <div class="flexContainer">
      <Galaxies
        v-if="validSlug"
        ref="galaxyMap"
        :courses="courses || []"
        :courseEdgesMap="courseEdgesMap"
        :courseNodesMap="courseNodesMap"
        :coursesActivity="coursesActivity"
        :highlightCourse="selectedCourseId"
        :isLoadingCourses="isLoadingCourses"
        @courseClicked="courseClicked($event)"
        @createGalaxy="showDialog = true"
      />
      <div v-if="!validSlug">
        <p class="overline missionAccent--text">Error. destination doesn't exist</p>
      </div>
    </div>

    <div class="buttons">
      <!-- Create button - only show if user is logged in -->
      <v-tooltip v-if="!user.loggedIn" top color="subBackground">
        <template v-slot:activator="{ on, attrs }">
          <v-row class="text-center" align="center" v-bind="attrs" v-on="on">
            <v-col cols="12">
              <v-btn
                outlined
                color="baseAccent"
                @click="showDialog = true"
                :disabled="!user.loggedIn"
                class="createButton"
                :style="selectedCourseId ? 'opacity:0' : 'opacity:1'"
              >
                <v-icon left>
                  {{ mdiPlus }}
                </v-icon>
                CREATE GALAXY
              </v-btn>
            </v-col>
          </v-row>
        </template>
        <div>
          <p class="overline galaxyAccent--text ma-0" style="font-size: 0.8rem">
            Sign in to Create a Galaxy
          </p>
        </div>
      </v-tooltip>
      <v-row v-else class="text-center" align="center">
        <v-col cols="12">
          <v-btn
            outlined
            color="baseAccent"
            @click="showDialog = true"
            :disabled="!user.loggedIn"
            class="createButton"
            :style="selectedCourseId ? 'opacity:0' : 'opacity:1'"
          >
            <v-icon left>
              {{ mdiPlus }}
            </v-icon>
            CREATE GALAXY
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- Create Galaxy DIALOG -->
    <CreateEditDeleteGalaxyDialog
      :showDialog="showDialog"
      @close="showDialog = false"
      @openAiDialog="showAiDialog = true"
    />
    <AICreateGalaxyDialog :showFirstDialog.sync="showAiDialog" @close="showAiDialog = false" />
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "@/components/Dialogs/CreateEditDeleteGalaxyDialog.vue";
import GalaxyListPanel from "@/components/GalaxyList/GalaxyListPanel.vue";
import GalaxyListInfoPanel from "@/components/GalaxyList/GalaxyListInfoPanel.vue";
import MobileGalaxyInfoPanel from "@/components/GalaxyList/MobileGalaxyInfoPanel.vue";
import Galaxies from "@/components/GalaxyList/Galaxies.vue";
import useGalaxyListViewStore from "@/store/galaxyListView";
import useRootStore from "@/store/index";
import { mdiPlus } from "@mdi/js";
import { mapActions, mapState } from "pinia";
import AICreateGalaxyDialogVue from "@/components/Dialogs/AICreateGalaxyDialog.vue";

export default {
  name: "AllPublicGalaxiesList",
  props: ["slug"],
  components: {
    CreateEditDeleteGalaxyDialog,
    GalaxyListPanel,
    GalaxyListInfoPanel,
    MobileGalaxyInfoPanel,
    Galaxies,
    AICreateGalaxyDialogVue,
  },
  watch: {
    async user(newUser) {
      await Promise.all([
        this.loadPublicCourses(),
        newUser.data != null
          ? this.loadCoursesActivity(newUser.data.id)
          : this.resetCoursesActivity(),
      ]);
    },
    "$route.query.map": {
      handler(courseId) {
        // If we already have courses and our desired course exists then select it
        if (
          courseId != null &&
          this.courses.length > 0 &&
          this.courses.find((x) => x.id === courseId)
        ) {
          this.setCurrentCourseId(courseId);
          this.setSelectedCourseId(courseId);
        } else {
          this.setCurrentCourseId(null);
          this.setSelectedCourseId(null);
        }
      },
      deep: true,
      immediate: true,
    },
  },
  created() {
    console.log("slug is:", this.slug);
    // Load public courses immediately
    this.loadPublicCourses().then(() => {
      // zoom to galaxy if that were user wants to land
      const courseId = this.$route.query.map;
      if (
        courseId != null &&
        this.courses.length > 0 &&
        this.courses.find((x) => x.id === courseId)
      ) {
        this.setCurrentCourseId(courseId);
        this.setSelectedCourseId(courseId);
      }
    });
    if (this.user.data != null) {
      this.loadCoursesActivity(this.user.data.id);
    }
  },

  data() {
    return {
      mdiPlus,
      showDialog: false,
      validSlug: true,
      showAiDialog: false,
    };
  },
  computed: {
    ...mapState(useRootStore, ["user", "person"]),
    ...mapState(useGalaxyListViewStore, [
      "courses",
      "courseEdgesMap",
      "courseNodesMap",
      "coursesActivity",
      "isLoadingCourses",
      "isLoadingActivity",
      "selectedCourseId",
    ]),
    selectedCourse() {
      return this.courses.find((course) => course.id === this.selectedCourseId);
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId"]),
    ...mapActions(useGalaxyListViewStore, [
      "loadCoursesActivity",
      "resetCoursesActivity",
      "setSelectedCourseId",
    ]),
    async loadPublicCourses() {
      // Use the store method to load public courses
      const store = useGalaxyListViewStore();
      await store.loadPublicCourses(this.slug);
    },

    courseClicked(emittedPayload) {
      this.$router.replace({
        query: {
          map: emittedPayload.courseId,
        },
      });
    },
    closeInfoPanel() {
      this.$router.replace({
        query: {
          map: undefined,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.fullHeight {
  height: 100vh; /* Fallback */
  height: calc(var(--vh, 1vh) * 100);
  overflow: hidden;
  width: 100%;
}

.flexContainer {
  height: 100%;
  width: 100%;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
}

.buttons {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%, 0%);
  display: flex;
  z-index: 300;

  // Mobile-specific bottom positioning
  @media (max-width: 959px) {
    bottom: 10vh;
  }

  .createButton {
    transition: all 0.3s;
  }
}

.button-row {
  position: relative;
  top: 80px;
  z-index: 1;
}

.focused {
  background-color: var(--v-missionAccent-darken4);
}

.galaxy-btn {
  background-color: var(--v-background-base);
}
</style>
