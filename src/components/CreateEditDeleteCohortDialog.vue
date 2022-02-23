<template>
  <div
    :class="cohortView ? 'text-end' : 'text-center'"
    :align="cohortView ? 'end' : 'center'"
  >
    <v-dialog v-model="dialog" width="40%" light>
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
          <v-icon small> mdi-pencil </v-icon>
        </v-btn>
        <v-btn v-else outlined color="baseAccent" v-bind="attrs" v-on="on">
          <v-icon left> mdi-plus </v-icon>
          CREATE COHORT
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title">
            {{ edit ? "Edit Cohort " + cohort.name : dialogTitle }}
          </p>
          <div class="d-flex align-center">
            <v-icon left color="missionAccent">mdi-information-variant</v-icon>
            <p class="dialog-description">{{ dialogDescription }}</p>
          </div>
        </div>

        <div
          class="left-side"
          :style="cohort.name ? 'width:50%' : 'width:100%'"
        >
          <div class="create-dialog-content mt-4">
            <!-- NAME -->
            <!-- TITLE -->
            <v-text-field
              class="input-field"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              v-model="cohort.name"
              label="Cohort name"
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
              label="Cohort description"
            ></v-textarea>

            <!-- IMAGE UPLOAD -->
            <v-progress-linear
              color="missionAccent"
              :value="percentage"
            ></v-progress-linear>
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
              label="Cohort image upload"
            ></v-file-input>

            <!-- ORGANISATION -->
            <p class="input-description">Organisation:</p>
            <v-select
              class="input-field"
              outlined
              :dark="dark"
              :light="!dark"
              v-model="cohort.organisation"
              :items="organisationsToSelect"
              item-text="name"
              item-value="id"
            >
            </v-select>
            <!-- Select teachers from list -->
            <!-- <p class="input-description">Cohort teachers:</p>
            <v-autocomplete
              v-model="cohort.teachers"
              :search-input.sync="search"
              :items="teachers"
              @change="search = ''"
              menu-props="closeOnContentClick"
              class="input-field text-lowercase"
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
                    <v-avatar
                      v-if="data.item.image && data.item.image.url"
                      left
                    >
                      <v-img :src="data.item.image.url"></v-img>
                    </v-avatar>
                    {{ data.item.email }}
                  </template>
                </v-chip>
              </template>
              <template v-slot:item="data">
                <template>
                  <v-list-item-avatar
                    v-if="data.item.image && data.item.image.url"
                  >
                    <img :src="data.item.image.url" />
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title
                      v-html="data.item.firstName"
                    ></v-list-item-title>
                    <v-list-item-subtitle
                      v-html="data.item.email"
                    ></v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </template>
              <template v-slot:no-data>
                <CreateAccountDialog
                  accountType="teacher"
                  :addingToCohort="true"
                  @addAccount="addTeacher(teacher)"
                />
              </template>
            </v-autocomplete> -->
          </div>
          <!-- End create-dialog-content -->
        </div>
        <!-- End of left-side -->

        <!-- RIGHT SIDE -->
        <div class="right-side" :style="cohort.name ? 'width:50%' : 'width:0%'">
          <!-- Cohort Preview -->
          <div id="cohort-info" v-if="cohort.name">
            <h2 class="cohort-label">Cohort</h2>
            <h1 class="cohort-title">{{ cohort.name }}</h1>
            <v-img
              v-if="cohort.image.url"
              :src="cohort.image.url"
              width="100%"
            ></v-img>
            <p class="cohort-description">{{ cohort.description }}</p>
            <!-- Organisation -->
            <div class="d-flex justify-center align-center">
              <Organisation
                v-if="cohort.organisation"
                :organisation="getOrganisationById(cohort.organisation)"
                :size="'0.25em'"
              />
            </div>
          </div>
        </div>
        <!-- End of right-side -->
        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <v-btn
            v-if="edit"
            outlined
            color="green darken-1"
            @click="updateCohort(cohort)"
            class="mr-2"
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
            @click="saveCohort(cohort)"
            class="mr-2"
            :loading="loading"
            :disabled="disabled"
            width="40%"
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
            width="40%"
            :dark="dark"
            :light="!dark"
          >
            <v-icon left> mdi-delete </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="ml-2"
            @click="close"
            :disabled="disabled || loading"
            width="40%"
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

    <!-- CONFIRM DELETE DIALOG -->
    <v-dialog v-model="dialogConfirm" width="40%" light>
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header py-10">
          <p class="dialog-title"><strong>Warning!</strong> Delete Cohort?</p>
          <div class="d-flex align-start">
            <v-icon left color="missionAccent">mdi-information-variant</v-icon>
            <p class="dialog-description">
              Are you sure you want to <strong>DELETE</strong> this
              <span class="cohort-text">{{ cohort.name }} Cohort</span>?
              <br />
              <br />
              Deleting is permanent!!!
              <br />
              <br />
              <span class="mission-text">PEOPLE</span> in this
              <strong>COHORT</strong> will no longer be able to access the
              assigned <span class="galaxy-text">GALAXY MAPS</span>
            </p>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <!-- DELETE -->
          <v-btn
            outlined
            color="error"
            @click="confirmDeleteCohort(cohort)"
            class="ml-2"
            :loading="deleting"
          >
            <v-icon left> mdi-delete </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
            class="ml-2"
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
  </div>
