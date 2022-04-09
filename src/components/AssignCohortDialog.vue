<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <!-- ASSIGN COHORT -->
            <v-btn
              v-if="assignCohorts"
              outlined
              color="baseAccent"
              v-bind="attrs"
              v-on="on"
              class="assignButton d-inline-flex text-truncate"
            >
              <v-icon small> mdi-account-multiple-plus </v-icon>
            </v-btn>
            <!-- ASSIGN GALAXY -->
            <v-btn
              v-else-if="assignCourses"
              outlined
              color="baseAccent"
              v-bind="attrs"
              v-on="on"
              class="assignButton d-inline-flex text-truncate"
            >
              <v-icon left> mdi-chart-timeline-variant-shimmer </v-icon>
              ASSIGN GALAXY
            </v-btn>
          </template>

          <!-- NEW DIALOG -->
          <div v-if="assignCohorts" class="create-dialog">
            <v-tabs
              v-model="tab"
              fixed-tabs
              background-color="transparent"
              dark
              slider-color="baseAccent"
              class="mt-4"
            >
              <v-tab><p class="baseAccent--text tab">Individual</p></v-tab>
              <v-tab v-if="teacherCohorts.length"><p class="baseAccent--text tab">Cohort</p></v-tab>
              <!-- <v-tab><p class="baseAccent--text tab">Organisation</p></v-tab> -->
            </v-tabs>

            <v-tabs-items v-model="tab">
              <!-- Individual -->
              <v-tab-item>
                <!-- HEADER -->
                <div class="dialog-header">
                  <p class="dialog-title">Assign to a Person</p>
                  <div class="d-flex align-center">
                    <v-icon left color="missionAccent"
                      >mdi-information-variant</v-icon
                    >
                    <p class="dialog-description">
                      Assign this Galaxy Map to a Person using their e-mail
                      address
                    </p>
                  </div>
                </div>
                <div class="create-dialog-content">
                  <!-- TITLE -->
                  <!-- <p class="dialog-description">Person's E-mail address:</p> -->
                  <v-text-field
                    class="input-field"
                    outlined
                    dark
                    color="missionAccent"
                    v-model="person.email"
                    label="Person's email address"
                    light
                  ></v-text-field>
                  <div>
                    <p class="dialog-description">
                      Assign the student to a cohort 
                    </p>
                    <v-select
                      v-model="cohort"
                      :items="cohortOptions"
                      outlined
                      single-line
                      :disabled="!teacherCohorts.length"
                    >
                      <template v-slot:selection="{ item }">
                        <v-list-item-avatar v-if="item.image" tile>
                          <img 
                            :src="item.image.url"
                          >
                        </v-list-item-avatar>
                        <v-list-item-content>
                          <v-list-item-title v-html="item.name"></v-list-item-title>
                        </v-list-item-content>
                      </template>
                      <template v-slot:item="{ item }">
                        <v-list-item-avatar v-if="item.image" tile>
                          <img 
                            :src="item.image.url"
                          >
                        </v-list-item-avatar>
                        <v-list-item-content>
                          <v-list-item-title v-html="item.name"></v-list-item-title>
                        </v-list-item-content>
                      </template>
                    </v-select>
                  </div>
                </div>
                
                <!-- End create-dialog-content -->
                <!-- ACTION BUTTONS -->
                <div class="action-buttons">
                  <v-btn
                    v-if="assignCohorts"
                    outlined
                    color="green darken-1"
                    @click="assignCourseToPerson(person)"
                    :loading="loading"
                  >
                    <v-icon left> mdi-check </v-icon>
                    ASSIGN PERSON
                  </v-btn>

                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    class="ml-2"
                    @click="close"
                    :disabled="loading"
                  >
                    <v-icon left> mdi-close </v-icon>
                    Cancel
                  </v-btn>
                </div>
                <!-- End action-buttons -->
              </v-tab-item>
              <!-- Cohorts -->
              <v-tab-item>
                <!-- HEADER -->
                <div class="dialog-header">
                  <p class="dialog-title">Assign to a Cohort</p>
                  <div class="d-flex align-center">
                    <v-icon left color="missionAccent"
                      >mdi-information-variant</v-icon
                    >
                    <p class="dialog-description">
                      Assign this Galaxy Map to an entire Cohort of learners
                    </p>
                  </div>
                </div>
                <div class="create-dialog-content">
                  <!-- TITLE -->
                  <p class="dialog-description">Cohorts:</p>
                  <v-select
                    v-if="assignCohorts"
                    v-model="cohort"
                    :items="cohorts"
                  >
                    <template v-slot:selection="{ item }">
                      <v-img
                        v-if="item.image.url"
                        :src="item.image.url"
                        style="object-fit: cover"
                        width="40"
                      />
                      <v-icon v-else>mdi-star-three-points</v-icon>
                      <p class="ml-4">{{ item.title }}</p>
                    </template>
                    <template v-slot:item="{ item }">
                      <v-img
                        v-if="item.image.url"
                        :src="item.image.url"
                        style="object-fit: cover"
                        width="40"
                      />
                      <v-icon v-else>mdi-star-three-points</v-icon>
                      <p class="ml-4 mt-4">{{ item.title }}</p>
                    </template>
                  </v-select>
                </div>
                <!-- ACTION BUTTONS -->
                <div class="action-buttons">
                  <v-btn
                    v-if="assignCohorts"
                    outlined
                    color="green darken-1"
                    @click="assignCourseToCohort(cohort)"
                    :loading="loading"
                  >
                    <v-icon left> mdi-check </v-icon>
                    ASSIGN COHORT
                  </v-btn>

                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    class="ml-2"
                    @click="close"
                    :disabled="loading"
                  >
                    <v-icon left> mdi-close </v-icon>
                    Cancel
                  </v-btn>
                </div>
                <!-- End action-buttons -->
              </v-tab-item>
            </v-tabs-items>

            <!-- </div> -->
          </div>
          <!-- End create-dialog -->

          <div v-else-if="assignCourses" class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">Assign this Cohort to a Course</p>
              <div class="d-flex align-center">
                <p class="dialog-description">
                  Assign all students in this Cohort to an exisiting galaxy map
                </p>
              </div>
            </div>

            <div class="create-dialog-content">
              <p class="dialog-description">Galaxy Maps:</p>
              <v-select
                v-if="assignCourses"
                v-model="course"
                :items="courses"
                dark
              >
                 <template v-slot:selection="{ item }">
                  <v-list-item-avatar tile>
                    <img 
                      v-if="item.image.url" 
                      :src="item.image.url"
                    >
                    <v-icon v-else> mdi-star-three-points </v-icon>
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title v-html="item.title"></v-list-item-title>
                  </v-list-item-content>
                </template>
                <template v-slot:item="{ item }">
                  <v-list-item-avatar tile>
                    <img 
                      v-if="item.image.url"
                      :src="item.image.url"
                    >
                    <v-icon v-else> mdi-star-three-points </v-icon>
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title v-html="item.title"></v-list-item-title>
                  </v-list-item-content>
                </template>
              </v-select>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <v-btn
                v-if="assignCourses"
                outlined
                color="green darken-1"
                @click="assignCourseToCohort(null, course)"
                :loading="loading"
              >
                <v-icon left> mdi-check </v-icon>
                ASSIGN GALAXY MAP
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-2"
                @click="close"
                :disabled="loading"
              >
                <v-icon left> mdi-close </v-icon>
                Cancel
              </v-btn>
            </div>
          </div>
          <!-- End Assign Courses create-dialog -->
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import firebase from "firebase/app";

