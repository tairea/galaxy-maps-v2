<template>
  <div>
    <v-dialog v-model="dialog" width="30%" light persistent>
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">Create your account</p>
        </div>
        <div class="create-dialog-content pt-0">
          <div v-if="tokenError" class="mb-4">
            <p class="overline" :class="tokenErrorClass" style="text-align: center">
              {{ tokenErrorMessage }}
            </p>
            <v-btn
              color="baseAccent"
              outlined
              width="100%"
              :loading="resending"
              @click="resendLink"
            >
              Email me a new link
            </v-btn>
            <v-divider class="my-6"></v-divider>
          </div>
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
              :type="hidePassword ? 'password' : 'text'"
              v-model="password"
              label="Create new password"
              :rules="passwordRules"
              required
              color="missionAccent"
              outlined
              class="custom-input"
              :append-icon="hidePassword ? mdiEye : mdiEyeOff"
              @click:append="() => (hidePassword = !hidePassword)"
            ></v-text-field>
            <v-text-field
              :dark="dark"
              :light="!dark"
              :type="hideConfirmPassword ? 'password' : 'text'"
              v-model="confirmPassword"
              label="Confirm new password"
              :rules="confirmPasswordRules"
              required
              color="missionAccent"
              outlined
              class="custom-input"
              :append-icon="hideConfirmPassword ? mdiEye : mdiEyeOff"
              @click:append="() => (hideConfirmPassword = !hideConfirmPassword)"
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
          </div>
          <v-row class="d-flex justify-center align-center mt-4">
            <v-btn
              :loading="settingPassword"
              color="missionAccent"
              class="ma-4"
              @click="setPassword()"
              outlined
              width="30%"
              :disabled="settingPassword"
            >
              Create Account
            </v-btn>
            <!-- <v-btn
              :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
              class="ma-4"
              @click="cancel()"
              outlined
              width="30%"
              :disabled="settingPassword"
            >
              Cancel
            </v-btn> -->
          </v-row>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiPencil, mdiAccount, mdiEye, mdiEyeOff } from "@mdi/js";
import firebase from "firebase/compat/app";
import "firebase/compat/functions";
import { mapActions, mapState } from "pinia";
import { navigatorImages } from "@/lib/utils";

export default {
  name: "SetInitialPasswordDialog",
  props: ["dialog", "userEmail", "userId", "token"],
  data: () => ({
    mdiPencil,
    mdiAccount,
    mdiEye,
    mdiEyeOff,
    navigatorImages,
    settingPassword: false,
    resending: false,
    tokenError: false,
    tokenErrorMessage: "",
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
    hidePassword: true,
    hideConfirmPassword: true,
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
      (v) => (v && v.length >= 8) || "Password must have a minimum of 8 characters",
    ],
  }),
  mounted() {
    if (this.userEmail) this.profile.email = this.userEmail;
    if (this.userId) this.profile.id = this.userId;
    this.prefillFromBackend();
  },
  watch: {
    dialog(newVal) {
      if (newVal) {
        if (this.userEmail) this.profile.email = this.userEmail;
        if (this.userId) this.profile.id = this.userId;
        this.prefillFromBackend();
      }
    },
    userEmail(newVal) {
      if (newVal) this.profile.email = newVal;
    },
    userId(newVal) {
      if (newVal) this.profile.id = newVal;
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
    tokenErrorClass() {
      return this.$vuetify.theme.isDark ? "pink--text" : "error--text";
    },
  },
  methods: {
    ...mapActions(useRootStore, ["getPersonById", "setSnackbar"]),
    async prefillFromBackend() {
      if (!this.userId) return;
      try {
        const doc = await db.collection("people").doc(this.userId).get();
        const data = doc.data() || {};
        this.profile.firstName = data.firstName || this.profile.firstName || "";
        this.profile.lastName = data.lastName || this.profile.lastName || "";
        this.profile.email = data.email || this.profile.email || this.userEmail || "";
        if (data.image && data.image.url) {
          this.profile.image = { ...this.profile.image, ...data.image };
        }
      } catch (e) {
        console.warn("Failed to prefill profile from Firestore", e);
      }
    },
    cancel() {
      this.dialog = false;
      this.$refs.form.reset();
      this.profile = {
        id: "",
        firstName: "",
        lastName: "",
        email: "",
        image: {
          url: "",
          name: "",
        },
      };
      this.password = "";
      this.confirmPassword = "";
    },
    async setPassword() {
      this.$refs.form.validate();
      if (
        !this.profile.email ||
        !this.confirmPassword ||
        !this.profile.firstName ||
        !this.profile.lastName
      ) {
        this.setSnackbar({
          show: true,
          text: "Please fill in all required fields",
          color: "pink",
        });
        return;
      }

      this.settingPassword = true;
      this.tokenError = false;

      try {
        if (this.token) {
          await firebase.auth().signInWithCustomToken(this.token);
        } else {
          await firebase.auth().signInAnonymously();
        }
        await this.updateUserPassword();
        await this.updateProfile(this.profile);
        await firebase.auth().signOut();
        this.settingPassword = false;
        this.setSnackbar({
          show: true,
          text: "Password set successfully! You can now log in.",
          color: "baseAccent",
        });
        this.$emit("passwordSet");
        this.cancel();
      } catch (err) {
        console.error("Error setting password:", err);
        this.settingPassword = false;
        const code = err?.code || "auth/error";
        if (
          code === "auth/argument-error" ||
          code === "auth/invalid-custom-token" ||
          code === "auth/custom-token-mismatch"
        ) {
          this.tokenError = true;
          this.tokenErrorMessage = "Create account link expired. Request a new link.";
        } else {
          this.setSnackbar({
            show: true,
            text: "Error setting password. Please try again.",
            color: "pink",
          });
        }
      }
    },
    async resendLink() {
      if (!this.userId || !this.profile.email) return;
      this.resending = true;
      try {
        const functionsCompat = firebase.functions();
        const resend = functionsCompat.httpsCallable("resendInitialSetupLink");
        await resend({ personId: this.userId, email: this.profile.email });
        this.setSnackbar({ show: true, text: "A new link has been emailed.", color: "baseAccent" });
      } catch (e) {
        this.setSnackbar({ show: true, text: "Unable to send new link.", color: "pink" });
      } finally {
        this.resending = false;
      }
    },
    async updateUserPassword() {
      const functionsCompat = firebase.functions();
      const updateUserPassword = functionsCompat.httpsCallable("updateUserPassword");
      return updateUserPassword({
        userId: this.userId,
        password: this.confirmPassword,
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        email: this.profile.email,
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
      const namePart = (this.profile.firstName || "") + (this.profile.lastName || "");
      const fallback = this.userId ? `${this.userId}-${Date.now()}` : `${Date.now()}`;
      const safePrefix = namePart || fallback;
      const storageRef = storage.ref(`avatar-images/${safePrefix}-${this.selectedFile.name}`);
      const uploadTask = storageRef.put(this.selectedFile);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          this.uploadPercentage = Math.floor(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
        },
        (err) => {
          console.log(err);
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            this.uploading = false;
            this.profile.image.url = downloadURL;
            this.profile.image.name = this.selectedFile.name;
          });
        },
      );
    },
    updateProfile(data) {
      return db
        .collection("people")
        .doc(this.userId)
        .update(data)
        .then(() => {
          this.getPersonById(this.userId);
          this.onhover = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          throw error;
        });
    },
    selectNavigator(image) {
      this.profile.image.url = image.url;
      this.profile.image.name = image.name;
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
