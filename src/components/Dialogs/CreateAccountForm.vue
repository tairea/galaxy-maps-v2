<template>
  <div class="create-dialog-content">
    <p v-if="!teacher && !edit" class="caption mb-0">
      Adding this Navigator will send a registration link to their email
    </p>
    <!-- TODO: info description for adding a teacher? -->
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field
        :dark="dark"
        :light="!dark"
        type="text"
        v-model="account.firstName"
        label="First Name"
        outlined
        class="mt-6"
        color="missionAccent"
      ></v-text-field>
      <v-text-field
        :dark="dark"
        :light="!dark"
        type="text"
        v-model="account.lastName"
        label="Last Name"
        outlined
        color="missionAccent"
      ></v-text-field>
      <v-text-field
        :dark="dark"
        :light="!dark"
        type="email"
        v-model="account.email"
        label="E-mail"
        :rules="emailRules"
        required
        outlined
        color="missionAccent"
      ></v-text-field>
      <v-text-field
        v-if="!teacher"
        :dark="dark"
        :light="!dark"
        type="email"
        v-model="account.parentEmail"
        label="Parent E-mail (optional)"
        outlined
        color="missionAccent"
        :rules="account.parentEmail.length ? parentEmailRules : []"
      ></v-text-field>
      <v-text-field
        v-if="!teacher"
        :dark="dark"
        :light="!dark"
        type="text"
        v-model="account.nsn"
        label="Student ID Number (optional)"
        outlined
        color="missionAccent"
      ></v-text-field>
      <v-text-field
        v-if="!teacher"
        :dark="dark"
        :light="!dark"
        type="text"
        v-model="account.inviter"
        label="Added by"
        required
        outlined
        color="missionAccent"
        :value="person.firstName + ' ' + person.lastName"
      ></v-text-field>
    </v-form>
    <v-row>
      <v-btn
        v-if="edit"
        :disabled="!valid"
        :loading="addingAccount || updatingAccount"
        @click="update()"
        width="30%"
        class="ma-4 disabledButton"
        color="missionAccent"
        outlined
        :dark="dark"
        :light="!dark"
      >
        Update
      </v-btn>
      <v-btn
        v-else
        :disabled="!valid"
        :loading="addingAccount || updatingAccount"
        @click="create()"
        width="30%"
        class="ma-4 disabledButton"
        color="missionAccent"
        outlined
        :dark="dark"
        :light="!dark"
      >
        add
      </v-btn>
      <v-btn
        :disabled="addingAccount || updatingAccount"
        @click="close()"
        outlined
        :dark="dark"
        :light="!dark"
        class="ma-4"
        width="30%"
      >
        cancel
      </v-btn>
    </v-row>
  </div>
</template>

<script>
import {
  fetchCohortByCohortId,
  fetchPersonByEmail,
  createPerson,
  updatePerson,
  addPersonToCohort,
  assignCourseToPerson,
} from "@/lib/ff";
import { db, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "CreateAccountForm",
  props: {
    accountType: { type: String },
    student: { type: Object },
    edit: { type: Boolean, default: false },
  },
  async mounted() {
    if (this.edit) {
      this.account = {
        ...this.account,
        ...this.student,
      };
      console.log("edit student: ", this.account);
    } else {
      this.cohort = await fetchCohortByCohortId(this.currentCohortId);
    }
  },
  data: () => ({
    updatingAccount: false,
    cohort: null,
    addingAccount: false,
    valid: true,
    account: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      displayName: "",
      nsn: "",
      inviter: "",
      parentEmail: "",
    },
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    parentEmailRules: [(v) => /.+@.+\..+/.test(v) || "E-mail must be valid"],
  }),
  computed: {
    ...mapState(useRootStore, ["person", "currentCohortId"]),
    teacher() {
      return this.accountType === "teacher";
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    close() {
      this.clearForm();
      this.$emit("close");
    },
    clearForm() {
      this.account = {
        firstName: "",
        lastName: "",
        email: "",
        displayName: "",
        nsn: "",
        inviter: "",
        parentEmail: "",
      };
    },
    async update() {
      this.updatingAccount = true;
      // remove empty fields
      let obj = Object.fromEntries(Object.entries(this.account).filter(([_, v]) => v.length));

      await db.collection("people").doc(obj.id).update(obj);

      this.$emit("updateStudentProfile", obj);
      this.setSnackbar({
        show: true,
        text: "Navigator successfully updated",
        color: "baseAccent",
      });
      this.updatingAccount = false;
      this.close();
    },
    async create() {
      this.$refs.form.validate();
      if (!this.account.email) return;
      this.addingAccount = true;
      const studentExists = await fetchPersonByEmail(this.account.email);
      console.log("person exists:", studentExists);
      if (studentExists) {
        const profile = {
          ...this.account,
          ...studentExists,
          inviter: this.person.firstName + " " + this.person.lastName,
        };
        // if teacher, emit teacher?
        if (this.teacher) {
          this.$emit("addTeacher", profile);
          this.addingAccount = false;
          this.close();
        } else {
          try {
            await updatePerson(profile.id, profile); // updates /people/:id profile
            
            // Add more detailed logging
            console.log("Adding exisiting person to cohort:", {
              personId: profile.id,
              cohortId: this.cohort.id
            });
            
            // Make sure cohort.id exists
            if (!this.cohort?.id) {
              throw new Error('Cohort ID is missing');
            }
            
            // Add to cohort and wait for completion
            const result = await addPersonToCohort(profile.id, this.cohort.id);
            console.log("Add to cohort result:", result);

            if (this.cohort.courses.length) {
              await this.assignStudentToCourses(profile); // adds course to /people/:id/assignedCourses
            }

            this.setSnackbar({
              show: true,
              text: "Navigator successfully added to Squad",
              color: "baseAccent",
            });

            await this.sendNewCohortEmail(profile);

            this.addingAccount = false;
            this.close();
          } catch (error) {
            this.addingAccount = false;
            console.error("Error adding existingperson to cohort:", error);
            this.setSnackbar({
              show: true,
              text: "Error adding Navigator to Squad: " + error.message,
              color: "error",
            });
          }
        }
      } else {
        const profile = {
          ...this.account,
          displayName: this.account.firstName + " " + this.account.lastName,
        };
        console.log("person does not exist in db. creating them now...", profile);
        try {
          const person = await createPerson(profile);
          this.setSnackbar({
            show: true,
            text: "New Account Created",
            color: "baseAccent",
          });
          if (!this.teacher) {
            await addPersonToCohort(person.id, this.currentCohortId);
            this.setSnackbar({
              show: true,
              text: "Navigator added to Squad",
              color: "baseAccent",
            });
            if (this.cohort.courses.length) {
              await this.assignStudentToCourses(person); // adds course to /people/:id/assignedCourses
            }
          } else {
            this.setSnackbar({
              show: true,
              text: "New Captain added to Galaxy Map",
              color: "baseAccent",
            });
          }
          this.addingAccount = false;
          this.close();
        } catch (error) {
          console.error(error);
        }
      }
    },
    async assignStudentToCourses(person) {
      for (const courseId of this.cohort.courses) {
        await assignCourseToPerson(person.id, courseId);
      }
    },
    sendNewCohortEmail(profile) {
      const person = {
        ...profile,
        cohort: this.cohort.name,
      };
      const sendNewCohortEmail = functions.httpsCallable("sendNewCohortEmail");
      return sendNewCohortEmail(person);
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
  background-color: var(--v-background-base);

  .custom-input {
    color: var(--v-missionAccent-base);
  }
}

.cohort-btn {
  font-weight: 400;
}
</style>
