<template>
  <div class="signin">
    <div id="signin-info">
      <h2 class="signin-label">Confirm Email</h2>
      <p class="signin-description mt-4">
        Please confirm your email address to sign in
      </p>
      <v-form ref="form" v-model="valid" lazy-validation class="my-4">
        <v-text-field
          type="email"
          v-model="email"
          label="E-mail"
          :rules="emailRules"
          required
          color="missionAccent"
          outlined
          class="custom-input"
        ></v-text-field>
        <v-btn
          :disabled="!valid"
          color="missionAccent"
          class="mr-4"
          @click="verifyEmail()"
          outlined
          width="100%"
        >
          Sign in
        </v-btn>
      </v-form>
    </div>
    <div style="width: 300px; margin: 20px auto; z-index: 1">
      <v-btn color="missionAccent" to="/login" outlined width="100%">
        <v-icon class="pr-4">{{ mdiKeyboardBackspace }}</v-icon>
        back to login
      </v-btn>
    </div>
    <CreateProfileDialog :dialog="dialog" @login="login()" />
  </div>
</template>

<script>
import firebase from "firebase";
import { mapGetters } from "vuex";

import { mdiKeyboardBackspace } from "@mdi/js";

import BackButton from "../components/BackButton";
import CreateProfileDialog from "../components/CreateProfileDialog";

export default {
  name: "EmailSignIn",
  components: {
    BackButton,
    CreateProfileDialog,
  },
  data: () => ({
    mdiKeyboardBackspace,
    dialog: false,
    valid: true,
    email: "",
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
  }),
  computed: {
    ...mapGetters(["user", "person"]),
  },
  methods: {
    verifyEmail() {
      // Confirm the link is a sign-in with email link.
      if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
        if (!this.email) return;
        // The client SDK will parse the code from the link for you.
        firebase
          .auth()
          .signInWithEmailLink(this.email, window.location.href)
          .then((result) => {
            console.log("successfully signed in");
            this.proceed();
          })
          .catch((error) => {
            this.$store.commit("setSnackbar", {
              show: true,
              text: error.message,
              color: "pink",
            });
            console.error("something went wrong signing in: ", error);
          });
      } else console.log("not a sign in link");
    },
    validate() {
      this.$refs.form.validate();
    },
    proceed() {
      if (!this.user?.data?.id || !this.person?.id) {
        return setTimeout(() => {
          this.proceed();
        }, 500);
      }
      // open dialog to set password and profile information
      this.dialog = true;
    },
    login() {
      console.log("login");
      this.dialog = false;
      this.$refs.form.reset();
      this.$router.push({ path: "/base/galaxies" });
    },
  },
};
</script>

<style lang="scss" scoped>
.signin {
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #393e46;
  background-image: url("../assets/hudf_big.jpeg");
  background-size: cover;
  box-shadow: inset 0 0 0 2000px rgba(20, 30, 48, 0.9);

  p {
    font-size: 0.9rem;
  }

  .custom-input {
    color: var(--v-missionAccent-base);
  }
}

#signin-info {
  width: 300px;
  // height: 400px;
  border: 1px solid var(--v-missionAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-missionAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;

  .signin-label {
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

  .signin-description {
    margin-top: 10px;
    color: var(--v-missionAccent-base);
    // font-size: 0.9rem;
  }
}
</style>
