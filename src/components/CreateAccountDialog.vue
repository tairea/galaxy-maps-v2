<template>
  <div>
    <v-dialog v-model="dialog" width="35%" :light="dark" :dark="!dark">
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn class="cohort-btn" :light="dark" :dark="!dark" :text="teacher" :color="teacher ? 'baseAccent':'missionAccent'" v-bind="attrs" v-on="on">
          <v-icon left>
            mdi-plus
          </v-icon>
          {{teacher ? "New Teacher" : "add student"}}
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">
            Add {{this.accountType}}
          </p>
        </div>
        <div class="create-dialog-content">
          <p v-if="!teacher" class="caption mb-0">Adding this student will send a registration link to their email</p>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              :dark="dark"
              :light="!dark"
              type="text"
              v-model="account.firstName"
              label="First Name"
              color="missionAccent"
              outlined
              class="custom-input mt-6"
            ></v-text-field>
            <v-text-field
              :dark="dark"
              :light="!dark"
              type="text"
              v-model="account.lastName"
              label="Last Name"
              color="missionAccent"
              outlined
              class="custom-input"
            ></v-text-field>
            <v-text-field
              :dark="dark"
              :light="!dark"
              type="email"
              v-model="account.email"
              label="E-mail"
              :rules="emailRules"
              required
              color="missionAccent"
              outlined
              class="custom-input"
            ></v-text-field>
            <v-text-field
              v-if="!teacher"
              :dark="dark"
              :light="!dark"
              type="text"
              v-model="nsn"
              label="Student NSN"
              required
              color="missionAccent"
              outlined
              class="custom-input"
            ></v-text-field>
            <v-text-field
              v-if="!teacher"
              :dark="dark"
              :light="!dark"
              type="text"
              v-model="inviter"
              label="Added by"
              required
              color="missionAccent"
              outlined
              class="custom-input"
              :value="person.firstName + ' ' + person.lastName" 
            ></v-text-field>
          </v-form>
          <v-row>
            <v-btn
              :disabled="!valid || addingAccount"
              color="missionAccent"
              class="ma-4"
              @click="create()"
              outlined
              width="30%"
              :loading="addingAccount"
            >
              Create
            </v-btn>
            <v-btn
              :dark="dark"
              :light="!dark"
              class="ma-4"
              @click="close()"
              outlined
              width="30%"
              :disabled="addingAccount"
            >
              cancel
            </v-btn>
          </v-row>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>

import { db, functions } from "../store/firestoreConfig";
import { mapGetters } from "vuex"
import firebase from "firebase"

export default {
  name: "CreateAccountDialog",
  props: {
    accountType: { type: String, default: "teacher"},
  },
  data: () => ({
    addingAccount: false,
    dialog: false,
    valid: true,
    account: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      accountType: "",
      displayName: "",
    },
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    nsn: "",
    inviter: ""
  }),
  computed: {
    ...mapGetters(['person', 'currentCohortId']),
    teacher() {
      return this.accountType === "teacher"
    },
    dark () {
      return this.$vuetify.theme.isDark
    }
  },
  methods: {
    close() {
      this.dialog = false;
      this.account = {
        firstName: "",
        lastName: "",
        email: "",
        accountType: "",
        displayName: "",
      }
    },
    create () {
      this.$refs.form.validate()
      if (!this.account.email) return
      this.addingAccount = true
      this.account.accountType = this.accountType
      this.account.displayName = this.account.firstName + ' ' + this.account.lastName
      // create user
      const createUser = functions.httpsCallable('createUser')
      createUser(this.account)
        .then(result => {
          this.account.id = result.data.uid
          return this.addAccount()
        }).then(() => {
          return this.generateLink()
        }).then(link => {
          return this.sendEmailInvite(link)
        }).then(() => {
          if (!this.teacher) {
            this.addStudentToCohort()
          }
          this.addingAccount = false
          this.close()
        })
        .catch((error) => {
          console.log(error)
      });
    },
    addAccount () { 
      const profile = {
        ...this.account,
      }
      if (!this.teacher) {
        profile.nsn = this.nsn
      }
      delete profile.id
      db.collection("people")
        .doc(this.account.id)
        .set(profile)
        .catch((error) => {
          console.error("Error writing document: ", error);
      });
    },
    generateLink() {
      // generate magic email link
      const data = {
        ...this.account,
        host: window.location.origin
      }

      const generateEmailLink = functions.httpsCallable('generateEmailLink')
      return generateEmailLink(data)
        .then((link) => {
          return link
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
      });
    },
    sendEmailInvite(link) {
      this.account.link = link.data
      if (!this.teacher) {
        this.account.inviter = this.inviter
      }
      const sendInviteEmail = functions.httpsCallable('sendInviteEmail')
      sendInviteEmail(this.account)
      .catch((error) => {
        console.error(error)
      });
    },
    addStudentToCohort () {
       db.collection("cohorts")
        .doc(this.currentCohortId)
        .update({
          students: firebase.firestore.FieldValue.arrayUnion(
            this.account.id
          ),
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
      });
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

.input-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;
}

.cohort-btn {
  font-weight: 400;
}

</style>
