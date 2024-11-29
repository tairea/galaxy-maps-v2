<template>
  <div class="fullHeight">
    <div class="flexContainer">
      <div class="databasePanel">
        <div class="flexRow">
          <p class="overline baseAccent--text pl-3 mb-2">Galaxy Database</p>
          <div class="toggle-buttons mb-2">
            <div class="toggle-button" :class="{ active: showAll }" @click="toggleView('all')">
              <p class="button-text ma-0">Show All</p>
            </div>
            <div
              class="toggle-button"
              :class="{ active: sortByCaptain }"
              @click="toggleView('captain')"
            >
              <p class="button-text ma-0">Sort by Captain</p>
            </div>
          </div>
        </div>

        <div class="innerPanels" v-if="sortByCaptain">
          <!-- panel one - teachers -->
          <div>
            <div class="firstPanel">
              <TeacherListPanelCard
                v-for="teacher in getTeachers"
                :key="teacher.teacherId"
                :teacher="teacher"
                :active="selectedTeacherId === teacher.teacherId"
                @teacherSelected="handleTeacherSelect"
              />
            </div>
            <p
              class="overline baseAccent--text text-right pr-5"
              style="text-transform: uppercase; font-size: 9px !important"
            >
              {{ getTeachers.length }} Captains
            </p>
          </div>

          <!-- panel two - courses -->
          <div class="secondPanel">
            <GalaxyListPanelCard
              v-for="course in selectedTeacherCourses"
              :key="course.id"
              :course="course"
              :active="selectedCourseId === course.id"
              @click.native="courseClicked({ courseId: course.id })"
            />
            <div
              v-if="selectedTeacherId === null"
              class="d-flex justify-center align-center"
              style="height: 100%"
            >
              <p class="overline baseAccent--text text-center">No captain selected</p>
            </div>
          </div>

          <div class="thirdPanel" v-if="selectedCourseId">
            <GalaxyInfo
              ref="galaxyInfo"
              :course="selectedCourse"
              :height="100"
              :descriptionOverflow="true"
            />
          </div>

          <!-- panel three - galaxy map -->
          <div class="fourthPanel">
            <GalaxyMap v-if="selectedCourse" :course="selectedCourse" :contained="true" />
            <div v-else class="d-flex justify-center align-center" style="height: 100%">
              <p class="overline galaxyAccent--text text-center">No map selected</p>
            </div>
            <!-- Updated button positioning -->
            <div class="galaxy-button-container" v-if="selectedCourse">
              <div class="galaxy-button" @click="goToGalaxyView">
                <p class="overline ma-0">Go to Galaxy</p>
              </div>
            </div>
          </div>
        </div>

        <div class="showAllPanels" v-if="showAll">
          <div class="galaxyMapContainer" v-for="course in limitedCourses" :key="course.id"></div>
        </div>
      </div>
    </div>

    <div class="buttons">
      <CreateGalaxyButton />
      <!-- Discover button -->
      <!-- <DiscoverGalaxyButton :hide="selectedCourseId"/> -->
    </div>
  </div>
</template>

<script>
import CreateGalaxyButton from "@/components/GalaxyList/CreateGalaxyButton.vue";
import DiscoverGalaxyButton from "@/components/Dialogs/DiscoverGalaxyButton.vue";
import Galaxies from "@/components/GalaxyList/Galaxies.vue";
import useGalaxyListViewStore from "@/store/galaxyListView";
import useRootStore from "@/store/index";
import { mdiPlus } from "@mdi/js";
import { mapActions, mapState } from "pinia";
import TeacherListPanelCard from "@/components/GalaxyList/TeacherListPanelCard.vue";
import GalaxyListPanelCard from "@/components/GalaxyList/GalaxyListPanel/GalaxyListPanelCard.vue";
import GalaxyView from "@/views/GalaxyView.vue";
import GalaxyInfo from "@/components/GalaxyView/GalaxyInfo.vue";
import GalaxyMap from "@/components/GalaxyView/GalaxyMap.vue";

