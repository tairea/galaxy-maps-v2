<template>
  <v-dialog v-model="dialog" width="40%" light>
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <span class="dialog-title">Remove Student from Squad?</span>
      </div>
      <div class="d-flex align-start pa-4">
        <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
        <div>
          <p class="dialog-description">
            Are you sure you want to <strong>REMOVE</strong><br />
            <span class="baseAccent--text overline">
              {{
                student.firstName ? student.firstName + " " + student.lastName : student.email
              }} </span
            ><br />
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
          :disabled="loading"
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
          :loading="loading"
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
  name: "ConfirmDeleteStudentDialog",
  props: ["dialog", "student"],
  data() {
    return {
      mdiInformationVariant,
      mdiDelete,
      mdiClose,
      loading: false,
    };
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId"]),
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

      this.setSnackbar({
        show: true,
        text: "Student removed from Squad",
        color: "baseAccent",
      });
      this.loading = false;
      this.$emit("close");
    },
    async deleteAssignedCourse(studentId) {
      const studentRef = doc(db, "people", studentId);
      console.log("student: ", studentRef);

      const currentCohort = await fetchCohortByCohortId(this.currentCohortId);

      const courseIds = currentCohort.courses;
      await updateDoc(studentRef, {
        assignedCourses: firebase.firestore.FieldValue.arrayRemove(...courseIds),
      });
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