</template>

<script>
import Organisation from "../components/Organisation";
import CreateAccountDialog from "../components/CreateAccountDialog";
import firebase from "firebase";

import { mapState, mapGetters } from "vuex";
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "CreateEditDeleteCohortDialog",
  props: ["edit", "cohortToEdit"],
  components: {
    Organisation,
    CreateAccountDialog,
  },
  data: () => ({
    administrator: "",
    addingAdmin: false,
    teacherDialog: false,
    dialog: false,
    dialogConfirm: false,
    dialogTitle: "Create A New Cohort",
    dialogDescription:
      "A Cohort is a group of learners. This is typically a class of students.",
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
  }),
  watch: {
    dialog(newVal) {
      if (newVal && this.edit) {
        this.cohort = this.cohortToEdit;
      }
    },
  },
  mounted() {
    // hack to make active select white
    if (this.$vuetify.theme.isDark) {
      this.$vuetify.theme.themes.dark.primary = "#ffffff"; // white
    } else {
      this.$vuetify.theme.themes.dark.primary = "#000000"; // black
    }
  },
  computed: {
    ...mapState(["organisations", "people"]),
    ...mapGetters(["getOrganisationById", "user"]),
    teachers() {
      const teachers = this.people.filter(
        (person) => person.accountType === "teacher"
      );
      return teachers;
    },
    cohortView() {
      console.log("route: ", this.$route);
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
    addTeacher(teacher) {
      return this.cohort.teachers.push(teacher);
    },
    toggleTeacherDialog() {
      this.teacherDialog = !this.teacherDialog;
    },
    remove(item) {
      let index = this.cohort.teachers.findIndex((n) => item.id === n);
      if (index >= 0) this.cohort.teachers.splice(index, 1);
    },
    close() {
      this.dialog = false;
      if (!this.edit) {
        this.cohort = {
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
        };
      }
    },
    saveCohort(cohort) {
      this.loading = true;
      // Add a new document in collection "cohorts"
      db.collection("cohorts")
        .add(cohort)
        .then((docRef) => {
          this.close();
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
    storeImage() {
      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "cohort-images/" + this.cohort.name + "-" + this.uploadedImage.name
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
            // add image url to cohort obj
            this.cohort.image.url = downloadURL;
            this.cohort.image.name =
              this.cohort.name + "-" + this.uploadedImage.name;
            console.log("upload percentage is: " + this.percentage);
            this.disabled = false;
            this.percentage = 0;
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
    confirmDeleteCohort(cohort) {
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
      if (this.cohort.image.name == "") return;
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
    updateCohort(cohort) {
      this.loading = true;
      // update document in collection "courses"
      db.collection("cohorts")
        .doc(cohort.id)
        .update(cohort)
        .then(() => {
          console.log("Document successfully updated!");
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
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

    .dialog-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
    }

    .dialog-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin: 0;
      font-style: italic;
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
