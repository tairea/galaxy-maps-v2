<template>
  <!-- Edit dialog -->
  <v-dialog v-model="dialog" width="30%" light>
    <!-- CREATE BUTTON -->
    <template v-slot:activator="{ on, attrs }">
      <!-- <v-btn
        v-if="isDashboardView"
        v-bind="attrs"
        v-on="on"
        class="mission-edit-button mt-4"
        outlined
        color="baseAccent"
        x-small
      >
        <v-icon small> {{ mdiPencil }} </v-icon>
      </v-btn> -->
      <v-btn
        v-if="isStudentPopupView"
        v-bind="attrs"
        v-on="on"
        class="mission-edit-button"
        outlined
        color="white"
        x-small
      >
        <v-icon small> {{ mdiPencil }} </v-icon>
      </v-btn>
      <v-btn v-else v-bind="attrs" v-on="on" color="baseAccent" class="ma-3" outlined>
        <v-icon class="pr-2">{{ mdiPencil }}</v-icon>
        edit account
      </v-btn>
    </template>

    <!-- DIALOG (TODO: make as a component)-->
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <div class="d-flex justify-space-between mb-4">
          <p class="dialog-title ma-0">Edit your profile details</p>
          <v-btn icon @click="dialog = false">
            <v-icon color="missionAccent">{{ mdiClose }}</v-icon>
          </v-btn>
        </div>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <p class="dialog-description">Update your profile information</p>
        </div>
      </div>

      <div class="create-dialog-content">
        <!-- FIRST NAME -->
        <v-text-field
          class="input-field"
          outlined
          :dark="dark"
          :light="!dark"
          color="missionAccent"
          v-model="profile.firstName"
          label="First name"
        ></v-text-field>
        <!-- LAST NAME -->
        <v-text-field
          class="input-field"
          outlined
          :dark="dark"
          :light="!dark"
          color="missionAccent"
          v-model="profile.lastName"
          label="Last name"
        ></v-text-field>
        <!-- EMAIL -->
        <v-row>
          <v-col cols="10" class="pt-3 pb-0">
            <v-text-field
              class="input-field"
              outlined
              :disabled="!editEmail"
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              v-model="profile.email"
              label="Email"
              ref="emailField"
              clear-icon="mdi-close-circle"
            ></v-text-field>
          </v-col>
          <v-col cols="2">
            <v-icon
              class="mt-2"
              large
              color="missionAccent"
              v-if="!editEmail"
              @click="editEmail = true"
            >
              {{ mdiPencilBox }}
            </v-icon>
            <v-icon class="mt-2" large color="missionAccent" v-else @click="cancelEmail">{{
              mdiClose
            }}</v-icon>
          </v-col>
        </v-row>
        <!-- PASSWORD -->
        <v-row>
          <v-col cols="10" class="py-0">
            <v-text-field
              class="input-field"
              outlined
              :disabled="!editPassword"
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              v-model="newPassword"
              :append-icon="hidePassword ? mdiEye : mdiEyeOff"
              @click:append="() => (hidePassword = !hidePassword)"
              :type="hidePassword ? 'password' : 'text'"
              label="Change Password"
            ></v-text-field>
          </v-col>
          <v-col cols="2">
            <v-icon
              class="mt-2"
              large
              color="missionAccent"
              v-if="!editPassword"
              @click="editPassword = true"
            >
              {{ mdiPencilBox }}
            </v-icon>
            <v-icon class="mt-2" large color="missionAccent" v-else @click="cancelPassword">{{
              mdiClose
            }}</v-icon>
          </v-col>
        </v-row>
        <!-- Discord handle -->
        <!-- <v-text-field
          class="input-field"
          outlined
          :dark="dark"
          :light="!dark"
          color="missionAccent"
          v-model="profile.discord"
          label="Discord handle (optional)"
        ></v-text-field> -->
        <!-- Photo -->
        <div>
          <p class="caption overline missionAccent--text text-center">Upload profile photo</p>
          <div class="avatars-container d-flex flex-column pb-6">
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
                  v-if="profile.image && profile.image.url"
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
                :class="{ 'selected-navigator': profile.image && profile.image.url === image.url }"
                @click="selectNavigator(image)"
              >
                <img :src="image.url" :alt="image.name" style="object-fit: cover" />
              </v-avatar>
            </div>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <v-btn
            outlined
            color="baseAccent"
            @click="updatePerson(profile)"
            class="mr-2"
            :loading="loading"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon left> {{ mdiCheck }} </v-icon>
            UPDATE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="ml-2"
            @click="cancel"
            :disabled="loading"
          >
            <v-icon left> {{ mdiClose }} </v-icon>
            Cancel
          </v-btn>
        </div>
        <!-- End action-buttons -->
      </div>
      <!-- End create-dialog-content -->
    </div>
  </v-dialog>
</template>

