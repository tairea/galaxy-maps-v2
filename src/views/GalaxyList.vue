<template>
  <div class="fullHeight">
    <GalaxyListPanel
      ref="listPanel"
      @courseClicked="courseClicked($event)"
      @createGalaxy="showDialog = true"
    />
    <GalaxyListInfoPanel
      :type="courseType"
      :selectedCourseId="clickedCourseId"
      @closeInfoPanel="closeInfoPanel"
    />
    <div class="flexContainer">
      <Galaxies
        v-if="!loading && validSlug"
        ref="galaxyMap"
        :highlightCourse="clickedCourseId"
        @courseClicked="courseClicked($event)"
        @createGalaxy="showDialog = true"
      />
      <div v-if="!loading && !validSlug">
        <p>Sorry, destination not found</p>
      </div>
    </div>

    <div class="buttons">
      <!-- Create button -->
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
                :style="clickedCourseId ? 'opacity:0' : 'opacity:1'"
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
            :style="clickedCourseId ? 'opacity:0' : 'opacity:1'"
          >
            <v-icon left>
              {{ mdiPlus }}
            </v-icon>
            CREATE GALAXY
          </v-btn>
        </v-col>
      </v-row>
      <!-- Discover button -->
      <!-- <DiscoverGalaxyButton :hide="clickedCourseId"/> -->
    </div>

    <!-- Create Galaxy DIALOG -->
    <CreateEditDeleteGalaxyDialog :showDialog="showDialog" @close="showDialog = false" />
  </div>
</template>

<script>
import CreateEditDeleteGalaxyDialog from "@/components/CreateEditDeleteGalaxyDialog.vue";
import DiscoverGalaxyButton from "@/components/DiscoverGalaxyButton.vue";
import GalaxyListPanel from "@/components/GalaxyListPanel.vue";
import GalaxyListInfoPanel from "@/components/GalaxyListInfoPanel.vue";
import Galaxies from "@/components/Galaxies.vue";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiPlus } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "GalaxyList",
  props: ["slug"],
  components: {
    CreateEditDeleteGalaxyDialog,
    GalaxyListPanel,
    GalaxyListInfoPanel,
    DiscoverGalaxyButton,
    Galaxies,
  },
  data() {
    return {
      mdiPlus,
      loading: true,
      // whichCoursesToDisplay: "all",
      clickedCourseId: null,
      courseType: null,
      showDialog: false,
      validSlug: true,
    };
  },
  computed: {
    ...mapState(useRootStore, ["courses", "user", "person"]),
  },
  watch: {
    async user() {
      let owner;
      if (this.slug != null) {
        const docRef = await db.collection("slugs").doc(this.slug).get();
        const data = docRef.data();
        if (data != null) {
          owner = data.owner;
        } else {
          this.validSlug = false;
        }
      }
      this.bindCourses({ owner }).then(() => {
        this.loading = false;
      });
    },
  },
  async mounted() {
    // We don't care about waiting for this to finish before completing mounted
    // because when it's finished it will automatically update our list of courses
    // TODO: This binds all courses. Should prob only bind courses relevant to user
    let owner;
    if (this.slug != null) {
      const docRef = await db.collection("slugs").doc(this.slug).get();
      const data = docRef.data();
      if (data != null) {
        owner = data.owner;
      } else {
        this.validSlug = false;
      }
    }
    this.bindCourses({ owner }).then(() => {
      this.loading = false;
    });
    if (this.courses.length > 0) {
      this.loading = false;
    }

    // 1) get assigned (EXPLORING)

    // 2) get created (CREATED) mappedBy

    // 3) get submitted (IN REVIEW) mappedby && status==submitted
  },
  methods: {
    ...mapActions(useRootStore, ["bindCourses"]),
    courseClicked(emittedPayload) {
      this.clickedCourseId = emittedPayload.courseId;
      if (emittedPayload.type) this.courseType = emittedPayload.type;
    },
    closeInfoPanel() {
      this.clickedCourseId = null;
      this.$refs.listPanel.courseClicked();
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

  .flexRow {
    display: flex;
    // height: 50%;
    flex-wrap: wrap;
    justify-content: center;
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
</style>
