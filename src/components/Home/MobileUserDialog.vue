<template>
  <v-dialog v-model="dialogVisible" fullscreen transition="dialog-bottom-transition">
    <v-card color="var(--v-background-darken1)">
      <v-toolbar dark color="var(--v-background-darken1)" flat>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog" class="close-btn">
          <v-icon color="baseAccent">{{ mdiClose }}</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text
        class="pa-4 dialog-content"
        style="height: calc(100vh - 64px); overflow-y: auto; overflow-x: hidden"
      >
        <!-- User Profile Section -->
        <div class="user-profile-section mb-6">
          <div class="d-flex flex-column align-center text-center mb-4">
            <v-progress-circular
              v-if="uploading"
              :value="uploadPercentage"
              color="baseAccent"
              size="80"
              width="4"
              class="mb-4"
            >
              {{ uploadPercentage }}%
            </v-progress-circular>
            <v-avatar v-else size="80" color="secondary" @click="onButtonClick" class="mb-4">
              <img
                v-if="person.image?.url"
                :src="person.image.url"
                :alt="person.firstName"
                style="object-fit: cover"
              />
              <v-icon v-else size="40">{{ mdiAccount }}</v-icon>
              <input
                ref="uploader"
                class="d-none"
                type="file"
                accept="image/*"
                @change="onFileChanged"
              />
            </v-avatar>
            <div>
              <h2 class="headline mb-1">{{ person.firstName }} {{ person.lastName }}</h2>
              <p class="body-2 grey--text">{{ person.email || user.data?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Settings Section -->
        <v-divider class="mb-4"></v-divider>
        <h3 class="title mb-3">Settings</h3>

        <!-- Theme Switch -->
        <div class="setting-item mb-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h4 class="subtitle-1">Theme</h4>
              <p class="body-2 grey--text">Choose between light and dark mode</p>
            </div>
            <v-switch
              v-model="darkSwitch"
              :label="darkSwitch ? 'Dark' : 'Light'"
              @change="changeTheme"
              color="missionAccent"
            ></v-switch>
          </div>
        </div>

        <v-divider class="mb-4"></v-divider>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <!-- Edit Account -->
          <StudentEditDialog 
            :button-block="true"
            :button-large="true"
            :button-outlined="true"
            button-color="baseAccent"
            button-class="mb-3"
            @close="editDialog = false"
          />

          <!-- Feedback -->
          <v-btn
            block
            large
            outlined
            color="galaxyAccent"
            class="mb-3"
            href="https://docs.google.com/forms/d/e/1FAIpQLSfJgXGWOeosZfJY7H0tvFzANoX8p95fmgVKom97HMDiNywSnA/viewform?usp=sf_link"
            target="_blank"
          >
            <v-icon left>{{ mdiSend }}</v-icon>
            FEEDBACK & BUGS
          </v-btn>

          <!-- Discord -->
          <v-btn
            block
            large
            outlined
            color="indigo lighten-1"
            class="mb-3"
            href="https://discord.gg/f2hPbqV22S"
            target="_blank"
          >
            <v-icon left>{{ mdiMessage }}</v-icon>
            CHAT ON DISCORD
          </v-btn>

          <!-- Logout -->
          <v-btn block large color="missionAccent" class="mb-3" @click="logout">
            <v-icon left>{{ mdiDoorClosed }}</v-icon>
            LOGOUT
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import StudentEditDialog from "@/components/Dialogs/StudentEditDialog.vue";
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiClose, mdiAccount, mdiPencil, mdiSend, mdiDoorClosed, mdiMessage } from "@mdi/js";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";
import { getFriendlyErrorMessage } from "@/lib/utils";

export default {
  name: "MobileUserDialog",
  components: {
    StudentEditDialog,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      mdiClose,
      mdiAccount,
      mdiPencil,
      mdiSend,
      mdiDoorClosed,
      mdiMessage,
      darkSwitch: true,
      selectedFile: null,
      uploading: false,
      uploadPercentage: 0,
      image: {},
    };
  },
  computed: {
    ...mapState(useRootStore, ["person", "user"]),
    dialogVisible: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
    dark() {
      return this.$vuetify.theme.dark;
    },
  },
  watch: {
    dark: {
      immediate: true,
      handler(val) {
        this.darkSwitch = val;
      },
    },
  },
  methods: {
    ...mapActions(useRootStore, ["getPersonById", "setDarkMode", "setSnackbar"]),
    closeDialog() {
      this.$emit("input", false);
    },
    changeTheme() {
      this.$vuetify.theme.dark = this.darkSwitch;
      this.setDarkMode(this.$vuetify.theme.dark);
    },
    onButtonClick() {
      this.$refs.uploader?.click();
    },
    onFileChanged(e) {
      this.selectedFile = e.target.files[0];
      if (this.selectedFile) {
        this.storeImage();
      }
    },
    storeImage() {
      this.uploading = true;
      const storageRef = storage.ref(
        `avatar-images/${this.person.firstName}${this.person.lastName}-${this.selectedFile.name}`,
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
          console.error(err);
          this.uploading = false;
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            this.uploading = false;
            this.image = {
              url: downloadURL,
              name: this.selectedFile.name,
            };
            this.updateProfile();
          });
        },
      );
    },
    updateProfile() {
      db.collection("people")
        .doc(this.person.id)
        .update({
          image: this.image,
        })
        .then(() => {
          console.log("Image successfully updated!");
          this.getPersonById(this.person.id);
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    logout() {
      firebase
        .database()
        .ref("/status/" + this.person.id)
        .set({
          state: "offline",
          last_changed: firebase.database.ServerValue.TIMESTAMP,
        });

      firebase
        .auth()
        .signOut()
        .then(() => {
          this.setSnackbar({
            show: true,
            text: "Successfully signed out",
            color: "baseAccent",
          });
          this.closeDialog();
          this.$router.push("/login");
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
          this.closeDialog();
          this.$router.push("/");
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.dialog-content {
  height: calc(100vh - 64px);
  overflow-y: auto;
  overflow-x: hidden;
}

.user-profile-section {
  text-align: center;
}

.setting-item {
  padding: 16px 0;
}

.action-buttons {
  .v-btn {
    height: 56px;
    text-transform: uppercase;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
}

.v-avatar {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}
</style>
