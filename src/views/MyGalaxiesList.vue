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
    <MobileGalaxyListInfoPanel
      :selectedCourse="selectedCourse"
      @closeInfoPanel="closeInfoPanel"
      class="hidden-md-and-up"
    />
    <div class="flexContainer">
      <Galaxies
        v-if="validSlug && courses && courses.length > 0"
        ref="galaxyMap"
        :courses="courses"
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
      <div v-else-if="!courses || courses.length === 0" class="text-center">
        <p class="overline missionAccent--text">You aren't navigating any galaxies yet</p>
        <v-row class="text-center pt-12" align="center">
          <v-col cols="12" class="d-flex flex-column">
            <!-- Explore Public Galaxies -->
            <v-btn outlined color="baseAccent" @click="$router.push('/')" class="createButton">
              <v-icon left>
                {{ mdiRocketLaunch }}
              </v-icon>
              EXPLORE PUBLIC GALAXIES
            </v-btn>

            <!-- Create Galaxy -->
            <v-btn
              outlined
              color="galaxyAccent"
              @click="showDialog = true"
              class="createButton"
              :style="selectedCourseId ? 'opacity:0' : 'opacity:1'"
            >
              <v-icon left>
                {{ mdiPlus }}
              </v-icon>
              CREATE NEW GALAXY
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </div>

    <div v-if="courses && courses.length > 0" class="buttons">
      <!-- Create button - always show for authenticated users -->
      <v-row class="text-center" align="center">
        <v-col cols="12">
          <div class="divider"></div>
          <v-btn outlined color="baseAccent" @click="showDialog = true" class="createButton">
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
import MobileGalaxyListInfoPanel from "@/components/GalaxyList/MobileGalaxyListInfoPanel.vue";
import Galaxies from "@/components/GalaxyList/Galaxies.vue";
import useGalaxyListViewStore from "@/store/galaxyListView";
import useRootStore from "@/store/index";
import { mdiPlus, mdiRocketLaunch } from "@mdi/js";
import { mapActions, mapState } from "pinia";
import AICreateGalaxyDialogVue from "@/components/Dialogs/AICreateGalaxyDialog.vue";

export default {
  name: "MyGalaxiesList",
  props: ["slug"],
  components: {
    CreateEditDeleteGalaxyDialog,
    GalaxyListPanel,
    GalaxyListInfoPanel,
    MobileGalaxyListInfoPanel,
    Galaxies,
    AICreateGalaxyDialogVue,
  },
  watch: {
    async user(newUser) {
      if (newUser.loggedIn && newUser.data) {
        await Promise.all([this.loadMyCourses(), this.loadCoursesActivity(newUser.data.id)]);
      } else {
        this.resetCoursesActivity();
        this.courses = [];
      }
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
    // Only load courses if user is authenticated
    if (this.user.loggedIn && this.user.data) {
      this.loadMyCourses().then(() => {
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
      this.loadCoursesActivity(this.user.data.id);
    }
  },
  data() {
    return {
      mdiPlus,
      mdiRocketLaunch,
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
    async loadMyCourses() {
      // Use the store method to load my courses
      const store = useGalaxyListViewStore();
      await store.loadMyCourses(this.slug);
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
  height: 100vh;
  overflow: hidden;
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
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%, 0%);
  display: flex;
}

.createButton {
  transition: all 0.3s;
  margin-bottom: 20px;
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
