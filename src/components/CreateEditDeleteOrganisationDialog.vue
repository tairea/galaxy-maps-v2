<template>
  <div class="text-center" align="center">
    <v-dialog v-model="dialog" width="40%" light>
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-if="!hideText"
          outlined
          color="baseAccent"
          v-bind="attrs"
          v-on="on"
        >
          <v-icon left> mdi-plus </v-icon>
          CREATE ORGANISATION
        </v-btn>
        <v-btn
          v-else
          outlined
          color="baseAccent"
          v-bind="attrs"
          v-on="on"
          :fab="true"
          class="mt-4"
          small
        >
          <v-icon> mdi-plus </v-icon>
        </v-btn>
      </template>

      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title">{{ dialogTitle }}</p>
          <div class="d-flex align-center">
            <v-icon left color="missionAccent">mdi-information-variant</v-icon>
            <p class="dialog-description">{{ dialogDescription }}</p>
          </div>
        </div>

        <!-- LEFT SIDE -->
        <div
          class="left-side"
          :style="organisation.name ? 'width:50%' : 'width:100%'"
        >
          <!-- DIALOG FIELDS -->
          <div class="create-dialog-content mt-8">
            <!-- TITLE -->
            <v-text-field
              class="input-field"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              v-model="organisation.name"
              label="Organisation name"
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
              v-model="organisation.description"
              label="Organisation description"
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
              label="Organisation image upload"
              @change="storeImage()"
              prepend-icon=""
            ></v-file-input>
          </div>
          <!-- End create-dialog-content -->
        </div>
        <!-- End of left-side -->

        <!-- RIGHT SIDE -->
        <div
          class="right-side"
          :style="organisation.name ? 'width:50%' : 'width:0%'"
        >
          <div v-if="organisation.name">
            <div class="d-flex flex-column justify-center align-center cursor">
              <v-img
                v-if="organisation.image.url"
                :src="organisation.image.url"
                max-width="60px"
                max-height="60px"
                class="organisation-image"
              ></v-img>
              <div v-else class="imagePlaceholder">
                {{ first3Letters(organisation.name) }}
              </div>
              <h3 class="overline mt-4">{{ organisation.name }}</h3>
              <p class="organisation-description mt-4">
                {{ organisation.description }}
              </p>
            </div>
          </div>
        </div>
        <!-- End of right-side -->
        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <v-btn
            outlined
            color="green darken-1"
            @click="saveOrganisation(organisation)"
            class="mr-2"
            :loading="loading"
            :disabled="disabled"
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
          >
            <v-icon left> mdi-delete </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="ml-2"
            @click="cancel"
            :disabled="disabled || loading"
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
          <p class="dialog-title">
            <strong>Warning!</strong> Delete Organisation?
          </p>
          <div class="d-flex align-start">
            <v-icon left color="missionAccent">mdi-information-variant</v-icon>
            <p class="dialog-description">
              Are you sure you want to <strong>DELETE</strong> the
              <span class="organisation-text"
                >{{ organisation.name }} ORGANISATION</span
              >?
              <br />
              <br />
              Deleting is permanent!!!
              <br />
              <br />
              <!-- <strong>YOU WILL LOSE ALL </strong> -->
              <strong>COHORTS</strong> will no longer be associated with this
              <strong>ORGANISATION</strong>
            </p>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <!-- DELETE -->
          <v-btn
            outlined
            color="error"
            @click="confirmDeleteOrganisation(organisation)"
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
import { mapMutations } from "vuex";
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "CreateEditDeleteOrganisationDialog",
  props: ["edit", "organisationToEdit", "hideText"],
  data: () => ({
    dialog: false,
    dialogConfirm: false,
    dialogTitle: "Create a new Organisation",
    dialogDescription:
      "An Organisation is typically a school, business or... an organisation",
    loading: false,
    disabled: false,
    deleting: false,
    organisation: {
      name: "",
      description: "",
      image: {
        name: "",
        url: "",
      },
      cohorts: [],
    },
    uploadedImage: null,
    percentage: 0,
  }),
  mounted() {
    if (this.organisationToEdit) {
      this.organisation = this.organisationToEdit;
    }
  },
  watch: {
    organisationToEdit: function (n, o) {
      this.organisation = n;
    },
  },
  computed: {
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
    cancel() {
      this.dialog = false;
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
    openDialog() {
      this.dialog = true;
    },
    closeDialog() {
      this.$emit("closeOrganisationEditDialog");
    },
    saveOrganisation(organisation) {
      this.loading = true;
      // Add a new document in collection "cohorts"
      db.collection("organisations")
        .add(organisation)
        .then((docRef) => {
          console.log("Document successfully written!");
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.organisation = {};
      this.uploadedImage = null;
    },
    updateOrganisation(organisation) {
      this.loading = true;
      // Add a new document in collection "cohorts"
      db.collection("organisations")
        .doc(organisation.id)
        .update(organisation)
        .then((docRef) => {
          console.log("Organisation successfully updated!");
          this.loading = false;
          this.closeDialog();
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.organisation = {};
    },
    storeImage() {
      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "organisation-images/" +
          this.organisation.name +
          "-" +
          this.uploadedImage.name
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
            // add image url to organisation obj
            this.organisation.image.url = downloadURL;
            this.organisation.image.name =
              this.organisation.name + "-" + this.uploadedImage.name;
            this.disabled = false;
            this.percentage = 0;
          });
        }
      );
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    // === DELETE
    deleteDialog() {
      (this.dialog = false), (this.dialogConfirm = true);
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.dialog = true;
    },
    confirmDeleteOrganisation(organisation) {
      this.loadingDelete = true;
      // delete document in collection "organisations"
      db.collection("organisations")
        .doc(organisation.id)
        .delete()
        .then(() => {
          console.log("Organisation successfully deleted!");
          this.loadingDelete = false;
          this.dialogConfirm = false;
          this.closeDialog();
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
        });

      // TODO:  search cohorts.organisations for "organisation.id" and delete/or set as empty
      db.collection("cohorts")
        .where("organisation", "==", organisation.id)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            // where id matches organisations in cohort, set emmpty org (removing org from cohort)
            db.collection("cohorts")
              .doc(doc.id)
              .update({ organisation: "" })
              .then(() => {
                console.log("Organisation removed from Cohort.");
              });
          });
        })
        .catch((error) => {
          console.log("Error getting documents: ", error);
        });

      this.deleteImage();
    },
    deleteImage() {
      // if no image, dont worry bout it cuz
      if (this.organisation.image.name == "") return;
      console.log("deleting image...");
      // Create a reference to the file to delete
      var storageRef = storage.ref(
        "organisation-images/" + this.organisation.image.name
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
    transition: all 0.3s;
  }

  .right-side {
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s;
    // flex-direction: column;
    // border-left: 1px solid var(--v-missionAccent-base);

    .imagePlaceholder {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: rgba(200, 200, 200, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .organisation-image {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .organisation-description {
      color: var(--v-missionAccent-base);
      font-size: 0.9rem;
    }
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
  }
}

.create-dialog-content {
  // width: 33.33%;
  // min-height: 400px;
  display: flex;
  // justify-content: space-around;
  // align-items: space-around;
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
    text-transform: none;
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
