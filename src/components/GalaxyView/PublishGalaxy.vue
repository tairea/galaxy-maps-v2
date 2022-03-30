<template>
  <v-dialog v-model="dialog" width="40%" light>
    <!-- CREATE BUTTON -->
    <template v-slot:activator="{ on, attrs }">
      <!-- ASSIGN COHORT -->
      <v-btn
        outlined
        color="galaxyAccent"
        v-bind="attrs"
        v-on="on"
        class="publishButton d-inline-flex text-truncate"
      >
        publish galaxy
      </v-btn>
      <!-- ASSIGN GALAXY -->
    </template>

    <!-- NEW DIALOG -->
    <div class="create-dialog">
      <div class="dialog-header">
        <p class="dialog-title">publish galaxy</p>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent"
            >mdi-information-variant</v-icon
          >
          <p class="dialog-description">
            Publish this galaxy to starting teaching
          </p>
        </div>
      </div>
      <v-divider dark color="missionAccent"></v-divider>
      <div class="create-dialog-content">
        <!-- LISTED -->
        <div>
          <p class="caption">Choose whether you would like this galaxy to be invite only or publically discoverable</p>
          <v-radio-group row v-model="courseOptions.public" color="missionAccent" :light="!dark" :dark="dark">
            <v-radio
              label="invite only"
              :value="false"
              color="missionAccent"
              class="label-text"
            ></v-radio>
            <v-radio
              label="discoverable"
              :value="true"
              color="missionAccent"
              class="label-text"
            ></v-radio>
          </v-radio-group>
        </div>
        <div v-if="courseOptions.public">
          <p class="caption">Would you like others to be able to add to this course</p>
          <v-radio-group row v-model="courseOptions.editable" color="missionAccent" :light="!dark" :dark="dark">
            <v-radio
              label="yes"
              :value="true"
              color="missionAccent"
              class="label-text"
            ></v-radio>
            <v-radio
              label="no"
              :value="false"
              color="missionAccent"
              class="label-text"
            ></v-radio>
          </v-radio-group>
        </div>
      </div>
          <!-- ACTION BUTTONS -->
      <div class="action-buttons">
        <v-btn
          v-if="courseOptions.public"
          outlined
          color="green darken-1"
          @click="submitCourse()"
          :loading="loading"
        >
          <v-icon left> mdi-send </v-icon>
          SUBMIT
        </v-btn>
        <v-btn
          v-else
          outlined
          color="green darken-1"
          @click="publishCourse()"
          :loading="loading"
        >
          <v-icon left> mdi-check </v-icon>
          publish
        </v-btn>

        <v-btn
          outlined
          :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
          class="ml-2"
          @click="close"
          :disabled="loading"
        >
          <v-icon left> mdi-close </v-icon>
          CANCEL
        </v-btn>
      </div>            
    </div>
  </v-dialog>
</template>

<script>
import { db } from "@/store/firestoreConfig";


export default {
  name: "PublishGalaxy",
  props: ["course"],
  data: () => ({
    dialog: false,
    loading: false,
    courseOptions: {
      public: false,
    }

  }),
  computed: {
    dark () {
      return this.$vuetify.theme.isDark
    }
  },
  methods: {
    close() {
      this.dialog = false;
      this.loading = false;
      this.courseOptions = {
        public: false,
      }
    },
    submitCourse() {
      this.loading = true;
      let course = {
        ...this.course, 
        ...this.courseOptions
      }
      course.status = "submitted"
      console.log("submitted course: ", course )
      this.updateCourse(course) 
    },
    publishCourse () {
      this.loading = true;
      let course = {
        ...this.course, 
        ...this.courseOptions
      }
      course.status = "published"
      console.log("oublished course: ", course )
      this.updateCourse(course) 
    },
    updateCourse(course) {
      db.collection("courses")
        .doc(course.id)
        .update(course)
        .then(() => {
          console.log("Document successfully updated!");
          this.$store.commit("setCurrentCourseId", course.id);
          this.close()
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    }
  },
};
</script>

<style lang="scss" scoped>
/* Dialog */
.v-input .v-label {
  font-size: 0.8em;
}

.saveButton {
  width: 100%;
  justify-content: center;
}

// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
    background-color: var(--v-background-base);
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
    background-color: var(--v-background-base);
  }
}

.create-dialog-content {
  background-color: var(--v-background-base);
  // width: 33.33%;
  // min-height: 400px;
  display: flex;
  // justify-content: space-around;
  // align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  text-transform: uppercase;
  width: 100%;
  // font-size: 0.6rem;
  // border: 1px solid var(--v-missionAccent-base);

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 0.8rem;
    color: var(--v-missionAccent-base) !important;
    text-transform: none;
  }

  .v-application .primary--text {
    color: var(--v-missionAccent-base) !important;
    caret-color: var(--v-missionAccent-base) !important;
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;

  .galaxy-text {
    color: var(--v-galaxyAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }
  .mission-text {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }
}
.publishButton {
  width: calc(100% - 30px);
  z-index: 3;
  margin-top: 20px
}

.label-text::v-deep label {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base) !important
}
</style>
