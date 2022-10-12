<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="open" width="70%" light @click:outside="closeDialog">
          <!-- CREATE BUTTON -->
          <!-- <template v-slot:activator="{ on, attrs }">
            <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon left>
                mdi-plus
              </v-icon>
              UPDATE ORGANISATION
            </v-btn>
          </template> -->

          <!-- DIALOG (TODO: make as a component)-->
          <div class="createOrganisationDialog">
            <!-- TITLE -->
            <div class="tile">
              <v-text-field
                label="ORGANISATION TITLE"
                :value="organisation.name"
              ></v-text-field>
            </div>

            <!-- DESCRIPTION -->
            <div class="tile">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="ORGANISATION DESCRIPTION"
                :value="organisation.description"
              ></v-textarea>
            </div>

            <!-- UPLOAD ORGANISATION IMAGE -->
            <div class="tile" id="uploadContainer">
              <v-col>
                <v-row v-if="percentage > 0">
                  <v-progress-linear :value="percentage"></v-progress-linear>
                </v-row>
                <v-row>
                  <v-file-input
                    accept="image/*"
                    v-model="uploadedImage"
                    label="UPLOAD ORGANISATION IMAGE"
                    @change="storeImage()"
                    style="width: 100%"
                  ></v-file-input>
                </v-row>
                <v-row
                  v-if="organisation.image.url"
                  class="d-flex justify-center"
                >
                  <v-img
                    :src="organisation.image.url"
                    max-height="150px"
                    max-width="150px"
                  ></v-img>
                </v-row>
              </v-col>
            </div>

            <!-- SAVE -->
            <div class="tile saveButton">
              <v-btn
                outlined
                color="baseAccent"
                class="mr-2"
                @click="updateOrganisation(combinePropAndLocalOrganisation)"
                :disabled="disabled"
                :loading="loading"
              >
                <v-icon left> mdi-check </v-icon>
                UPDATE ORGANISATION
              </v-btn>
              <!-- DELETE -->
              <v-btn
                outlined
                color="error"
                @click="deleteDialog()"
                class="ml-2"
              >
                <v-icon left> mdi-delete </v-icon>
                DELETE ORGANISATION
              </v-btn>
            </div>
          </div>
        </v-dialog>

        <!-- CONFIRM DELETE DIALOG -->
        <v-dialog v-model="dialogConfirm" width="500" light>
          <v-card>
            <v-card-title class="text-h5 grey lighten-2">
              Warning
            </v-card-title>

            <v-card-text class="py-8 px-6">
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
                <v-icon left> mdi-close </v-icon>
                CANCEL
              </v-btn>
              <v-btn
                outlined
                color="error"
                @click="confirmDeleteOrganisation(organisation)"
                class="ml-2"
                :disabled="disabledDelete"
                :loading="loadingDelete"
              >
                <v-icon left> mdi-delete </v-icon>
                CONFIRM DELETE ORGANISATION
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "EditOrganisationButtonDialog",
  //TODO: manipulating prop error. Fix by v-model to a new obj and emit that up to replace the prop. Like this: https://javascript.plainenglish.io/avoid-mutating-a-prop-directly-7b127b9bca5b
  props: ["open", "organisation"],
  mounted() {},
  computed: {
    combinePropAndLocalOrganisation() {
      return { ...this.organisation, ...this.localOrganisation };
    },
  },
  data: () => ({
    loading: false,
    disabled: false,
    loadingDelete: false,
    disabledDelete: false,
    dialogConfirm: false,
    // dialog: false,
    // organisation: null,
    uploadedImage: {},
    percentage: 0,
    localOrganisation: {},
  }),
  methods: {
    closeDialog() {
      this.$emit("closeOrganisationEditDialog");
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
    // camelize(str) {
    //   return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    //     if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    //     return index === 0 ? match.toLowerCase() : match.toUpperCase();
    //   });
    // },
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
            this.organisation.image.name = this.uploadedImage.name;
            this.disabled = false;
          });
        }
      );
    },
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
/* Dialog */
.createOrganisationDialog {
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

.organisation-text {
  color: var(--v-primary-base);
  text-transform: uppercase;
  font-weight: 700;
  // background-color: var(--v-subBackground-base);
  padding: 0px 5px;
}
</style>