<script>
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import {
  mdiPencil,
  mdiInformationVariant,
  mdiPencilBox,
  mdiCheck,
  mdiClose,
  mdiEye,
  mdiEyeOff,
  mdiAccount,
} from "@mdi/js";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";
import { navigatorImages, getFriendlyErrorMessage } from "@/lib/utils";

export default {
  name: "StudentEditDialog",
  props: {
    on: {
      type: Boolean,
      default: false,
    },
    attrs: {
      type: Object,
      default: () => ({}),
    },
    isDashboardView: {
      type: Boolean,
      default: false,
    },
    isStudentPopupView: {
      type: Boolean,
      default: false,
    },
    student: {
      type: Object,
      default: () => ({}),
    },
  },
  components: {},
  mounted() {
    if (this.student) {
      Object.assign(this.profile, this.student);
    } else {
      Object.assign(this.profile, this.person);
    }
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    originalProfile() {
      return Object.keys(this.student).length > 0 ? this.student : this.person;
    },
  },
  data() {
    return {
      mdiPencil,
      mdiInformationVariant,
      mdiPencilBox,
      mdiCheck,
      mdiClose,
      mdiEye,
      mdiEyeOff,
      mdiAccount,
      navigatorImages,
      dialog: false,
      loading: false,
      editEmail: false,
      editPassword: false,
      hidePassword: true,
      uploading: false,
      uploadPercentage: 0,
      onhover: false,
      selectedFile: {},
      newPassword: "",
      profile: {
        firstName: "",
        lastName: "",
        email: "",
        image: {
          url: "",
          name: "",
        },
      },
    };
  },
  watch: {
    dialog(newVal) {
      if (newVal) {
        Object.assign(this.profile, this.originalProfile);
      }
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    onButtonClick() {
      this.$refs.uploader?.click();
    },
    async onFileChanged(e) {
      this.selectedFile = e.target.files[0];
      await this.storeImage();
    },
    storeImage() {
      this.uploading = true;
      const storageRef = storage.ref(
        "avatar-images/" +
          this.profile.firstName +
          this.profile.lastName +
          "-" +
          this.selectedFile.name,
      );

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
          this.uploading = false;
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            this.uploading = false;
            if (!this.profile.image) this.profile.image = { url: "", name: "" };
            this.profile.image.url = downloadURL;
            this.profile.image.name = this.selectedFile.name;
          });
        },
      );
    },
    selectNavigator(image) {
      if (!this.profile.image) this.profile.image = { url: "", name: "" };
      this.profile.image.url = image.url;
      this.profile.image.name = image.name;
    },
    cancelEmail() {
      this.profile.email = this.person.email;
      this.editEmail = false;
    },
    cancelPassword() {
      this.newPassword = "";
      this.hidePassword = true;
      this.editPassword = false;
    },
    updatePerson(profile) {
      this.loading = true;
      if (profile.email != this.originalProfile.email) {
        this.saveEmail();
      }
      if (this.editPassword && this.newPassword) {
        this.savePassword();
      }
      db.collection("people")
        .doc(profile.id)
        .update(profile)
        .then((res) => {
          console.log("Profile successfully updated");
          this.setSnackbar({
            show: true,
            text: "Profile successfully updated",
            color: "baseAccent",
          });
          this.cancel();
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
          this.cancel();
        });
    },
    saveEmail() {
      console.log("saving emails");
      firebase
        .auth()
        .currentUser.updateEmail(this.profile.email)
        .then(() => {
          var actionCodeSettings = {
            url: window.location.origin + "/login",
            handleCodeInApp: true,
          };
          firebase.auth().currentUser.sendEmailVerification(actionCodeSettings);
          this.setSnackbar({
            show: true,
            text: "Email successfully updated, check your email to verify your new email account",
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
      this.editEmail = false;
    },
    savePassword() {
      firebase
        .auth()
        .currentUser.updatePassword(this.newPassword)
        .then(() => {
          this.setSnackbar({
            show: true,
            text: "Password successfully updated",
            color: "baseAccent",
          });
          this.cancelPassword();
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
        });
    },
    cancel() {
      this.dialog = false;
      this.loading = false;
      this.editEmail = false;
      this.cancelPassword();
      this.$emit("close");
    },
  },
};
</script>

<style lang="scss" scoped>
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;
  overflow-y: auto;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .dialog-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.7rem;
    margin: 0;
    font-style: italic;
  }

  .create-dialog-content {
    // width: 33.33%;
    min-height: 400px;
    display: flex;
    justify-content: space-around;
    align-items: space-around;
    flex-direction: column;
    color: var(--v-missionAccent-base);
    padding: 20px;
    text-transform: uppercase;
    width: 100%;
    // font-size: 0.6rem;
    // border: 1px solid var(--v-missionAccent-base);

    .input-field {
      width: 100%;
      text-align: center;
      flex: none;
      font-size: 0.8rem;
      color: var(--v-missionAccent-base);
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
  }
}
</style>
