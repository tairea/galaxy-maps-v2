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
              <v-icon small> {{ mdiAccountMultiplePlus }} </v-icon>
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
              <v-icon left> {{ mdiChartTimelineVariantShimmer }} </v-icon>
              ASSIGN GALAXY
            </v-btn>
          </template>

          <!-- ===== ASSIGN COHORT TO COURSE (EG. FROM COURSE VIEW) ===== -->
          <div v-if="assignCohorts" class="create-dialog">
            <v-tabs
              v-model="tab"
              fixed-tabs
              background-color="transparent"
              dark
              slider-color="baseAccent"
              class="mt-4"
            >
              <v-tab>
                <p class="baseAccent--text tab">Individual</p>
              </v-tab>
              <v-tab v-if="teacherCohorts.length">
                <p class="baseAccent--text tab">Cohort</p>
              </v-tab>
              <!-- <v-tab><p class="baseAccent--text tab">Organisation</p></v-tab> -->
            </v-tabs>

            <v-tabs-items v-model="tab">
              <!-- Individual -->
              <v-tab-item>
                <!-- HEADER -->
                <div class="dialog-header">
                  <p class="dialog-title">Assign to a Navigator</p>
                  <div class="d-flex align-center">
                    <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                    <p class="dialog-description">
                      Assign this Galaxy Map to a Navigator using their e-mail address
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
                    v-model="profile.email"
                    label="Person's email address"
                    light
                  ></v-text-field>
                  <div>
                    <p class="dialog-description">Assign the Navigator to squad</p>
                    <div class="d-flex align-center">
                      <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                      <p class="dialog-description py-2">
                        Navigator progression is tracked at the Squad level
                      </p>
                    </div>
                    <v-select
                      v-if="currentCourse != null"
                      v-model="cohort"
                      :items="cohortOptions"
                      outlined
                      single-line
                      :disabled="!teacherCohorts.length"
                      class="cohort-select"
                    >
                      <template v-slot:selection="{ item }">
                        <v-list-item-avatar tile>
                          <img v-if="item.image && item.image.url" :src="item.image.url" />
                          <v-icon v-else>{{ mdiStarThreePoints }}</v-icon>
                        </v-list-item-avatar>
                        <v-list-item-content
                          ><p class="cohortAccent--text">{{ item.name }}</p>
                        </v-list-item-content>
                      </template>
                      <template v-slot:item="{ item }">
                        <v-list-item-avatar tile>
                          <img v-if="item.image && item.image.url" :src="item.image.url" />
                          <v-icon v-else>{{ mdiStarThreePoints }}</v-icon>
                        </v-list-item-avatar>
                        <v-list-item-content>
                          <p class="cohortAccent--text">{{ item.name }}</p>
                        </v-list-item-content>
                      </template>
                    </v-select>
                  </div>
                </div>

                <!-- End create-dialog-content -->
                <!-- ACTION BUTTONS -->
                <div class="action-buttons">
                  <v-btn
                    v-if="assignCohorts && profile.email"
                    outlined
                    color="baseAccent"
                    @click="assignCourseToPerson(profile)"
                    :loading="loading"
                  >
                    <v-icon left> {{ mdiCheck }} </v-icon>
                    ASSIGN PERSON
                  </v-btn>

                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    class="ml-2"
                    @click="close"
                    :disabled="loading"
                  >
                    <v-icon left> {{ mdiClose }} </v-icon>
                    Cancel
                  </v-btn>
                </div>
                <!-- End action-buttons -->
              </v-tab-item>
              <!-- Cohorts -->
              <v-tab-item>
                <!-- HEADER -->
                <div class="dialog-header">
                  <p class="dialog-title">Assign to a Squad</p>
                  <div class="d-flex align-center">
                    <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                    <p class="dialog-description">
                      Assign this Galaxy Map to an entire
                      <span class="cohortAccent--text">Squad</span> of Navigators
                    </p>
                  </div>
                </div>
                <div class="create-dialog-content">
                  <!-- TITLE -->
                  <p class="dialog-description">Squads:</p>
                  <v-select v-if="assignCohorts" v-model="cohort" :items="cohorts">
                    <template v-slot:selection="{ item }">
                      <v-list-item-avatar tile>
                        <img v-if="item.image && item.image.url" :src="item.image.url" />
                        <v-icon v-else>{{ mdiStarThreePoints }}</v-icon>
                      </v-list-item-avatar>
                      <v-list-item-content
                        ><p class="cohortAccent--text">{{ item.name }}</p>
                      </v-list-item-content>
                    </template>
                    <template v-slot:item="{ item }">
                      <v-list-item-avatar tile>
                        <img v-if="item.image && item.image.url" :src="item.image.url" />
                        <v-icon v-else>{{ mdiStarThreePoints }}</v-icon>
                      </v-list-item-avatar>
                      <v-list-item-content>
                        <p class="cohortAccent--text">{{ item.name }}</p>
                      </v-list-item-content>
                    </template>
                  </v-select>
                </div>
                <!-- ACTION BUTTONS -->
                <div class="action-buttons">
                  <v-btn
                    v-if="assignCohorts"
                    outlined
                    color="baseAccent"
                    @click="assignCourseToCohort(cohort)"
                    :loading="loading"
                  >
                    <v-icon left> {{ mdiCheck }} </v-icon>
                    ASSIGN SQUAD
                  </v-btn>

                  <v-btn
                    outlined
                    :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                    class="ml-2"
                    @click="close"
                    :disabled="loading"
                  >
                    <v-icon left> {{ mdiClose }} </v-icon>
                    Cancel
                  </v-btn>
                </div>
                <!-- End action-buttons -->
              </v-tab-item>
            </v-tabs-items>
          </div>

          <!-- ===== ASSIGN COURSE TO COHORT (EG. FROM COHORT VIEW) ===== -->
          <div v-else-if="assignCourses" class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                Add another Galaxy Map to Squad:
                <span class="cohortAccent--text">{{ inThisCohort.name }}</span>
              </p>
              <div class="d-flex align-center">
                <p class="dialog-description">Track this Squad through another Galaxy Map</p>
              </div>
            </div>

            <div class="create-dialog-content">
              <p class="dialog-description">Galaxy Maps:</p>
              <v-select v-if="assignCourses" v-model="course" :items="courses" dark>
                <template v-slot:selection="{ item }">
                  <v-list-item-avatar tile>
                    <img v-if="item.image.url" :src="item.image.url" />
                    <v-icon v-else> mdiStarThreePoints </v-icon>
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title v-html="item.title"></v-list-item-title>
                  </v-list-item-content>
                </template>
                <template v-slot:item="{ item }">
                  <v-list-item-avatar tile>
                    <img v-if="item.image.url" :src="item.image.url" />
                    <v-icon v-else> {{ mdiStarThreePoints }} </v-icon>
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
                color="baseAccent"
                @click="assignCourseToCohort(null, course)"
                :loading="loading"
              >
                <v-icon left> {{ mdiCheck }} </v-icon>
                ASSIGN GALAXY MAP
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-2"
                @click="close"
                :disabled="loading"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
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
import {
  fetchCourses,
  fetchCohortByCohortId,
  fetchCourseByCourseId,
  fetchPersonByEmail,
  createPerson,
  addPersonToCohort,
  assignCourseToPerson,
} from "@/lib/ff";
import { db, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import {
  mdiClose,
  mdiCheck,
  mdiStarThreePoints,
  mdiInformationVariant,
  mdiAccountMultiplePlus,
  mdiChartTimelineVariantShimmer,
} from "@mdi/js";
import firebase from "firebase/compat/app";
import { doc, updateDoc } from "firebase/firestore";
import { mapActions, mapState } from "pinia";

export default {
  name: "AssignCohortDialog",
  props: ["assignCohorts", "assignCourses", "cohorts", "inThisCohort"],
  data: () => ({
    //icons
    mdiClose,
    mdiCheck,
    mdiStarThreePoints,
    mdiInformationVariant,
    mdiAccountMultiplePlus,
    mdiChartTimelineVariantShimmer,
    tab: null,
    dialog: false,
    loading: false,

    profile: {
      id: "",
      email: "",
    },
    cohort: null,
    course: null,
    courses: [],
    teacherCohorts: [],
    currentCourse: null,
  }),
  async mounted() {
    if (this.assignCourses) {
      this.courses = await fetchCourses();
    } else if (this.assignCohorts) {
      this.teacherCohorts = this.cohorts.filter(
        (cohort) => cohort.teachers.includes(this.person.id) && !cohort.courseCohort,
      );
    }
    this.currentCourse = await fetchCourseByCourseId(this.currentCourseId);
  },
  watch: {
    dialog(newVal) {
      if (newVal && !this.cohort)
        this.cohort = this.cohorts?.find((cohort) => cohort.id == this.currentCohortId);
    },
  },
  computed: {
    ...mapState(useRootStore, ["currentCourseId", "currentCohortId", "person"]),
    cohortOptions() {
      // teacherCohorts && the courseCohort
      this.cohort = this.cohorts.find((cohort) => cohort.id === this.currentCourse.cohort);
      return [this.cohort, ...this.teacherCohorts];
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    close() {
      this.dialog = false;
      this.loading = false;
      this.profile = {
        id: "",
        email: "",
      };
      // this.cohort = null;
      this.course = null;
    },
    async assignCourseToPerson(profile) {
      this.loading = true;
      console.log('assigning course to person')

      // If we dont already have the students Id, check if they already have an account using their email
      const personExists = await fetchPersonByEmail(profile.email);
      console.log({personExists})
      if (personExists) {
        await this.handleAssignment(personExists, this.currentCourse);
      } else {
        //create the persons account
        profile.inviter = this.person.firstName + " " + this.person.lastName;
        console.log({profile})

        const person = await createPerson(profile);
        console.log("1. person created: ", person);
        await this.handleAssignment(person, this.currentCourse);
      }
    },

    async handleAssignment(person, course) {
      try {
        await assignCourseToPerson(person.id, course.id);
        await addPersonToCohort(person.id, this.cohort.id);
        if (this.cohort.courses.length) {
          // Possible optimize to make this concurrent instead of sequential
          for (const courseId of this.cohort.courses) {
            // dont need to assign current course again
            if (courseId === course.id) continue;
            console.log("assigning cohort's course with id", courseId);
            await assignCourseToPerson(person.id, courseId);
          }
        }

        this.setSnackbar({
          show: true,
          text: `${person.firstName} assigned to ${course.title} Galaxy`,
          color: "baseAccent",
        });
        this.sendNewCohortEmail(person)
        this.$emit("newAssignment", person);
        this.close();
      } catch (error) {
        console.error("Error writing document: ", error);
        // snackbar message
        this.setSnackbar({
          show: true,
          text: error,
          color: "pink",
        });
        this.close();
      }
    },
    sendNewCohortEmail(profile) {
      console.log('sending email to: ', profile)
      const person = {
        ...profile,
        cohort: this.cohort.name,
        inviter: profile.inviter || "Galaxy Maps Admin",
      };
      const sendNewCohortEmail = functions.httpsCallable("sendNewCohortEmail");
      return sendNewCohortEmail(person);
    },
    async assignCourseToCohort(cohort, course) {
      if (!cohort) {
        cohort = await fetchCohortByCohortId(this.currentCohortId);
      }
      if (!course) course = this.currentCourse;
      this.loading = true;

      try {
        // Add a course to a cohort
        await updateDoc(doc(db, "cohorts", cohort.id), {
          courses: firebase.firestore.FieldValue.arrayUnion(course.id),
        });
        // add courses as assignedCourse to each student in the cohort
        if (cohort.students?.length) {
          for (const studentId of cohort.students) {
            await assignCourseToPerson(studentId, course.id);
          }
        }

        console.log("courses added to all students!");
        this.setSnackbar({
          show: true,
          text: "Cohort assigned to Course",
          color: "baseAccent",
        });
        this.close();
      } catch (error) {
        console.error("Error writing document: ", error);
        this.setSnackbar({
          show: true,
          text: error,
          color: "pink",
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.cohort-select ::v-deep .v-list-item__content {
  min-width: 250px;
}

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
