<template>
  <div class="galaxyListPanel">
    <!-- USER MENU TOPBAR -->

    <!-- USER MENU HIDDEN-->

    <div class="panelContent">
      <div class="panelContentInner">
        <!-- ADMIN NEEDING TO REVIEW -->
        <div
          class="subPanel"
          style="border-color: var(--v-cohortAccent-base)"
          v-if="getAllSubmittedCourses"
        >
          <p
            class="galaxyListPanelLabel overline mx-4 cohortAccent--text"
            style="border-bottom: 1px solid var(--v-cohortAccent-base)"
          >
            PLEASE REVIEW
          </p>
          <div>
            <!-- COURSE CARD -->
            <GalaxyListPanelCard
              v-for="(course, index) in getAllSubmittedCourses"
              :key="course.id"
              :course="course"
              :admin="user.data.admin"
              :active="index === activeSubmitted"
              @click.native="courseClicked(course.id, index, 'submitted')"
            />
          </div>
        </div>

        <!-- LEARNING -->
        <div class="subPanel">
          <p class="galaxyListPanelLabel overline mx-4">EXPLORING</p>
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
            YOU ARE NOT EXPLORING ANY GALAXIES
          </p>
        </div>

        <!-- TEACHING -->
        <div class="subPanel">
          <p class="galaxyListPanelLabel overline mx-4">MAPPED BY YOU</p>
          <!-- Create NEW GALAXY button -->
          <div class="d-flex justify-center mb-4">
            <v-btn
              x-small
              color="missionAccent"
              @click="$emit('createGalaxy')"
              outlined
              class="py-6 px-4"
            >
              <v-icon class="pr-2">{{ mdiPlus }}</v-icon>
              MAP NEW GALAXY
            </v-btn>
          </div>

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
        </div>

        <!-- SUBMITTED (CREATED & IN REVIEW) -->
        <div class="subPanel" v-if="getSubmittedCourses.length > 0">
          <p class="galaxyListPanelLabel overline mx-4">IN REVIEW</p>
          <div>
            <!-- COURSE CARD -->
            <GalaxyListPanelCard
              v-for="(course, index) in getSubmittedCourses"
              :key="course.id"
              :course="course"
              :active="index === activeSubmitted"
              @click.native="courseClicked(course.id, index, 'submitted')"
            />
          </div>
        </div>

        <!-- ALL -->
        <div class="subPanel">
          <p class="galaxyListPanelLabel overline mx-4">PUBLIC GALAXIES</p>
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
          LIST OF GALAXIES
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import GalaxyListPanelCard from "@/components/GalaxyListPanelCard.vue";
import { mdiPlus } from "@mdi/js";

export default {
  name: "GalaxyListPanel",
  components: {
    GalaxyListPanelCard,
  },
  data() {
    return {
      mdiPlus,
      allCourses: [],
      selectedGalaxy: false,
      activeLearning: null,
      activeTeaching: null,
      activeSubmitted: null,
      activePublic: null,
    };
  },
  async mounted() {
    //bind cohorts to get learning maps
    this.$store.dispatch("getCohortsByPersonId", this.person);
  },
  computed: {
    ...mapState(["person", "courses", "cohorts", "user"]),

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
    getSubmittedCourses() {
      return this.courses.filter(
        (course) =>
          course.mappedBy.personId == this.person.id &&
          course.status == "submitted"
      );
    },
    // ADMIN NEEDS TO REVIEW
    getAllSubmittedCourses() {
      if (this.user.data.admin) {
        const submitted = this.courses.filter(
          (course) => course.status == "submitted"
        );
        if (submitted.length > 0) {
          return submitted;
        } else {
          return false;
        }
      }
    },
    // TEACHERING GALAXIES
    getTeachingCourses() {
      return this.courses.filter(
        (course) =>
          course.mappedBy.personId == this.person.id &&
          course.status != "submitted"
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
        } else if (type === "submitted") {
          this.activeSubmitted = index;
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
      this.activeSubmitted = null;
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

      .subPanel {
        border: 1px dashed var(--v-galaxyAccent-base);
        margin: 10px;
        margin-top: 20px;
      }
    }

    .galaxyListPanelLabel {
      color: var(--v-galaxyAccent-base);
      position: relative;
      border-bottom: 1px solid var(--v-galaxyAccent-base);
    }

    .galaxyListPanelContent {
      color: var(--v-missionAccent-base);
      position: relative;
      font-size: 0.6rem;
      letter-spacing: 1px;
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

.add-galaxy-icon {
  background-color: rgba(266, 105, 207, 0.2);
  border-radius: 50%;
  width: 20px;
  height: 20px;
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
