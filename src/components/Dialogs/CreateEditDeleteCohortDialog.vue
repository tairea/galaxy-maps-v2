<template>
  <div :class="cohortView ? 'text-end' : 'text-center'" :align="cohortView ? 'end' : 'center'">
    <v-dialog v-model="dialog" width="40%" light content-class="dialog-border">
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-if="edit"
          v-bind="attrs"
          v-on="on"
          class="mission-edit-button"
          outlined
          color="cohortAccent"
          small
        >
          <v-icon small> {{ mdiPencil }} </v-icon>
        </v-btn>

        <v-btn
          v-else-if="hideText"
          outlined
          color="baseAccent"
          v-bind="attrs"
          v-on="on"
          :fab="true"
          small
        >
          <v-icon> {{ mdiPlus }} </v-icon>
        </v-btn>

        <v-btn v-else outlined color="baseAccent" v-bind="attrs" v-on="on">
          <v-icon left> {{ mdiPlus }} </v-icon>
          CREATE SQUAD
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title">
            {{ edit ? "Edit Cohort " + safeCohort.name : dialogTitle }}
          </p>
          <div class="d-flex align-center">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <p class="dialog-description">{{ dialogDescription }}</p>
          </div>
        </div>

        <!-- LEFT SIDE -->
        <div class="left-side" :style="safeCohort.name ? 'width:50%' : 'width:100%'">
          <div class="create-dialog-content mt-8">
            <!-- NAME -->
            <!-- TITLE -->
            <v-text-field
              class="input-field"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              v-model="cohort.name"
              label="Squad name"
            ></v-text-field>

            <!-- DESCRIPTION -->
            <v-textarea
              class="input-field"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              auto-grow
              clearable
              rows="1"
              v-model="cohort.description"
              label="Squad description"
            ></v-textarea>

            <!-- IMAGE UPLOAD -->

            <v-file-input
              class="input-field"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              accept="image/*"
              v-model="uploadedImage"
              @change="storeImage()"
              prepend-icon=""
              label="Squad image upload"
              hide-details
            ></v-file-input>
            <v-progress-linear color="missionAccent" :value="percentage"></v-progress-linear>

            <!-- <div v-if="user.data.admin"> removed admin as im wanting to open up features for user testing -->
            <div>
              <!-- ORGANISATION -->
              <!-- <p class="input-description">Organisation:</p>
              <v-select
                class="input-field select-color"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                v-model="cohort.organisation"
                :items="organisationsToSelect"
                item-text="name"
                item-value="id"
              >
              </v-select> -->
              <!-- Select teachers from list -->
              <p class="input-description mt-6">Squad Captains:</p>
              <v-autocomplete
                v-model="cohort.teachers"
                :search-input.sync="search"
                :items="teachers"
                @change="search = ''"
                menu-props="closeOnContentClick"
                class="input-field text-lowercase select-color"
                color="missionAccent"
                outlined
                :dark="dark"
                :light="!dark"
                chips
                item-text="email"
                item-value="id"
                multiple
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs"
                    :input-value="data.selected"
                    close
                    @click="data.select"
                    @click:close="remove(data.item)"
                  >
                    <template>
                      <v-avatar v-if="data.item.image && data.item.image.url" left>
                        <v-img :src="data.item.image.url"></v-img>
                      </v-avatar>
                      {{ data.item.email }}
                    </template>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <template>
                    <v-list-item-avatar v-if="data.item.image && data.item.image.url">
                      <img :src="data.item.image.url" />
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title v-html="data.item.firstName"></v-list-item-title>
                      <v-list-item-subtitle v-html="data.item.email"></v-list-item-subtitle>
                    </v-list-item-content>
                  </template>
                </template>
                <template v-slot:append-item>
                  <div class="d-flex justify-end">
                    <CreateAccountDialog accountType="teacher" @addTeacher="addTeacher" />
                  </div>
                </template>
                <template v-slot:no-data>
                  <CreateAccountDialog accountType="teacher" @addTeacher="addTeacher" />
                </template>
              </v-autocomplete>
            </div>
          </div>
          <!-- End create-dialog-content -->
        </div>
        <!-- End of left-side -->

        <!-- RIGHT SIDE -->
        <div class="right-side" :style="safeCohort.name ? 'width:50%' : 'width:0%'">
          <!-- Cohort Preview -->
          <div id="cohort-info" v-if="safeCohort.name">
            <h2 class="cohort-label">Squad</h2>
            <h1 class="cohort-title">{{ safeCohort.name }}</h1>
            <v-img
              v-if="safeCohort.image && safeCohort.image.url"
              :src="safeCohort.image.url"
              width="100%"
            ></v-img>
            <p class="cohort-description">{{ safeCohort.description }}</p>
            <!-- Organisation -->
            <!-- <div class="d-flex justify-center align-center">
              <Organisation
                v-if="cohort.organisation"
                :organisation="getOrganisationById(cohort.organisation)"
                :size="40"
              />
            </div> -->
          </div>
        </div>
        <!-- End of right-side -->
        <!-- ACTION BUTTONS -->
        <v-row class="action-buttons mb-2">
          <v-btn
            v-if="edit"
            outlined
            color="baseAccent"
            @click="updateCohort(safeCohort)"
            class="mx-2"
            :loading="loading"
            :disabled="disabled"
            width="30%"
            :dark="dark"
            :light="!dark"
          >
            <v-icon left> {{ mdiCheck }} </v-icon>
            UPDATE
          </v-btn>
          <v-btn
            v-else
            outlined
            color="baseAccent"
            @click="saveCohort(safeCohort)"
            class="mx-2"
            :loading="loading"
            :disabled="disabled"
            width="30%"
            :dark="dark"
            :light="!dark"
          >
            <v-icon left> {{ mdiCheck }} </v-icon>
            SAVE
          </v-btn>

          <!-- DELETE -->
          <v-btn
            v-if="edit"
            outlined
            color="error"
            @click="deleteDialog()"
            class="mx-2"
            width="30%"
            :dark="dark"
            :light="!dark"
          >
            <v-icon left> {{ mdiDelete }} </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="mx-2"
            @click="close"
            :disabled="disabled || loading"
            width="30%"
            :dark="dark"
            :light="!dark"
          >
            <v-icon left> {{ mdiClose }} </v-icon>
            Cancel
          </v-btn>
        </v-row>
        <!-- End action-buttons -->
      </div>
      <!-- End create-dialog -->
    </v-dialog>

    <!-- CONFIRM DELETE DIALOG -->
    <v-dialog v-model="dialogConfirm" width="40%" light>
      <div v-if="cohortToEdit && cohortToEdit.courseCohort && courseExists" class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title"><strong>Warning!</strong> Delete Squad?</p>
          <div class="d-flex align-start">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <p class="dialog-description">
              This Squad is linked to the
              <span style="color: var(--v-galaxyAccent-base)">{{ safeCohort.name }}</span>
              Galaxy Map. <br /><br />
              To delete this squad, please navigate to the galaxy map and delete it.
              <br /><br />
              If you have any questions or require help please contact
              <a href="mailto:base@galaxymaps.io">base@galaxymaps.io</a>
            </p>
          </div>
        </div>
        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
            class="ml-2"
            @click="cancelDeleteDialog"
            :disabled="disabled || loading"
          >
            <v-icon left> {{ mdiClose }} </v-icon>
            Cancel
          </v-btn>
        </div>
      </div>
      <div v-else class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header py-10">
          <p class="dialog-title"><strong>Warning!</strong> Delete Squad?</p>
          <div class="d-flex align-start">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <p class="dialog-description">
              Are you sure you want to <strong>DELETE</strong> this
              <span class="cohort-text">{{ safeCohort.name }} Squad</span>?
              <br />
              <br />
              Deleting is permanent!!!
              <br />
              <br />
              <span class="mission-text">NAVIGATORS</span> in this <strong>SQUAD</strong> will no
              longer be able to access the assigned <span class="galaxy-text">GALAXY MAPS</span>
            </p>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <!-- DELETE -->
          <v-btn
            outlined
            color="error"
            @click="confirmDeleteCohort(safeCohort)"
            class="ml-2"
            :loading="deleting"
          >
            <v-icon left> {{ mdiDelete }} </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
            class="ml-2"
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
  </div>
