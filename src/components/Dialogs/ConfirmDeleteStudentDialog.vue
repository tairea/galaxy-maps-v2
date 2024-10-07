<template>
  <v-dialog v-model="dialog" width="40%" light>
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <span class="dialog-title">Remove Navigator from Squad?</span>
      </div>
      <div class="d-flex align-start pa-4">
        <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
        <div>
          <p class="dialog-description">
            Are you sure you want to <span class="red--text">REMOVE</span>
            <span class="baseAccent--text overline">
              {{ student.firstName ? student.firstName + " " + student.lastName : student.email }}
            </span>
            from this Squad?
          </p>
          <p class="dialog-description">
            This will also remove them from any Galaxy Maps assigned to this Squad.
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
          @click="confirmDeleteStudent()"
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
import { deleteStudentsCourseXAPIStatements } from "@/lib/veracityLRS";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiInformationVariant, mdiDelete, mdiClose } from "@mdi/js";
import { mapActions, mapState } from "pinia";
import firebase from "firebase/compat/app";
import { doc, updateDoc } from "firebase/firestore";

export default {
  name: "ConfirmDeleteStudentDialog",
  props: ["dialog", "student"],
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
    this.currentCohort = await fetchCohortByCohortId(this.currentCohortId);
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar", "setCurrentCohortId"]),
    async confirmDeleteStudent() {
      this.loading = true;
      const studentId = this.student.id;

      // if currentCohortId is null, get it from the route
      if (!this.currentCohortId) {
        const cohortId = this.$route.params.cohortId;
        await this.setCurrentCohortId(cohortId);
      }

      // Remove student id from cohort
      await updateDoc(doc(db, "cohorts", this.currentCohortId), {
        students: firebase.firestore.FieldValue.arrayRemove(studentId),
      });

      // Remove assigned courses from student
      await this.deleteAssignedCourse(studentId);

      // remove students requests for help
      await this.deleteRequestsForHelp(studentId);

      // remove students submissions
      await this.deleteSubmissions(studentId);

      // remove students xAPI statements related to cohort courses
      await this.deleteXAPIStatements(studentId);

      this.setSnackbar({
        show: true,
        text:
          "Navigator " +
          this.student.lastName.charAt(0).toUpperCase() +
          this.student.lastName.slice(1) +
          " removed from Squad",
        color: "baseAccent",
      });
      this.loading = false;
      this.$emit("close");
    },
    async deleteAssignedCourse(studentId) {
      const studentRef = doc(db, "people", studentId);
      console.log("student: ", studentRef);

      const courseIds = this.currentCohort.courses;
      await updateDoc(studentRef, {
        assignedCourses: firebase.firestore.FieldValue.arrayRemove(...courseIds),
      });
    },
    async deleteRequestsForHelp(studentId) {
      try {
        for (const courseId of this.currentCohort.courses) {
          const requestsForHelpRef = db
            .collection("courses")
            .doc(courseId)
            .collection("requestsForHelp");
          const snapshot = await requestsForHelpRef.where("personId", "==", studentId).get();

          if (snapshot.empty) {
            console.log(`No requests for help found for student in course: ${courseId}`);
            continue;
          }

          const batch = db.batch();
          snapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          console.log(`Deleted requests for help for student in course: ${courseId}`);
        }
        console.log("All student requests for help deleted successfully");
        return true;
      } catch (error) {
        console.error("Error deleting student requests for help:", error);
        return false;
      }
    },
    async deleteSubmissions(studentId) {
      try {
        for (const courseId of this.currentCohort.courses) {
          const submissionsRef = db
            .collection("courses")
            .doc(courseId)
            .collection("submissionsForReview");
          const snapshot = await submissionsRef.where("studentId", "==", studentId).get();

          if (snapshot.empty) {
            console.log(`No submissions found for student in course: ${courseId}`);
            continue;
          }

          const batch = db.batch();
          snapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          console.log(`Deleted submissions for student in course: ${courseId}`);
        }
        console.log("All student submissions deleted successfully");
        return true;
      } catch (error) {
        console.error("Error deleting student submissions:", error);
        return false;
      }
    },
    async deleteXAPIStatements(studentId) {
      // loop this.currentCohort.courses and delete xpi data
      for (const courseId of this.currentCohort.courses) {
        await deleteStudentsCourseXAPIStatements(studentId, courseId); //  (<--- NOT TESTED. NOT SURE IF THIS WORKS)
        console.log("students xapi data deleted for course: ", courseId);
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
