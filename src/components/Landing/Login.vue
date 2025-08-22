<template>
  <div class="login">
    <p class="gm-title" :style="{ fontSize: isMobile ? '10vw' : '5vw' }">GALAXY MAPS</p>
    <SetInitialPasswordDialog
      ref="initialPassDialog"
      v-if="showInitialPasswordDialog"
      :dialog="showInitialPasswordDialog"
      :userEmail="initialEmail"
      :userId="initialUserId"
      :token="initialSetupToken"
      @passwordSet="onInitialPasswordSet"
    />
    <EmailSignIn v-if="showEmailSignin" />
    <NewPassword
      v-else-if="isResetPassword"
      :actionCode="actionCode"
      :email="accountEmail"
      @close="isResetPassword = false"
    />
    <div v-else-if="isVerifyEmail" id="galaxy-info">
      <h2 class="galaxy-label">EMAIL VERIFIED</h2>
      <v-btn color="baseAccent" class="mr-4 my-4" @click="redirect" outlined width="100%">
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
          v-model="password"
          label="Password"
          required
          color="baseAccent"
          outlined
          class="custom-input"
          :append-icon="hide ? mdiEye : mdiEyeOff"
          @click:append="() => (hide = !hide)"
          :type="hide ? 'password' : 'text'"
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
        <v-btn
          color="baseAccent"
          class="mr-4 mt-6"
          @click="googleSignIn"
          outlined
          width="100%"
          :loading="loadingGoogle"
        >
          <v-icon left class="mr-2">{{ mdiGoogle }}</v-icon>
          Sign in with Google
        </v-btn>
      </v-form>

      <router-link to="/register" class="overline mt-4" color="baseAccent--text"
        >Create an Account</router-link
      >
      <br />
      <router-link to="/reset" class="overline mt-4" color="baseAccent--text"
        >Reset Password</router-link
      >
    </div>
  </div>
</template>

<script>
import NewPassword from "@/components/Reused/NewPassword.vue";
import EmailSignIn from "@/components/Reused/EmailSignIn.vue";
import SetInitialPasswordDialog from "@/components/Dialogs/SetInitialPasswordDialog.vue";
import useRootStore from "@/store/index";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { mapActions, mapState } from "pinia";
import { mdiEye, mdiEyeOff, mdiGoogle } from "@mdi/js";
import { getFriendlyErrorMessage } from "@/lib/utils";

