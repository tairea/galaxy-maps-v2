<template>
  <div
    class="galaxyListPanel"
    :style="
      show
        ? 'left:0px; transition-delay: 0.3s'
        : 'left:-200px;transition-delay: 0s;'
    "
  >
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
            NO ENROLLED GALAXIES
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
          <div v-else>
            <!-- <p class="galaxyListPanelContent text-center">
              NO CREATED MAPS
            </p> -->
            <div class="d-flex justify-center mb-4">
              <v-btn
                x-small
                color="missionAccent"
                text
                @click="$emit('createGalaxy')"
              >
                <v-icon x-small class="pr-2">mdi-plus</v-icon>
                MAP NEW GALAXY
              </v-btn>
            </div>
          </div>
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
  props: {
    show: { type: Boolean, default: false },
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

    // CSS Transition Events (might come in handy)
    // this.$refs.panelContent.ontransitionrun = () => {
    //   console.log("Transition started running");
    // };
    // this.$refs.panelContent.ontransitionend = () => {
    //   console.log("Transition ended");
    // };
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
      // this.selectedGalaxy = !this.selectedGalaxy;
      this.selectedGalaxy = true;
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
      this.selectedGalaxy = false;
    },
    panelTransitioned() {
      console.log("list panel transitioned");
      // this.galaxyOverview = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.galaxyListPanel {
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
    background: var(--v-galaxyAccent-base);
    // border: 1px solid var(--v-galaxyAccent-base);

    margin-left: -2px;
    // margin-left: 10px;
    position: relative;

    .panelContentInner {
      position: relative;
      height: 99%;
      width: 99.5%;
      overflow-y: scroll;
      overflow-x: hidden;

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
