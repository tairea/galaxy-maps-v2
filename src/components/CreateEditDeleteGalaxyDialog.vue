<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12" class="pa-0">
        <v-dialog v-model="dialog" width="50%" light>
          <!-- CREATE BUTTON -->
          <template v-if="edit" v-slot:activator="{ on, attrs }">
            <v-btn
              v-if="edit"
              v-bind="attrs"
              v-on="on"
              outlined
              :color="draft ? 'cohortAccent' : 'galaxyAccent'"
              small
              class="pa-o"
            >
              <v-icon class="pr-2" small> mdi-pencil </v-icon>
               edit galaxy
            </v-btn>
            <v-btn v-else outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon left> mdi-plus </v-icon>
              CREATE GALAXY
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                {{ edit ? "Edit Galaxy " + course.title : dialogTitle }}
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">{{ dialogDescription }}</p>
              </div>
            </div>

            <!-- LEFT SIDE -->
            <div
              class="left-side"
              :style="course.title ? 'width:50%' : 'width:100%'"
              style="margin-top: 10px"
            >
              <!-- DIALOG FIELDS -->
              <div class="create-dialog-content">
                <!-- TITLE -->
                <!-- <p class="dialog-description">Galaxy Name:</p> -->
                <v-text-field
                  :dark="dark"
                  :light="!dark"
                  class="input-field"
                  outlined
                  color="missionAccent"
                  v-model="course.title"
                  label="Galaxy name"
                ></v-text-field>

                <!-- DESCRIPTION -->
                <!-- <p class="dialog-description">Galaxy Description:</p> -->
                <v-textarea
                  :dark="dark"
                  :light="!dark"
                  class="input-field"
                  outlined
                  color="missionAccent"
                  auto-grow
                  clearable
                  rows="1"
                  v-model="course.description"
                  label="Galaxy description"
                ></v-textarea>

                <!-- IMAGE UPLOAD -->
                <!-- <p class="dialog-description">Galaxy Image:</p> -->

                <v-file-input
                  class="input-field"
                  outlined
                  :dark="dark"
                  :light="!dark"
                  color="missionAccent"
                  accept="image/*"
                  v-model="uploadedImage"
                  label="Upload Galaxy Image"
                  @change="storeImage()"
                  prepend-icon=""
                  hide-details
                ></v-file-input>
                <v-progress-linear
                  color="missionAccent"
                  :value="percentageGalaxy"
                  class=""
                ></v-progress-linear>

                <!-- ===== Credit other learning content course ==== -->
                <div
                  class="author-checkbox-wrap d-flex flex-column my-4"
                >
                  <v-checkbox
                    v-model="notAuthor"
                    dense
                    :dark="dark"
                    :light="!dark"
                    color="missionAccent"
                    class="author-checkbox ma-0"
                    hide-details
                  >
                    <template v-slot:label>
                      <span class="author-checkbox-label"
                        >Not an original course</span
                      >
                    </template>
                  </v-checkbox>
                  <div class="d-flex align-center">
                    <p class="dialog-description pt-1">
                      Tick this box if your are mapping someone elses content
                    </p>
                  </div>
                </div>
                <!-- ORIGINAL AUTHOR -->
                <div v-if="notAuthor">
                  <!-- AUTHOR -->
                  <!-- <p class="dialog-description">Name of content creator:</p> -->
                  <v-text-field
                    class="input-field"
                    outlined
                    color="missionAccent"
                    v-model="course.contentBy.name"
                    :dark="dark"
                    :light="!dark"
                    label="Name of content creator"
                  ></v-text-field>

                  <!-- AUTHOR IMAGE UPLOAD -->
                  <!-- <p class="dialog-description">Image of content creator:</p> -->

                  <v-file-input
                    class="input-field"
                    outlined
                    :dark="dark"
                    :light="!dark"
                    color="missionAccent"
                    accept="image/*"
                    v-model="authorImage"
                    label="Upload content creator image"
                    @change="storeAuthorImage()"
                    prepend-icon=""
                    hide-details="true"
                  ></v-file-input>
                  <v-progress-linear
                    color="missionAccent"
                    :value="percentageAuthor"
                  ></v-progress-linear>

                  <!-- SOURCE OF ORIGINAL CONTENT -->
                  <!-- <p class="dialog-description">
                    Source URL of original content:
                  </p> -->
                  <v-text-field
                    class="input-field mt-4"
                    outlined
                    :dark="dark"
                    :light="!dark"
                    color="missionAccent"
                    v-model="course.contentBy.source"
                    label="Source URL of original content"
                  ></v-text-field>
                </div>
                <!-- End original author -->
              </div>
              <!-- End create-dialog-content -->
            </div>
            <!-- End of left-side -->

            <!-- RIGHT SIDE -->
            <div
              class="right-side"
              :style="course.title ? 'width:50%' : 'width:0%'"
            >
              <div id="galaxy-info" v-if="course.title" class="mb-2">
                <h2 class="galaxy-label">Galaxy</h2>
                <h1 class="galaxy-title">{{ course.title }}</h1>
                <v-img
                  v-if="course.image.url"
                  :src="course.image.url"
                  width="100%"
                ></v-img>
                <p class="galaxy-description">{{ course.description }}</p>
              </div>
              <v-select
                v-if="edit"
                class="input-field mt-4"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                v-model="course.public"
                :items="[{text: 'Public', value: true}, {text: 'Private', value: false}]"
                label="Galaxy Access"
              >
              </v-select>
            </div>
            <!-- End of right-side -->
            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <v-btn
                v-if="edit"
                outlined
                color="green darken-1"
                @click="updateCourse(course)"
                class="mx-2"
                :loading="loading"
                :disabled="disabled"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> mdi-check </v-icon>
                UPDATE
              </v-btn>
              <v-btn
                v-else
                outlined
                color="green darken-1"
                @click="saveCourse(course)"
                class="mr-2"
                :loading="loading"
                :disabled="disabled"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> mdi-check </v-icon>
                SAVE
              </v-btn>

              <!-- DELETE -->
              <v-btn
                v-if="edit"
                outlined
                color="error"
                @click="deleteDialog()"
                class="ml-2"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> mdi-delete </v-icon>
                DELETE
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-4"
                @click="cancel"
                :disabled="disabled || loading"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> mdi-close </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog -->
        </v-dialog>

        <v-dialog v-model="privateDialog" width="40%" light>
          <div v-if="peopleInCourse.length " class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header py-10">
              <p class="dialog-title">
                Delete Galaxy Map?
              </p>
              <div class="d-flex align-start">
                <v-icon left color="missionAccent"
                  >mdi-information-variant</v-icon
                >
                <p class="dialog-description">
                  <strong>Warning!</strong> You have at least one person currently active in this galaxy.
                  <br>
                  <br>

                  <span v-if="course.public">
                    If you like you can choose to make this course private instead of deleteing which will allow active learners to continue and finish the galaxy, 
                    while preventing new learners from being able to start.
                  </span>
                  <span v-else>
                    Are you sure want to continue to Delete this Galaxy
                  </span>
                </p>
              </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- DELETE -->
              <v-btn
                v-if="course.public"
                outlined
                color="missionAccent"
                @click="changeToPrivate(course)"
                :loading="deleting"
              >
                <v-icon left> mdi-delete </v-icon>
                make private
              </v-btn>
              <v-btn
                outlined
                color="error"
                @click="deleteDialog()"
                class="ml-4"
                :loading="deleting"
              >
                <v-icon left> mdi-delete </v-icon>
                confirm delete
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-4"
                @click="privateDialog = false"
                :disabled="disabled || loading"
              >
                <v-icon left> mdi-close </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog-content -->
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
                  <span class="galaxy-text">Galaxy {{ course.title }}</span
                  >?
                  <br />
                  <br />
                  Deleting is permanent!!!
                  <br />
                  <br />
                  <strong>YOU WILL LOSE ALL </strong>
                  <span class="galaxy-text">Galaxy</span> and related
                  <span class="mission-text">Mission</span> data.
                  <br />
                  <br />
                  To confirm type <span class="destroy">"DESTROY"</span> in the box below
                </p>
              </div>
              <v-text-field
                class="input-field ma-5"
                outlined
                color="missionAccent"
                v-model="destroy"
                :dark="dark"
                :light="!dark"
                placeholder="DESTROY"
              ></v-text-field>              
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
                :disabled="destroy !== 'DESTROY'"
              >
                <v-icon left> mdi-delete </v-icon>
                DELETE
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-4"
                @click="cancelDeleteDialog"
                :disabled="disabled || loading"
              >
                <v-icon left> mdi-close </v-icon>
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
import { mapState, mapGetters } from "vuex";
import { db, storage, functions } from "../store/firestoreConfig";
import firebase from 'firebase'

