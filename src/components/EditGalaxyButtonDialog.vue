<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="pa-0">
        <v-dialog v-model="dialog" width="70%">
          <!-- EDIT BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button"
              outlined
              color="galaxyAccent"
              small
            >
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
                <v-row v-if="this.course.image.url">
                  <v-img :src="this.course.image.url"></v-img>
                </v-row>
              </v-col>
            </div>

            <div class="tile saveButton">
              <!-- SAVE -->
              <v-btn
                outlined
                color="green darken-1"
                @click="updateCourse(course)"
                class="mr-2"
              >
                <v-icon left>
                  mdi-check
                </v-icon>
                SAVE
              </v-btn>
              <!-- DELETE -->
              <v-btn
                outlined
                color="error"
                @click="deleteDialog()"
                class="ml-2"
              >
                <v-icon left>
                  mdi-delete
                </v-icon>
                DELETE
              </v-btn>
            </div>
          </div>
        </v-dialog>

        <!-- CONFIRM DELETE DIALOG -->
        <v-dialog v-model="dialogConfirm" width="500">
          <v-card>
            <v-card-title class="text-h5 grey lighten-2">
              Warning
            </v-card-title>

            <v-card-text class="py-8 px-6">
              Are you sure you want to <strong>DELETE</strong> this
              <span class="galaxy-text">{{ course.title }} Galaxy Map</span>?
              <br />
              <br />
              Deleting is permanent!!!
              <br />
              <br />
              <strong>YOU WILL LOSE ALL </strong>
              <span class="galaxy-text">Galaxy</span> and related
              <span class="mission-text">Mission</span> data.
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn
                outlined
                color="primary"
                @click="cancelDeleteDialog()"
                class="ml-2"
              >
                <v-icon left>
                  mdi-close
                </v-icon>
                CANCEL
              </v-btn>
              <v-btn
                outlined
                color="error"
                @click="confirmDeleteCourse(course)"
                class="ml-2"
              >
                <v-icon left>
                  mdi-delete
                </v-icon>
                CONFIRM DELETE GALAXY
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "EditGalaxyButtonDialog",
  props: ["course"],
  data: () => ({
    dialog: false,
    dialogConfirm: false,
    uploadedImage: "",
    percentage: 0,
  }),
  methods: {
    deleteDialog() {
      (this.dialog = false), (this.dialogConfirm = true);
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.dialog = true;
    },
    confirmDeleteCourse(course) {
      // delete document in collection "courses"
      db.collection("courses")
        .doc(course.id)
        .delete()
        .then(() => {
          console.log("Document successfully deleted!");
          this.dialog = false;
          // after delete... route back to home
          this.$router.push({path: "/galaxy"});
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
        });
        //TODO: delete course image from storage
        // Create a reference to the file to delete
        var storageRef = storage.ref("course-images/" + this.course.title + "-" + this.course.image.name);
        // Delete the file
        storageRef.delete().then(() => {          
          console.log("Image successfully deleted!")
        }).catch((error) => {
          console.log("Uh-oh, an error occurred!",error)
        });

    },
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

.galaxy-text {
  color: var(--v-galaxyAccent-base);
  text-transform: uppercase;
  font-weight: 700;
}
.mission-text {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-weight: 700;
}
</style>
