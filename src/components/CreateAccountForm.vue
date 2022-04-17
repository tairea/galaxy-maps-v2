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
        label="Parent E-mail"
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
        label="Student NSN"
        required
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
import { mapGetters } from "vuex";
import { dbMixins } from "../mixins/DbMixins";
import { getCourseById } from "../lib/ff";

export default {
  name: "CreateAccountForm",
  mixins: [dbMixins],
  props: {
    accountType: { type: String, default: "teacher" },
  },
  data: () => ({
    addingAccount: false,
    valid: true,
    account: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      accountType: "",
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
    ...mapGetters(["person", "currentCohort"]),
    teacher() {
      return this.accountType === "teacher";
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    close() {
      this.account = {
        firstName: "",
        lastName: "",
        email: "",
        accountType: "",
        displayName: "",
        nsn: "",
        inviter: "",
        parentEmail: "",
      };
      this.$emit('close')
    },
    async create() {
      this.$refs.form.validate();
      if (!this.account.email) return;
      this.addingAccount = true;
      const personExists = await this.MXgetPersonByEmail(this.account.email);
      if (personExists) {
        console.log("account: ", this.account);
        console.log("personExists: ", personExists);
        const profile = {
          ...this.account,
          ...personExists,
        };
        console.log("output profile: ", profile);
        // this.account = profile
        this.MXsaveProfile(profile)
          .then(() => {
            this.MXaddExistingUserToCohort(personExists);
          }).then(() => {
            if (this.currentCohort.courses.length) {
              this.currentCohort.courses.forEach(async (courseId) => {
                let course = await getCourseById(courseId);
                this.MXassignCourseToStudent(personExists, course);
              });
            }
          })
          .then(() => {
            this.addingAccount = false;
            this.close();
          })
          .catch((err) => {
            this.addingAccount = false;
            console.error("something went wrong adding existing person: ", err);
          });
      } else {
        const person = {
          ...this.account,
          accountType: this.accountType,
          displayName: this.account.firstName + " " + this.account.lastName,
        };
        this.MXcreateUser(person)
          .then(() => {
            if (!this.teacher) {
              this.MXaddStudentToCohort(person);
            }
            this.addingAccount = false;
            this.close();
          })
          .catch((error) => {
            console.error(error);
          });
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
