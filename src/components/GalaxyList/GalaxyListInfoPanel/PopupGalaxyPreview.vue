<template>
  <!-- POPUP -->
  <div
    ref="popup"
    class="ss-info-panel"
    :class="draft ? 'draft-border' : 'panel-border'"
    :style="galaxyListInfoPanel ? 'backdrop-filter:none;border:none;width:100%' : ''"
    v-if="course"
  >
    <div class="ss-details">
      <div>
        <p class="info-panel-label mb-2">
          <span class="galaxyColour statusLabel"
            ><span>{{ courseStatus }}</span> Galaxy</span
          >
          <br />
          <span class="course-title">{{ course.title }}</span>
        </p>
        <v-img v-if="course.image" class="galaxy-image" :src="course.image.url"></v-img>
        <p ref="description" class="mt-2 galaxy-description">
          <!-- {{ course.description }} -->
          {{ maybeTruncate(course.description) }}
          <a style="border-bottom: 1px solid" v-if="readmore" @click="showFullDescription()"
            >Read more</a
          >
        </p>
      </div>
      <v-btn text x-small color="missionAccent" class="close-button" @click="close">
        <v-icon>{{ mdiClose }}</v-icon>
      </v-btn>
    </div>

    <div class="ss-makers">
      <!-- CONTENT BY -->
      <!-- <div class="left">
        <div v-if="course.contentBy.image">
          <v-avatar size="40px">
            <v-img
              :src="course.contentBy.image.url"
            ></v-img>
          </v-avatar>
        </div>
        <div v-else-if="course.contentBy.personId">
          <v-avatar size="40px">
            <v-img
              :src="contentAuthorImage"
            ></v-img>
          </v-avatar>
        </div>
        <p class="ma-0">Content By:</p>
        <a :href="course.contentBy.source"
          ><span>{{ course.contentBy.name }}</span></a
        >
      </div> -->
      <!-- MAPPED BY -->
      <div class="mapped-details left">
        <p class="info-panel-label mb-1">
          <span class="mappedByTitle">MAPPED BY</span>
        </p>
        <div class="mappedByContainer">
          <Avatar :personId="course.mappedBy.personId" :size="50" :colourBorder="true" />
          <!-- <p class="ma-0">Mapped By:</p> -->
          <span class="mt-2">{{ course.mappedBy.name }}</span>
        </div>
      </div>
      <!-- OWNED BY -->
      <div v-if="courseOwner" class="mapped-details right">
        <p class="info-panel-label mb-1">
          <span class="mappedByTitle">UNIVERSE</span>
        </p>
        <div class="mappedByContainer">
          <Avatar
            v-if="isCourseOwnerOrganisation"
            :organisationData="courseOwner"
            :size="50"
            :colourBorder="true"
          />
          <Avatar v-else :profile="courseOwner" :size="50" :colourBorder="true" />
          <!-- <p class="ma-0">Mapped By:</p> -->
          <span v-if="isCourseOwnerOrganisation" class="mt-2">{{ courseOwner.name }}</span>
          <span v-else class="mt-2">{{ courseOwner.firstName + " " + courseOwner.lastName }}</span>
        </div>
      </div>
    </div>

    <div>
      <!-- Not logged in -->
      <div v-if="!user.loggedIn" class="ss-actions py-4">
        <div class="not-allowed">
          <v-btn
            class="view-ss-button pa-5"
            dark
            small
            color="galaxyAccent"
            outlined
            tile
            title="View Galaxy"
            @click="routeToGalaxyEdit"
            :disabled="!user.loggedIn"
          >
            View Galaxy
          </v-btn>
        </div>
        <!-- Signin Dialog -->
        <LoginDialog />
      </div>
      <div v-else-if="teacher" class="ss-actions py-4">
        <v-btn
          class="view-ss-button pa-5"
          dark
          small
          color="galaxyAccent"
          outlined
          tile
          title="View Galaxy"
          @click="routeToGalaxyEdit"
        >
          View Galaxy
        </v-btn>

        <!-- <v-btn
          class="view-ss-button pa-5"
          :dark="dark"
          :light="!dark"
          small
          color="missionAccent"
          outlined
          tile
          title="View Analytics"
          @click="routeToGalaxyAnalytics"
          disabled
        >
          View Analytics
        </v-btn> -->
      </div>
      <!-- Student Galaxy Actions -->
      <div v-else class="ss-actions py-4">
        <v-btn
          v-if="enrolled"
          class="view-ss-button pa-5"
          dark
          small
          color="galaxyAccent"
          outlined
          tile
          title="View Galaxy"
          @click="routeToGalaxyEdit"
        >
          Resume Galaxy
        </v-btn>
        <!-- starting galaxy status-->

        <v-btn
          v-else
          class="view-ss-button pa-5"
          dark
          small
          color="galaxyAccent"
          outlined
          tile
          title="View Galaxy"
          @click="startThisGalaxy"
          :loading="loading"
        >
          Start Galaxy
        </v-btn>
        <div v-if="loading" style="width: 100%">
          <p class="starting-status ma-0">{{ startingGalaxyStatus }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "@/components/Reused/Avatar.vue";
import LoginDialog from "@/components/Dialogs/LoginDialog.vue";
import { db } from "@/store/firestoreConfig";
import {
  fetchCohortByCohortId,
  fetchPersonByPersonId,
  addMeToCohort,
  assignCourseToMe,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import { mdiClose } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "PopupGalaxyPreview",
  components: { Avatar, LoginDialog },
  props: ["course", "galaxyListInfoPanel"],
  data() {
    return {
      mdiClose,
      teacher: false,
      enrolled: false,
      loading: false,
      startingGalaxyStatus: "",
      contentAuthorImage: "",
      mappedAuthorImage: "",
      readmore: false,
      courseOwner: null,
      isCourseOwnerOrganisation: false,
    };
  },
  computed: {
    ...mapState(useRootStore, ["person", "user"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    draft() {
      return this.course.status === "drafting";
    },
    courseStatus() {
      if (this.draft) return "Draft";
      else if (this.course.status == "submitted") return "Submitted";
      else if (!this.course.public) return "Private";
    },
  },
  watch: {
    async course() {
      console.log("course changed: ", this.course);
      await this.setAccountType();
      await this.setImages();
      await this.setCourseOwner();
    },
  },
  async mounted() {
    await this.setAccountType();
    await this.setImages();
    await this.setCourseOwner();
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId"]),
    maybeTruncate(value) {
      if (!value) return "";
      if (value.length <= 100) {
        return value;
      } else {
        // show read more button
        this.readmore = true;
        // limit to 100 characters
        return value.substring(0, 100) + "...";
      }
    },
    showFullDescription() {
      this.$refs.description.innerHTML = this.course.description;
    },
    async setCourseOwner() {
      if (this.course.owner == null || this.course.owner == "") {
        return;
      }

      const doc = await db.doc(this.course.owner).get();
      this.courseOwner = doc.data();
      this.isCourseOwnerOrganisation = db.doc(this.course.owner).path.startsWith("organisations");
    },
    async setImages() {
      this.mappedAuthorImage = await this.getPersonsImage(this.course.mappedBy.personId);
      if (this.course.contentBy.personId) {
        this.contentAuthorImage = await this.getPersonsImage(this.course.contentBy.personId);
      }
    },
    async setAccountType() {
      this.teacher = false;
      if (this.course.mappedBy?.personId === this.person.id || this.user.data?.admin) {
        this.teacher = true;
      } else if (this.user.loggedIn) {
        // We can used the assignedCourses array to quickly check if the user is enrolled in this course
        this.enrolled = this.person.assignedCourses?.includes(this.course.id) ?? false;
      } else {
        this.enrolled = false;
      }
    },
    close() {
      if (this.galaxyListInfoPanel) {
        this.$emit("closeInfoPanel");
      }
      this.$emit("togglePopup", false);
    },
    routeToGalaxyEdit() {
      console.log("route to galaxy", this.course.id);
      // save current course to store
      this.setCurrentCourseId(this.course.id);
      // route to topic/solar system
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.course.id,
        },
      });
    },
    routeToGalaxyAnalytics() {
      console.log("route to galaxy analytics", this.currentCourseId);

      // save current course to store
      this.setCurrentCourseId(this.course.id);

      // this.$router.push({
      //   name: "GalaxyView",
      //   params: {
      //     topicId: this.currentCourseId,
      //   },
      // });
    },
    async startThisGalaxy() {
      this.loading = true;
      // add this galaxy metadata (eg. topics) to this persons course database

      // save current course to store
      this.setCurrentCourseId(this.course.id);

      // 5) assign student to cohort and course
      const cohort = await fetchCohortByCohortId(this.course.cohort);
      await addMeToCohort(cohort.id);
      await assignCourseToMe(this.course.id);

      this.loading = false;
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.course.id,
          role: "student",
        },
      });
    },

    async getPersonsImage(personId) {
      const person = await fetchPersonByPersonId(personId);
      return person.image?.url;
    },
  },
};
</script>

