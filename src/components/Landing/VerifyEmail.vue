<template>
  <div class="bg">
    <div class="verify">
      <p class="overline gm-title">Please verify your email</p>
      <p class="overline" style="font-size: 0.65rem !important">
        An email has been sent to the email address that you entered
      </p>
      <p class="overline" style="font-size: 0.65rem !important">
        Please check your emails and click on the link to verify your email.
      </p>
      <v-row class="mt-8">
        <v-btn outlined class="mr-4" color="baseAccent" :to="{ path: 'login' }">
          Back to login
        </v-btn>
        <v-btn :loading="loading" outlined color="missionAccent" @click="sendVerificationEmail">
          resend email
        </v-btn>
      </v-row>
    </div>
  </div>
</template>

<script>
import firebase from "firebase/compat/app";

export default {
  name: "VerifyEmail",
  components: {},
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    sendVerificationEmail() {
      this.loading = true;
      var actionCodeSettings = {
        url: window.location.origin + "/login",
        handleCodeInApp: true,
      };
      return firebase
        .auth()
        .currentUser.sendEmailVerification(actionCodeSettings)
        .then(() => {
          console.log("Email verification sent!");
          this.loading = false;
        })
        .catch((error) => {
          console.error(error);
          this.loading = false;
        });
    },
  },
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Genos:wght@200&display=swap");

.gm-title {
  // font-family: "Genos", sans-serif;
  // font-size: 5vw;
  color: var(--v-baseAccent-base);
  // letter-spacing: 15px;
}
.bg {
  background: var(--v-background-base);
  // overflow: hidden;
  // overflow-y: hidden; // hide vertical
  // overflow-x: hidden; // hide horizontal
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100vh;
  width: 100vw;

  .verify {
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
}
</style>
