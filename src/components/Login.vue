<template>
  <div class="login">
    <p class="gm-title">GALAXY MAPS</p>
    <NewPassword 
      v-if="isResetPassword" 
      :actionCode="actionCode"
      :email="accountEmail"
      @close="isResetPassword = false"
    />
    <div v-else-if="isVerifyEmail" id="galaxy-info">
      <h2 class="galaxy-label">EMAIL VERIFIED</h2>
        <v-btn
          color="baseAccent"
          class="mr-4 my-4"
          @click="redirect"
          outlined
          width="100%"
        >
          continue to login
        </v-btn>
    </div>
    <div v-else id="galaxy-info">
      <h2 class="galaxy-label">LOGIN</h2>
      <!-- <h1 class="galaxy-title">Login</h1> -->
      <!-- <div class="d-flex justify-center align-center"> -->
      <!-- <v-img class="galaxy-image" :src=""></v-img> -->
      <!-- </div> -->
      <v-form
        ref="form"
        v-model="valid"
        lazy-validation
        class="my-6"
        @keyup.native.enter="valid && login($event)"
      >
        <v-text-field
          type="email"
          v-model="email"
          label="E-mail"
          :rules="emailRules"
          required
          color="baseAccent"
          outlined
          class="custom-input"
        ></v-text-field>
        <v-text-field
          type="password"
          v-model="password"
          label="Password"
          required
          color="baseAccent"
          outlined
          class="custom-input"
        ></v-text-field>
        <v-btn
          :disabled="!valid"
          color="baseAccent"
          class="mr-4"
          @click="login"
          outlined
          width="100%"
          :loading="loading"
        >
          Sign-in
        </v-btn>
      </v-form>

      <router-link to="/register" class="overline mt-4" color="baseAccent--text"
        >Register</router-link
      >
      <br />
      <router-link to="/reset" class="overline mt-4" color="baseAccent--text"
        >Reset Password</router-link
      >
    </div>
  </div>
</template>

<script>
import NewPassword from "./NewPassword.vue"

import firebase from "firebase";
import { mapGetters } from "vuex";
import { queryXAPIStatement } from "../lib/veracityLRS";

