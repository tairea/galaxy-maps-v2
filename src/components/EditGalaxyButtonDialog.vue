<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="pa-0">
        <v-dialog v-model="dialog" width="70%">
          <!-- EDIT BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" class="mission-edit-button" outlined color="galaxyAccent" small>
              <v-icon small>
                mdi-pencil 
              </v-icon>
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
                <v-row v-if="this.course.image">
                  <v-img :src="this.course.image"></v-img>
                </v-row>
              </v-col>
            </div>

            <!-- SAVE -->
            <div class="tile saveButton">
              <v-btn
                outlined
                color="green darken-1"
                @click="updateCourse(course)"
              >
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
  name: "EditGalaxyButtonDialog",
  props: ["course"],
  data: () => ({
    dialog: false,
    uploadedImage: "",
    percentage: 0,
  }),
  methods: {
    updateCourse(course) {
      // update document in collection "courses"
      db.collection("courses")
        .doc(course.id)
        .update(course)
        .then(() => {
          console.log("Document successfully updated!");
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
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
