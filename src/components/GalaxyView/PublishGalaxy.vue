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
        @click="getTopicsWithoutTasks"
      >
        publish galaxy
      </v-btn>
      <!-- ASSIGN GALAXY -->
    </template>

    <!-- NOT!!!! OK TO PUBLISH DIALOG -->
    <div v-if="topicsWithoutTasks.length > 0" class="create-dialog">
      <div class="dialog-header">
        <div class="d-flex mb-4">
          <p class="dialog-title ma-0">Important</p>
          <v-icon color="missionAccent" class="ml-2">mdi-alert-outline</v-icon>
        </div>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">mdi-information-variant</v-icon>
          <p class="dialog-description">
            System's must have <strong>AT LEAST ONE MISSION</strong>
          </p>
        </div>
      </div>
      <v-divider dark color="missionAccent"></v-divider>
      <div class="create-dialog-content">
        <div>
          <p class="caption mb-2 red--text">
            The following Systems have no Missions:
          </p>

          <ul>
            <li
              v-for="topic in topicsWithoutTasks"
              :key="topic.id"
              class="overline"
            >
              {{ topic.label }}
            </li>
          </ul>

          <p class="caption mt-2 mb-0">
            Please create at least one Mission for each of these Systems
          </p>
        </div>
      </div>
      <!-- ACTION BUTTONS -->
      <div class="action-buttons">
        <v-btn
          outlined
          :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
          class="ml-2"
          @click="close"
          :disabled="loading"
        >
          <v-icon left> mdi-close </v-icon>
          OK
        </v-btn>
      </div>
    </div>
    <!-- OK TO PUBLISH DIALOG -->
    <div v-else class="create-dialog">
      <div class="dialog-header">
        <p class="dialog-title">publish galaxy</p>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">mdi-information-variant</v-icon>
          <p v-if="admin" class="dialog-description">
            Publish
            <span style="font-weight: 600; color: var(--v-galaxyAccent-base)">{{
              course.title
            }}</span>
            galaxy to make publically visible
          </p>
          <p v-else class="dialog-description">
            Publish
            <span style="font-weight: 600; color: var(--v-galaxyAccent-base)">{{
              course.title
            }}</span>
            galaxy to make it visible to others
          </p>
        </div>
      </div>
      <v-divider dark color="missionAccent"></v-divider>
      <div v-if="!admin" class="create-dialog-content">
        <!-- LISTED -->
        <div>
          <p class="caption mb-2">
            Choose whether you would like this galaxy to be:
          </p>
          <p class="caption ma-0"><strong>PRIVATE</strong> (invite only), or</p>
          <p class="caption ma-0">
            <strong>PUBLIC</strong> (discoverable by all Galaxy Maps users)
          </p>

          <v-radio-group
            row
            v-model="courseOptions.public"
            color="missionAccent"
            :light="!dark"
            :dark="dark"
          >
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
        <p class="caption ma-0" v-if="courseOptions.public">
          <i
            >(Public courses need to be submitted for review by Galaxy Map
            moderators)</i
          >
        </p>
      </div>
      <!-- ACTION BUTTONS -->
      <div v-if="admin" class="action-buttons">
        <v-btn
          outlined
          color="baseAccent"
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
          color="baseAccent"
          @click="submitCourse()"
          :loading="loading"
        >
          <v-icon left> mdi-send </v-icon>
          SUBMIT
        </v-btn>
        <v-btn
          v-else
          outlined
          color="baseAccent"
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
import { mapGetters, mapMutations, mapState } from "vuex";

import { dbMixins } from "@/mixins/DbMixins";

