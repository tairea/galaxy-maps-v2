<template>
  <div class="d-flex justify-center align-center">
    <v-progress-circular
      v-if="uploading"
      :rotate="360"
      :size="size"
      :width="2"
      :value="uploadPercentage"
      color="baseAccent"
    >
      {{ uploadPercentage + "%" }}
    </v-progress-circular>
    <!-- <v-hover v-else v-slot="{ hover }"> -->
    <v-avatar
      v-else
      :size="size"
      color="secondary"
      @mouseenter="onhover = true"
      @mouseleave="onhover = false"
    >
      <img
        v-if="person.image.url"
        :src="person.image.url"
        :alt="person.firstName"
        style="object-fit: cover"
      />
      <!-- <v-icon v-if="hover">{{mdiPencil}}</v-icon> -->
      <v-icon v-else>{{ mdiAccount }}</v-icon>
      <v-fade-transition>
        <v-overlay v-if="onhover" absolute color="baseAccent">
          <v-icon large @click="onButtonClick">{{ mdiPencil }}</v-icon>
        </v-overlay>
      </v-fade-transition>
      <input ref="uploader" class="d-none" type="file" accept="image/*" @change="onFileChanged" />
    </v-avatar>
    <!-- </v-hover> -->
  </div>
</template>

<script>
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiPencil, mdiAccount } from "@mdi/js";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";

export default {
  name: "StudentAvatar",
  props: ["size"],
  mounted() {},
  computed: {
    ...mapState(useRootStore, ["person"]),
  },
  data() {
    return {
      mdiPencil,
      mdiAccount,
      editProfile: false,
      selectedFile: {},
      uploading: false,
      uploadPercentage: 0,
      image: {},
      onhover: false,
    };
  },
  methods: {
    ...mapActions(useRootStore, ["getPersonById"]),
    logout() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          // alert("Successfully signed out");
          this.snackbarColour = "baseAccent";
          this.snackbarMsg = "Successfully signed out";
          this.snackbar = true;
          this.$router.push("/login");
        })
        .catch((error) => {
          // alert(error.message);
          this.snackbarColour = "pink";
          this.snackbarMsg = error.message;
          this.snackbar = true;
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
          this.selectedFile.name,
      );

      // upload a file
      var uploadTask = storageRef.put(this.selectedFile);

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
  },
};
</script>

<style lang="scss" scoped></style>
