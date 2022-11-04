<template>
  <v-hover v-model="hover">
    <div ref="userBar" class="userMenu" :class="{ showMenu: hover, miniMenu: miniNavMenu }">
      <!-- USER MENU TOPBAR -->
      <div class="blackBar">
        <div class="d-flex justify-center align-center">
          <v-progress-circular v-if="uploading" :rotate="360" :size="50" :width="2" :value="uploadPercentage"
            color="baseAccent">
            {{ uploadPercentage + "%" }}
          </v-progress-circular>
          <!-- <v-hover v-else v-slot="{ hover }"> -->
          <v-avatar v-else color="secondary" @mouseenter="onhover = true" @mouseleave="onhover = false">
            <img v-if="person.image" :src="person.image.url" :alt="person.firstName" style="object-fit: cover" />
            <!-- <v-icon v-if="hover">mdi-pencil</v-icon> -->
            <v-icon v-else>mdi-account</v-icon>
            <v-fade-transition>
              <v-overlay v-if="onhover" absolute color="baseAccent">
                <v-icon small @click="onButtonClick">mdi-pencil</v-icon>
              </v-overlay>
            </v-fade-transition>
            <input ref="uploader" class="d-none" type="file" accept="image/*" @change="onFileChanged" />
          </v-avatar>
          <!-- </v-hover> -->
        </div>
        <div v-if="!miniNavMenu || hover" class="username mx-4" style="">
          {{ person.firstName }} {{ person.lastName }}
        </div>
      </div>
      <!-- USER MENU HIDDEN-->
      <div class="userMenuHidden">
        <v-row>
          <v-col class="d-flex" style="border-bottom: 1px solid var(--v-missionAccent-base)">
            <p class="settings overline ma-0">Settings</p>
            <!-- <v-icon color="missionAccent" small>mdi-cog-outline</v-icon> -->
          </v-col>
        </v-row>
        <v-row class="pt-3">
          <v-col class="pa-0 d-flex justify-center">
            <p class="text-overline missionAccent--text ma-0">Colour Theme</p>
          </v-col>
          <!-- LIGHT/DARK MODE SWITCH -->
          <v-col class="pa-0 d-flex justify-center">
            <v-switch v-model="darkSwitch" :label="`${darkSwitch ? 'Dark' : 'Light'}`" @change="changeTheme()"
              color="missionAccent" class="ma-0"></v-switch>
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
            <v-icon class="pr-2">mdi-pencil</v-icon>
            edit account
          </v-btn> -->
          <StudentEditDialog @close="close" />
          <v-btn
            href="https://docs.google.com/forms/d/e/1FAIpQLSfJgXGWOeosZfJY7H0tvFzANoX8p95fmgVKom97HMDiNywSnA/viewform?usp=sf_link"
            target="_blank" color="galaxyAccent" class="ma-4" outlined :dark="dark" :light="!dark">
            <v-icon class="pr-2">mdi-send</v-icon>
            Feedback
          </v-btn>

          <v-btn class="ma-4" @click="logout" color="missionAccent" outlined :dark="dark" :light="!dark">
            <v-icon class="pr-2">mdi-door-closed</v-icon>
            Logout
          </v-btn>
        </div>
      </div>
    </div>
  </v-hover>
</template>

<script>
// import { Component, Vue } from "vue-property-decorator";
import firebase from "firebase";
import { mapState, mapActions, mapMutations } from "vuex";
import ThemeColourPicker from "@/components/ThemeColourPicker.vue";
import { db, storage } from "../store/firestoreConfig";
import StudentEditDialog from "../components/StudentEditDialog.vue";

export default {
  name: "UserBar",
  components: {
    ThemeColourPicker,
    StudentEditDialog,
  },
  data() {
    return {
      darkSwitch: true,
      editProfile: false,
      selectedFile: {},
      uploading: false,
      uploadPercentage: 0,
      image: {},
      onhover: false,
      hover: false,
      miniNavMenu: false,
    };
  },
  watch: {
    $route(to, from) {
      if (this.$route.name == "GalaxyView" || this.$route.name == "SolarSystemView") {
        this.miniNavMenu = true;
      } else {
        this.miniNavMenu = false;
      }
    },
  },
  async mounted() {
    // === BINDS UESFUL FOR ALL COMPONENTS

    if (this.person.accountType == "teacher") {
      // get courses created by this person (populates state.personsCourses)
      await this.$store.dispatch("bindCoursesByPersonId", this.person.id);
    }
  },
  computed: {
    ...mapState(["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    ...mapActions(["getPersonById"]),
    changeTheme() {
      this.$vuetify.theme.dark = this.darkSwitch;
      this.$store.commit("setDarkMode", this.$vuetify.theme.isDark);
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
          // alert("Successfully signed out");
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Successfully signed out",
            color: "baseAccent",
          });
          this.$router.push("/login");
        })
        .catch((error) => {
          alert(error.message);
          this.$store.commit("setSnackbar", {
            show: true,
            text: error.message,
            color: "pink",
          });
          this.$router.push("/");
        });
    },
    onButtonClick() {
      this.$refs.uploader?.click();
    },
    async onFileChanged(e) {
      console.log("e: ", e);
      this.selectedFile = e.target.files[0];
      await this.storeImage();
    },
    storeImage() {
      this.uploading = true;
      console.log("selectedfile: ", this.selectedFile);
      // ceate a storage ref
      var storageRef = storage.ref(
        "avatar-images/" +
        this.person.firstname +
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
            console.log("image url is: " + downloadURL);
            // add image url to course obj
            this.uploading = false;
            this.image.url = downloadURL;
            this.image.name = this.selectedFile.name;
            console.log("image: ", this.image);
            this.updateProfile();
          });
        }
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
  height: 400px;
  position: absolute;
  // bottom: 0px;
  bottom: -400px;
  right: 0;
  transition: all 0.3s;

  z-index: 200;

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
  transition: width 0.3s ease-out 0.3s, bottom 0.3s ease-out;
}

.showMenu {
  width: 25%;
  bottom: 0px;
  transition: width 0.3s ease-out, bottom 0.3s ease-out 0.3s;
}
</style>
