<template>
  <div class="create-dialog-content">
    <p v-if="!teacher" class="caption mb-0">
      Adding this student will send a registration link to their email
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
        :disabled="!valid || addingAccount"
        :loading="addingAccount"
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
        :disabled="!valid || addingAccount"
        :loading="addingAccount"
        @click="create()"
        width="30%"
        class="ma-4 disabledButton"
        color="missionAccent"
        outlined
        :dark="dark"
        :light="!dark"
      >
        Create
      </v-btn>
      <v-btn
        :disabled="addingAccount"
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
  updatePersonByPersonId,
  assignTopicsAndTasksToPerson,
} from "@/lib/ff";
import { dbMixins } from "@/mixins/DbMixins";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "CreateAccountForm",
  mixins: [dbMixins],
  props: {
    accountType: { type: String },
    student: { type: Object },
    edit: { type: Boolean, default: false },
  },
  async mounted() {
    this.cohort = await fetchCohortByCohortId(this.currentCohortId);
    if (this.edit)
      this.account = {
        ...this.account,
        ...this.student,
      };
  },
  data: () => ({
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
      this.account = {
        firstName: "",
        lastName: "",
        email: "",
        displayName: "",
        nsn: "",
        inviter: "",
        parentEmail: "",
      };
      this.$emit("close");
    },
    async update() {
      let obj = Object.fromEntries(Object.entries(this.account).filter(([_, v]) => v.length));

      await db.collection("people").doc(obj.id).update(obj);

      this.$emit("updateStudentProfile", obj);
      this.setSnackbar({
        show: true,
        text: "Student successfully updated",
        color: "baseAccent",
      });
      this.close();
    },
    async create() {
      this.$refs.form.validate();
      if (!this.account.email) return;
      this.addingAccount = true;
      const personExists = await fetchPersonByEmail(this.account.email);
      console.log("person exists:", personExists);
      if (personExists) {
        const profile = {
          ...this.account,
          ...personExists,
        };
        // if teacher, emit teacher?
        if (this.teacher) {
          this.$emit("addTeacher", profile);
          this.addingAccount = false;
          this.close();
        } else {
          try {
            await updatePersonByPersonId(profile.id, profile); // updates /people/:id profile
            await this.MXaddExistingUserToCohort(profile); // adds student to /cohorts/:id/students

            if (this.cohort.courses.length) {
              await this.assignStudentToCourses(profile); // adds course to /people/:id/assignedCourses
            }

            this.addingAccount = false;
            this.close();
          } catch (error) {
            this.addingAccount = false;
            console.error("something went wrong adding existing person: ", err);
          }
        }
      } else {
        const person = {
          ...this.account,
          displayName: this.account.firstName + " " + this.account.lastName,
        };
        console.log("person does not exist in db. creating them now...", person);
        try {
          await this.MXcreateUser(person);
          this.setSnackbar({
            show: true,
            text: "Account created",
            color: "baseAccent",
          });
          if (!this.teacher) {
            await this.MXaddStudentToCohort(person.id, this.currentCohortId);
            this.setSnackbar({
              show: true,
              text: "Student added to Cohort",
              color: "baseAccent",
            });
            if (this.cohort.courses.length) {
              await this.assignStudentToCourses(person);
            }
          } else {
            this.setSnackbar({
              show: true,
              text: "Teacher added to Galaxy Map",
              color: "baseAccent",
            });
            this.addingAccount = false;
            this.close();
          }
        } catch (error) {
          console.error(error);
        }
      }
    },
    async assignStudentToCourses(person) {
      for (const courseId of this.cohort.courses) {
        await this.MXassignCourseToStudent(person.id, courseId);
        await assignTopicsAndTasksToPerson(person.id, courseId);
      }
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