export default {
  name: "Login",
  components: {
    NewPassword,
    EmailSignIn,
    SetInitialPasswordDialog,
  },
  data: () => ({
    mdiEye,
    mdiEyeOff,
    mdiGoogle,
    valid: true,
    email: "",
    password: "",
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    loading: false,
    loadingGoogle: false,
    isResetPassword: false,
    accountEmail: "",
    actionCode: "",
    isVerifyEmail: false,
    showEmailSignin: false,
    showInitialPasswordDialog: false,
    initialEmail: "",
    initialUserId: "",
    initialSetupToken: "",
    hide: String,
  }),
  mounted() {
    this.initFromQuery();
  },
  watch: {
    "$route.query.mode"() {
      this.initFromQuery();
    },
  },
  computed: {
    ...mapState(useRootStore, ["person", "user"]),
    isMobile() {
      return this.$vuetify.breakpoint.mobile;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    initFromQuery() {
      const mode = this.$route.query.mode || null;
      const actionCode = this.$route.query.oobCode;
      const auth = firebase.auth();
      // console logs for debugging
      console.log("Login initFromQuery mode:", mode);

      switch (mode) {
        case "resetPassword":
          this.handleResetPassword(auth, actionCode);
          break;
        case "recoverEmail":
          this.handleRecoverEmail(auth, actionCode);
          break;
        case "verifyEmail":
          this.handleVerifyEmail(auth, actionCode);
          break;
        case "signIn":
          if (this.$route.fullPath.includes("email_signin")) {
            this.showEmailSignin = true;
          }
          break;
        case "initialPassword":
          this.initialEmail = this.$route.query.email || "";
          this.initialUserId = this.$route.query.userId || "";
          this.initialSetupToken = this.$route.query.token || "";
          this.showInitialPasswordDialog = Boolean(this.initialEmail && this.initialUserId);
          this.$nextTick(() => {
            // force-open fallback
            const ref = this.$refs.initialPassDialog;
            if (ref && this.showInitialPasswordDialog) {
              try {
                // if child guards prop, it may still open since v-dialog binds to prop
                // this is a fallback if needed
                // eslint-disable-next-line no-prototype-builtins
                if (
                  ref &&
                  ref.$props &&
                  ref.$props.hasOwnProperty("dialog") &&
                  !ref.$props.dialog
                ) {
                  ref.$props.dialog = true; // best-effort
                }
              } catch (e) {}
            }
          });
          break;
        default:
          break;
      }
    },
    onInitialPasswordSet() {
      this.showInitialPasswordDialog = false;
      this.setSnackbar({
        show: true,
        text: "Password set successfully! You can now log in.",
        color: "baseAccent",
      });
    },
    async googleSignIn() {
      try {
        this.loadingGoogle = true;
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        await firebase.auth().signInWithPopup(provider);
        this.proceed();
      } catch (error) {
        if (error && error.code === "auth/popup-blocked") {
          const provider = new firebase.auth.GoogleAuthProvider();
          await firebase.auth().signInWithRedirect(provider);
          return;
        }
        this.setSnackbar({
          show: true,
          text: getFriendlyErrorMessage(error.code || "auth/error"),
          color: "pink",
        });
      } finally {
        this.loadingGoogle = false;
      }
    },
    redirect() {
      this.isVerifyEmail = false;
      firebase.auth().signOut();
      this.$router.push("login");
    },
    handleResetPassword(auth, actionCode) {
      auth
        .verifyPasswordResetCode(actionCode)
        .then((email) => {
          this.isResetPassword = true;
          this.accountEmail = email;
          this.actionCode = actionCode;
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
        });
    },
    handleRecoverEmail(auth, actionCode) {
      console.log("handle recover email");
      let restoredEmail = null;
      auth
        .checkActionCode(actionCode)
        .then((info) => {
          restoredEmail = info["data"]["email"];
          return auth.applyActionCode(actionCode);
        })
        .then(() => {
          auth
            .sendPasswordResetEmail(restoredEmail)
            .then(() => {
              this.setSnackbar({
                show: true,
                text: "Email successfully reverted. Password reset email sent",
                color: "baseAccent",
              });
            })
            .catch((error) => {
              this.setSnackbar({
                show: true,
                text: getFriendlyErrorMessage(error.message || error.code),
                color: "pink",
              });
            });
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
        });
    },
    handleVerifyEmail(auth, actionCode) {
      console.log("handle verify email");
      this.isVerifyEmail = true;
      auth
        .applyActionCode(actionCode)
        .then((resp) => {
          this.setSnackbar({
            show: true,
            text: "Email successfully verified",
            color: "baseAccent",
          });
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
          this.$router.push("/verify");
        });
    },
    login() {
      console.log("loggin in");
      this.loading = true;
      firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          return firebase.auth().signInWithEmailAndPassword(this.email, this.password);
        })
        .then(() => {
          this.proceed();
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
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
        const actionCodeSettings = {
          url: window.location.origin + "/login",
          handleCodeInApp: true,
        };
        firebase.auth().currentUser.sendEmailVerification(actionCodeSettings);
        this.loading = false;
        this.setSnackbar({
          show: true,
          text: "Your account is not verified. We've just emailed you a link to verify your account. Please check your email.",
          color: "baseAccent",
        });
        throw new Error("Please check your emails to verify your account");
      } else {
        this.$router.push("/");
      }
    },
    validate() {
      this.$refs.form.validate();
    },
    resetPassword() {
      firebase
        .auth()
        .sendPasswordResetEmail(this.email)
        .then(() => {
          this.setSnackbar({
            show: true,
            text: "Reset Password Email Sent",
            color: "baseAccent",
          });
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
        });
    },
    delay(ms) {
      return new Promise((res) => setTimeout(res, ms));
    },
  },
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Genos:wght@200&display=swap");

.gm-title {
  font-family: "Genos", sans-serif;
  // font-size: 5vw; inline on isMobile condition
  color: var(--v-baseAccent-base);
  letter-spacing: 15px;
  z-index: 1;
  // position: relative;
  // top: 100px;
}
.login {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #393e46;
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
