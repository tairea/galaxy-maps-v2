<template>
  <!-- POPUP -->
  <!-- follow drag -> :style="{ top: getCoords.y - 100 + 'px', left: getCoords.x + 30 + 'px' }" -->
  <div ref="popup" class="ss-info-panel">
    <div class="ss-details">
      <div>
        <p class="info-panel-label mb-2">
          <span class="galaxyColour">Galaxy:</span>
          <br />
          <span style="color: white">{{ course.title }}</span>
        </p>
        <v-img
          v-if="course.image.url"
          class="galaxy-image"
          :src="course.image.url"
        ></v-img>
        <!-- <p class="info-panel-label">
          X: <span style="color: white">{{ currentNode.x }}</span>
        </p>
        <p class="info-panel-label">
          Y: <span style="color: white">{{ currentNode.y }}</span>
        </p> -->
      </div>

      <!-- <v-btn
        class="map-button"
        fab
        dark
        small
        color="baseAccent"
        outlined
        tile
        title="Edit"
        @click="routeToGalaxyEdit"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn> -->

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
            class="contentBy-image mb-2"
            :src="course.contentBy.image.url"
          ></v-img>
        </div>
        <p class="ma-0">Content By:</p>
        <a :href="course.contentBy.source"
          ><span style="color: white">{{ course.contentBy.name }}</span></a
        >
      </div>
      <div class="right">
        <div v-if="course.mappedBy.image">
          <v-img
            class="mappedBy-image"
            :src="course.mappedBy.image.url"
          ></v-img>
        </div>
        <p class="ma-0">Mapped By:</p>
        <span style="color: white">{{ course.mappedBy.name }}</span>
      </div>
    </div>

    <div>
      <div v-if="person.accountType != 'student'" class="ss-actions">
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
          dark
          small
          color="missionAccent"
          outlined
          tile
          title="View Analytics"
          @click="routeToGalaxyAnalytics"
        >
          View Analytics
        </v-btn>
      </div>
      <!-- Student Galaxy Actions -->
      <div v-else class="ss-actions">
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
          <p class="starting-status">{{ startingGalaxyStatus }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

import { db } from "../store/firestoreConfig";

import { mapGetters } from "vuex";

export default {
  name: "PopupGalaxyPreview",
  components: {},
  props: ["course"],
  computed: {
    ...mapGetters(["person"]),
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
  },
  computed: {
    ...mapState(["person"]),
  },
  data() {
    return {
      enrolled: false,
      loading: false,
      startingGalaxyStatus: "",
    };
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
        .get();

      // 2) add them to person (this will store their TOPIC progression data for this course )
      for (const doc of querySnapshot.docs) {
        await db
          .collection("people")
          .doc(this.person.id)
          .collection(this.course.id)
          .doc(doc.data().id)
          .set({
            ...doc.data(),
            // set the status of topics to locked unless they are introduction nodes
            topicStatus:
              doc.data().group == "introduction" ? "introduction" : "locked",
          });

        // 3) check if this topic has tasks
        const subquerySnapshot = await db
          .collection("courses")
          .doc(this.course.id)
          .collection("topics")
          .doc(doc.data().id)
          .collection("tasks")
          // order by timestamp is important otherwise index == 0 (in the next step) wont necessarily be the first mission
          .orderBy("timestamp")
          .get();

        // 4) if tasks exist. add them to person
        for (const [index, subDoc] of subquerySnapshot.docs.entries()) {
          // cool lil status to show whats happening during loading
          // this.startingGalaxyStatus = "...adding " + subDoc.data().title;
          this.startingGalaxyStatus =
            "...adding " + doc.data().label + " - " + subDoc.data().title;
          console.log(
            "...adding " +
              subDoc.id +
              ": " +
              doc.data().label +
              " - " +
              subDoc.data().title
          );

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

      this.loading = false;
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.course.id,
        },
      });
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
  }

  .contentBy-image {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
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
    min-height: 20vh;
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
    }
  }
  .ss-details {
    padding: 20px;
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
  padding: 20px;
  // text-transform: uppercase;
}
</style>