<style lang="scss" scoped>
// POPUP
.ss-info-panel {
  // background-color: var(--v-background-base);
  position: absolute;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  z-index: 3;
  width: 300px;

  .info-panel-label {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 1.1rem;

    .statusLabel {
      color: var(--v-galaxyAccent-base);
      font-size: 0.8rem;
      // font-weight: 800;
    }
  }

  .galaxy-image {
    width: 100%;
    max-height: 200px;
    // width: 100%;
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 0px;
    padding: 0px !important;
  }

  .ss-makers {
    font-size: 0.8rem;
    color: var(--v-missionAccent-base);
    text-transform: uppercase;

    min-height: 10vh;
    border-top: 1px solid var(--v-missionAccent-base);
    display: flex;

    .left,
    .right {
      width: 100%;
      padding: 5px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-size: 0.6rem;
    }

    .right {
      border-left: 1px solid var(--v-missionAccent-base);
    }
  }

  .ss-actions {
    border-top: 1px solid var(--v-missionAccent-base);
    // min-width: 20vw;
    // min-height: 10vh;
    // position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: hidden;

    .view-ss-button {
      width: 80%;
      margin: 5px;
      // position: absolute;
      // bottom: 20px; // matches 20px padding of ss-details
      background-color: var(--v-background-base);
      z-index: 3;
    }
  }

  .ss-details {
    padding: 20px;

    .course-title {
      color: var(--v-galaxyAccent-base);
      font-weight: 800;
    }

    .galaxy-description {
      color: var(--v-missionAccent-base);
      font-size: 0.8rem;
      font-style: italic;
      margin-bottom: 0px;
    }
  }

  .not-allowed {
    cursor: not-allowed !important;
    width: 100%;
    display: flex;
    justify-content: center;
  }
}

.mapped-details {
  width: 100%;
  padding: 10px 20px;

  .mappedByTitle {
    color: var(--v-galaxyAccent-base);
    font-size: 0.8rem;
    font-weight: 800;
  }

  .mappedByContainer {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}

.centeredFocus {
  margin-top: -100px;
  margin-left: 50px;
}

.galaxyColour {
  color: var(--v-galaxyAccent-base);
  font-weight: 800;
}

.starting-status {
  color: var(--v-galaxyAccent-base);
  font-style: italic;
  font-size: 0.7rem;
  text-align: left;
  padding: 10px;
  // text-transform: uppercase;
}

.draft-border {
  border: 1px dashed var(--v-missionAccent-base);
}

.panel-border {
  border: 1px solid var(--v-missionAccent-base);
}
</style>
