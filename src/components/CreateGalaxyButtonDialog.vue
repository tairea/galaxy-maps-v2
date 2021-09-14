<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="50%" light>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon left>
                mdi-plus
              </v-icon>
              CREATE GALAXY
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)--
          <div class="createGalaxyDialog">

            <!-- TITLE --
            <div class="tile">
              <v-text-field label="TITLE" v-model="course.title"></v-text-field>
            </div>

            <!-- DESCRIPTION --
            <div class="tile">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="DESCRIPTION"
                v-model="course.description"
              ></v-textarea>
            </div>

            <!-- UPLOAD IMAGE --
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

            <!-- ===== SAVE ===== --
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
          
          -->

          <div class="create-dialog">
            <!-- Title/Desc Header -->
            <div class="dialog-header">
              <p class="dialog-title">{{ dialogTitle }}</p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">{{ dialogDescription }}</p>
              </div>
            </div>
            <div class="left-side">
              <div class="create-dialog-content">
                <!-- Fields -->
                <p class="dialog-description">Galaxy Name:</p>
                <v-text-field
                  class="input-field"
                  solo
                  color="missionAccent"
                  v-model="course.title"
                  background-color="white"
                ></v-text-field>

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

                <!-- Image Upload -->
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
                

                <!-- Action buttons -->
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

                  <v-btn
                    outlined
                    color="white"
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
              <!-- End create-dialog-content -->
            </div>
            <!-- End of left-side -->
            <div class="right-side">
              <div v-if="course.title" id="galaxy-info">
                <h2 class="galaxy-label">Galaxy</h2>
                <h1 class="galaxy-title">{{ course.title }}</h1>
                <!-- <div class="d-flex justify-center align-center"> -->
                <v-img
                  v-if="course.image.url"
                  :src="course.image.url"
                  max-width="150px"
                  max-height="150px"
                ></v-img>
                <!-- </div> -->
                <p class="galaxy-description">{{ course.description }}</p>
              </div>
            </div>
          </div>
          <!-- End create-dialog -->
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
    dialogTitle: "Create a new Galaxy",
    dialogDescription: "A Galaxy is a journey of learning. Kind of like a course.",
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
  }),
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
  },
};
</script>

<style lang="scss" scoped>
/* Dialog */
// .createGalaxyDialog {
//   color: black;
//   background: lightGrey;
//   display: flex;
//   flex-wrap: wrap;
// }

// .tile {
//   width: 33.33%;
//   min-height: 200px;
//   display: flex;
//   justify-content: flex-start;
//   align-items: center;
//   color: black;
//   padding: 20px;
//   text-transform: uppercase;
//   font-size: 0.6rem;
//   border: 1px solid rgba(0, 0, 0, 0.05);
// }

// .v-input .v-label {
//   font-size: 0.8em;
// }

// .saveButton {
//   width: 100%;
//   justify-content: center;
// }

// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;

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
  }

  .right-side {
    width: 50%;
    display: flex;
    flex-direction: column;
    // border-left: 1px solid var(--v-missionAccent-base);
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

  // .dialog-description {
  //   color: var(--v-missionAccent-base);
  //   text-transform: uppercase;
  //   font-size: 0.7rem;
  //   margin: 0;
  //   font-style: italic;
  // }

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
}

// galaxy info
#galaxy-info {
  width: calc(100% - 30px);
  // min-height: 100%;
  border: 1px solid var(--v-galaxyAccent-base);
  margin-top: 30px;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;

  .galaxy-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    // ribbon label
    position: absolute;
    top: 0;
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
    color: white;
  }

  .galaxy-description {
    margin-top: 10px;
    color: var(--v-galaxyAccent-base);
    // font-size: 0.9rem;
  }
}
</style>
