<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="70%" light>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon left>
                mdi-plus
              </v-icon>
              CREATE GALAXY
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div class="createGalaxyDialog">
            <!-- TITLE -->
            <div class="tile">
              <v-text-field label="TITLE" v-model="course.title"></v-text-field>
            </div>

            <!-- DESCRIPTION -->
            <div class="tile">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="DESCRIPTION"
                v-model="course.description"
              ></v-textarea>
            </div>

            <!-- UPLOAD IMAGE -->
            <div class="tile" id="uploadContainer">
              <v-col>
                <v-row v-if="percentage > 0">
                  <v-progress-linear :value="percentage"></v-progress-linear>
                </v-row>
                <v-row>
                  <v-file-input
                    accept="image/*"
                    v-model="uploadedImage"
                    label="Upload Image"
                    @change="storeImage()"
                    style="width:100% "
                  ></v-file-input>
                </v-row>
                <v-row v-if="course.image.url">
                  <v-img :src="course.image.url" max-width="150px" max-height="150px"></v-img>
                </v-row>
              </v-col>
            </div>

            <!-- SAVE -->
            <div class="tile saveButton">
              <v-btn
                outlined
                color="green darken-1"
                @click="saveCourse(course)"
                :disabled="disabled"
              >
                <v-icon left>
                  mdi-check
                </v-icon>
                SAVE GALAXY
              </v-btn>
            </div>
          </div>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapMutations } from "vuex";
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "CreateGalaxyButtonDialog",
  data: () => ({
    dialog: false,
    course: {
      title: "",
      description: "",
      image: {
        url: "",
        name: ""
      },
    },
    uploadedImage: "",
    percentage: 0,
    disabled: false,
    loading: false,
  }),
  methods: {
    saveCourse(course) {
      this.loading = true
      // Add a new document in collection "courses"
      db.collection("courses")
        .add(course)
        .then((docRef) => {
          console.log("Document successfully written!");
          this.dialog = false;
          this.loading = false
          //get doc id from firestore (aka course id)
          const courseId = docRef.id;
          //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
          this.$store.commit("setCurrentCourseId", courseId);
          // route to newly created galaxy
          this.$router.push({
            name: "GalaxyView",
            params: {
              courseTitle: this.camelize(course.title),
              courseId: courseId,
            },
          });
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.course = {};
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
    storeImage() {
      this.disabled = true
      console.log("this.uploadedImage",this.uploadedImage)
      // ceate a storage ref
      var storageRef = storage.ref("course-images/" + this.course.title + "-" + this.uploadedImage.name);

      // upload a file
      var uploadTask = storageRef.put(this.uploadedImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentage =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
            this.course.image.url = downloadURL;
            this.course.image.name = this.uploadedImage.name;
            this.disabled = false
          });
        }
      );
    },
  },
};
</script>

<style lang="scss" scoped>

/* Dialog */
.createGalaxyDialog {
  color: black;
  background: lightGrey;
  display: flex;
  flex-wrap: wrap;
}

.tile {
  width: 33.33%;
  min-height: 200px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: black;
  padding: 20px;
  text-transform: uppercase;
  font-size: 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.v-input .v-label {
  font-size: 0.8em;
}

.saveButton {
  width: 100%;
  justify-content: center;
}
</style>