export default {
  name: "PublishGalaxy",
  mixins: [dbMixins],
  props: ["course", "courseTasks"],
  data: () => ({
    dialog: false,
    loading: false,
    courseOptions: {
      public: false,
    },
    topicsWithoutTasks: 0,
  }),
  computed: {
    ...mapGetters(["user"]),
    ...mapState(["currentCourseNodes"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    admin() {
      return this.user.data.admin;
    },
  },
  watch: {
    // courseTasks: function (n, o) {
    //   console.log("from watch publish. course TASKS", n);
    // },
    // currentCourseNodes: function (n, o) {
    //   console.log("from watch publish. course NODES", n);
    // },
  },
  mounted() {
    // console.log("from publish. course TASKS", this.courseTasks);
  },
  methods: {
    ...mapMutations(["setCurrentCourse"]),
    getTopicsWithoutTasks() {
      // copy nodes
      let splicedNodes = [...this.currentCourseNodes];
      // loop tasks
      for (const task of this.courseTasks) {
        // get index of nodes that have tasks
        var index = splicedNodes.findIndex(function (node) {
          return node.id === task.topicId;
        });
        // remove topics that have tasks
        if (index !== -1) splicedNodes.splice(index, 1);
      }
      // assign splicedNodes (nodes/topics that DO NOT have tasks)
      this.topicsWithoutTasks = splicedNodes;
    },
    close() {
      this.dialog = false;
      this.loading = false;
      this.courseOptions = {
        public: false,
      };
    },

    async submitCourse() {
      this.loading = true;
      let course = {
        ...this.course,
        ...this.courseOptions,
      };
      course.status = "submitted";
      await this.updateCourse(course)
        .then(() => {
          this.sendNewSubmissionEmail(course);
        })
        .then(() => {
          this.$store.commit("setCurrentCourseId", course.id);
          this.$store.commit("setCurrentCourse", course);
          this.close();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    },

    async publishCourse() {
      this.loading = true;
      let course = this.course;
      if (!this.admin) {
        course = {
          ...course,
          ...this.courseOptions,
        };
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
        courseCohort: true,
      };

      course.status = "published";
      if (!course.cohort) {
        await this.saveCohort(cohort)
          .then((cohortId) => {
            course.cohort = cohortId;
            this.updateCourse(course);
          })
          .then(() => {
            this.setCurrentCourse(course);
            this.close();
          })
          .catch((error) => {
            console.error("Error updating document: ", error);
          });
      } else {
        this.updateCourse(course)
          .then(() => {
            this.setCurrentCourse(course);
            this.close();
          })
          .catch((error) => {
            console.error("Error updating document: ", error);
          });
      }
    },

    async updateCourse(course) {
      return await db
        .collection("courses")
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
        });
    },

    async saveCohort(cohort) {
      // Add a new document in collection "cohorts"
      const cohortId = await db
        .collection("cohorts")
        .add(cohort)
        .then(async (docRef) => {
          if (this.admin) {
            const person = await this.MXgetPersonByIdFromDB(cohort.teachers[0]);
            person.inviter = "Galaxy Maps Admin";
            this.sendCoursePublishedEmail(person, this.course);
            this.sendNewCohortEmail(person, cohort);
          } else {
            this.sendNewCohortEmail(this.person, cohort);
          }
          return docRef.id;
        });
      return cohortId;
    },

    sendNewCohortEmail(profile, cohort) {
      const person = {
        ...profile,
        cohort: cohort.name,
      };
      const sendNewCohortEmail = functions.httpsCallable("sendNewCohortEmail");
      return sendNewCohortEmail(person);
    },

    sendNewSubmissionEmail(course) {
      let data = {
        author: course.mappedBy.name,
        title: course.title,
      };
      const sendNewSubmissionEmail = functions.httpsCallable(
        "sendNewSubmissionEmail"
      );
      return sendNewSubmissionEmail(data);
    },

    sendCoursePublishedEmail(person, course) {
      let data = {
        email: person.email,
        name: person.firstName + " " + person.lastName,
        course: course.title,
      };
      const sendCoursePublishedEmail = functions.httpsCallable(
        "sendCoursePublishedEmail"
      );
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
  margin-top: 20px;
}

.label-text::v-deep label {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base) !important;
}
</style>
