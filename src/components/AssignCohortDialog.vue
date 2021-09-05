<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="40%" light>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <!-- ASSIGN COHORT -->
            <v-btn v-if="assignCohorts" outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon small>
                mdi-account-multiple-plus
              </v-icon>
              <!-- ASSIGN COHORT -->
            </v-btn>
            <!-- ASSIGN GALAXY -->
            <v-btn v-else-if="assignCourses" outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon left>
                mdi-chart-timeline-variant-shimmer
              </v-icon>
              ASSIGN GALAXY
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div class="assignCohortDialog">
            <!-- AVAILABLE COHORTS -->
            <div class="tile" >
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
            </div>

            <!-- SAVE -->
            <div class="tile saveButton">
              <v-btn
              v-if="assignCohorts"
                outlined
                color="green darken-1"
                @click="assignCohort(cohort)"
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
            </div>
          </div>
        </v-dialog>
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
    dialog: false,
    cohort: {
      id: ""
    },
    course: {
      id: ""
    }
  }),
    computed: {
    ...mapState(["courses", "cohorts", "currentCourseId", "currentCohortId"]),
    // ...mapState(["currentCohortId", "currentCourseId", "courses", "cohorts"]),
    ...mapGetters(["getCohortsByOrganisationId"]),
  },
  methods: {
    assignCohort(cohort) {
      // Add a cohort into collection "courses"
      db.collection("cohorts")
        .doc(cohort.id)
        .update({
          courses: firebase.firestore.FieldValue.arrayUnion(this.currentCourseId)
        })
        .then(() => {
          console.log("Document successfully updated! Cohort assigned to Course!");
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.course = {};
    },
    assignCourse(course) {
      // Add a cohort into collection "courses"
      db.collection("cohorts")
        .doc(this.currentCohortId)
        .update({
          courses: firebase.firestore.FieldValue.arrayUnion(course.id)
        })
        .then(() => {
          console.log("Document successfully updated! Cohort assigned to Course!");
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.course = {};
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

</style>
