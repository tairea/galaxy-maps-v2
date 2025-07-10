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
              <v-icon class="pr-2" small> {{ mdiPencil }} </v-icon>
              edit galaxy
            </v-btn>
            <v-btn v-else outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon left> {{ mdiPlus }} </v-icon>
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
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <div>
                  <p class="dialog-description">
                    A Galaxy Map is a journey map towards a target destination.
                  </p>
                  <p class="dialog-description mt-2">
                    Like the steps you need to take to complete a project, course, skill, or a life
                    goal.
                  </p>
                </div>
              </div>
            </div>

            <!-- Choose creation mode buttons -->
            <div class="creation-mode-options my-12" v-if="!edit && !creationMode">
              <!-- AI MODE -->
              <v-tooltip v-if="!edit" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <div
                    v-bind="attrs"
                    v-on="on"
                    class="creation-mode-option galaxy-border"
                    :class="{ selected: creationMode === 'ai' }"
                    @click="openAIDialog"
                  >
                    <div class="creation-mode-icon">
                      <v-icon color="galaxyAccent">{{ mdiRobotExcited }}</v-icon>
                    </div>
                    <div class="creation-mode-label galaxyAccent--text">Create with AI</div>
                    <!-- <div class="creation-mode-description">
                      Let AI help you design your galaxy map
                    </div> -->
                  </div>
                </template>
                <span>Try this new beta feature</span>
              </v-tooltip>

              <!-- MANUAL MODE -->
              <div
                class="creation-mode-option base-border"
                :class="{ selected: creationMode === 'manual' }"
                @click="creationMode = 'manual'"
              >
                <div class="creation-mode-icon">
                  <v-icon color="baseAccent">{{ mdiPencil }}</v-icon>
                </div>
                <div class="creation-mode-label baseAccent--text">Create Manually</div>
                <!-- <div class="creation-mode-description">Build your galaxy map step by step</div> -->
              </div>
            </div>

            <!-- LEFT SIDE -->
            <div
              class="left-side"
              :style="course.title ? 'width:50%' : 'width:100%'"
              style="margin-top: 10px"
              v-if="creationMode == 'manual'"
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

                <!-- ===== Owner field. This is who owns the course e.g. you might be creating the course for an organisation ==== -->
                <!-- 1. dropdown menu of the organisations that the user is in. -->

                <!-- ===== Credit other learning content course ==== -->
                <!-- <div class="author-checkbox-wrap d-flex flex-column my-4">
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
                <div v-if="notAuthor">
                  <v-text-field
                    class="input-field"
                    outlined
                    color="missionAccent"
                    v-model="course.contentBy.name"
                    :dark="dark"
                    :light="!dark"
                    label="Name of content creator"
                  ></v-text-field>
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
                  <v-text-field
                    class="input-field mt-4"
                    outlined
                    :dark="dark"
                    :light="!dark"
                    color="missionAccent"
                    v-model="course.contentBy.source"
                    label="Source URL of original content"
                  ></v-text-field>
                </div> -->
                <!-- End original author -->
              </div>
              <!-- End create-dialog-content -->
            </div>
            <!-- End of left-side -->

            <!-- RIGHT SIDE -->
            <div
              v-if="creationMode == 'manual'"
              class="right-side"
              :style="course.title ? 'width:50%' : 'width:0%'"
            >
              <!-- Galaxy info panel -->
              <div id="galaxy-info" v-if="course.title" class="mb-2">
                <h2 class="galaxy-label">Galaxy</h2>
                <h1 class="galaxy-title">{{ course.title }}</h1>
                <!-- Status -->
                <p class="galaxy-status overline mb-0">
                  Status: <span class="font-weight-black">{{ course.status }}</span>
                </p>
                <!-- Visibility -->
                <p
                  v-if="course.status === 'submitted'"
                  class="galaxy-status overline mb-0 in-review"
                >
                  awaiting review
                </p>
                <p v-if="courseToEdit" class="galaxy-status overline mb-0">
                  Visibility:
                  <span class="font-weight-black">{{ courseToEdit.visibility }}</span>
                </p>
                <p v-if="course.presentationOnly" class="galaxy-status overline mb-0">
                  <span class="font-weight-black baseAccent--text">Presentation Map</span>
                </p>
                <v-img v-if="course.image.url" :src="course.image.url" width="100%"></v-img>
                <p class="galaxy-description">{{ course.description }}</p>
              </div>

              <v-select
                v-if="edit"
                class="input-field mt-4"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                v-model="course.visibility"
                :items="[
                  { text: 'Private (only people added can see)', value: 'private' },
                  { text: 'Unlisted (publicly available, but hidden)', value: 'unlisted' },
                  // Presentations cannot be public as they are not proper maps navigators can progress through
                  ...(course.presentationOnly == false || course.presentationOnly == null
                    ? [{ text: 'Public (all users can see)', value: 'public' }]
                    : []),
                ]"
                label="Galaxy Visibility"
                style="width: calc(100% - 25px)"
              >
              </v-select>
            </div>

            <!-- End of right-side -->
            <!-- ACTION BUTTONS -->
            <div v-if="creationMode == 'manual'" class="action-buttons">
              <!-- PUBLISH -->
              <!-- <div
                style="width: 200px"
                v-if="edit && courseToEdit.visibility != 'public' && course.visibility == 'public'"
              > -->
              <PublishGalaxy
                v-if="edit && courseToEdit.visibility != 'public' && course.visibility == 'public'"
                :course="course"
                :courseTasks="courseTasks"
                :publicOnly="true"
              />
              <!-- </div> -->

              <!-- UPDATE -->
              <v-btn
                v-else-if="edit"
                outlined
                color="baseAccent"
                @click="updateCourse(course)"
                class="mx-2"
                :loading="loading"
                :disabled="disabled"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiCheck }} </v-icon>
                UPDATE
              </v-btn>

              <!-- CREATE -->
              <v-btn
                v-else
                outlined
                color="baseAccent"
                @click="saveCourse(course)"
                class="mr-2"
                :loading="loading"
                :disabled="disabled"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiCheck }} </v-icon>
                CREATE GALAXY
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
                <v-icon left> {{ mdiDelete }} </v-icon>
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
                <v-icon left> {{ mdiClose }} </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog -->
        </v-dialog>

        <v-dialog v-model="privateDialog" width="40%" light>
          <div v-if="peopleInCourse.length" class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header py-10">
              <p class="dialog-title">Delete Galaxy Map?</p>
              <div class="d-flex align-start">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  <strong>Warning!</strong> You have at least one person currently active in this
                  galaxy.
                  <br />
                  <br />

                  <span v-if="course.public">
                    If you like you can choose to make this course private instead of deleteing
                    which will allow active learners to continue and finish the galaxy, while
                    preventing new learners from being able to start.
                  </span>
                  <span v-else> Are you sure want to continue to Delete this Galaxy </span>
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
                <v-icon left> {{ mdiDelete }} </v-icon>
                make private
              </v-btn>
              <v-btn
                outlined
                color="error"
                @click="deleteDialog()"
                class="ml-4"
                :loading="deleting"
              >
                <v-icon left> {{ mdiDelete }} </v-icon>
                confirm delete
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-4"
                @click="privateDialog = false"
                :disabled="disabled || loading"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
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
              <p class="dialog-title"><strong>Warning!</strong> Delete Galaxy Map?</p>
              <div class="d-flex align-start">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
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
                <v-icon left> {{ mdiDelete }} </v-icon>
                DELETE
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-4"
                @click="cancelDeleteDialog"
                :disabled="disabled || loading"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
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
import { db, storage, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import {
  mdiPencil,
  mdiPlus,
  mdiClose,
  mdiCheck,
  mdiDelete,
  mdiInformationVariant,
  mdiRobotExcited,
} from "@mdi/js";
import firebase from "firebase/compat/app";
import clone from "lodash/clone";
import { mapActions, mapState } from "pinia";
import { DocumentReference } from "firebase/firestore";
import PublishGalaxy from "@/components/GalaxyView/PublishGalaxy.vue";

export default {
  name: "CreateEditDeleteGalaxyDialog",
  components: { PublishGalaxy },
  props: ["showDialog", "edit", "draft", "courseToEdit"],
  data: () => ({
    mdiPencil,
    mdiPlus,
    mdiClose,
    mdiDelete,
    mdiCheck,
    mdiInformationVariant,
    mdiRobotExcited,
    notAuthor: false,
    dialog: false,
    dialogConfirm: false,
    privateDialog: false,
    destroy: "",
    dialogTitle: "Create a new Galaxy",
    course: {
      title: "",
      description: "",
      image: {
        url: "",
        name: "",
      },
      // contentBy: {
      //   name: "",
      //   image: {
      //     url: "",
      //     name: "",
      //   },
      //   source: "",
      // },
      mappedBy: {
        name: "",
        image: {
          url: "",
          name: "",
        },
        source: "",
      },
      status: "drafting",
    },
    uploadedImage: {},
    authorImage: {},
    percentageGalaxy: 0,
    percentageAuthor: 0,
    disabled: false,
    loading: false,
    deleting: false,
    creationMode: "",
  }),
  computed: {
    ...mapState(useRootStore, ["person", "peopleInCourse", "currentCourseId", "courseTasks"]),

    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  watch: {
    courseToEdit: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.course = { ...newVal };
        }
      },
    },
    showDialog(newVal) {
      this.dialog = newVal;
    },
  },
  mounted() {
    if (this.courseToEdit) {
      this.course = { ...this.courseToEdit };
    }
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar"]),
    cancel() {
      this.dialog = false;
      this.creationMode = "";
      this.$emit("close");
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

      this.course.owner = db.collection("people").doc(this.person.id);

      let nodeId;
      let courseId;

      try {
        // Add a new document in collection "courses"
        const courseDocRef = await db.collection("courses").add(course);
        console.log("1");
        courseDocRef.update({ id: courseDocRef.id }); // add course id to course
        courseId = courseDocRef.id;

        //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
        this.setCurrentCourseId(courseDocRef.id);
        this.setSnackbar({
          show: true,
          text: "Galaxy created",
          color: "baseAccent",
        });

        console.log("2");
        const mapNodeDocRef = await db
          .collection("courses")
          .doc(courseDocRef.id)
          .collection("map-nodes")
          .add({
            // hardcoded first node
            label: course.title ? course.title + " Intro" : "Map intro",
            group: "introduction",
            color: "#00E676",
            topicCreatedTimestamp: new Date(),
            x: 0,
            y: 0,
            topicTotal: 1,
            taskTotal: 0,
          });

        console.log("3");

        // update node obj with docRef.id aka nodeId
        await db
          .collection("courses")
          .doc(courseDocRef.id)
          .collection("map-nodes")
          .doc(mapNodeDocRef.id)
          .update({ id: mapNodeDocRef.id });

        console.log("4");
        // create topic with node id
        await db
          .collection("courses")
          .doc(courseDocRef.id)
          .collection("topics")
          .doc(mapNodeDocRef.id)
          .set({
            // hardcoded first node topic
            id: mapNodeDocRef.id,
            label: course.title + " Intro",
            group: "introduction",
            color: "#00E676",
            topicCreatedTimestamp: new Date(),
            taskTotal: 0,
            x: 0,
            y: 0,
          });

        // send admins an email notification of a new course (email, name, course, courseId)
        await this.sendCourseCreatedEmail(
          this.person.email,
          this.person.firstName + " " + this.person.lastName,
          course.title,
          courseId,
        );

        console.log("5");
        // route to newly created galaxy
        this.$router.push({
          name: "GalaxyView",
          params: {
            courseId: courseDocRef.id,
          },
        });

        this.dialog = false;
        this.loading = false;
      } catch (error) {
        this.cancel();
        console.error("Error writing document: ", error);
      }
      this.course = {};
    },
    async updateCourse(course) {
      this.loading = true;
      if (course.public !== this.courseToEdit.public) {
        course.status = "drafting";
      }

      // changing from public to private/unlisted (no longer visible to all)
      if (this.courseToEdit.public == true && course.visibility != "public") {
        course.public = false;
      }

      console.log("course.status", course.status);

      // make ower a reference to the person (because owner is bound it is an object when it needs to be a Firestore DocumentReference)
      // Retrieve the course document
      const courseDoc = await db.collection("courses").doc(course.id).get();
      const courseDocData = courseDoc.data();
      const ownerRefString = courseDocData.owner.path;

      // Ensure the owner field is a DocumentReference
      const ownerRef =
        courseDocData.owner instanceof DocumentReference
          ? courseDocData.owner
          : db.doc(ownerRefString);

      const courseData = {
        ...course,
        owner: ownerRef,
      };

      await db.collection("courses").doc(course.id).update(courseData);

      this.setSnackbar({
        show: true,
        text: "Galaxy updated",
        color: "baseAccent",
      });
      this.dialog = false;
      this.loading = false;
      //get doc id from firestore (aka course id)
      //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
      this.setCurrentCourseId(course.id);
    },
    storeImage() {
      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "course-images/" + this.currentCourseId + "-" + this.uploadedImage.name,
      );

      // upload a file
      var uploadTask = storageRef.put(this.uploadedImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentageGalaxy = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
        },
      );
    },
    storeAuthorImage() {
      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "author-images/" + this.course.author + "-" + this.authorImage.name,
      );

      // upload a file
      var uploadTask = storageRef.put(this.authorImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentageAuthor = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
        },
      );
    },
    // delete
    deleteDialog() {
      if (this.privateDialog == false && this.peopleInCourse.length) {
        this.privateDialog = true;
      } else {
        (this.privateDialog = false), (this.dialog = false), (this.dialogConfirm = true);
      }
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.dialog = true;
    },
    async confirmDeleteCourse(course) {
      this.deleting = true;
      console.log("course: ", course);

      // delete courseCohort
      await db.collection("cohorts").doc(this.course.cohort).delete();

      // delete for any students in course
      await this.deleteCourseForStudents();

      // delete image
      await this.deleteImage();

      // delete document in collection "courses"
      await db.collection("courses").doc(course.id).delete();

      this.deleting = false;
      this.dialog = false;
      // after delete... route back to home
      this.$router.push({ path: "/" });
      this.setSnackbar({
        show: true,
        text: this.destroyedText(),
        color: "baseAccent",
      });
    },
    async deleteImage() {
      // if no image, dont worry bout it cuz
      if (!this.course.image.url) return;

      try {
        // Extract the full path from the URL
        const imageUrl = new URL(this.course.image.url);
        const pathFromUrl = decodeURIComponent(imageUrl.pathname.split("/o/")[1].split("?")[0]);

        // Create a reference using the full path
        var storageRef = storage.ref(pathFromUrl);

        // Delete the file
        await storageRef.delete();
      } catch (error) {
        console.error("Error deleting image:", error);
        // Continue with course deletion even if image deletion fails
      }
    },
    async deleteCourseForStudents() {
      await Promise.all(
        this.peopleInCourse.map(async (person) => {
          const student = db.collection("people").doc(person.id);

          await student.update({
            assignedCourses: firebase.firestore.FieldValue.arrayRemove(this.currentCourseId),
          });

          const data = {
            email: person.email,
            teacher: this.person.firstName + " " + this.person.lastName,
            course: this.course.title,
            student: person.firstName ? person.firstName + " " + person.lastName : "",
            teacherEmail: this.person.email,
          };
          // Not sure we need an email to students when a course is deleted (but its here anyway if we change our mind)
          // console.log("sending delete galaxy email: ", data);
          // const sendCourseDeleted = functions.httpsCallable("sendCourseDeleted");
          // await sendCourseDeleted(data);
        }),
      );
    },
    async changeToPrivate(course) {
      await db.collection("courses").doc(course.id).update({ public: false });

      this.setSnackbar({
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
      this.setCurrentCourseId(course.id);
    },
    destroyedText() {
      const options = [
        "Galaxy deleted",
        "Galaxy destroyed",
        "Galaxy was destroyed by a deathstar",
        "Galaxy destroyed by a Space Bat Angel Dragon",
        "Galaxy destroyed by its own inhabitants",
        "Galaxy was swallowed by a black hole",
        "Galaxy has mysteriously disappeared",
      ];
      return options[Math.floor(Math.random() * options.length)];
    },
    sendCourseCreatedEmail(email, name, courseTitle, courseId) {
      let data = {
        email: email,
        name: name,
        course: courseTitle,
        courseId: courseId,
      };
      console.log("sending new map created email");
      const sendCourseCreatedEmail = functions.httpsCallable("sendCourseCreatedEmail");
      return sendCourseCreatedEmail(data);
    },
    openAIDialog() {
      this.creationMode = "ai";
      this.cancel(); // Close current dialog
      this.$nextTick(() => {
        this.$emit("openAiDialog"); // Emit event to open AI dialog
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.author-checkbox >>> .v-input--selection-controls__input.v-icon {
  color: purple !important;
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
  min-height: 250px;
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

.galaxy-status {
  font-size: 0.6rem !important;
  line-height: 1rem !important;
  color: var(--v-galaxyAccent-base);
}
.in-review {
  color: var(--v-cohortAccent-base);
}

// Creation mode selection styles
.creation-mode-selection {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.creation-mode-options {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin: 20px 0;
  width: 100%;
}

.creation-mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 30px;
  border: 2px solid var(--v-missionAccent-base);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 150px;
  background-color: var(--v-background-base);
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: var(--v-baseAccent-base);
    background-color: rgba(var(--v-baseAccent-base), 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--v-baseAccent-base), 0.3);
  }
}

.galaxy-border {
  border: 2px solid var(--v-galaxyAccent-base);
}

.base-border {
  border: 2px solid var(--v-baseAccent-base);
}

.creation-mode-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  .v-icon {
    font-size: 2.5rem;
    color: var(--v-missionAccent-base);
  }
}

.creation-mode-label {
  font-size: 1rem;
  text-transform: uppercase;
  color: var(--v-missionAccent-base);
  font-weight: 600;
  margin-bottom: 8px;
}

.creation-mode-description {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base);
  opacity: 0.8;
  line-height: 1.3;
}

// AI creation mode styles
.ai-creation-mode {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ai-creation-content {
  width: 100%;
  max-width: 500px;
  text-align: center;
}
</style>
