<template>
  <v-dialog v-model="dialog" width="40%" light>
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <span class="dialog-title">Remove Student from Cohort?</span>
      </div>
      <div class="d-flex align-start pa-4">
        <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
        <p class="dialog-description">
          Are you sure you want to <strong>REMOVE</strong>
          <span>
            {{
              student.firstName
                ? student.firstName + " " + student.lastName
                : student.email
            }}
          </span>
          from this cohort
        </p>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="d-flex align-end my-4">
        <!-- DELETE -->
        <v-btn
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
import { mdiInformationVariant, mdiDelete, mdiClose } from "@mdi/js";

export default {
  name: "ConfirmDeleteStudentDialog",
  props: ["dialog", "student"],
  data() {
    return {
      mdiInformationVariant,
      mdiDelete,
      mdiClose,
    };
  },
  methods: {
    confirmDeleteStudent() {
      db.collection("cohorts")
        .doc(this.currentCohort.id)
        .update({
          students: firebase.firestore.FieldValue.arrayRemove(this.student.id),
        })
        .then(() => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Student removed from Cohort",
            color: "baseAccent",
          });
        });
      this.$emit("cancel");
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
