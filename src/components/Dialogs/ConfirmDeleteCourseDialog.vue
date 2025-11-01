<template>
  <v-dialog v-model="dialog" width="40%" light>
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <span class="dialog-title">Remove Galaxy Map from Squad?</span>
      </div>
      <div class="d-flex align-start pa-4">
        <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
        <div>
          <p class="dialog-description">
            Are you sure you want to <span class="red--text">REMOVE</span>
            <span class="galaxyAccent--text overline">
              {{ course.title }}
            </span>
            from this Squad?
          </p>
          <p class="dialog-description">
            This will also remove the Galaxy Map from all Navigators in this Squad.
          </p>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="d-flex align-end my-4">
        <!-- DELETE -->
        <v-btn
          :loading="loading"
          outlined
          color="error"
          @click="confirmDeleteCourse()"
          class="ml-4"
        >
          <v-icon left> {{ mdiDelete }} </v-icon>
          DELETE
        </v-btn>

        <v-btn
          outlined
          :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
          class="ml-4"
          @click="$emit('cancel')"
          :disabled="loading"
        >
          <v-icon left> {{ mdiClose }} </v-icon>
          Cancel
        </v-btn>
      </div>
      <!-- End action-buttons -->
    </div>
    <!-- End create-dialog-content -->
  </v-dialog>
</template>
<script>
import { fetchCohortByCohortId } from "@/lib/ff";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiInformationVariant, mdiDelete, mdiClose } from "@mdi/js";
import { mapActions, mapState } from "pinia";
import firebase from "firebase/compat/app";
import { doc, updateDoc } from "firebase/firestore";

export default {
  name: "ConfirmDeleteCourseDialog",
  props: ["dialog", "course", "cohortId"],
  data() {
    return {
      mdiInformationVariant,
      mdiDelete,
      mdiClose,
      loading: false,
      currentCohort: null,
    };
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId"]),
  },
  async mounted() {
    // Use provided cohortId or fall back to currentCohortId from store
    const cohortId = this.cohortId || this.currentCohortId;
    if (cohortId) {
      this.currentCohort = await fetchCohortByCohortId(cohortId);
    }
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar", "setCurrentCohortId"]),
    async confirmDeleteCourse() {
      this.loading = true;
      const courseId = this.course.id;

      try {
        // Use provided cohortId or fall back to currentCohortId from store
        const cohortId = this.cohortId || this.currentCohortId;

        if (!cohortId) {
          throw new Error("No cohort ID available");
        }

        // Remove course id from cohort
        await updateDoc(doc(db, "cohorts", cohortId), {
          courses: firebase.firestore.FieldValue.arrayRemove(courseId),
        });

        // Remove course from all students in the cohort TODO: add rules that will allow remove course fromm students
        // await this.removeCourseFromStudents(courseId);

        this.setSnackbar({
          show: true,
          text: `Galaxy Map "${this.course.title}" removed from Squad`,
          color: "baseAccent",
        });

        this.loading = false;
        this.$emit("close");
        this.$emit("courseDeleted", courseId);
      } catch (error) {
        console.error("Error removing course from cohort:", error);
        this.setSnackbar({
          show: true,
          text: "Error removing Galaxy Map from Squad",
          color: "error",
        });
        this.loading = false;
      }
    },
    async removeCourseFromStudents(courseId) {
      try {
        if (!this.currentCohort || !this.currentCohort.students) {
          console.log("No students to remove course from");
          return;
        }

        // Remove course from each student's assignedCourses and delete their course collection
        const batch = db.batch();

        for (const studentId of this.currentCohort.students) {
          const studentRef = doc(db, "people", studentId);

          // Remove course from assignedCourses array
          batch.update(studentRef, {
            assignedCourses: firebase.firestore.FieldValue.arrayRemove(courseId),
          });

          // Delete the student's course collection (topics and tasks)
          //   const studentCourseRef = db.collection("people").doc(studentId).collection(courseId);
          //   const studentCourseSnapshot = await studentCourseRef.get();

          // Delete all topics and their tasks for this student
          //   for (const topicDoc of studentCourseSnapshot.docs) {
          //     const tasksSnapshot = await topicDoc.ref.collection("tasks").get();

          //     // Delete all tasks in this topic
          //     for (const taskDoc of tasksSnapshot.docs) {
          //       batch.delete(taskDoc.ref);
          //     }

          //     // Delete the topic
          //     batch.delete(topicDoc.ref);
          //   }
        }

        await batch.commit();
        console.log(
          `Removed course ${courseId} from ${this.currentCohort.students.length} students and deleted their course data`,
        );
      } catch (error) {
        console.error("Error removing course from students:", error);
        throw error;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  display: flex;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }
}

.create-dialog-content {
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;

  .custom-input {
    color: var(--v-missionAccent-base);
  }
}
</style>
