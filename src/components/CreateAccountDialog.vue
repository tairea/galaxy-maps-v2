<template>
  <div>
    <v-dialog v-model="dialog" width="35%" light>
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn text color="baseAccent" v-bind="attrs" v-on="on">
          <v-icon left>
            mdi-plus
          </v-icon>
          new teacher
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title">
            Add {{this.accountType}}
          </p>
        </div>
        <div class="create-dialog-content">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              dark
              type="string"
              v-model="person.firstName"
              label="First Name"
              color="missionAccent"
              outlined
              class="custom-input mt-6"
            ></v-text-field>
            <v-text-field
              dark
              type="string"
              v-model="person.lastName"
              label="Last Name"
              color="missionAccent"
              outlined
              class="custom-input"
            ></v-text-field>
            <v-text-field
              dark
              type="email"
              v-model="person.email"
              label="E-mail"
              :rules="emailRules"
              required
              color="missionAccent"
              outlined
              class="custom-input"
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
            >
              Create
            </v-btn>
            <v-btn
              :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
              class="ma-4"
              @click="cancel()"
              outlined
              width="30%"
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

export default {
  name: "CreateAccountDialog",
  props: {
    accountType: { type: String, default: "teacher"}
  },
  data: () => ({
    addingAccount: false,
    dialog: false,
    valid: true,
    person: {
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
    ]
  }),
  watch: {
    dialog(newVal) {
      if (newVal === true) {
        const emptyPerson = {
          id: "",
          firstName: "",
          lastName: "",
          email: "",
          accountType: "",
          displayName: "",
        }
        this.person = emptyPerson
      }
    }
  },
  methods: {
    cancel() {
      this.dialog = false;
    },
    create () {
      this.$refs.form.validate()
      if (!this.person.email) return
      this.addingAccount = true
      this.person.accountType = this.accountType

      // create user
      const createUser = functions.httpsCallable('createUser')
      createUser(this.person)
        .then(result => {
          this.person.id = result.data.uid
          return this.addPerson()
        }).then(() => {
          return this.generateLink()
        }).then(link => {
          return this.sendEmailInvite(link)
        }).then(() => {
          this.addingAccount = false
          debugger
          this.$emit('addAccount', this.person)
          this.cancel()
        })
        .catch((error) => {
          console.log(error)
        });
    },
    addPerson () {
      const profile = (({ displayName, ...o }) => o)(this.person) // remove id and teachers
      db.collection("people")
        .doc(profile.id)
        .set(profile)
        .catch((error) => {
          console.error("Error writing document: ", error);
      });
    },
    generateLink() {
      // generate magic email link
      this.person.displayName = this.person.firstName + " " + this.person.lastName
      const data = {
        ...this.person,
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
      this.person.link = link.data
      const sendInviteEmail = functions.httpsCallable('sendInviteEmail')
      sendInviteEmail(this.person)
      .catch((error) => {
        console.error(error)
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

</style>
