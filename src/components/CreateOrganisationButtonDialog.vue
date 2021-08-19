<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="70%" light>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on">
              <v-icon left>
                mdi-plus
              </v-icon>
              CREATE ORGANISATION
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div class="createOrganisationDialog">

            <!-- TITLE -->
            <div class="tile">
              <v-text-field label="ORGANISATION TITLE" v-model="organisation.name"></v-text-field>
            </div>

            <!-- DESCRIPTION -->
            <div class="tile">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="ORGANISATION DESCRIPTION"
                v-model="organisation.description"
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
                    style="width:100% "
                  ></v-file-input>
                </v-row>
                <v-row v-if="imgUrl" class="d-flex justify-center">
                  <v-img
                    :src="imgUrl"
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
                color="green darken-1"
                 :disabled="disabled"
                :loading="loading"
                @click="saveOrganisation(organisation)"
              >
                <v-icon left>
                  mdi-check
                </v-icon>
                SAVE ORGANISATION
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
  name: "CreateOrganisationButtonDialog",
   computed: {
    // easy image preview thanks to: https://stackoverflow.com/questions/60678840/vuetify-image-upload-preview
    imgUrl() {
      if (!this.uploadedImage) return;
      return URL.createObjectURL(this.uploadedImage);
    },
  },
  data: () => ({
    dialog: false,
        loading: false,
    disabled: false,
    organisation: {
      name: "",
      description:"",
      image: {
        name: "",
        url: "",
      },
      cohorts: []
    },
    uploadedImage: null,
    percentage: 0,
  }),
  methods: {
    saveOrganisation(organisation) {
      this.loading = true;
      // Add a new document in collection "cohorts"
      db.collection("organisations")
        .add(organisation)
        .then((docRef) => {
          console.log("Document successfully written!");
          this.loading = false;
          this.dialog = false;
          //get doc id from firestore (aka course id)
          // const organisationId = docRef.id;
          //set cohortId to Store state 'state.currentcohortId' (so not relying on router params)
          // this.$store.commit("setCurrentOrganisationId", organisationId);
          // route to newly created galaxy
          // this.$router.push({
          //   name: "CohortView",
          //   params: {
          //     cohortName: this.camelize(cohort.name),
          //     cohortId: cohortId,
          //   },
          // });
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.organisation = {};
      this.uploadedImage = null
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
      var storageRef = storage.ref("organisation-images/" + this.organisation.name + "-" + this.uploadedImage.name);

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
            this.organisation.image.name = this.organisation.name + "-" + this.uploadedImage.name;
            this.disabled = false;
            this.percentage = 0
          });
        }
      );
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
</style>
