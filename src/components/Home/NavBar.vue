<template>
  <div class="topMenuContainer">
    <div ref="topNav" class="topCenterBar" :class="{ hide: !showNavMenu }">
      <div class="inner">
        <!-- Student tabs -->
        <v-tabs
          fixed-tabs
          background-color="transparent"
          dark
          slider-color="baseAccent"
          v-model="activeTab"
          height="30"
        >
          <v-tab v-for="tab in tabs" :key="tab.id" :to="tab.route" :exact-path="tab.exactPath">
            <div class="baseAccent--text tab">
              {{ tab.name }}
              <template v-if="tab.name === 'DASHBOARD'">
                <span
                  v-if="unansweredRequestsForHelp.length"
                  class="notification-badge galaxyAccent"
                >
                  {{ unansweredRequestsForHelp.length }}
                </span>
                <span v-if="inReviewSubmissionsCount" class="notification-badge cohortAccent">
                  {{ inReviewSubmissionsCount }}
                </span>
              </template>
            </div>
          </v-tab>
        </v-tabs>
      </div>
    </div>
    <!-- hamburger menu -->
    <div v-if="showHamburgerMenu" class="hamburger">
      <v-btn
        class="map-button"
        color="baseAccent"
        dark
        text
        small
        tile
        title="Toggle Navigation"
        @click="toggleMenu"
      >
        <v-icon v-if="!showNavMenu && !isMobile">{{ mdiMenu }}</v-icon>
        <v-icon v-else-if="!isMobile" color="baseAccent">{{ mdiClose }}</v-icon>
        <v-icon v-else>{{ mdiMenu }}</v-icon>
      </v-btn>
    </div>

    <!-- Mobile Navigation Dialog -->
    <MobileNavDialog
      v-model="mobileNavDialog"
      :tabs="tabs"
      :unanswered-requests-for-help="unansweredRequestsForHelp"
      :in-review-submissions-count="inReviewSubmissionsCount"
    />
  </div>
</template>

<script>
import useRootStore from "@/store/index";
import { mdiMenu, mdiClose } from "@mdi/js";
import { mapState } from "pinia";
import useGalaxyListViewStore from "@/store/galaxyListView";
import MobileNavDialog from "./MobileNavDialog.vue";

const TAB_MY_GALAXIES = { id: 1, name: "MY GALAXIES", route: `/my-galaxies`, exactPath: false };
const TAB_PUBLIC_GALAXIES = { id: 2, name: "PUBLIC GALAXIES", route: `/`, exactPath: true };
const TAB_COHORTS = { id: 3, name: "SQUADS", route: `/squads`, exactPath: false };
const TAB_DASHBOARD = { id: 4, name: "DASHBOARD", route: `/dashboard`, exactPath: false };
const TAB_ADMIN = { id: 5, name: "ADMIN", route: `/students` };
const TAB_DEBUG = { id: 6, name: "MAP DEBUG", route: `/map-debug`, exactPath: false };

