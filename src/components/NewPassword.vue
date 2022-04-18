<template>
  <div id="signin-info">
    <h2 class="signin-label">Create New Password</h2>
    <p class="signin-description mt-4">
      Reset your password for you Galaxy Maps account
    </p>
    <v-form ref="form" v-model="valid" lazy-validation class="my-4">
      <v-text-field
          :dark="dark"
          :light="!dark"
          type="password"
          v-model="password"
          label="Password"
          :rules="passwordRules"
          required
          color="missionAccent"
          outlined
          class="custom-input"
      ></v-text-field>
      <v-text-field
          :dark="dark"
          :light="!dark"
          type="password"
          v-model="confirmPassword"
          label="Confirm password"
          :rules="confirmPasswordRules"
          required
          color="missionAccent"
          outlined
          class="custom-input"
      ></v-text-field>
      <v-btn
        :disabled="!valid"
        color="missionAccent"
        class="mr-4"
        @click="resetPassword()"
        outlined
        width="100%"
      >
        Sign in
      </v-btn>
      <v-btn
        color="missionAccent"
        class="mr-4 mt-4"
        @click="$emit('close')"
        outlined
        width="100%"
      >
        back to login
      </v-btn>
    </v-form>
  </div>
</template>

<script>
import firebase from "firebase";
import { mapGetters } from "vuex"

export default {
  name: "NewPassword",
  props: {
    actionCode: { type: String},
    email: { type: String }
  },
  data: () => ({
    valid: true,
    password: "",
    confirmPassword: "",
    passwordRules: [
      (v) => !!v || "Password is required",
      (v) =>
        (v && v.length >= 8) || "Password must have a minimum of 8 characters",
    ],
  }),
  computed : {
    ...mapGetters(['user', 'person']),
    confirmPasswordRules() {
      return [
        (v) => !!v || "Please confirm password",
        (v) =>
          v === this.password || "The password confirmation does not match.",
      ];
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    resetPassword() {
      // Save the new password.
      firebase.auth().confirmPasswordReset(this.actionCode, this.confirmPassword)
      .then((resp) => {
        // Password reset has been confirmed. 
        this.$store.commit("setSnackbar", {
          show: true,
          text: "Password reset",
          color: "baseAccent",
        }); 
      }).then(() => {
        firebase
          .auth()
          .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      }).then(() => {
        // Sign in user
        return firebase.auth().signInWithEmailAndPassword(this.email, this.confirmPassword);
      }).then(() => {
        this.proceed()
      }).catch((error) => {
        // Error occurred during confirmation. The code might have expired or the
        this.$store.commit("setSnackbar", {
          show: true,
          text: 'something went wrong please try to reset your password again',
          color: "pink",
        });
      });
    },
    proceed() {
      if (!this.user?.data?.id || !this.person?.id) {
        return setTimeout(() => {
          this.proceed()
        }, 500)
      } else this.login()
    },
    login() {
      this.$refs.form.reset()
      this.$router.push("/base/galaxies");
    }
  },
};
</script>

<style lang="scss" scoped>

#signin-info {
  width: 300px;
  // height: 400px;
  border: 1px solid var(--v-missionAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
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
    padding: 0px 30px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
  }

  .signin-description {
    margin-top: 10px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
  }

  .custom-input {
    color: var(--v-missionAccent-base);
  }
}
</style>
