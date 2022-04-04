<template>
  <div class="galaxyListPanel">
    <!-- USER MENU TOPBAR -->

    <!-- USER MENU HIDDEN-->

    <div class="panelContent">
      <div class="panelContentInner">
        <!-- LEARNING -->
        <div>
          <p class="galaxyListPanelLabel overline mx-4">LEARNING</p>
          <div v-if="getLearningCourses.length">
            <!-- COURSE CARD -->
            <GalaxyListPanelCard
              v-for="(course, index) in getLearningCourses"
              :key="course.id"
              :course="course"
              :active="index === activeLearning"
              @click.native="courseClicked(course.id, index, 'learning')"
            />
          </div>
          <p v-else class="galaxyListPanelContent text-center">
            NO ENROLLED MAPS
          </p>
        </div>
        <!-- TEACHING -->
        <div>
          <p class="galaxyListPanelLabel overline mx-4">TEACHING</p>
          <div v-if="getTeachingCourses.length">
            <!-- COURSE CARD -->
            <GalaxyListPanelCard
              v-for="(course, index) in getTeachingCourses"
              :key="course.id"
              :course="course"
              :active="index === activeTeaching"
              @click.native="courseClicked(course.id, index, 'teaching')"
            />
          </div>
          <p v-else class="galaxyListPanelContent text-center">
            NO CREATED MAPS
          </p>
        </div>
        <!-- ALL -->
        <div>
          <p class="galaxyListPanelLabel overline mx-4">ALL GALAXIES</p>
          <div v-if="getPublicCourses.length">
            <!-- COURSE CARD -->
            <GalaxyListPanelCard
              v-for="(course, index) in getPublicCourses"
              :key="course.id"
              :course="course"
              :active="index === activePublic"
              @click.native="courseClicked(course.id, index, 'public')"
            />
          </div>
          <p v-else class="galaxyListPanelContent text-center">
            NO PUBLIC MAPS
          </p>
        </div>
      </div>
    </div>
    <div class="blackBar">
      <div class="d-flex justify-center align-center">
        <div
          class="panelTab overline"
          style="color: var(--v-galaxyAccent-base)"
        >
          <!-- <v-icon color="galaxyAccent"
            >mdi-chart-timeline-variant-shimmer</v-icon
          > -->
          LIST OF GALAXIES
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import GalaxyListPanelCard from "@/components/GalaxyListPanelCard.vue";

export default {
  name: "GalaxyListPanel",
  components: {
    GalaxyListPanelCard,
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
  async mounted() {
    //bind cohorts to get learning maps
    this.$store.dispatch("getCohortsByPersonId", this.person);
  },
  computed: {
    ...mapState(["person", "courses", "cohorts"]),

    // LEARNING GALAXIES
    getLearningCourses() {
      let learningCourses = [];

      const filteredCohorts = this.cohorts.filter(
        (cohort) => cohort.student == true
      );

      for (const cohort of filteredCohorts) {
        for (const course of cohort.courses) {
          learningCourses.push(course);
        }
      }

      // remove course duplicates
      learningCourses = learningCourses.filter(function (
        item,
        index,
        inputArray
      ) {
        return inputArray.indexOf(item) == index;
      });

      // filter courses
      return this.courses.filter((course) => {
        for (let x = 0; x < learningCourses.length; x++) {
          if (course.id == learningCourses[x] && course.status == "published") {
            return course;
          }
        }
      });
    },
    // TEACHERING GALAXIES
    getTeachingCourses() {
      return this.courses.filter(
        (course) => course.mappedBy.personId == this.person.id
      );
    },
    // ALL GALAXIES
    getPublicCourses() {
      return this.courses.filter(
        (course) => course.public == true && course.status == "published"
      );
    },
  },
  methods: {
    ...mapActions(["getPersonById"]),
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    courseClicked(courseId, index, type) {
      this.selectedGalaxy = !this.selectedGalaxy;
      if (this.selectedGalaxy) {
        if (type === "learning") {
          this.activeLearning = index;
        } else if (type === "teaching") {
          this.activeTeaching = index;
        } else if (type === "public") {
          this.activePublic = index;
        }
      } else {
        this.allInactive();
        // TODO: zoom out
      }

      this.$emit("courseClicked", {
        courseId,
        type,
      });
    },
    allInactive() {
      this.activeLearning = null;
      this.activeTeaching = null;
      this.activePublic = null;
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxyListPanel {
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

  .panelContent {
    height: calc(100% - 40px);
    width: auto;
    margin: 20px 0px 30px 0px;
    background: var(--v-galaxyAccent-base);
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

    .galaxyCard {
      position: relative;
      margin: 10px;
      border: 1px solid var(--v-galaxyAccent-base);
      display: flex;
      cursor: pointer;

      .galaxyCardImage {
        width: 30px;
        height: 30px;
      }

      .imagePlaceholder {
        width: 30px;
        height: 30px;
        background-color: rgba(200, 200, 200, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 0.6rem;
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
    clip-path: polygon(0 0, 100% 0, 100% 95%, 85% 100%, 0 100%);
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
  background: var(--v-galaxyAccent-base);
}
/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-galaxyAccent-base);
}
</style>
