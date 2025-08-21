<template>
  <div>
    <v-dialog v-model="dialog" width="30%" light>
      <!-- CREATE BUTTON -->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">Create profile</p>
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
            <p class="caption overline missionAccent--text">Upload profile photo</p>
            <div class="avatars-container d-flex flex-column">
              <div class="upload-avatar-container">
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
                  size="100"
                  class="mb-4"
                >
                  <img
                    v-if="profile.image.url"
                    :src="profile.image.url"
                    :alt="profile.firstName"
                    style="object-fit: cover"
                  />
                  <!-- <v-icon v-if="hover">{{mdiPencil}}</v-icon> -->
                  <v-icon :dark="dark" :light="!dark" v-else>{{ mdiAccount }}</v-icon>
                  <v-fade-transition>
                    <v-overlay v-if="onhover" absolute color="baseAccent">
                      <v-icon small @click="onButtonClick">{{ mdiPencil }}</v-icon>
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
              </div>
              <div class="navigators-avatar-container d-flex flex-wrap pl-1">
                <v-avatar
                  v-for="image in navigatorImages"
                  :key="image.name"
                  size="30"
                  class="navigators-avatar mr-2 mb-2"
                  :class="{ 'selected-navigator': profile.image.url === image.url }"
                  @click="selectNavigator(image)"
                >
                  <img :src="image.url" :alt="image.name" style="object-fit: cover" />
                </v-avatar>
              </div>
            </div>
            <!-- </v-hover> -->
          </div>
          <v-row class="d-flex justify-center align-center mt-4">
            <v-btn
              :loading="updatingAccount"
              color="missionAccent"
              class="ma-4"
              @click="update()"
              outlined
              width="30%"
              :disabled="updatingAccount"
            >
              Update
            </v-btn>
            <v-btn
              :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
              class="ma-4"
              @click="cancel()"
              outlined
              width="30%"
              :disabled="updatingAccount"
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
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiPencil, mdiAccount } from "@mdi/js";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";
import { navigatorImages } from "@/lib/utils";

export default {
  name: "CreateProfileDialog",
  props: ["dialog"],
  data: () => ({
    mdiPencil,
    mdiAccount,
    navigatorImages,
    updatingAccount: false,
    valid: true,
    profile: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      image: {
        url: "",
        name: "",
      },
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
      (v) => (v && v.length >= 6) || "Password must have a minimum of 8 characters",
    ],
  }),
  watch: {
    person() {
      Object.assign(this.profile, this.person);
    },
  },
  computed: {
    ...mapState(useRootStore, ["user", "person"]),
    confirmPasswordRules() {
      return [
        (v) => !!v || "Please confirm password",
        (v) => v === this.password || "The password confirmation does not match.",
      ];
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["getPersonById"]),
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
          this.updatingAccount = false;
          this.$emit("login");
        })
        .catch((err) => {
          console.error("something went wrong: ", err);
          this.updatingAccount = false;
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
      const storageRef = storage.ref(
        "avatar-images/" +
          this.profile.firstName +
          this.profile.lastName +
          "-" +
          this.selectedFile.name,
      );

      // upload a file
      const uploadTask = storageRef.put(this.selectedFile);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.uploadPercentage = Math.floor(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
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
        },
      );
    },
    updateProfile(data) {
      return db
        .collection("people")
        .doc(this.person.id)
        .update(data)
        .then(() => {
          // TODO: Use firebase reactive functions to make person reactive
          this.getPersonById(this.person.id);
          this.onhover = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          throw error; // Re-throw to be caught by the calling function
        });
    },
    selectNavigator(image) {
      console.log("Selecting navigator:", image);
      this.profile.image.url = image.url;
      this.profile.image.name = image.name;
      console.log("Updated profile.image:", this.profile.image);
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

.caption {
  text-align: center;
}

.avatars-container {
  width: 100%;

  .upload-avatar-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .navigators-avatar-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    .navigators-avatar {
      pointer-events: auto;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }

      &.selected-navigator {
        border: 2px solid var(--v-missionAccent-base);
        transform: scale(1.1);
      }

      img {
        pointer-events: none;
      }
    }
  }
}
</style>
