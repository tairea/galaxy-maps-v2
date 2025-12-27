<template>
  <div>
    <v-hover
      :disabled="!user.loggedIn || isMobile"
      v-model="hover"
      v-if="(showMenu || isMobile) && !shouldHideMiniUserBar"
    >
      <div
        ref="userBar"
        class="userMenu"
        :class="{
          showMenu: hover && !isMobile,
          miniMenu: miniNavMenu,
          notSignedInMenu: !user.loggedIn,
        }"
        @click="isMobile && user.loggedIn ? openMobileDialog() : null"
        style="display: block"
      >
        <!-- USER MENU TOP (BLACK) BAR -->
        <div v-if="!user.loggedIn" class="blackBar">
          <div class="d-flex justify-center align-center" style="width: 80%">
            <LoginDialog
              :buttonMsg="isMobile ? 'SIGN\nIN' : 'SIGN IN or CREATE AN ACCOUNT'"
              class="mobile-login-btn"
            />
          </div>
        </div>
        <div v-else class="blackBar">
          <div class="d-flex justify-center align-center">
            <v-progress-circular
              v-if="uploading"
              :rotate="360"
              :size="50"
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
            >
              <img
                v-if="person.image?.url"
                :src="person.image.url"
                :alt="person.firstName"
                style="object-fit: cover"
              />
              <v-icon v-else>{{ mdiAccount }}</v-icon>
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
          <div v-if="!miniNavMenu || hover" class="username mx-4" style="">
            <p class="ma-0">{{ person.firstName }} {{ person.lastName }}</p>
            <!-- <span style="font-size: 0.8rem; color: #777">ID: {{ person.id }}</span> -->
          </div>
        </div>
        <!-- USER MENU HIDDEN-->
        <div class="userMenuHidden">
          <v-row>
            <v-col class="d-flex" style="border-bottom: 1px solid var(--v-missionAccent-base)">
              <p class="settings overline ma-0">Settings</p>
            </v-col>
          </v-row>
          <v-row class="pt-3">
            <v-col class="pa-0 d-flex justify-center">
              <p class="text-overline missionAccent--text ma-0">Colour Theme</p>
            </v-col>
            <!-- LIGHT/DARK MODE SWITCH -->
            <v-col class="pa-0 d-flex justify-center">
              <v-switch
                v-model="darkSwitch"
                :label="`${darkSwitch ? 'Dark' : 'Light'}`"
                @change="changeTheme()"
                color="missionAccent"
                class="ma-0"
              ></v-switch>
            </v-col>
          </v-row>

          <!-- AI Credit Balance Display -->
          <v-row class="pt-3">
            <v-col class="pa-0 d-flex justify-center">
              <p class="text-overline missionAccent--text ma-0">AI Credits</p>
            </v-col>
            <v-col class="pa-0 d-flex justify-center align-center">
              <v-chip
                small
                :color="creditColor"
                text-color="white"
              >
                {{ userCredits }}{{ userCredits === '...' ? '' : ' credits' }}
              </v-chip>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="pa-0 px-4">
              <p class="caption text-center ma-0" style="font-size: 0.7rem !important; color: var(--v-missionAccent-base);">
                Resets {{ hasActiveSubscription ? 'monthly' : 'daily' }} • {{ timeUntilReset }}
              </p>
            </v-col>
          </v-row>

          <div class="d-flex flex-column mt-5">
            <!-- <ThemeColourPicker/> -->
            <!-- <v-btn
            color="baseAccent"
            class="ma-4"
            outlined
            :dark="dark"
            :light="!dark"
            @click="editProfile"
            >
            <v-icon class="pr-2">{{mdiPencil}}</v-icon>
            edit account
          </v-btn> -->

            <!-- Edit Account button -->
            <StudentEditDialog @close="close" />

            <!-- Feedback button -->
            <v-btn
              href="https://docs.google.com/forms/d/e/1FAIpQLSfJgXGWOeosZfJY7H0tvFzANoX8p95fmgVKom97HMDiNywSnA/viewform?usp=sf_link"
              target="_blank"
              color="galaxyAccent"
              class="ma-3"
              outlined
              :dark="dark"
              :light="!dark"
            >
              <v-icon class="pr-2">{{ mdiSend }}</v-icon>
              Feedback & Bugs
            </v-btn>

            <!-- Discord button -->
            <v-btn
              href="https://discord.gg/f2hPbqV22S"
              target="_blank"
              color="indigo lighten-1"
              class="ma-3"
              outlined
              :dark="dark"
              :light="!dark"
            >
              <v-icon class="pr-2">{{ mdiMessage }}</v-icon>
              Chat on Discord
            </v-btn>

            <!-- Github button -->
            <!-- <v-btn
            href="https://github.com/tairea/galaxy-maps-v2"
            target="_blank"
            color="blue-grey lighten-3"
            class="ma-3"
            outlined
            :dark="dark"
            :light="!dark"
          >
            <v-icon class="pr-2">{{ mdiGithub }}</v-icon>
            Help code this
          </v-btn> -->

            <!-- Logout button -->
            <v-btn
              class="ma-3"
              @click="logout"
              color="missionAccent"
              outlined
              :dark="dark"
              :light="!dark"
            >
              <v-icon class="pr-2">{{ mdiDoorClosed }}</v-icon>
              Logout
            </v-btn>
          </div>
        </div>
      </div>
    </v-hover>

    <!-- Mobile User Dialog -->
    <MobileUserDialog v-model="mobileUserDialog" />
  </div>
