<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="50%" light>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-if="edit"
              v-bind="attrs"
              v-on="on"
              outlined
              color="galaxyAccent"
              small
            >
              <v-icon small>
                mdi-pencil
              </v-icon>
            </v-btn>
            <v-btn v-else outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon left>
                mdi-plus
              </v-icon>
              CREATE GALAXY
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">{{ dialogTitle }}</p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">{{ dialogDescription }}</p>
              </div>
            </div>

            <!-- LEFT SIDE -->
            <div class="left-side" :style="course.title ? 'width:50%' : 'width:100%'">
              <!-- DIALOG FIELDS -->
              <div class="create-dialog-content">
                <!-- TITLE -->
                <p class="dialog-description">Galaxy Name:</p>
                <v-text-field
                  class="input-field"
                  solo
                  color="missionAccent"
                  v-model="course.title"
                  background-color="white"
                ></v-text-field>

                <!-- DESCRIPTION -->
                <p class="dialog-description">Galaxy Description:</p>
                <v-textarea
                  class="input-field"
                  solo
                  color="missionAccent"
                  auto-grow
                  clearable
                  rows="1"
                  v-model="course.description"
                ></v-textarea>

                <!-- IMAGE UPLOAD -->
                <p class="dialog-description">Galaxy Image:</p>
                <v-progress-linear
                  color="missionAccent"
                  :value="percentage"
                ></v-progress-linear>
                <v-file-input
                  class="input-field"
                  solo
                  color="missionAccent"
                  accept="image/*"
                  v-model="uploadedImage"
                  label="Upload Image"
                  @change="storeImage()"
                  prepend-icon=""
                ></v-file-input>
              </div>
              <!-- End create-dialog-content -->
            </div>
            <!-- End of left-side -->

            <!-- RIGHT SIDE -->
            <div class="right-side" :style="course.title ? 'width:50%' : 'width:0%'" >
              <div id="galaxy-info" v-if="course.title">
                <h2 class="galaxy-label">Galaxy</h2>
                <h1 class="galaxy-title">{{ course.title }}</h1>
                <v-img
                  v-if="course.image.url"
                  :src="course.image.url"
                  width="100%"
                ></v-img>
                <p class="galaxy-description">{{ course.description }}</p>
              </div>
            </div>
            <!-- End of right-side -->
            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <v-btn
                outlined
                color="green darken-1"
                @click="saveCourse(course)"
                class="mr-2"
                :loading="loading"
                :disabled="disabled"
              >
                <v-icon left>
                  mdi-check
                </v-icon>
                SAVE
              </v-btn>

              <!-- DELETE -->
              <v-btn
                v-if="edit"
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

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-2"
                @click="cancel"
                :disabled="disabled || loading"
              >
                <v-icon left>
                  mdi-close
                </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog -->
        </v-dialog>

        <!-- CONFIRM DELETE DIALOG -->
        <v-dialog v-model="dialogConfirm" width="40%" light>
          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header py-10">
              <p class="dialog-title">
                <strong>Warning!</strong> Delete Galaxy Map?
              </p>
              <div class="d-flex align-start">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">
                  Are you sure you want to <strong>DELETE</strong> this
                  <span class="galaxy-text">{{ course.title }} Galaxy Map</span
                  >?
                  <br />
                  <br />
                  Deleting is permanent!!!
                  <br />
                  <br />
                  <strong>YOU WILL LOSE ALL </strong>
                  <span class="galaxy-text">Galaxy</span> and related
                  <span class="mission-text">Mission</span> data.
                </p>
              </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- DELETE -->
              <v-btn
                outlined
                color="error"
                @click="confirmDeleteCourse(course)"
                class="ml-2"
                :loading="deleting"
              >
                <v-icon left>
                  mdi-delete
                </v-icon>
                DELETE
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-2"
                @click="cancelDeleteDialog"
                :disabled="disabled || loading"
              >
                <v-icon left>
                  mdi-close
                </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog-content -->
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
  props: ["edit", "courseToEdit"],
  data: () => ({
    dialog: false,
    dialogConfirm: false,
    dialogTitle: "Create a new Galaxy",
    dialogDescription:
      "A Galaxy is a journey of learning. Kind of like a course.",
    course: {
      title: "",
      description: "",
      image: {
        url: "",
        name: "",
      },
    },
    uploadedImage: {},
    percentage: 0,
    disabled: false,
    loading: false,
    deleting: false,
  }),
  mounted() {
    if (this.courseToEdit) {
      console.log("editing course")
      this.course = this.courseToEdit
    }
  },
  methods: {
    cancel() {
      console.log("cancel");
      this.dialog = false;
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
    saveCourse(course) {
      this.loading = true;
      // Add a new document in collection "courses"
      db.collection("courses")
        .add(course)
        .then((docRef) => {
          console.log("Document successfully written!");
          this.dialog = false;
          this.loading = false;
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
      this.disabled = true;
      console.log("this.uploadedImage", this.uploadedImage);
      // ceate a storage ref
      var storageRef = storage.ref(
        "course-images/" + this.course.title + "-" + this.uploadedImage.name
      );

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
            this.disabled = false;
          });
        }
      );
    },
    // delete
    deleteDialog() {
      (this.dialog = false), (this.dialogConfirm = true);
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.dialog = true;
    },
    confirmDeleteCourse(course) {
      this.deleting = true;
      // delete document in collection "courses"
      db.collection("courses")
        .doc(course.id)
        .delete()
        .then(() => {
          console.log("Document successfully deleted!");
          this.deleting = false;
          this.dialog = false;
          // after delete... route back to home
          this.$router.push({ path: "/galaxy" });
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
        });
      this.deleteImage();
    },
    deleteImage() {
      // if no image, dont worry bout it cuz
      if (this.course.image.title == "") return;
      // Create a reference to the file to delete
      var storageRef = storage.ref(
        "course-images/" + this.course.title + "-" + this.course.image.name
      );
      // Delete the file
      storageRef
        .delete()
        .then(() => {
          console.log("Image successfully deleted!");
        })
        .catch((error) => {
          console.log("Uh-oh, an error occurred!", error);
        });
    },
  },
};
</script>

<style lang="scss" scoped>

// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .left-side {
    width: 50%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    transition:all 0.3s;
  }

  .right-side {
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    transition:all 0.3s;
    // flex-direction: column;
    // border-left: 1px solid var(--v-missionAccent-base);

    // galaxy info
    #galaxy-info {
      width: calc(100% - 40px);
      // min-height: 100%;
      border: 1px solid var(--v-galaxyAccent-base);
      margin-top: 30px;
      padding: 20px;
      // background: var(--v-baseAccent-base);
      position: relative;
      z-index: 3;

      .galaxy-label {
        font-size: 0.8rem;
        font-weight: 400;
        text-transform: uppercase;
        // ribbon label
        position: absolute;
        top: -1px;
        left: -1px;
        background-color: var(--v-galaxyAccent-base);
        color: var(--v-background-base);
        padding: 0px 15px 0px 5px;
        clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
      }

      .galaxy-title {
        font-size: 1.2rem;
        color: var(--v-galaxyAccent-base);
        font-weight: 600;
        text-transform: uppercase;
        margin: 20px 0px 5px 0px;
      }

      .galaxy-description {
        margin-top: 10px;
        color: var(--v-galaxyAccent-base);
        // font-size: 0.9rem;
      }
    }
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
  }
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

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 0.8rem;
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;

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
}
</style>
