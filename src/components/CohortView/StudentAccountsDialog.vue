<template>
  <div>
    <v-dialog v-model="dialog" width="45%" :light="dark" :dark="!dark">
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          class="cohort-btn"
          color="missionAccent"
          v-bind="attrs"
          v-on="on"
          outlined
        >
          <v-icon left> mdi-account-group </v-icon>
          manage students
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">Manage Students</p>
        </div>
        <div class="create-dialog-content">
          <v-tabs
            background-color="var(--v-background-base)"
            dark
            fixed-tabs
          >
            <v-tab class="justify-start">
              <v-icon small class="mr-2">mdi-account-plus</v-icon><div>add student</div>
            </v-tab>
            <v-tab class="justify-start">
              <v-icon small class="mr-2">mdi-account-group</v-icon><div>upload csv</div>
            </v-tab>
            <v-tab class="justify-start">
              <v-icon small class="mr-2">mdi-account-minus</v-icon><div>remove student</div>
            </v-tab>

            <v-tab-item>
              <CreateAccountForm  accountType="student" @close="close"/>
            </v-tab-item>
            <v-tab-item>
             <StudentImportCsv />
            </v-tab-item>
            <v-tab-item>
              <div>
                <v-simple-table :dark="dark" :light="!dark" class="table">
                  <thead>
                    <tr>
                      <th>student</th>
                      <th>action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in students" :key="student.id">
                      <td class="pl-4">
                        {{student.firstName + ' ' + student.lastName || student.email}}
                      </td>
                      <td>
                        <v-btn text @click="removeStudent(student)">
                          <v-icon small>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </div>
            </v-tab-item>
          </v-tabs>
        </div>
      </div>
    </v-dialog>
    <!-- CONFIRM DELETE DIALOG -->
    <v-dialog v-model="confirmDialog" width="40%" light>
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <span class="dialog-title">Remove Student from Cohort?</span>
        </div>
        <div class="d-flex align-start pa-4">
          <v-icon left color="missionAccent">mdi-information-variant</v-icon>
          <p class="dialog-description">
            Are you sure you want to <strong>REMOVE</strong>
            <span> {{ exStudent.firstName + ' ' + exStudent.lastName }} </span> from this cohort
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
            <v-icon left> mdi-delete </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
            class="ml-4"
            @click="cancelDeleteDialog"
          >
            <v-icon left> mdi-close </v-icon>
            Cancel
          </v-btn>
        </div>
        <!-- End action-buttons -->
      </div>
      <!-- End create-dialog-content -->
    </v-dialog>
  </div>
</template>

<script>
import CreateAccountForm from "../../components/CreateAccountForm"
import StudentImportCsv from "../../components/StudentImportCsv"

import firebase from "firebase/app";
import { db } from "../../store/firestoreConfig";
import { mapGetters } from "vuex";
import { dbMixins } from "../../mixins/DbMixins";

export default {
  name: "StudentAccountsDialog",
  mixins: [dbMixins],
  components: {
    CreateAccountForm,
    StudentImportCsv
  },
  props: ['students'],
  data() {
    return {
      exStudent: {},
      dialog: false,
      confirmDialog: false
    }
  },
  computed: {
    ...mapGetters(["person", "currentCohort"]),
    teacher() {
      return this.currentCohort.teacher;
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    close() {
      this.dialog = false;
    },
    removeStudent(student) {
      this.confirmDialog = true
      this.exStudent = student
    },
    confirmDeleteStudent() {
      db.collection('cohorts')
        .doc(this.currentCohort.id)
        .update({students: firebase.firestore.FieldValue.arrayRemove(this.exStudent.id)})
      this.confirmDialog = false
      this.exStudent = {}
    },
    cancelDeleteDialog() {
      this.confirmDialog = false
      this.exStudent = {}
    }
  },
};
</script>

<style lang="scss" scoped>
// new dialog ui
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

.cohort-btn {
  font-weight: 400;
}

.tab-label {
  color: var(--v-missionAccent-base)
}

.table {
  background-color: var(--v-background-base);
}

.dialog-description {

}
</style>
