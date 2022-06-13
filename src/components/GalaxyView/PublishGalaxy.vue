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
          <p v-if="admin" class="dialog-description">
            Publish this galaxy to list publically 
          </p>
          <p v-else class="dialog-description">
            Publish this galaxy to starting teaching
          </p>
        </div>
      </div>
      <v-divider dark color="missionAccent"></v-divider>
      <div v-if="!admin" class="create-dialog-content">
        <!-- LISTED -->
        <div>
          <p class="caption">Choose whether you would like this galaxy to be <strong>PRIVATE</strong> (invite only), or <strong>PUBLIC</strong> (discoverable by all Galaxy Maps users)</p>
          <v-radio-group row v-model="courseOptions.public" color="missionAccent" :light="!dark" :dark="dark">
            <v-radio
              label="private"
              :value="false"
              color="missionAccent"
              class="label-text"
            ></v-radio>
            <v-radio
              label="public"
              :value="true"
              color="missionAccent"
              class="label-text"
            ></v-radio>
          </v-radio-group>
        </div>
        <!-- Is the course editable? -->
        <!-- <div v-if="courseOptions.public">
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
        </div> -->
      </div>
          <!-- ACTION BUTTONS -->
      <div v-if="admin" class="action-buttons">
        <v-btn
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
      <div v-else class="action-buttons">
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
import { db, functions } from "@/store/firestoreConfig";
import { mapGetters, mapMutations } from 'vuex'

import { dbMixins } from '@/mixins/DbMixins'

export default {
  name: "PublishGalaxy",
  mixins: [dbMixins],
  props: ["course"],
  data: () => ({
    dialog: false,
    loading: false,
    courseOptions: {
      public: false,
    },

  }),
  computed: {
    ...mapGetters(['user']),
    dark () {
      return this.$vuetify.theme.isDark
    },
    admin () {
      return this.user.data.admin
    }

  },
  methods: {
    ...mapMutations(['setCurrentCourse']),
    close() {
      this.dialog = false;
      this.loading = false;
      this.courseOptions = {
        public: false,
      }
    },

    async submitCourse() {
      this.loading = true;
      let course = {
        ...this.course, 
        ...this.courseOptions
      }
      course.status = "submitted"
      await this.updateCourse(course)
      .then(() => {
        this.sendNewSubmissionEmail(course)
      })
      .then(() => {
        this.$store.commit("setCurrentCourseId", course.id);
        this.$store.commit("setCurrentCourse", course)
        this.close()
      }).catch((error) => {
        console.error("Error updating document: ", error);
      });
    },

    async publishCourse () {
      this.loading = true;
      let course = this.course
      if (!this.admin) {
        course = {
          ...course, 
          ...this.courseOptions
        }
      }
      
      let cohort = {
        name: course.title,
        description: course.description,
        organisation: "",
        students: [],
        courses: [course.id],
        image: {
          name: course.image?.name,
          url: course.image?.url,
        },
        teachers: [course.mappedBy.personId],
        courseCohort: true
      }

      course.status = "published"
      await this.saveCohort(cohort)
      .then((cohortId) => { 
        course.cohort = cohortId
        this.updateCourse(course)
      }).then(() => {
        this.setCurrentCourse(course)
        this.close()
      }).catch((error) => {
        console.error("Error updating document: ", error);
      });
    },

    async updateCourse(course) {
      return await db.collection("courses")
        .doc(course.id)
        .update(course)
        .then(() => {
          console.log("Document successfully updated!");
          this.$store.commit("setCurrentCourseId", course.id);
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Galaxy successfully updated",
            color: "baseAccent",
          });
        })
    },

    async saveCohort(cohort) {
      // Add a new document in collection "cohorts"
      const cohortId = await db.collection("cohorts")
        .add(cohort)
        .then( async (docRef) => {
          if (this.admin) {
            const person = await this.MXgetPersonByIdFromDB(cohort.teachers[0])
            console.log('teacher profile: ', person)
            this.sendCoursePublishedEmail(person, this.course)
            this.sendNewCohortEmail(person, cohort);
          } else {
            this.sendNewCohortEmail(this.person, cohort);
          } 
          return docRef.id
        })
      return cohortId
    },

    sendNewCohortEmail(profile, cohort) {
      const person = {
        ...profile,
        cohort: cohort.name,
        inviter: "Galaxy Maps Admin",
      };
      if (!person.accountType) person.accountType = 'teacher'
      const sendNewCohortEmail = functions.httpsCallable("sendNewCohortEmail");
      return sendNewCohortEmail(person);
    },
    
    sendNewSubmissionEmail(course) {
      let data = {
        author: course.mappedBy.name,
        title: course.title,
      }
      const sendNewSubmissionEmail = functions.httpsCallable("sendNewSubmissionEmail");
      return sendNewSubmissionEmail(data);
    },

    sendCoursePublishedEmail(person, course) {
      let data = {
        email: person.email,
        name: person.firstName + ' ' + person.lastName,
        course: course.title,
      }
      const sendCoursePublishedEmail = functions.httpsCallable("sendCoursePublishedEmail");
      return sendCoursePublishedEmail(data);
    },
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
  width: 100%;
  z-index: 3;
  margin-top: 20px
}

.label-text::v-deep label {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base) !important
}
</style>
