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
        <a href="mailto:ian@tairea.io">ian@tairea.io</a>
      </p>

      <v-form v-else ref="form" v-model="valid" lazy-validation class="my-4">
        <v-text-field
          type="email"
          v-model="person.firstName"
          label="First Name"
          required
          color="missionAccent"
          outlined
          class="custom-input mt-6"
        ></v-text-field>
        <v-text-field
          type="email"
          v-model="person.lastName"
          label="Last Name"
          required
          color="missionAccent"
          outlined
          class="custom-input"
        ></v-text-field>
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
          type="password"
          v-model="person.password"
          label="Password"
          required
          color="missionAccent"
          outlined
          class="custom-input"
        ></v-text-field>
        <v-select
          dark
          :items="items"
          label="Account Type"
          v-model="person.accountType"
          outlined
        ></v-select>
        <!-- <p>Account Type</p> -->
        <!-- <v-radio-group  row>
          <v-radio label="Teacher" value="teacher" color="green" dark>
          </v-radio>
          <v-radio label="Student" value="student" color="green" dark>
          </v-radio>
        </v-radio-group> -->
        <v-btn
          :disabled="!valid"
          color="missionAccent"
          class="mr-4"
          @click="register"
          outlined
          width="100%"
        >
          Register
        </v-btn>
      </v-form>
    </div>
    <!-- <v-img :src="`https://i.pravatar.cc/300`" class="gm-logo"></v-img> -->
    <div style="width: 300px; margin: 0px auto">
      <BackButton :toPath="'/login'" />
    </div>
  </div>
</template>

<script>
import firebase from "firebase";
import { db } from "../store/firestoreConfig";

import BackButton from "../components/BackButton";

export default {
  name: "Register",
  components: {
    BackButton,
  },
  data: () => ({
    closed: false,
    valid: true,
    person: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      id: "",
      accountType: "teacher",
    },
    items: ["teacher", "student"],
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
  }),
  mounted() {},
  methods: {
    register() {
      // add user the auth
      firebase
        .auth()
        .createUserWithEmailAndPassword(this.person.email, this.person.password)
        .then((userRef) => {
          console.log(userRef.user.uid);
          // get new user id
          this.person.id = userRef.user.uid;
          // remove password so its not saved to database
          delete this.person.password;
          // add user to people database
          db.collection("people")
            .doc(this.person.id)
            .set(this.person)
            .then(() => {
              alert("Successfully registered! Please login.");
              // route to login screen
              this.$router.push("/login");
            })
            .catch((error) => {
              console.error("Error writing document: ", error);
            });
        })
        .catch((error) => {
          alert(error.message);
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
</style>