export default {
  name: "Login",
  components: {
    NewPassword
  },
  data: () => ({
    valid: true,
    email: "",
    password: "",
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    loading: false,
    isResetPassword: false,
    accountEmail: '',
    actionCode: '',
    isVerifyEmail: false
  }),
  mounted() {
    // Get the email action to complete.
    var mode = this.$route.query.mode || null;
    var actionCode = this.$route.query.oobCode
    var auth = firebase.auth()

    // Handle the user management action.
    switch (mode) {
      case 'resetPassword':
        // Display reset password handler and UI.
        this.handleResetPassword(auth, actionCode);
        break;
      case 'recoverEmail':
        // Display email recovery handler and UI.
        this.handleRecoverEmail(auth, actionCode);
        break;
      case 'verifyEmail':
        // Display email verification handler and UI.
        this.handleVerifyEmail(auth, actionCode);
        break;
      default:
        // Error: invalid mode.
    }
  },
  computed: {
    ...mapGetters(["person", "user"]),
  },
  methods: {
    redirect() {
      this.isVerifyEmail = false
      firebase
        .auth()
        .signOut()
      this.$router.push("login");
    },
    handleResetPassword(auth, actionCode) {
      // Verify the password reset code is valid.
      auth.verifyPasswordResetCode(actionCode).then((email) => {
        this.isResetPassword = true;
        this.accountEmail = email;
        this.actionCode = actionCode
      }).catch((error) => {
        // Invalid or expired action code. Ask user to try to reset the password
        this.$store.commit("setSnackbar", {
          show: true,
          text: 'error verifying code: '+ error.message,
          color: "pink",
        });
      });
    },
    handleRecoverEmail(auth, actionCode) {
      console.log('handle recover email')
      var restoredEmail = null;
      // Confirm the action code is valid.
      auth.checkActionCode(actionCode).then((info) => {
        // Get the restored email address.
        restoredEmail = info['data']['email'];

        // Revert to the old email.
        return auth.applyActionCode(actionCode);
      }).then(() => {
        // Account email reverted to restoredEmail
        auth.sendPasswordResetEmail(restoredEmail).then(() => {
        
        this.$store.commit("setSnackbar", {
          show: true,
          text: "Email successfully reverted. Password reset email sent",
          color: "baseAccent",
        });

        }).catch((error) => {
          // Error encountered while sending password reset code.
          this.$store.commit("setSnackbar", {
            show: true,
            text: 'error sending password reset email: '+ error.message,
            color: "pink",
          });
        });
      }).catch((error) => {
        this.$store.commit("setSnackbar", {
          show: true,
          text: 'invalid or expired code: '+ error.message,
          color: "pink",
        });
      });
    },
    handleVerifyEmail(auth, actionCode) {
      console.log('handle verify email')
      this.isVerifyEmail = true
      // Try to apply the email verification code.
      auth.applyActionCode(actionCode).then((resp) => {
        // Email address has been verified.
        this.$store.commit("setSnackbar", {
          show: true,
          text: "Email successfully verified",
          color: "baseAccent",
        });
      }).catch((error) => {
        // Code is invalid or expired. Ask the user to verify their email address
        this.$store.commit("setSnackbar", {
          show: true,
          text: 'invalid or expired code: '+ error.message,
          color: "pink",
        });
      });
    },
    login() {
      console.log('loggin in')
      this.loading = true;
      firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          // New sign-in will be persisted with session persistence.
          return firebase
            .auth()
            .signInWithEmailAndPassword(this.email, this.password);
        })
        .then(() => {
          this.proceed();
        })
        .catch((error) => {
          console.log('error: ', error)
          this.$store.commit("setSnackbar", {
            show: true,
            text: error.message,
            color: "pink",
          });
          this.loading = false;
        });
    },
    proceed() {
      if (!this.user?.data?.id || !this.person?.id) {
        return setTimeout(() => {
          this.proceed();
        }, 500);
      }
      if (!this.user.data.verified) {
        var actionCodeSettings = {
          // TODO: Update to galaxymaps.io on deployment
          url: window.location.origin + "/login",
          handleCodeInApp: true,
        };
        firebase.auth().currentUser.sendEmailVerification(actionCodeSettings);
        this.loading = false;
        throw new Error("Please check your emails to verify your account");
      } else {
        this.$router.push("/base/galaxies");
      }
    },
    validate() {
      this.$refs.form.validate();
    },
    resetPassword() {
      console.log("sending reset email password");
      firebase
        .auth()
        .sendPasswordResetEmail(this.email)
        .then(() => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Reset Password Email Sent",
            color: "baseAccent",
          });
        })
        .catch((error) => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: error.message,
            color: "pink",
          });
        });
    },
    // hack delay to wait for person to load before routing
    delay(ms) {
      return new Promise((res) => setTimeout(res, ms));
    },
  },
};
</script>

<style lang="scss" scoped>
.gm-title {
  font-family: "Genos", sans-serif;
  font-size: 5vw;
  color: var(--v-baseAccent-base);
  letter-spacing: 15px;
}
.login {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #393e46;
  // background-image: url("../assets/hudf_big.jpeg");
  background-size: cover;
  box-shadow: inset 0 0 0 2000px rgba(20, 30, 48, 0.9);

  .title {
    color: var(--v-baseAccent-base);
    text-transform: uppercase;
    text-align: center;
  }

  .custom-input {
    font-size: 0.9rem;
  }

  a {
    color: var(--v-baseAccent-base) !important;
  }
}

#galaxy-info {
  width: 300px;
  // height: 400px;
  border: 1px solid var(--v-baseAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;

  .galaxy-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    // ribbon label
    position: absolute;
    top: 0;
    left: -1px;
    background-color: var(--v-baseAccent-base);
    color: var(--v-background-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
  }

  .resetPassButton {
    text-decoration: underline;
    cursor: pointer;
  }
}
</style>
