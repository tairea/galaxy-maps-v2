<template>
  <div class="login">
    <!-- <v-img :src="`https://i.pravatar.cc/300`" class="gm-logo"></v-img> -->
    <div id="galaxy-info">
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

    <!-- Login Error Snackbar -->
    <v-snackbar v-model="snackbar">
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn
          :color="snackbarColour"
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          OK
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import firebase from "firebase";
import { mapGetters } from "vuex";
import { queryXAPIStatement } from "../store/veracityLRS";

export default {
  name: "Login",
  data: () => ({
    valid: true,
    email: "",
    password: "",
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    snackbar: false,
    snackbarText: "",
    snackbarColour: "",
    loading: false,
  }),
  mounted() {
    // working test xApi query (requests galaxy info from specific user)
    queryXAPIStatement({
      "statement.actor.mbox": "mailto:email.thebro@gmail.com",
      "statement.context.contextActivities.grouping.id":
        "https://www.galaxymaps.io/course/52YbN7eoE8ol5aPzvEap",
    }).then((result) => {
      console.log("result");
      console.log(result);
    });
  },

  computed: {
    ...mapGetters(["person", "user"]),
  },
  methods: {
    login() {
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
          this.snackbarColour = "pink";
          this.snackbarText = error;
          this.snackbar = true;
          console.log("Login error:", error);
          this.loading = false;
        });
    },
    proceed() {
      if (!this.user?.data?.id || !this.person?.id) {
        return setTimeout(() => {
          this.proceed();
        }, 500);
      }
      if (this.person.accountType == "student") {
        this.$router.push("/base/galaxies/assigned");
      } else {
        this.$router.push("/base/cohorts");
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
          this.snackbarColour = "baseAccent";
          this.snackbarText = "Reset Password Email Sent";
          this.snackbar = true;
          // Password reset email sent!
          // ..
        })
        .catch((error) => {
          this.snackbarColour = "pink";
          this.snackbarText = "Error: " + error.message;
          this.snackbar = true;
          var errorCode = error.code;
          var errorMessage = error.message;
          // ..
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
.login {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #393e46;
  background-image: url("../assets/hudf_big.jpeg");
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