export default {
  name: "GalaxyMapsHome",
  props: ["slug"],
  components: {
    CreateGalaxyButton,
    DiscoverGalaxyButton,
    Galaxies,
    TeacherListPanelCard,
    GalaxyListPanelCard,
    GalaxyView,
    GalaxyInfo,
    GalaxyMap,
  },
  data() {
    return {
      mdiPlus,

      validSlug: true,
      selectedTeacherId: null,
      showAll: true,
      sortByCaptain: false,
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

    // Group courses by teacher personId
    getCoursesMappedByTeachers() {
      const coursesByTeachers = this.courses.reduce((acc, course) => {
        const teacherId = course.mappedBy.personId;
        const teacherName = course.mappedBy.name;

        if (!acc[teacherId]) {
          acc[teacherId] = {
            teacherId,
            teacherName,
            courses: [],
            totalTopics: 0,
          };
        }

        acc[teacherId].courses.push(course);
        acc[teacherId].totalTopics += course.topicTotal || 0;
        return acc;
      }, {});

      return Object.values(coursesByTeachers).sort((a, b) => b.totalTopics - a.totalTopics);
    },

    // Add a getter for easier access in template
    getTeachers() {
      return this.getCoursesMappedByTeachers;
    },

    selectedTeacherCourses() {
      if (!this.selectedTeacherId) return [];
      const teacher = this.getTeachers.find((t) => t.teacherId === this.selectedTeacherId);
      return teacher ? teacher.courses : [];
    },

    limitedCourses() {
      return this.courses.slice(0, 6); // Only return first 6 courses
    },
  },
  watch: {
    async user(newUser) {
      await Promise.all([
        this.loadCourses(this.slug),
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
    this.loadCourses(this.slug);
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
    if (this.user.data != null) {
      this.loadCoursesActivity(this.user.data.id);
    }
    console.log("courses", this.courses);
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId"]),
    ...mapActions(useGalaxyListViewStore, [
      "loadCourses",
      "loadCoursesActivity",
      "resetCoursesActivity",
      "setSelectedCourseId",
    ]),
    goToGalaxyView() {
      if (this.selectedCourse) {
        this.$router.push({
          name: "GalaxyView",
          params: {
            courseId: this.selectedCourse.id,
          },
        });
      }
    },
    courseClicked(emittedPayload) {
      this.$router.replace({
        query: {
          map: emittedPayload.courseId,
        },
      });
      this.setSelectedCourseId(emittedPayload.courseId);
      this.setCurrentCourseId(emittedPayload.courseId);
      this.expandDescription();
    },
    closeInfoPanel() {
      this.$router.replace({
        query: {
          map: undefined,
        },
      });
    },
    handleTeacherSelect(teacher) {
      if (this.selectedTeacherId !== teacher.teacherId) {
        this.setSelectedCourseId(null);
        this.setCurrentCourseId(null);
        this.$router.replace({
          query: {
            map: undefined,
          },
        });
      }
      this.selectedTeacherId = teacher.teacherId;
    },
    expandDescription() {
      this.$refs.galaxyInfo.showFullDescription();
    },
    toggleView(view) {
      if (view === "all") {
        this.showAll = true;
        this.sortByCaptain = false;
      } else if (view === "captain") {
        this.showAll = false;
        this.sortByCaptain = true;
      }

      // Reset selections when switching views
      this.selectedTeacherId = null;
      this.setSelectedCourseId(null);
      this.setCurrentCourseId(null);
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
  // border: solid blue 2px;

  .databasePanel {
    // margin-top: -5%;
    width: 70%;
    height: 50%;
    border: solid var(--v-baseAccent-base) 1px;

    .innerPanels {
      display: flex;
      height: 85%;
      padding: 0 20px;

      .firstPanel,
      .secondPanel {
        width: 200px;
        height: 100%;
        border: solid var(--v-baseAccent-base) 1px;
        margin-right: 20px;
        overflow-y: auto;

        // Add custom scrollbar styles
        &::-webkit-scrollbar {
          width: 8px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background-color: var(--v-baseAccent-base);
          // border-radius: 4px;
        }
      }

      .secondPanel {
        &::-webkit-scrollbar-thumb {
          background-color: var(--v-galaxyAccent-base);
          // border-radius: 4px;
        }
      }

      .thirdPanel {
        width: 200px;
        height: 100%;
        margin-top: -30px;
      }

      .fourthPanel {
        flex: 1;
        min-width: 300px;
        height: 100%;
        margin-left: 20px;
        border: solid var(--v-galaxyAccent-base) 1px;
        position: relative;
      }
    }

    .showAllPanels {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      padding: 10px;

      // frame for each galaxy map (in Show All view)
      .galaxyMapContainer {
        width: 150px;
        height: 150px;
        border: solid var(--v-galaxyAccent-base) 1px;
      }
    }
  }

  .flexRow {
    display: flex;
    // height: 50%;
    flex-wrap: wrap;
    // justify-content: center;
    width: 100%;
    // border: solid pink 2px;

    .box {
      // width: 25%;
      max-width: 25%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      // margin: 10px;
      padding: 2%;
      box-sizing: border-box;
      // border: 1px solid yellow;
    }
  }
}

.buttons {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%, 0%);
  display: flex;

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

.galaxy-button-container {
  position: absolute;
  bottom: 16px;
  right: 16px;

  .galaxy-button {
    background-color: var(--v-galaxyAccent-base);
    color: var(--v-background-base);
    padding: 5px 15px;
    // border-radius: 5px;
    cursor: pointer;
  }
}

.toggle-buttons {
  display: flex;
  justify-content: center;
  // gap: 10px;
  // padding: 0 20px;
  margin-left: 20px;
  margin-top: 5px;
}

.toggle-button {
  // padding: 5px 15px;
  cursor: pointer;
  border: 1px solid var(--v-baseAccent-base);
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px 10px;

  .button-text {
    font-size: 10px;
    text-transform: uppercase;
    // color: var(--v-baseAccent-base);
  }

  &.active {
    background-color: var(--v-baseAccent-base);
    color: var(--v-background-base) !important;
  }

  &:hover {
    opacity: 0.8;
  }
}
</style>
