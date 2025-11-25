<template>
  <!-- POPUP -->
  <div
    ref="popup"
    class="ss-info-panel"
    :class="draft ? 'draft-border' : 'panel-border'"
    :style="galaxyListInfoPanel ? 'backdrop-filter:none;border:none;width:100%' : ''"
    v-if="course"
  >
    <v-btn text x-small color="missionAccent" class="close-button align-self-end" @click="close">
      <v-icon>{{ mdiClose }}</v-icon>
    </v-btn>
    <div class="ss-details">
      <div>
        <p class="info-panel-label mb-2">
          <span class="galaxyColour statusLabel"
            ><span>{{ courseStatus }}</span> Galaxy</span
          >
          <br />
          <span class="course-title">{{ course.title }}</span>
        </p>
        <v-img
          v-if="hasValidImage"
          class="galaxy-image"
          :src="course.image.url"
          @error="handleImageError"
        ></v-img>
        <div v-else class="image-placeholder">
          {{ first3Letters(course.title) }}
        </div>
        <p ref="description" class="mt-2 galaxy-description">
          <!-- {{ course.description }} -->
          {{ maybeTruncate(course.description) }}
          <a style="border-bottom: 1px solid" v-if="readmore" @click="showFullDescription()"
            >Read more</a
          >
        </p>
      </div>
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
      <!-- OWNED BY (not sure how this should work yet) -->
      <!-- <div v-if="courseOwner" class="mapped-details right">
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
          <span v-if="isCourseOwnerOrganisation" class="mt-2">{{ courseOwner.name }}</span>
          <span v-else class="mt-2">{{ courseOwner.firstName + " " + courseOwner.lastName }}</span>
        </div>
      </div> -->
    </div>
  </div>
</template>

<script>
import Avatar from "@/components/Reused/Avatar.vue";
import { db } from "@/store/firestoreConfig";
import {
  // fetchCohortByCohortId,
  fetchPersonByPersonId,
  // addMeToCohort,
  // assignCourseToMe,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import { mdiClose } from "@mdi/js";
import { mapState } from "pinia";

export default {
  name: "PopupGalaxyPreview",
  components: { Avatar },
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
      else if (this.course.status == "submitted") return "Submitted For Review";
      else if (this.course.visibility == "private") return "Private";
      else if (this.course.visibility == "unlisted") return "Unlisted";
      else if (this.course.public == true) return "Public";
    },
    hasValidImage() {
      return (
        this.course &&
        this.course.image &&
        this.course.image.url &&
        this.course.image.url.trim() !== ""
      );
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
      if (
        this.course.mappedBy?.personId === this.person.id ||
        this.user.data?.admin ||
        (this.course?.collaboratorIds && this.course.collaboratorIds.includes(this.person.id))
      ) {
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
    async getPersonsImage(personId) {
      const person = await fetchPersonByPersonId(personId);
      return person.image?.url;
    },
    handleImageError(event) {
      // Remove the placeholder image fallback - just rely on the first 3 letters
      console.log("Image failed to load for course:", this.course.title);
    },
    first3Letters(title) {
      if (!title) return "";
      return title.substring(0, 3).toUpperCase();
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
    position: sticky;
    top: 10px;
    right: 10px;
    padding: 0px !important;
    z-index: 10;
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

  .ss-details {
    padding: 20px;
    margin-top: -30px;

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

    .image-placeholder {
      width: 150px;
      height: 150px;
      background-color: rgba(200, 200, 200, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 2rem;
      font-weight: bold;
      color: var(--v-galaxyAccent-base);
      border: 1px solid var(--v-galaxyAccent-base);
      border-radius: 8px;
    }
  }
}

.mapped-details {
  width: 100%;
  padding: 10px 20px;
  margin-bottom: 10px;

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

.draft-border {
  border: 1px dashed var(--v-missionAccent-base);
}

.panel-border {
  border: 1px solid var(--v-missionAccent-base);
}
</style>
