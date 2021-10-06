<template>
  <div class="login">
    <!-- <v-img :src="`https://i.pravatar.cc/300`" class="gm-logo"></v-img> -->
    <div id="galaxy-info">
      <h2 class="galaxy-label">LOGIN</h2>
      <!-- <h1 class="galaxy-title">Login</h1> -->
      <!-- <div class="d-flex justify-center align-center"> -->
      <!-- <v-img class="galaxy-image" :src=""></v-img> -->
      <!-- </div> -->
      <v-form ref="form" v-model="valid" lazy-validation class="my-6">
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
        >
          Sign-in
        </v-btn>
      </v-form>

      <router-link to="/register" class="overline mt-4" color="baseAccent--text"
        >Register</router-link
      >
    </div>

    <!-- <div id="firebaseui-auth-container"></div> -->
  </div>
</template>

<script>
import firebase from "firebase";
import * as firebaseui from "firebaseui";
// import "firebaseui/dist/firebaseui.css";

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
  }),
  mounted() {},
  methods: {
    login() {
      firebase
        .auth()
        .signInWithEmailAndPassword(this.email, this.password)
        .then(() => {
          alert("Successfully logged in");
          this.$router.push("/galaxy");
        })
        .catch((error) => {
          alert(error.message);
        });
    },
    validate() {
      this.$refs.form.validate();
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

  .galaxy-title {
    font-size: 1.2rem;
    color: var(--v-baseAccent-base) !important;
    font-weight: 600;
    text-transform: uppercase;
    margin: 20px 0px 5px 0px;
    color: white;
  }

  .galaxy-image {
    width: 100%;
  }

  .galaxy-description {
    margin-top: 10px;
    color: var(--v-baseAccent-base);
    // font-size: 0.9rem;
  }
}
</style>
