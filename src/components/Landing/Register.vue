<template>
  <div class="register">
    <div id="register-info">
      <h2 class="register-label">{{ closed ? "aplha" : "register" }}</h2>
      <!-- <h1 class="register-title">Register</h1> -->
      <p v-if="closed" class="register-description mt-4">
        GALAXY MAPS is currently in ALPHA testing.
        <br /><br />
        If you would like early access, please email your request to
        <br /><br />
        <a href="mailto:base@galaxymaps.io">base@galaxymaps.io</a>
      </p>

      <v-form v-else ref="form" v-model="valid" lazy-validation class="my-4">
        <v-text-field
          dark
          v-model="person.firstName"
          label="First Name"
          required
          color="missionAccent"
          outlined
          class="custom-input mt-6"
        ></v-text-field>
        <v-text-field
          v-model="person.lastName"
          label="Last Name"
          required
          color="missionAccent"
          outlined
          class="custom-input"
        ></v-text-field>
        <!-- <v-text-field
          v-model="person.discord"
          label="Discord Handle (optional)"
          color="missionAccent"
          outlined
          class="custom-input"
        ></v-text-field> -->
        <v-text-field
          type="email"
          v-model="person.email"
          label="E-mail"
          :rules="emailRules"
          required
          color="missionAccent"
          outlined
          class="custom-input"
        ></v-text-field>
        <v-text-field
          v-model="person.password"
          label="Password"
          required
          color="missionAccent"
          outlined
          class="custom-input"
          :append-icon="hide ? mdiEye : mdiEyeOff"
          @click:append="() => (hide = !hide)"
          :type="hide ? 'password' : 'text'"
        ></v-text-field>
        <v-btn
          :disabled="!valid"
          color="missionAccent"
          class="mr-4"
          @click="register"
          outlined
          width="100%"
          :loading="loading"
        >
          Register
        </v-btn>
      </v-form>
    </div>
    <!-- back button -->
    <div class="backButton">
      <BackButton :toPath="'/login'" />
    </div>
  </div>
</template>

<script>
import BackButton from "@/components/Reused/BackButton.vue";
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import firebase from "firebase/compat/app";
import { mapActions } from "pinia";
import { mdiEye, mdiEyeOff } from "@mdi/js";

export default {
  name: "Register",
  components: {
    BackButton,
  },
  data: () => ({
    mdiEye,
    mdiEyeOff,
    closed: false,
    valid: true,
    person: {
      firstName: "",
      lastName: "",
      discord: "",
      email: "",
      password: "",
      id: "",
    },
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    loading: false,
    hide: String,
  }),
  mounted() {
    // hack to make active select white
    if (this.$vuetify.theme.isDark) {
      this.$vuetify.theme.themes.dark.primary = "#ffffff"; // white
    } else {
      this.$vuetify.theme.themes.dark.primary = "#000000"; // black
    }
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    register() {
      this.loading = true;
      // add user the auth
      firebase
        .auth()
        .createUserWithEmailAndPassword(this.person.email, this.person.password)
        .then((userRef) => {
          console.log(userRef.user.uid);
          // get new user id
          this.person.id = userRef.user.uid;
          console.log("user created with id: ", this.person.id);
          // remove password so its not saved to database
          delete this.person.password;
          // add time registered
          this.person["registered"] = new Date();
          // add user to people database
          db.collection("people")
            .doc(this.person.id)
            .set(this.person)
            .catch((error) => {
              console.error("Error writing document: ", error);
            });
        })
        .then(() => {
          var actionCodeSettings = {
            // TODO: Update to galaxymaps.io on deployment
            url: window.location.origin + "/login",
            handleCodeInApp: true,
          };
          firebase.auth().currentUser.sendEmailVerification(actionCodeSettings);
        })
        .then(() => {
          this.loading = false;
          // route to verify email
          this.$router.push("/verify");
          // this.$emit("verify");
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: error.message,
            color: "pink",
          });
          this.person = {};
        });
    },
    validate() {
      this.$refs.form.validate();
    },
  },
};
</script>

<style lang="scss" scoped>
.register {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #393e46;
  background-size: cover;
  box-shadow: inset 0 0 0 2000px rgba(20, 30, 48, 0.9);

  p {
    font-size: 0.9rem;
  }

  .custom-input {
    color: var(--v-missionAccent-base);
  }

  #register-info {
    width: 300px;
    // height: 400px;
    border: 1px solid var(--v-missionAccent-base);
    margin-top: 30px;
    padding: 20px;
    // background: var(--v-baseAccent-base);
    position: relative;
    backdrop-filter: blur(2px);
    z-index: 3;

    .register-label {
      font-size: 0.8rem;
      font-weight: 400;
      text-transform: uppercase;
      // ribbon label
      position: absolute;
      top: 0;
      left: -1px;
      background-color: var(--v-missionAccent-base);
      color: var(--v-background-base);
      padding: 0px 15px 0px 5px;
      clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
    }

    .register-title {
      font-size: 1.2rem;
      color: var(--v-missionAccent-base) !important;
      font-weight: 600;
      text-transform: uppercase;
      margin: 20px 0px 5px 0px;
      color: white;
    }

    .register-image {
      width: 100%;
    }

    .register-description {
      margin-top: 10px;
      color: var(--v-missionAccent-base);
      // font-size: 0.9rem;
    }
  }

  .backButton {
    margin-top: 15px;
    width: calc(100% - 30px);
    z-index: 999;
  }
}
</style>