</template>

<script>
// import ThemeColourPicker from "@/components/Home/UserBar/ThemeColourPicker.vue";
import LoginDialog from "@/components/Dialogs/LoginDialog.vue";
import StudentEditDialog from "@/components/Dialogs/StudentEditDialog.vue";
import MobileUserDialog from "./MobileUserDialog.vue";
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiAccount, mdiPencil, mdiSend, mdiDoorClosed, mdiMessage, mdiGithub } from "@mdi/js";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";
import { getFriendlyErrorMessage } from "@/lib/utils";

export default {
  name: "UserBar",
  components: {
    // ThemeColourPicker,
    StudentEditDialog,
    LoginDialog,
    MobileUserDialog,
  },
  data() {
    return {
      mdiAccount,
      mdiPencil,
      mdiSend,
      mdiDoorClosed,
      mdiMessage,
      mdiGithub,
      darkSwitch: true,
      editProfile: false,
      selectedFile: {},
      uploading: false,
      uploadPercentage: 0,
      image: {},
      onhover: false,
      hover: false,
      showMenu: true,
      miniNavMenu: false,
      notSignedInMenu: false,
      mobileUserDialog: false,
    };
  },
  watch: {
    $route() {
      this.updateUserBarVisibility();
    },
    isMobile() {
      this.updateUserBarVisibility();
    },
    mobileInfoMinimized(min) {
      // Force mini state when cohort info is minimized; restore defaults when expanded
      if (min) {
        this.miniNavMenu = true;
      } else {
        this.updateUserBarVisibility();
      }
    },
  },
  async mounted() {
    // === BINDS UESFUL FOR ALL COMPONENTS

    if (this.person.accountType == "teacher") {
      // get courses created by this person (populates state.personsCourses)
      await this.bindCoursesByPersonId(this.person.id);
    }

    this.updateUserBarVisibility();
  },
  computed: {
    ...mapState(useRootStore, ["person", "user", "mobileInfoMinimized"]),
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    dark() {
      return this.$vuetify.theme.dark;
    },
    shouldHideMiniUserBar() {
      return this.isMobile && this.$route.name === "SolarSystemView";
    },
    userCredits() {
      if (!this.user?.data?.creditsChecked) return '...';
      return this.user?.data?.credits ?? 0;
    },
    hasActiveSubscription() {
      return Boolean(this.user?.data?.hasActiveSubscription);
    },
    creditColor() {
      const credits = this.userCredits;
      if (credits === '...') return 'grey';
      if (credits <= 0) return 'error';
      if (credits < 50) return 'warning';
      return 'success';
    },
    timeUntilReset() {
      const lastReset = this.user?.data?.lastCreditReset;
      if (!lastReset) return 'Soon';

      const resetPeriodMs = this.hasActiveSubscription
        ? 30 * 24 * 60 * 60 * 1000  // 30 days
        : 24 * 60 * 60 * 1000;      // 24 hours

      const lastResetTime = lastReset.toMillis ? lastReset.toMillis() : lastReset;
      const nextReset = lastResetTime + resetPeriodMs;
      const msUntilReset = nextReset - Date.now();

      if (msUntilReset <= 0) return 'On next login';

      const hours = Math.floor(msUntilReset / (60 * 60 * 1000));
      const minutes = Math.floor((msUntilReset % (60 * 60 * 1000)) / (60 * 1000));

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''}`;
      }

      return `${hours}h ${minutes}m`;
    },
  },
  methods: {
    ...mapActions(useRootStore, [
      "bindCoursesByPersonId",
      "getPersonById",
      "setDarkMode",
      "setSnackbar",
    ]),
    updateUserBarVisibility() {
      const isAuthRoute =
        this.$route.name === "Login" ||
        this.$route.name === "Verify" ||
        this.$route.name === "Reset" ||
        this.$route.name === "Register";

      const isMiniRoute =
        (this.$route.name === "GalaxyView" && this.user.loggedIn) ||
        this.$route.name === "SolarSystemView" ||
        this.$route.name === "AiGalaxyEdit" ||
        this.$route.path.includes("ai-galaxy-edit") ||
        this.$route.name === "AiGalaxyEditWithCourse";

      if (isAuthRoute) {
        this.showMenu = false;
      } else {
        this.showMenu = true;
      }

      // Default mini state based on route/device
      const defaultMini = isMiniRoute || this.isMobile;
      // If cohort info is minimized, force mini state on
      this.miniNavMenu = this.mobileInfoMinimized || defaultMini;
    },
    openMobileDialog() {
      this.mobileUserDialog = true;
    },
    changeTheme() {
      this.$vuetify.theme.dark = this.darkSwitch;
      this.setDarkMode(this.$vuetify.theme.dark);
    },
    logout() {
      this.hover = false;
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
          // alert("Successfully signed out");
          this.setSnackbar({
            show: true,
            text: "Successfully signed out",
            color: "baseAccent",
          });
          this.$router.push("/login");
        })
        .catch((error) => {
          alert(error.message);
          this.setSnackbar({
            show: true,
            text: getFriendlyErrorMessage(error.code),
            color: "pink",
          });
          this.$router.push("/");
        });
    },
    onButtonClick() {
      this.$refs.uploader?.click();
    },
    onFileChanged(e) {
      console.log("e: ", e);
      this.selectedFile = e.target.files[0];
      this.storeImage();
    },
    storeImage() {
      this.uploading = true;
      console.log("selectedfile: ", this.selectedFile);
      // ceate a storage ref
      const namePart = (this.person.firstName || "") + (this.person.lastName || "");
      const fallback = this.person?.id ? `${this.person.id}-${Date.now()}` : `${Date.now()}`;
      const safePrefix = namePart || fallback;
      const storageRef = storage.ref(`avatar-images/${safePrefix}-${this.selectedFile.name}`);

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
            console.log("image url is: " + downloadURL);
            // add image url to course obj
            this.uploading = false;
            this.image.url = downloadURL;
            this.image.name = this.selectedFile.name;
            console.log("image: ", this.image);
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
          // TODO: Use firebase reactive functions to make person reactive
          console.log("Image successfully updated!");
          this.getPersonById(this.person.id);
          this.onhover = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    close() {
      this.hover = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.userMenu {
  background: var(--v-subBackground-base);
  width: 25%;
  height: 450px;
  position: absolute;
  // bottom: 0px;
  bottom: -450px;
  right: 0;
  transition: all 0.3s;

  z-index: 50;

  .blackBar {
    position: absolute;
    height: 70px;
    top: -70px;
    right: 0px;
    background: var(--v-subBackground-base);
    width: 100%;
    padding: 10px;
    clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%);
    text-align: right;
    display: flex;
    justify-content: flex-end;
    // border: 1px yellow solid;

    .profilePic {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 50%;
    }

    .username {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 10px;
      flex-direction: column;
      // width: 200px;
    }
  }

  .userMenuHidden {
    padding: 20px 50px;

    .settings {
      color: var(--v-missionAccent-base);

      width: 100%;
    }
  }
}

.miniMenu {
  width: 90px;
  transition:
    width 0.3s ease-out 0.3s,
    bottom 0.3s ease-out;
}

.showMenu {
  width: 25%;
  bottom: 0px;
  transition:
    width 0.3s ease-out,
    bottom 0.3s ease-out 0.3s;
}

// Mobile-specific styles
@media (max-width: 959px) {
  .miniMenu {
    position: fixed !important;
    width: 70px;
    height: 0px;
    cursor: pointer;
    bottom: 0px !important;
    right: 0px !important;
    z-index: 50;
    background: var(--v-subBackground-base) !important;

    .blackBar {
      height: 70px;
      padding: 5px;
      bottom: 0px !important;
      z-index: 100;
      background: var(--v-subBackground-base) !important;

      .username {
        display: none;
      }
    }
  }

  .mobile-login-btn {
    .v-btn__content {
      // white-space: normal !important;
      // line-height: 1.2 !important;
      // text-align: center !important;
    }

    // .v-btn {
    //   height: auto !important;
    //   min-height: 48px !important;
    //   padding: 8px 12px !important;
    // }
  }

  .userMenuHidden {
    display: none;
  }
}
</style>