</template>

<script>
import Organisation from "@/components/Reused/Organisation.vue";
import CreateAccountDialog from "@/components/Dialogs/CreateAccountDialog.vue";
import { db, storage, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import useCohortViewStore from "@/store/cohortView";

import { mdiPencil, mdiPlus, mdiClose, mdiCheck, mdiDelete, mdiInformationVariant } from "@mdi/js";

import { mapActions, mapState } from "pinia";

export default {
  name: "CreateEditDeleteCohortDialog",
  props: {
    edit: {
      type: Boolean,
      default: false,
    },
    cohortToEdit: {
      type: Object,
      default: () => ({}),
    },
    hideText: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    Organisation,
    CreateAccountDialog,
  },
  data: () => ({
    mdiPencil,
    mdiPlus,
    mdiClose,
    mdiDelete,
    mdiCheck,
    mdiInformationVariant,
    administrator: "",
    addingAdmin: false,
    teacherDialog: false,
    dialog: false,
    dialogConfirm: false,
    dialogTitle: "Create A New Squad",
    dialogDescription: "A Squad is a group of Navigators. (This is typically a cohort of students)",
    loading: false,
    disabled: false,
    deleting: false,
    cohort: {
      name: "",
      description: "",
      organisation: "",
      students: [],
      courses: [],
      image: {
        name: "",
        url: "",
      },
      teachers: [],
    },
    uploadedImage: null,
    percentage: 0,
    search: "",
    teachers: [],
    courseExists: null,
  }),
  mounted() {
    // Only bind people data if user is admin (for other admin functions)
    if (this.user.data.admin) {
      this.bindAllPeople();
    }

    if (this.$vuetify.theme.isDark) {
      this.$vuetify.theme.themes.dark.primary = "#ffffff"; // white
    } else {
      this.$vuetify.theme.themes.dark.primary = "#000000"; // black
    }

    // Fetch teacher details or add default teacher
    this.initializeTeachers();

    // Initialize courseExists
    this.initializeCourseExists();
  },
  watch: {
    dialog(newVal) {
      if (newVal && this.edit && this.cohortToEdit && Object.keys(this.cohortToEdit).length > 0) {
        // Ensure the image property exists before assigning
        if (!this.cohortToEdit.image) {
          this.cohortToEdit.image = {
            name: "",
            url: "",
          };
        }
        Object.assign(this.cohort, this.cohortToEdit);
      }
    },
  },
  computed: {
    ...mapState(useRootStore, ["person", "getOrganisationById", "user", "people", "organisations"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    // Ensure cohort object always has proper structure
    safeCohort() {
      if (!this.cohort) {
        return {
          name: "",
          description: "",
          organisation: "",
          students: [],
          courses: [],
          image: {
            name: "",
            url: "",
          },
          teachers: [],
        };
      }

      // Ensure all required properties exist
      return {
        name: this.cohort.name || "",
        description: this.cohort.description || "",
        organisation: this.cohort.organisation || "",
        students: this.cohort.students || [],
        courses: this.cohort.courses || [],
        image: this.cohort.image || { name: "", url: "" },
        teachers: this.cohort.teachers || [],
        ...this.cohort, // Keep any additional properties
      };
    },
    // teachers() {
    // const teachers = this.people.filter(
    //   (person) => person.accountType === "teacher"     //  we dont have account type anymore. so defaulting to person creating cohort is the default teacher
    // );
    // return teachers;
    // },
    cohortView() {
      return this.$route.name === "CohortView";
    },
    organisationsToSelect() {
      return [{ name: "none", id: 0 }, ...this.organisations];
    },
    // easy image preview thanks to: https://stackoverflow.com/questions/60678840/vuetify-image-upload-preview
    imgUrl() {
      if (!this.uploadedImage) return;
      return URL.createObjectURL(this.uploadedImage);
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },

  methods: {
    ...mapActions(useRootStore, ["bindAllPeople", "setSnackbar"]),
    ...mapActions(useCohortViewStore, ["loadCohort"]),
    toggleTeacherDialog() {
      this.teacherDialog = !this.teacherDialog;
    },
    remove(item) {
      // Safety check: ensure cohort.teachers exists
      if (!this.cohort.teachers) {
        this.cohort.teachers = [];
      }

      let index = this.cohort.teachers.findIndex((n) => item.id === n);
      if (index >= 0) this.cohort.teachers.splice(index, 1);

      // Also remove from teachers array for autocomplete display
      let teacherIndex = this.teachers.findIndex((teacher) => teacher.id === item.id);
      if (teacherIndex >= 0) this.teachers.splice(teacherIndex, 1);
    },
    close() {
      this.dialog = false;
      this.loading = false;
      if (!this.edit) {
        this.cohort = {
          name: "",
          description: "",
          organisation: "",
          students: [],
          courses: [],
          image: {
            name: "",
            url: "",
          },
          teachers: [],
        };
        this.uploadedImage = null;
      }
    },
    /**
     * Saves a new cohort to the database and routes to the cohort view.
     * Teacher email notifications are sent asynchronously and won't block the creation process.
     * @param {Object} cohort - The cohort object to save
     */
    saveCohort(cohort) {
      // Safety check: ensure cohort is valid
      if (!cohort || !cohort.name) {
        console.error("Cannot save cohort: missing cohort name");
        this.setSnackbar({
          show: true,
          text: "Please enter a squad name before saving",
          color: "error",
        });
        return;
      }

      this.loading = true;
      if (cohort.teacher) delete cohort.teacher;

      // Add a new document in collection "cohorts"
      db.collection("cohorts")
        .add(cohort)
        .then((docRef) => {
          console.log("Cohort created successfully with ID:", docRef.id);

          // Reset loading state
          this.loading = false;

          // Close the dialog first
          this.close();

          // Add a small delay to ensure dialog is fully closed before routing
          setTimeout(() => {
            try {
              // Route to the new cohort view
              this.$router.push({
                name: "CohortView",
                params: {
                  cohortId: docRef.id,
                  cohortName: cohort.name,
                },
              });
            } catch (error) {
              console.error("Error routing to cohort view:", error);
              // Fallback: route to cohorts list
              this.$router.push({ name: "CohortsList" });
            }
          }, 100);

          // Show success message
          this.setSnackbar({
            show: true,
            text: `Squad "${cohort.name}" created successfully!`,
            color: "success",
          });
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          this.loading = false;
          this.setSnackbar({
            show: true,
            text: "Error creating squad. Please try again.",
            color: "error",
          });
        });

      // notify teachers of new cohort assignment (non-blocking)
      // Note: Email sending is optional and won't block the cohort creation process
      // Security: Only fetches minimal data for specific people by ID, not entire people collection
      if (cohort.teachers && cohort.teachers.length) {
        // Store cohort name for email sending
        const cohortName = cohort.name;

        console.log("Attempting to notify teachers:", cohort.teachers);

        // Use setTimeout to make this non-blocking
        setTimeout(async () => {
          try {
            // Fetch only the specific people we need for email notifications
            const teacherProfiles = await this.fetchPeopleByIds(cohort.teachers);
            console.log("Fetched teacher profiles:", teacherProfiles.length);

            for (const profile of teacherProfiles) {
              if (profile && profile.email) {
                console.log("email send to:", profile.email, " about new cohort");
                try {
                  await this.sendNewCohortEmail(profile, cohortName);
                } catch (error) {
                  console.error("Error sending email to teacher:", error);
                }
              } else {
                console.warn("Cannot send email to teacher: missing profile or email", profile?.id);
                // Don't let this prevent the cohort creation from completing
              }
            }
          } catch (error) {
            console.error("Error in teacher notification process:", error);
            // Don't let this prevent the cohort creation from completing
          }
        }, 100);
      }
    },
    sendNewCohortEmail(profile, cohortName) {
      // Safety check: ensure profile is valid
      if (!profile || !profile.email) {
        console.error("Cannot send email: missing profile or email");
        return;
      }

      const person = {
        email: profile.email,
        displayName: profile.displayName || profile.firstName || profile.lastName || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        inviter: this.inviter || "Galaxy Maps Admin",
        cohort: cohortName,
      };
      const sendNewCohortEmail = functions.httpsCallable("sendNewCohortEmail");
      return sendNewCohortEmail(person);
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
    storeImage() {
      // Safety check: ensure cohort object and name exist
      if (!this.cohort || !this.cohort.name || !this.cohort.name.trim() || !this.uploadedImage) {
        console.error("Cannot upload image: missing cohort name or uploaded image");
        this.setSnackbar({
          show: true,
          text: "Please enter a squad name before uploading an image",
          color: "error",
        });
        return;
      }

      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "cohort-images/" + this.cohort.name + "-" + this.uploadedImage.name,
      );

      // upload a file
      var uploadTask = storageRef.put(this.uploadedImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
            // Ensure cohort.image exists before setting properties
            if (!this.cohort.image) {
              this.cohort.image = {
                name: "",
                url: "",
              };
            }
            // add image url to cohort obj
            this.cohort.image.url = downloadURL;
            this.cohort.image.name = this.cohort.name + "-" + this.uploadedImage.name;
            console.log("upload percentage is: " + this.percentage);
            this.disabled = false;
            this.percentage = 0;
          });
        },
      );
    },
    // delete
    deleteDialog() {
      ((this.dialog = false), (this.dialogConfirm = true));
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.dialog = true;
    },
    confirmDeleteCohort(cohort) {
      // Safety check: ensure cohort has an id
      if (!cohort || !cohort.id) {
        console.error("Cannot delete cohort: missing cohort id");
        this.setSnackbar({
          show: true,
          text: "Cannot delete cohort: missing cohort information",
          color: "error",
        });
        return;
      }

      this.loadingDelete = true;
      // delete document in collection "courses"
      db.collection("cohorts")
        .doc(cohort.id)
        .delete()
        .then(() => {
          console.log("Cohort successfully deleted!");
          this.loadingDelete = false;
          this.dialog = false;
          // after delete... route back to home
          this.$router.push({ name: "CohortsList" });
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
        });
      //TODO: delete course image from storage
      this.deleteImage();
    },
    deleteImage() {
      // if no image, dont worry bout it cuz
      if (!this.cohort.image || this.cohort.image.name == "") return;
      console.log("deleting image...");
      // Create a reference to the file to delete
      var storageRef = storage.ref("cohort-images/" + this.cohort.image.name);
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
    async updateCohort(cohort) {
      // Safety check: ensure cohort is valid
      if (!cohort || !cohort.id || !cohort.name) {
        console.error("Cannot update cohort: missing cohort id or name");
        this.setSnackbar({
          show: true,
          text: "Cannot update cohort: missing cohort information",
          color: "error",
        });
        return;
      }

      console.log("update cohort: ", cohort);
      this.loading = true;

      // update document in collection "courses"
      db.collection("cohorts")
        .doc(cohort.id)
        .update(cohort)
        .then(() => {
          console.log("Document successfully updated!");
          this.loadCohort(cohort.id);
          this.close();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });

      // Notify new teachers added to the cohort (non-blocking)
      // Security: Only fetches minimal data for specific new teachers by ID
      if (
        this.cohortToEdit &&
        this.cohortToEdit.teachers &&
        cohort.teachers &&
        cohort.teachers.length > this.cohortToEdit.teachers.length
      ) {
        const newTeachers = cohort.teachers.filter(
          (teacherId) => !this.cohortToEdit.teachers.includes(teacherId),
        );
        if (newTeachers.length) {
          // Fetch only the new teachers we need to notify
          const newTeacherProfiles = await this.fetchPeopleByIds(newTeachers);

          for (const profile of newTeacherProfiles) {
            if (profile && profile.email) {
              console.log("Sending email to new teacher:", profile);
              try {
                await this.sendNewCohortEmail(profile, cohort.name);
              } catch (error) {
                console.error("Error sending email to new teacher:", error);
              }
            } else {
              console.warn("Cannot send email to teacher: missing profile or email", profile?.id);
            }
          }
        }
      }
    },
    addTeacher(teacher) {
      console.log("adding teacher", teacher);
      // Safety check: ensure cohort.teachers exists
      if (!this.cohort.teachers) {
        this.cohort.teachers = [];
      }
      this.cohort.teachers.push(teacher.id);
      // Add the teacher object to the teachers array so the autocomplete can display it
      this.teachers.push(teacher);

      this.setSnackbar({
        show: true,
        text: "New Captain added to Squad",
        color: "baseAccent",
      });
    },
    async initializeTeachers() {
      if (
        this.cohortToEdit &&
        this.cohortToEdit.teachers &&
        this.cohortToEdit.teachers.length > 0
      ) {
        console.log(
          "cohort has teachers, fetching teacher details from db to populate squad captain dropdown",
        );
        // Fetch teacher details from Firebase
        const teacherPromises = this.cohortToEdit.teachers.map((teacherId) =>
          db.collection("people").doc(teacherId).get(),
        );

        const teacherSnapshots = await Promise.all(teacherPromises);

        this.teachers = teacherSnapshots.map((snapshot) => {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            ...data,
          };
        });
      } else {
        console.log("cohort has no teachers, adding current user as default teacher");
        // Add current user as default teacher
        this.teachers = [this.person];
        // Automatically select the first teacher by default
        this.cohort.teachers = [this.person.id];
      }
    },
    async initializeCourseExists() {
      this.courseExists = await this.cohortCourseStillExists();
    },
    async cohortCourseStillExists() {
      // Check if course exists when delete dialog opens
      if (this.cohortToEdit && this.cohortToEdit.courses && this.cohortToEdit.courses[0]) {
        try {
          const docRef = db.collection("courses").doc(this.cohortToEdit.courses[0]);
          const doc = await docRef.get();
          const courseExists = doc.exists;
          console.log("course exists: ", courseExists);
          return courseExists;
        } catch (error) {
          console.error("Error checking if course exists:", error);
        }
      }
      return false;
    },
    /**
     * Fetches specific people by their IDs for email notifications
     * Only fetches minimal data needed: id, email, firstName, lastName, displayName
     * @param {string[]} personIds - Array of person IDs to fetch
     * @returns {Promise<Array>} Array of person objects with minimal data
     */
    async fetchPeopleByIds(personIds) {
      if (!personIds || personIds.length === 0) {
        return [];
      }

      // Security check: ensure we're not trying to fetch too many people at once
      if (personIds.length > 50) {
        console.warn("Too many people requested, limiting to 50");
        personIds = personIds.slice(0, 50);
      }

      try {
        const peoplePromises = personIds.map(async (personId) => {
          try {
            // Additional security: validate personId format
            if (!personId || typeof personId !== "string" || personId.length < 3) {
              console.warn("Invalid person ID format:", personId);
              return null;
            }

            const doc = await db.collection("people").doc(personId).get();
            if (doc.exists) {
              const data = doc.data();
              // Only return the minimal data needed for email notifications
              return {
                id: doc.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: data.displayName,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching person ${personId}:`, error);
            return null;
          }
        });

        const people = await Promise.all(peoplePromises);
        return people.filter((person) => person !== null);
      } catch (error) {
        console.error("Error fetching people by IDs:", error);
        return [];
      }
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
  overflow: hidden !important;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);

    .dialog-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
    }

    .dialog-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin: 0;
    }
  }

  .left-side {
    width: 50%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    transition: all 0.3s;
  }

  .right-side {
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    transition: all 0.3s;
    // flex-direction: column;
    // border-left: 1px solid var(--v-missionAccent-base);

    // cohort info
    #cohort-info {
      width: calc(100% - 40px);
      // min-height: 100%;
      border: 1px solid var(--v-cohortAccent-base);
      margin-top: 30px;
      padding: 20px;
      // background: var(--v-baseAccent-base);
      position: relative;
      z-index: 3;

      .cohort-label {
        font-size: 0.8rem;
        font-weight: 400;
        text-transform: uppercase;
        // ribbon label
        position: absolute;
        top: -1px;
        left: -1px;
        background-color: var(--v-cohortAccent-base);
        color: var(--v-background-base);
        padding: 0px 15px 0px 5px;
        clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
      }

      .cohort-title {
        font-size: 1.2rem;
        color: var(--v-cohortAccent-base);
        font-weight: 600;
        text-transform: uppercase;
        margin: 20px 0px 5px 0px;
      }

      .cohort-description {
        margin-top: 10px;
        color: var(--v-cohortAccent-base);
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

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 0.9rem;
    color: var(--v-missionAccent-base);
    text-transform: none;
  }
}

.input-description {
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

  .cohort-text {
    color: var(--v-cohortAccent-base);
    text-transform: uppercase;
    font-weight: 700;
    background-color: var(--v-subBackground-base);
    padding: 0px 5px;
  }
}
</style>
