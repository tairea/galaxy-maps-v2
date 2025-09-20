<template>
  <div>
    <v-dialog v-model="dialog" width="45%" :light="dark" :dark="!dark">
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          class="cohort-btn"
          color="missionAccent"
          v-bind="attrs"
          v-on="activatorListeners(on)"
          outlined
          :loading="isSubscriptionCheckPending"
          :disabled="isSubscriptionCheckPending"
        >
          <v-icon left> {{ mdiAccountPlus }} </v-icon>
          Add/remove Navigators
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">Manage Navigators</p>
        </div>
        <div class="create-dialog-content">
          <v-tabs background-color="var(--v-background-base)" dark fixed-tabs>
            <v-tab class="justify-start">
              <v-icon small class="mr-2">{{ mdiAccountPlus }}</v-icon>
              <div>add navigator</div>
            </v-tab>
            <v-tab class="justify-start">
              <v-icon small class="mr-2">{{ mdiAccountGroup }}</v-icon>
              <div>upload csv</div>
            </v-tab>
            <v-tab class="justify-start">
              <v-icon small class="mr-2">{{ mdiAccountEdit }}</v-icon>
              <div>edit/remove navigators</div>
            </v-tab>

            <v-tab-item>
              <CreateAccountForm @close="close" />
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
                      <th>email</th>
                      <th>edit</th>
                      <th>remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in students" :key="student.id">
                      <!-- name cell -->
                      <td class="pl-4">
                        {{
                          student.firstName
                            ? student.firstName + " " + student.lastName
                            : student.email
                        }}
                      </td>
                      <!-- email cell -->
                      <td class="pl-4">
                        {{ student.email ? student.email : "no email provided" }}
                      </td>
                      <!-- edit cell -->
                      <td>
                        <v-btn text @click="updateStudent(student)">
                          <v-icon small>{{ mdiPencil }}</v-icon>
                        </v-btn>
                      </td>
                      <!-- delete cell -->
                      <td>
                        <v-btn text color="red" @click="removeStudent(student)">
                          <v-icon small>{{ mdiDelete }}</v-icon>
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
    <ConfirmDeleteStudentDialog
      :dialog="confirmDialog"
      :student="exStudent"
      @cancel="cancelDeleteDialog"
      @close="closeDeleteDialog"
    />
    <EditStudentDialog
      v-if="editDialog"
      :dialog="editDialog"
      :student="editStudent"
      @cancel="cancelEditDialog"
      @updateStudentProfile="$emit('updateStudentProfile', $event)"
    />
  </div>
</template>

<script>
import CreateAccountForm from "@/components/Dialogs/CreateAccountForm.vue";
import StudentImportCsv from "@/components/Reused/StudentImportCsv.vue";
import ConfirmDeleteStudentDialog from "@/components/Dialogs/ConfirmDeleteStudentDialog.vue";
import EditStudentDialog from "@/components/Dialogs/EditStudentDialog.vue";
import useCohortViewStore from "@/store/cohortView";
import useRootStore from "@/store/index";

import { mdiAccountGroup, mdiAccountEdit, mdiPencil, mdiDelete, mdiAccountPlus } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "StudentAccountsDialog",
  components: {
    CreateAccountForm,
    StudentImportCsv,
    ConfirmDeleteStudentDialog,
    EditStudentDialog,
  },
  props: ["students"],
  data() {
    return {
      mdiAccountGroup,
      mdiAccountPlus,
      mdiAccountEdit,
      mdiPencil,
      mdiDelete,
      dialog: false,
      confirmDialog: false,
      exStudent: {},
      editDialog: false,
      editStudent: {},
    };
  },
  computed: {
    ...mapState(useRootStore, ["user"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    subscriptionChecked() {
      return Boolean(this.user?.data?.subscriptionChecked);
    },
    isStripeCustomer() {
      return Boolean(this.user?.data?.isCustomer);
    },
    hasActiveSubscription() {
      return Boolean(this.user?.data?.hasActiveSubscription);
    },
    requiresSubscription() {
      // Managing navigator accounts is a paid feature
      return true;
    },
    isSubscriptionCheckPending() {
      return this.requiresSubscription && !this.subscriptionChecked;
    },
    canOpenPaidDialog() {
      if (!this.requiresSubscription) return true;
      if (!this.subscriptionChecked) return false;
      return this.isStripeCustomer && this.hasActiveSubscription;
    },
  },
  methods: {
    ...mapActions(useCohortViewStore, ["refreshCohort"]),
    ...mapActions(useRootStore, ["setSnackbar", "setPaywall"]),
    activatorListeners(on = {}) {
      return {
        ...on,
        click: (event) => this.handleActivatorEvent(event, on?.click),
        keydown: (event) => this.handleActivatorEvent(event, on?.keydown),
      };
    },
    handleActivatorEvent(event, originalHandler) {
      if (this.canOpenPaidDialog) {
        if (typeof originalHandler === "function") {
          originalHandler(event);
        } else {
          this.dialog = true;
        }
        return;
      }

      if (event?.preventDefault) event.preventDefault();
      if (event?.stopPropagation) event.stopPropagation();

      this.handleSubscriptionBlocked();
    },
    handleSubscriptionBlocked() {
      if (this.isSubscriptionCheckPending) {
        this.setSnackbar({
          show: true,
          text: "Hang tight — checking your subscription status.",
          color: "baseAccent",
        });
        return;
      }

      if (!this.isStripeCustomer) {
        this.setPaywall({
          show: true,
          text: "A paid Galaxy Maps plan is required to manage navigators.",
        });
        return;
      }

      if (!this.hasActiveSubscription) {
        this.setPaywall({
          show: true,
          text: "Your subscription is inactive. Update billing to continue.",
        });
      }
    },
    close() {
      this.refreshCohort();
      this.dialog = false;
    },
    closeDeleteDialog() {
      this.confirmDialog = false;
      this.exStudent = {};
      this.refreshCohort();
    },
    removeStudent(student) {
      this.confirmDialog = true;
      this.exStudent = student;
    },
    cancelDeleteDialog() {
      this.confirmDialog = false;
      this.exStudent = {};
    },
    updateStudent(student) {
      this.editStudent = student;
      this.editDialog = true;
    },
    cancelEditDialog() {
      this.editDialog = false;
      this.editStudent = {};
    },
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
  color: var(--v-missionAccent-base);
}

.table {
  background-color: var(--v-background-base);
}
</style>
