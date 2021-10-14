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
            >
              <v-icon small>
                mdi-account-multiple-plus
              </v-icon>
            </v-btn>
            <!-- ASSIGN GALAXY -->
            <v-btn
              v-else-if="assignCourses"
              outlined
              color="baseAccent"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon left>
                mdi-chart-timeline-variant-shimmer
              </v-icon>
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
              <v-tab><p class="baseAccent--text tab">Cohort</p></v-tab>
              <v-tab><p class="baseAccent--text tab">Organisation</p></v-tab>
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
                  <p class="dialog-description">Person's E-mail address:</p>
                  <v-text-field
                    class="input-field"
                    solo
                    color="missionAccent"
                    v-model="person.email"
                    background-color="white"
                    light
                  ></v-text-field>
                </div>
                <!-- End create-dialog-content -->
                <!-- ACTION BUTTONS -->
                <div class="action-buttons">
                  <v-btn
                    v-if="assignCohorts"
                    outlined
                    color="green darken-1"
                    @click="assignPersonToCourse(person)"
                    :loading="loading"
                  >
                    <v-icon left>
                      mdi-check
                    </v-icon>
                    ASSIGN PERSON
                  </v-btn>

                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    class="ml-2"
                    @click="cancel"
                    :disabled="loading"
                  >
                    <v-icon left>
                      mdi-close
                    </v-icon>
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
                      Assign this Galaxy Map to a specific Cohort that you have
                      already created.
                    </p>
                  </div>
                </div>
                <div class="create-dialog-content">
                  <!-- TITLE -->
                  <p class="dialog-description">Cohorts:</p>
                  <v-select
                    v-if="assignCohorts"
                    v-model="cohort.id"
                    :items="cohorts"
                    item-text="name"
                    item-value="id"
                  >
                  </v-select>
                </div>
                <!-- ACTION BUTTONS -->
                <div class="action-buttons">
                  <v-btn
                    v-if="assignCohorts"
                    outlined
                    color="green darken-1"
                    @click="assignCohortToCourse(cohort)"
                    :loading="loading"
                  >
                    <v-icon left>
                      mdi-check
                    </v-icon>
                    ASSIGN COHORT
                  </v-btn>

                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    class="ml-2"
                    @click="cancel"
                    :disabled="loading"
                  >
                    <v-icon left>
                      mdi-close
                    </v-icon>
                    Cancel
                  </v-btn>
                </div>
                <!-- End action-buttons -->
              </v-tab-item>

              <!-- Organisations -->
              <v-tab-item>
                <!-- HEADER -->
                <div class="dialog-header">
                  <p class="dialog-title">Assign to an Organisation</p>
                  <div class="d-flex align-center">
                    <v-icon left color="missionAccent"
                      >mdi-information-variant</v-icon
                    >
                    <p class="dialog-description">
                      Assign this Galaxy Map to an Organisation.<br />(This will
                      assign this Galaxy Map to all Cohorts and Individuals in
                      this Organisation.)
                    </p>
                  </div>
                </div>
                <div class="create-dialog-content">
                  <!-- TITLE -->
                  <p class="dialog-description">Organsations:</p>
                  <v-select
                    v-if="assignCohorts"
                    v-model="organisation.id"
                    :items="organisations"
                    item-text="name"
                    item-value="id"
                  >
                  </v-select>
                </div>
                <!-- End create-dialog-content -->
                <!-- ACTION BUTTONS -->
                <div class="action-buttons">
                  <v-btn
                    v-if="assignCohorts"
                    outlined
                    color="green darken-1"
                    @click="assignOrganisationToCourse(organisation)"
                    :loading="loading"
                  >
                    <v-icon left>
                      mdi-check
                    </v-icon>
                    ASSIGN ORGANISATION
                  </v-btn>

                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    class="ml-2"
                    @click="cancel"
                    :disabled="loading"
                  >
                    <v-icon left>
                      mdi-close
                    </v-icon>
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
                    <v-icon left color="missionAccent"
                      >mdi-information-variant</v-icon
                    >
                    <p class="dialog-description">
                      Assign this Cohort to a specific Galaxy Map that you have
                      already created.
                    </p>
                  </div>
                </div>
                <div class="create-dialog-content">
                  <!-- TITLE -->
                  <p class="dialog-description">Galaxy Maps:</p>
                  <v-select
                    v-if="assignCohorts"
                    v-model="courses.id"
                    :items="courses"
                    item-text="name"
                    item-value="id"
                  >
                  </v-select>
                </div>
                <!-- ACTION BUTTONS -->
                <div class="action-buttons">
                  <v-btn
                    v-if="assignCourses"
                    outlined
                    color="green darken-1"
                    @click="assignCourse(course)"
                    :loading="loading"
                  >
                    <v-icon left>
                      mdi-check
                    </v-icon>
                    ASSIGN GALAXY MAP
                  </v-btn>

                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    class="ml-2"
                    @click="cancel"
                    :disabled="loading"
                  >
                    <v-icon left>
                      mdi-close
                    </v-icon>
                    Cancel
                  </v-btn>
                </div>
          </div>
          <!-- End Assign Courses create-dialog -->

        </v-dialog>

        <!-- DIALOG (TODO: make as a component)-->
        <!-- <div class="assignCohortDialog"> -->
        <!-- AVAILABLE COHORTS -->
        <!-- <div class="tile">
            <v-select
              v-if="assignCohorts"
              v-model="cohort.id"
              :items="cohorts"
              item-text="name"
              item-value="id"
              label="COHORTS"
            >
            </v-select>
            <v-select
              v-else-if="assignCourses"
              v-model="course.id"
              :items="courses"
              item-text="title"
              item-value="id"
              label="GALAXY MAP"
            >
            </v-select>
          </div> -->

        <!-- SAVE -->
        <!-- <div class="tile saveButton">
            <v-btn
              v-if="assignCohorts"
              outlined
              color="green darken-1"
              @click="assignCohortToCohort(cohort)"
            >
              <v-icon left>
                mdi-check
              </v-icon>
              ADD COHORT
            </v-btn>
            <v-btn
              v-else-if="assignCourses"
              outlined
              color="green darken-1"
              @click="assignCourse(course)"
            >
              <v-icon left>
                mdi-check
              </v-icon>
              ADD GALAXY MAP
            </v-btn>
          </div> -->
        <!-- </div> -->
        <!-- </v-dialog> -->
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import firebase from "firebase/app";

