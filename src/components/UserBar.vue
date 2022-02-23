<template>
  <div class="userMenu">
    <!-- USER MENU TOPBAR -->
    <div class="blackBar">
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
        <!-- <v-hover v-else v-slot="{ hover }"> -->
        <v-avatar
          v-else
          color="secondary"
          @mouseenter="onhover = true"
          @mouseleave="onhover = false"
        >
          <img
            v-if="person.image"
            :src="person.image.url"
            :alt="person.firstName"
            style="object-fit: cover"
          />
          <!-- <v-icon v-if="hover">mdi-pencil</v-icon> -->
          <v-icon v-else>mdi-account</v-icon>
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
      <div class="username mx-4" style="">
        {{ person.firstName }} {{ person.lastName }}
      </div>
    </div>
    <!-- USER MENU HIDDEN-->
    <div class="userMenuHidden">
      <v-row>
        <p class="text-overline mr-8 mt-4" color="primary">Colour Theme</p>
        <!-- LIGHT/DARK MODE SWITCH -->
        <v-switch
          v-model="darkSwitch"
          :label="`${darkSwitch ? 'Dark' : 'Light'}`"
          @change="changeTheme()"
          class="mb-4"
        ></v-switch>
      </v-row>

      <!-- <ThemeColourPicker/> -->
      <v-btn @click="logout">Logout</v-btn>
    </div>

    <!-- Login Error Snackbar -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMsg }}
      <template v-slot:action="{ attrs }">
        <v-btn color="pink" text v-bind="attrs" @click="snackbar = false">
          OK
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
// import { Component, Vue } from "vue-property-decorator";
import firebase from "firebase";
import { mapState, mapActions } from "vuex";
import ThemeColourPicker from "@/components/ThemeColourPicker.vue";
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "UserBar",
  components: {
    ThemeColourPicker,
  },
  data() {
    return {
      snackbar: false,
      snackbarMsg: "",
      darkSwitch: true,
      editProfile: false,
      selectedFile: {},
      uploading: false,
      uploadPercentage: 0,
      image: {},
      onhover: false,
    };
  },
  computed: {
    ...mapState(["person"]),
  },
  methods: {
    ...mapActions(["getPersonById"]),
    changeTheme() {
      this.$vuetify.theme.dark = this.darkSwitch;
      this.$store.commit("setDarkMode", this.$vuetify.theme.isDark);
    },
    logout() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          // alert("Successfully signed out");
          this.snackbarMsg = "Successfully signed out";
          this.snackbar = true;
          this.resetState();
          this.$router.push("/login");
        })
        .catch((error) => {
          // alert(error.message);
          this.snackbarMsg = error.message;
          this.snackbar = true;
          this.$router.push("/");
        });
    },
    resetState() {
      let state = this.$store.state;
      let newState = {};

      Object.keys(state).forEach((key) => {
        newState[key] = null; // or = initialState[key]
      });
      delete newstate.user;
      this.$store.replaceState(newState);
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
  },
};
</script>

<style lang="scss" scoped>
.userMenu {
  background: var(--v-subBackground-base);
  width: 25%;
  height: 200px;
  position: absolute;
  // bottom: 0px;
  bottom: -200px;
  right: 0;
  transition: all 0.3s ease-out;

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
    z-index: 200;
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
  }
}

.userMenu:hover {
  bottom: 0px;
}
</style>
