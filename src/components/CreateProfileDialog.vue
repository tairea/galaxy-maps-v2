<template>
  <div>
    <v-dialog v-model="dialog" width="30%" light>
      <!-- CREATE BUTTON -->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">Update profile</p>
        </div>
        <div class="create-dialog-content pt-0">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              :dark="dark"
              :light="!dark"
              type="text"
              v-model="profile.firstName"
              label="First Name"
              color="missionAccent"
              outlined
              class="custom-input mt-6"
              required
            ></v-text-field>
            <v-text-field
              :dark="dark"
              :light="!dark"
              type="text"
              v-model="profile.lastName"
              label="Last Name"
              color="missionAccent"
              outlined
              class="custom-input"
              required
            ></v-text-field>
            <v-text-field
              :dark="dark"
              :light="!dark"
              type="email"
              v-model="profile.email"
              label="E-mail"
              :rules="emailRules"
              disabled
              color="missionAccent"
              outlined
              class="custom-input"
            ></v-text-field>
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
          </v-form>
          <div>
            <p class="caption">Upload profile photo</p>
            <v-progress-circular
              v-if="uploading"
              :rotate="360"
              :size="60"
              :width="2"
              :value="uploadPercentage"
              color="baseAccent"
            >
              {{ uploadPercentage + "%" }}
            </v-progress-circular>
            <!-- <v-hover v-else v-slot="{ hover }"> -->
            <v-avatar
              v-else
              color="secondary"
              @mouseenter="onhover = true"
              @mouseleave="onhover = false"
              size="60"
              class="mb-4"
            >
              <img
                v-if="profile.image.url"
                :src="profile.image.url"
                :alt="profile.firstName"
                style="object-fit: cover"
              />
              <!-- <v-icon v-if="hover">mdi-pencil</v-icon> -->
              <v-icon :dark="dark" :light="!dark" v-else>mdi-account</v-icon>
              <v-fade-transition>
                <v-overlay v-if="onhover" absolute color="baseAccent">
                  <v-icon small @click="onButtonClick">mdi-pencil</v-icon>
                </v-overlay>
              </v-fade-transition>
              <input
                ref="uploader"
                class="d-none"
                type="file"
                accept="image/*"
                @change="onFileChanged"
              />
            </v-avatar>
            <!-- </v-hover> -->
          </div>
          <v-row>
            <v-btn
              :disabled="!valid || updatingAccount"
              color="missionAccent"
              class="ma-4"
              @click="update()"
              outlined
              width="30%"
            >
              Update
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
import { db, storage } from "../store/firestoreConfig";
import { mapGetters, mapActions } from "vuex";
import firebase from "firebase";

export default {
  name: "CreateProfileDialog",
  props: ["dialog"],
  data: () => ({
    updatingAccount: false,
    valid: true,
    profile: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      image: {},
    },
    password: "",
    confirmPassword: "",
    selectedFile: {},
    uploading: false,
    uploadPercentage: 0,
    onhover: false,
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    passwordRules: [
      (v) => !!v || "Password is required",
      (v) =>
        (v && v.length >= 8) || "Password must have a minimum of 8 characters",
    ],
  }),
  watch: {
    person() {
      Object.assign(this.profile, this.person);
    },
  },
  computed: {
    ...mapGetters(["user", "person"]),
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
    ...mapActions(["getPersonById"]),
    cancel() {
      this.dialog = false;
      this.$refs.form.reset();
      this.person.id = "";
      this.displayName = "";
    },
    update() {
      this.$refs.form.validate();
      if (!this.profile.email || !this.confirmPassword) return;
      this.updatingAccount = true;

      // update user password
      this.updatePassword()
        .then(() => {
          // update profile with user names
          this.updateProfile(this.profile);
        })
        .then(() => {
          // login and navigate to my cohorts
          this.$emit("login");
        })
        .catch((err) => {
          console.error("something went wrong: ", err);
        });
    },
    updatePassword() {
      const user = firebase.auth().currentUser;
      return user
        .updatePassword(this.confirmPassword)
        .then(() => {})
        .catch((error) => {
          console.error("something went wrong updating password: ", error);
        });
    },
    onButtonClick() {
      this.$refs.uploader?.click();
    },
    async onFileChanged(e) {
      this.selectedFile = e.target.files[0];
      await this.storeImage();
    },
    storeImage() {
      this.uploading = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "avatar-images/" +
          this.profile.firstname +
          this.person.lastname +
          "-" +
          this.selectedFile.name
      );

      // upload a file
      var uploadTask = storageRef.put(this.selectedFile);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.uploadPercentage = Math.floor(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
        },
        // upload error
        (err) => {
          console.log(err);
        },
        // upload complete
        () => {
          // get image url
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // add image url to course obj
            this.uploading = false;
            this.profile.image.url = downloadURL;
            this.profile.image.name = this.selectedFile.name;
            this.updateProfile(this.profile);
          });
        }
      );
    },
    updateProfile(data) {
      db.collection("people")
        .doc(this.person.id)
        .update(data)
        .then(() => {
          // TODO: Use firebase reactive functions to make person reactive
          this.getPersonById(this.person.id);
          this.onhover = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
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