export default {
  name: "NavBar",
  components: {
    MobileNavDialog,
  },
  props: [""],
  data() {
    return {
      mdiMenu,
      mdiClose,
      activeTab: null,
      tabs: [TAB_PUBLIC_GALAXIES],
      showNavMenu: true,
      showHamburgerMenu: false,
      mobileNavDialog: false,
    };
  },
  computed: {
    ...mapState(useRootStore, ["user"]),
    ...mapState(useGalaxyListViewStore, ["courses"]),
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    unansweredRequestsForHelp() {
      const store = useRootStore();
      const unansweredRequests = store.getUnansweredRequestsForHelp;
      // filter unaswered requests that are from courses mapped by me or where I'm a collaborator
      const unansweredRequestsFromMyCourses = unansweredRequests.filter(
        (request) =>
          request.contextCourse.mappedBy.personId === this.user.data.id ||
          (request.contextCourse.collaboratorIds &&
            request.contextCourse.collaboratorIds.includes(this.user.data.id)),
      );
      // console.log("unansweredRequestsFromMyCourses: ", unansweredRequestsFromMyCourses);
      return unansweredRequestsFromMyCourses;
    },
    inReviewSubmissionsCount() {
      const store = useRootStore();
      const inReviewSubmissions = store.getInReviewSubmissions;
      // filter inreview submissions that are from courses mapped by me or where I'm a collaborator
      const inReviewSubmissionsFromMyCourses = inReviewSubmissions.filter(
        (submission) =>
          submission.contextCourse.mappedBy.personId === this.user.data.id ||
          (submission.contextCourse.collaboratorIds &&
            submission.contextCourse.collaboratorIds.includes(this.user.data.id)),
      );
      // console.log("inReviewSubmissionsFromMyCourses: ", inReviewSubmissionsFromMyCourses);
      return inReviewSubmissionsFromMyCourses.length;
    },
  },
  watch: {
    $route() {
      this.updateNavVisibility();
    },
    isMobile() {
      this.updateNavVisibility();
    },
    user(to) {
      if (this.user?.data?.admin) {
        this.tabs = [
          TAB_MY_GALAXIES,
          TAB_PUBLIC_GALAXIES,
          TAB_COHORTS,
          TAB_DASHBOARD,
          TAB_ADMIN,
          TAB_DEBUG,
        ];
      } else if (to.loggedIn) {
        this.tabs = [TAB_MY_GALAXIES, TAB_PUBLIC_GALAXIES, TAB_COHORTS, TAB_DASHBOARD];
      } else {
        this.tabs = [TAB_PUBLIC_GALAXIES];
      }
    },
    courses: {
      immediate: true,
      async handler(newCourses) {
        if (newCourses && newCourses.length > 0) {
          const store = useRootStore();
          // Loop through all courses and fetch their requests and submissions
          await Promise.all(
            newCourses.map(async (course) => {
              await store.getRequestsForHelpByCourseId(course.id);
              await store.getAllSubmittedWorkByCourseId(course.id);
            }),
          );
        }
      },
    },
  },
  async mounted() {
    if (this.user?.data?.admin) {
      this.tabs = [
        TAB_MY_GALAXIES,
        TAB_PUBLIC_GALAXIES,
        TAB_COHORTS,
        TAB_DASHBOARD,
        TAB_ADMIN,
        TAB_DEBUG,
      ];
    } else if (this.user.loggedIn) {
      this.tabs = [TAB_MY_GALAXIES, TAB_PUBLIC_GALAXIES, TAB_COHORTS, TAB_DASHBOARD];
    } else {
      this.tabs = [TAB_PUBLIC_GALAXIES];
    }

    this.updateNavVisibility();
  },
  methods: {
    updateNavVisibility() {
      const isSpecialRoute =
        this.$route.name === "GalaxyView" ||
        this.$route.name === "SolarSystemView" ||
        this.$route.name === "AiGalaxyEditWithCourse";

      const isAuthRoute =
        this.$route.name === "Login" ||
        this.$route.name === "Verify" ||
        this.$route.name === "Reset" ||
        this.$route.name === "Register";

      if (isSpecialRoute) {
        this.showNavMenu = this.isMobile ? false : !this.showNavMenu;
        this.showHamburgerMenu = true;
      } else if (isAuthRoute) {
        this.showNavMenu = false;
        this.showHamburgerMenu = false;
      } else {
        this.showNavMenu = this.isMobile ? false : true;
        this.showHamburgerMenu = this.isMobile;
      }
    },
    toggleMenu() {
      if (this.isMobile) {
        this.mobileNavDialog = true;
      } else {
        this.showNavMenu = !this.showNavMenu;
      }
    },
  },
};
</script>

<style lang="scss">
.topMenuContainer {
  background-color: pink;
}

.topCenterBar {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0%);
  background: var(--v-background-darken1);
  width: 60%;
  padding: 10px;
  clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);

  display: flex;
  justify-content: center;
  color: white;
  z-index: 200;

  transition: all 0.3s ease-in-out;

  .inner {
    width: 80%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    // border: solid 5px yellow;
  }
}

.hide {
  transform: translate(-50%, -100%);
}

.hamburger {
  position: fixed;
  top: 0;
  right: 0;
  // transform: translate(-50%, 0%);
  background: var(--v-background-darken1);
  width: 60px;
  height: 50px;
  padding: 10px 0px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 30% 100%);

  display: flex;
  justify-content: flex-end;
  // padding-right: 15px;
  color: white;
  z-index: 200;
  // border: 2px solid pink;
}

.neon {
  color: var(--v-baseAccent-base);
}

.profilePic {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
}

.username {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
}

.tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

.notification-badge {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  font-size: 0.75rem;
  font-weight: bold;
  line-height: 1;
  top: -7px;

  &.galaxyAccent {
    background-color: var(--v-galaxyAccent-base);
    color: var(--v-background-base);
    right: -15px;
  }

  &.cohortAccent {
    background-color: var(--v-cohortAccent-base);
    color: var(--v-background-base);
    right: -30px;
  }
}
</style>