import { mapState, mapGetters } from "vuex";
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "AssignCohortDialog",
  props: ["assignCohorts", "assignCourses"],
  data: () => ({
    tab: null,
    dialog: false,
    loading: false,
    person: {
      id: "",
      email: "",
    },
    cohort: {
      id: "",
    },
    organisation: {
      id: "",
    },
    course: {
      id: "",
    },
  }),
  computed: {
    ...mapState([
      "courses",
      "cohorts",
      "organisations",
      "currentCourseId",
      "currentCohortId",
    ]),
    // ...mapState(["currentCohortId", "currentCourseId", "courses", "cohorts"]),
    ...mapGetters(["getCohortsByOrganisationId"]),
  },
  methods: {
    cancel() {
      this.dialog = false;
    },
    async assignPersonToCourse(person) {
      this.loading = true;
      // check if person exists in database. if they do. get their id then update their assignedCourses
      await db
        .collection("people")
        .where("email", "==", person.email)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
            this.person.id = doc.id;
          });
          // now got the persons id. assigned them to course
          db.collection("people")
            .doc(this.person.id)
            .update({
              assignedCourses: firebase.firestore.FieldValue.arrayUnion(
                this.currentCourseId
              ),
            })
            .then(() => {
              console.log(
                "Document successfully updated! Person assigned to Course!"
              );
              this.loading = false;
              this.dialog = false;
              // empty field
              this.person.email = "";
            })
            .catch((error) => {
              console.error("Error writing document: ", error);
            });
        })
        .catch((error) => {
          console.log("Error getting documents: ", error);
        });

      // if not create new id (new person in people collection)
      db.collection("people")
        .add({
          email: person.email,
          assignedCourses: firebase.firestore.FieldValue.arrayUnion(
            this.currentCourseId
          ),
        })
        .then(() => {
          console.log(
            "Document successfully updated! New Person Created and assigned to Course!"
          );
          this.loading = false;
          this.dialog = false;
          // empty field
          this.person.email = "";
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    assignCohortToCourse(cohort) {
      this.loading = true;
      // Add a cohort into collection "courses"
      db.collection("cohorts")
        .doc(cohort.id)
        .update({
          courses: firebase.firestore.FieldValue.arrayUnion(
            this.currentCourseId
          ),
        })
        .then(() => {
          console.log(
            "Document successfully updated! Course assigned to Cohort!"
          );
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      // this.course = {};
    },
    assignOrganisationToCourse(organisation) {
      this.loading = true;
      // Add a cohort into collection "courses"
      db.collection("organisations")
        .doc(organisation.id)
        .update({
          courses: firebase.firestore.FieldValue.arrayUnion(
            this.currentCourseId
          ),
        })
        .then(() => {
          console.log(
            "Document successfully updated! Organisation assigned to Course!"
          );
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      // this.course = {};
    },
    assignCourse(course) {
      this.loading = true;
      // Add a cohort into collection "courses"
      db.collection("cohorts")
        .doc(this.currentCohortId)
        .update({
          courses: firebase.firestore.FieldValue.arrayUnion(course.id),
        })
        .then(() => {
          console.log(
            "Document successfully updated! Cohort assigned to Course!"
          );
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      // this.course = {};
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

.tab {
  // padding: 20px 0px;
}
</style>
