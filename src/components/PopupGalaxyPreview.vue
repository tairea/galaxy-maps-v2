<template>
  <!-- POPUP -->
  <!-- follow drag -> :style="{ top: getCoords.y - 100 + 'px', left: getCoords.x + 30 + 'px' }" -->
  <div ref="popup" class="ss-info-panel">
    <div class="ss-details">
      <div>
        <p class="info-panel-label mb-2">
          <span class="galaxyColour">Galaxy:</span>
          <br />
          <span>{{ course.title }}</span>
        </p>
        <v-img
          v-if="course.image.url"
          class="galaxy-image"
          :src="course.image.url"
        ></v-img>
        <p class="my-2 galaxy-description">
          {{ course.description }}
        </p>
      </div>
      <v-btn
        text
        x-small
        color="missionAccent"
        class="close-button"
        @click="close"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <div class="ss-makers">
      <div class="left">
        <div v-if="course.contentBy.image">
          <v-img
            width="50px"
            class="contentBy-image mb-2"
            :src="course.contentBy.image.url"
          ></v-img>
        </div>
        <div v-else-if="course.contentBy.personId">
          <v-img
            width="50px"
            class="contentBy-image mb-2"
            :src="contentAuthorImage"
          ></v-img>
        </div>
        <p class="ma-0">Content By:</p>
        <a :href="course.contentBy.source"
          ><span>{{ course.contentBy.name }}</span></a
        >
      </div>
      <div class="right">
        <div v-if="course.mappedBy.image">
          <v-img
            width="50px"
            class="mappedBy-image"
            :src="course.mappedBy.image.url"
          ></v-img>
        </div>
        <div v-else-if="course.mappedBy.personId">
          <v-img
            width="50px"
            class="mappedBy-image"
            :src="mappedAuthorImage"
          ></v-img>
        </div>
        <p class="ma-0">Mapped By:</p>
        <span>{{ course.mappedBy.name }}</span>
      </div>
    </div>

    <div>
      <div v-if="person.accountType != 'student'" class="ss-actions py-2">
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

        <v-btn
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
        </v-btn>
      </div>
      <!-- Student Galaxy Actions -->
      <div v-else class="ss-actions py-2">
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
import { db } from "../store/firestoreConfig";
import { dbMixins } from "../mixins/DbMixins";

import { mapGetters, mapState } from "vuex";

import { startGalaxyXAPIStatement } from "../lib/veracityLRS";

export default {
  name: "PopupGalaxyPreview",
  mixins: [dbMixins],
  components: {},
  props: ["course"],
  computed: {
    ...mapGetters(["person"]),
  },
  data() {
    return {
      enrolled: false,
      loading: false,
      startingGalaxyStatus: "",
      contentAuthorImage: "",
      mappedAuthorImage: "",
    };
  },
  async mounted() {
    // check is student is already in this course
    if (this.person.accountType == "student") {
      const querySnapshot = await db
        .collection("people")
        .doc(this.person.id)
        .collection(this.course.id)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        this.enrolled = false;
      } else {
        this.enrolled = true;
      }
    }
    this.mappedAuthorImage = await this.getPersonsImage(
      this.course.mappedBy.personId
    );
    this.contentAuthorImage = await this.getPersonsImage(
      this.course.contentBy.personId
    );
  },
  computed: {
    ...mapState(["person"]),

    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    close() {
      this.$emit("togglePopup", false);
    },
    routeToGalaxyEdit() {
      console.log("route to galaxy", this.course.id);
      // save current course to store
      this.$store.commit("setCurrentCourse", this.course);
      this.$store.commit("setCurrentCourseId", this.course.id);
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
      this.$store.commit("setCurrentCourse", this.course);
      this.$store.commit("setCurrentCourseId", this.course.id);

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
      this.$store.commit("setCurrentCourse", this.course);
      this.$store.commit("setCurrentCourseId", this.course.id);

      // 1) get topics in this course
      const querySnapshot = await db
        .collection("courses")
        .doc(this.course.id)
        .collection("topics")
        .orderBy("topicCreatedTimestamp")
        .get();

      // 2) add them to person (this will store their TOPIC progression data for this course )
      for (const [index, doc] of querySnapshot.docs.entries()) {
        await db
          .collection("people")
          .doc(this.person.id)
          .collection(this.course.id)
          .doc(doc.data().id)
          .set({
            ...doc.data(),
            // topicStatus: index == 0 ? "unlocked" : "locked", // unlock first topic only
            topicStatus:
              doc.data().group == "introduction" ? "introduction" : "locked", // set the status of topics to locked unless they are introduction nodes
          });

        // 3) check if this topic has tasks
        const subquerySnapshot = await db
          .collection("courses")
          .doc(this.course.id)
          .collection("topics")
          .doc(doc.data().id)
          .collection("tasks")
          // order by timestamp is important otherwise index == 0 (in the next step) wont necessarily be the first mission
          .orderBy("taskCreatedTimestamp")
          .get();

        // 4) if tasks exist. add them to person
        for (const [index, subDoc] of subquerySnapshot.docs.entries()) {
          // cool lil status to show whats happening during loading
          // this.startingGalaxyStatus = "...adding " + subDoc.data().title;
          this.startingGalaxyStatus =
            "...adding " + doc.data().label + " - " + subDoc.data().title;
          // console.log(
          //   "...adding " +
          //     subDoc.id +
          //     ": " +
          //     doc.data().label +
          //     " - " +
          //     subDoc.data().title
          // );

          if (subDoc.exists) {
            await db
              .collection("people")
              .doc(this.person.id)
              .collection(this.course.id)
              .doc(doc.data().id)
              .collection("tasks")
              .doc(subDoc.id)
              .set({
                ...subDoc.data(),
                // set the status of topics to locked unless they are the first mission (index == 0)
                taskStatus: index == 0 ? "unlocked" : "locked",
              });
          }
        }
      }

      // Send Galaxy Started statment to LRS
      startGalaxyXAPIStatement(this.person, { galaxy: this.course });

      this.loading = false;
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.course.id,
        },
      });
    },

    async getPersonsImage(personId) {
      const person = await this.MXgetPersonByIdFromDB(personId);
      return person.image.url;
    },
  },
};
</script>

<style lang="scss" scoped>
// POPUP
.ss-info-panel {
  // background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
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
  }

  .galaxy-image {
    width: 100%;
    max-height: 250px;
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

    .contentBy-image,
    .mappedBy-image {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .left,
    .right {
      width: 100%;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
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

    .galaxy-description {
      color: var(--v-missionAccent-base);
      font-size: 0.9rem;
      font-style: italic;
    }
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
</style>