export default {
  name: "CreateEditDeleteGalaxyDialog",
  props: ['showDialog', 'edit', 'draft', 'courseToEdit'],
  data: () => ({
    notAuthor: false,
    dialog: false,
    dialogConfirm: false,
    privateDialog: false,
    destroy: "",
    dialogTitle: "Create a new Galaxy",
    dialogDescription: "A Galaxy is a path of learning. Kind of like a course.",
    course: {
      title: "",
      description: "",
      image: {
        url: "",
        name: "",
      },
      contentBy: {
        name: "",
        image: {
          url: "",
          name: "",
        },
        source: "",
      },
      mappedBy: {
        name: "",
        image: {
          url: "",
          name: "",
        },
        source: "",
      },
      status: "drafting"
    },
    uploadedImage: {},
    authorImage: {},
    percentageGalaxy: 0,
    percentageAuthor: 0,
    disabled: false,
    loading: false,
    deleting: false,
  }),
  computed: {
    ...mapGetters(["person"]),
    ...mapState(['peopleInCourse']),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  watch: {
    courseToEdit(newVal) {
      console.log('new course')
      if (this.course.id !== newVal.id) {
        Object.assign(this.course, this.courseToEdit)
      }
    }
  },
  mounted () {
    if (this.courseToEdit) {
      Object.assign(this.course, this.courseToEdit);
    }
  },
  watch: {
    showDialog(newVal) {
      if (newVal) this.dialog = true
      else this.dialog = false
    }
  },
  methods: {
    cancel() {
      this.dialog = false;
      this.$emit('close')
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
    async saveCourse(course) {
      this.loading = true;
      // not notAuthor means user is the author
      if (!this.notAuthor) {
        // TODO: add users photo to contentBy
        // TODO: need to allow users to add their photo first
        // get user. save them to contentBy & mappedBy
        this.course.contentBy = {
          name: this.person.firstName + " " + this.person.lastName,
          personId: this.person.id,
        };
      }
      // add user to mappedBy
      this.course.mappedBy = {
        name: this.person.firstName + " " + this.person.lastName,
        personId: this.person.id,
      };

      let nodeId
      let courseId

      console.log

      // Add a new document in collection "courses"
      db.collection("courses")
        .add(course)
        .then((docRef) => {
          console.log('1')
          docRef.update({ id: docRef.id }); // add course id to course
          this.dialog = false;
          this.loading = false;
          //get doc id from firestore (aka course id)
          courseId = docRef.id;
          //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
          this.$store.commit("setCurrentCourseId", courseId);
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Galaxy created",
            color: "baseAccent",
          });
        }).then( async () => {
          console.log('2')
          await db
          .collection("courses")
          .doc(courseId)
          .collection("map-nodes")
          .add({
            // hardcoded first node
            label: this.course.title ? this.course.title + " Intro" : "Course intro",
            group: "introduction",
            topicCreatedTimestamp: new Date(),
            x: 0,
            y: 0,
          })
          .then( async (docRef) => {
            console.log('3')
            nodeId = docRef.id
            // update node obj with docRef.id aka nodeId
            await db.collection("courses")
              .doc(courseId)
              .collection("map-nodes")
              .doc(docRef.id)
              .update({ id: docRef.id });

          })
        }).then( async () => {
          console.log('4')
          // create topic with node id
          await db.collection("courses")
            .doc(courseId)
            .collection("topics")
            .doc(nodeId)
            .set({
              // hardcoded first node topic
              id: nodeId,
              label: this.course.title + " Intro",
              group: "introduction",
              topicCreatedTimestamp: new Date(),
            })
        }).then(() => {
          console.log('5')
          // route to newly created galaxy
          this.$router.push({
            name: "GalaxyView",
            params: {
              courseId: courseId,
            },
          });
        })
        .catch((error) => {
          this.cancel()
          console.error("Error writing document: ", error);
        });
      this.course = {};
    },
    updateCourse(course) {
      this.loading = true;
      if (course.public !== this.courseToEdit.public) course.status = 'drafting'
      db.collection("courses")
        .doc(course.id)
        .update(course)
        .then(() => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Galaxy updated",
            color: "baseAccent",
          });
          this.dialog = false;
          this.loading = false;
          //get doc id from firestore (aka course id)
          //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
          this.$store.commit("setCurrentCourseId", course.id);
          this.$store.commit("setCurrentCourse", course)
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    },
    storeImage() {
      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "course-images/" + this.course.id + "-" + this.uploadedImage.name
      );

      // upload a file
      var uploadTask = storageRef.put(this.uploadedImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentageGalaxy =
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
            // add image url to course obj
            this.course.image.url = downloadURL;
            this.course.image.name = this.uploadedImage.name;
            this.disabled = false;
          });
        }
      );
    },
    storeAuthorImage() {
      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "author-images/" + this.course.author + "-" + this.authorImage.name
      );

      // upload a file
      var uploadTask = storageRef.put(this.authorImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentageAuthor =
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
            console.log("author image url is: " + downloadURL);
            // add image url to course obj
            this.course.contentBy.image.url = downloadURL;
            this.course.contentBy.image.name = this.uploadedImage.name;
            this.disabled = false;
          });
        }
      );
    },
    // delete
    deleteDialog() {
      if (this.privateDialog == false && this.peopleInCourse.length) { this.privateDialog = true }
      else {
        (this.privateDialog = false), (this.dialog = false), (this.dialogConfirm = true);
      }
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.dialog = true;
    },
    confirmDeleteCourse(course) {
      this.deleting = true;
      console.log('course: ', course)
      const documentRef = db.collection("courses").doc(course.id);

      // // delete document in collection "courses"
      documentRef
        .delete()
        .then(() => {
          // delete courseCohort
          db.collection('cohorts').doc(this.course.cohort).delete()
        })
        .then(() => {
          // delete for any students in course
          this.deleteCourseForStudents()
        })
        .then(() => {
          this.deleting = false;
          this.dialog = false;
          // after delete... route back to home
          this.$router.push({ path: "/base/galaxies"});
          this.$store.commit("setSnackbar", {
            show: true,
            text: this.destroyedText(),
            color: "baseAccent",
          });
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
        });
      
      this.deleteImage();
    },
    deleteImage() {
      // if no image, dont worry bout it cuz
      if (this.course.image.name == "") return;
      // Create a reference to the file to delete
      var storageRef = storage.ref(
        "course-images/" + this.course.id + "-" + this.course.image.name
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
    deleteCourseForStudents() {
      this.peopleInCourse.forEach(async person => {
        const student = await db.collection('people').doc(person.id)
        
        student.update({
          assignedCourses: firebase.firestore.FieldValue.arrayRemove(this.course.id)
        });

        const data = {
          email: person.email,
          teacher: this.person.firstName + ' ' + this.person.lastName,
          course: this.course.title,
          student: person.firstName ? person.firstName + ' ' + person.lastName : '',
          teacherEmail: this.person.email
        }
        console.log('sending delete galaxy email: ', data)
        const sendCourseDeleted = functions.httpsCallable("sendCourseDeleted");
        return sendCourseDeleted(data);

      })
    },
    async changeToPrivate(course) {
      return await db.collection('courses').doc(course.id).update({public: false}).then(() => {
        this.$store.commit("setSnackbar", {
          show: true,
          text: "Course updated",
          color: "baseAccent",
        });
        this.privateDialog = false;
        this.dialog = false;
        this.loading = false;
        course.public = false;
        //get doc id from firestore (aka course id)
        //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
        this.$store.commit("setCurrentCourseId", course.id);
        this.$store.commit("setCurrentCourse", course)
      })
    },
    destroyedText () {
      const options = ["Galaxy deleted", "Galaxy destroyed", "Galaxy was destroyed by a deathstar", "Galaxy destroyed by a Space Bat Angel Dragon", "Galaxy destroyed by its own inhabitants", "Galaxy was swallowed by a black hole", "Galaxy has mysteriously disappeared"];
      return options[Math.floor(Math.random() * options.length)];
    }
  },
};
</script>

<style lang="scss" scoped>
.author-checkbox >>> .v-input--selection-controls__input.v-icon {
  color: purple !important
}
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
    transition: all 0.3s;

    .author-checkbox-label {
      font-size: 0.8rem !important;
      // padding: 10px 20px;
      color: var(--v-missionAccent-base) !important;
      // border-top: 1px solid var(--v-missionAccent-base);
      // border-bottom: 1px solid var(--v-missionAccent-base);
    }
  }

  .right-side {
    width: 50%;
    display: flex;
    align-items: flex-start;
    transition: all 0.3s;
    flex-direction: column;
    // border-left: 1px solid var(--v-missionAccent-base);

    // galaxy info
    #galaxy-info {
      width: calc(100% - 25px);
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
  // text-transform: uppercase;
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
    color: var(--v-missionAccent-base);
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;

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

.v-btn:not(.v-btn--round).v-size--default {
  background-color: var(--v-background-base) !important;
}
</style>
