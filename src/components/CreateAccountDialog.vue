<template>
  <div>
    <v-dialog v-model="dialog" width="35%" :light="dark" :dark="!dark">
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          class="cohort-btn"
          :light="dark"
          :dark="!dark"
          :text="teacher"
          :color="teacher ? 'baseAccent' : 'missionAccent'"
          v-bind="attrs"
          v-on="on"
        >
          <v-icon left> {{ mdiPlus }} </v-icon>
          {{ teacher ? "New Teacher" : "add student" }}
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">Add {{ this.accountType }}</p>
        </div>
        <CreateAccountForm :accountType="accountType" @close="dialog = false" />
      </div>
    </v-dialog>
  </div>
</template>

<script>
import CreateAccountForm from "./CreateAccountForm";

import { mapGetters } from "vuex";
import { dbMixins } from "../mixins/DbMixins";

import { mdiPlus } from "@mdi/js";

export default {
  name: "CreateAccountDialog",
  mixins: [dbMixins],
  components: {
    CreateAccountForm,
  },
  props: {
    accountType: { type: String },
  },
  data: () => ({
    mdiPlus,
    addingAccount: false,
    dialog: false,
    valid: true,
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    parentEmailRules: [(v) => /.+@.+\..+/.test(v) || "E-mail must be valid"],
  }),
  computed: {
    ...mapGetters(["person", "currentCohort"]),
    teacher() {
      return this.accountType === "teacher";
    },
    dark() {
      return this.$vuetify.theme.isDark;
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
</style>
