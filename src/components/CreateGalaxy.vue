<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="70%">
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn outlined color="neon" v-bind="attrs" v-on="on">
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
              <v-text-field label="TITLE" v-model="course.name"></v-text-field>
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
                <v-row v-if="percentage">
                  <v-progress-linear :value="percentage"></v-progress-linear>
                </v-row>
                <v-row>
                  <v-file-input
                    accept="image/*"
                    label="Upload Image"
                    v-model="uploadedImage"
                    @change="storeImage()"
                    style="width:100% "
                  ></v-file-input>
                </v-row>
                 <v-row v-if="this.course.image">
                  <v-img :src="this.course.image"></v-img>
                </v-row>
              </v-col>
            </div>

            <!-- SAVE -->
            <div class="tile saveButton">
              <v-btn outlined color="green darken-1" @click="saveCourse(course)">
                <v-icon left>
                  mdi-check
                </v-icon>
                SAVE
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
  name: "CreateGalaxy",
  data: () => ({
    dialog: false,
    course: {
      name: "",
      description: "",
      image: "",
    },
    uploadedImage: "",
    percentage: "",
  }),
  methods: {
    // ...mapMutations(['addCourse']),
    saveCourse(course) {
      // this.addCourse(this.course)

      // Add a new document in collection "courses"
      db.collection("courses")
        .add(course)
        .then((docRef) => {
          console.log("Document successfully written!");
          this.dialog = false;
          //get doc id from firestore (aka course id)
          const courseId = docRef.id
          this.$router.push({name:"GalaxyView", params: { courseName: this.camelize(course.name), courseId: courseId } })

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
      // ceate a storage ref
      var storageRef = storage.ref("course-images/" + this.uploadedImage.name);

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
            this.course.image = downloadURL;
          });
        }
      );
    },
  },
};
</script>

<style>
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