import { mapState, mapActions } from "vuex";
import { db, storage } from "../store/firestoreConfig";
import { dbMixins } from "../mixins/DbMixins";

export default {
  name: "AssignCohortDialog",
  mixins: [dbMixins],
  props: ["assignCohorts", "assignCourses"],
  data: () => ({
    tab: null,
    dialog: false,
    loading: false,

    person: {
      id: "",
      email: "",
    },
    cohort: "",
    course: "",
    teacherCohorts: []
  }),
  async mounted () {
    if (this.assignCourses) {
      // TODO: we need to think about what courses are available to assign for a teacher
      await this.$store.dispatch("bindAllCourses");
    } else if (this.assignCohorts) {
      this.teacherCohorts = this.cohorts.filter(cohort => cohort.teacher && !cohort.courseCohort)
    } 
  },
  computed: {
    ...mapState([
      "courses",
      "cohorts",
      "organisations",
      "currentCourseId",
      "currentCourse",
      "currentCohort",
      "personsCourses",
    ]),
    cohortOptions () {
      // teacherCohorts && the courseCohort
      let courseCohort = this.cohorts.filter(cohort => cohort.id === this.currentCourse.cohort)
      console.log('courseCohort: ', courseCohort)
      this.cohort = courseCohort[0]
      console.log('cohort: ', this.cohort)
      return [
        ...courseCohort,
        ...this.teacherCohorts
      ]
    }
  },
  methods: {
    close() {
      this.dialog = false;
      this.loading = false;
      this.person = {
        id: "",
        email: "",
      };
      (this.cohort = ""), (this.course = "");
    },
    async assignCourseToPerson(person) {
      this.loading = true;

      // If we dont already have the students Id, check if they already have an account using their email
      const personExists = await this.MXgetPersonByEmail(person.email);
      if (personExists) {
        this.handleAssignment(personExists, this.currentCourse);
      } else {
        //create the persons account
        this.MXcreateUser(person).then((person) => {
          this.handleAssignment(person, this.currentCourse);
        });
      }
    },

    handleAssignment(person, course) {
      this.MXassignCourseToStudent(person, course)
        .then(() => {
          this.MXaddExistingUserToCohort(person, this.cohort);
        })
        .then(() => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Individual assigned to Course",
            color: "baseAccent",
          });
          this.close();
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          // snackbar message
          this.$store.commit("setSnackbar", {
            show: true,
            text: error,
            color: "pink",
          });
          this.close();
        });
    },
    assignCourseToCohort(cohort, course) {
      if (!cohort) cohort = this.currentCohort;
      if (!course) course = this.currentCourse;
      this.loading = true;
      // Add a course to a cohort
      db.collection("cohorts")
        .doc(cohort.id)
        .update({
          courses: firebase.firestore.FieldValue.arrayUnion(course.id),
        })
        .then(() => {
          // add courses as assignedCourse to each student in the cohort
          if (cohort.students?.length) {
            cohort.students.forEach(async (student) => {
              let person = await this.MXgetPersonByIdFromDB(student);
              return this.MXassignCourseToStudent(person, course);
            });
          }
        })
        .then(() => {
          console.log("courses added to all students!");
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Cohort assigned to Course",
            color: "baseAccent",
          });
          this.close();
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          this.$store.commit("setSnackbar", {
            show: true,
            text: error,
            color: "pink",
          });
        });
    },
  },
};
</script>

<style lang="scss" scoped>
/* Dialog */
.assignCohortDialog {
  color: black;
  background: lightGrey;
  display: flex;
  flex-wrap: wrap;
}

.tile {
  width: 100%;
  min-height: 200px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: black;
  padding: 20px;
  text-transform: uppercase;
  font-size: 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

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
    // border-bottom: 1px solid var(--v-missionAccent-base);
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
.assignButton {
  max-width: 100%;
}
</style>
