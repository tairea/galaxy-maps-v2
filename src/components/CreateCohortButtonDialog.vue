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
              CREATE COHORT
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div class="createCohortDialog">
            <!-- NAME -->
            <div class="tile">
              <v-text-field
                label="COHORT TITLE"
                v-model="cohort.name"
              ></v-text-field>
            </div>

            <!-- DESCRIPTION -->
            <div class="tile">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="COHORT DESCRIPTION"
                v-model="cohort.description"
              ></v-textarea>
            </div>

            <!-- UPLOAD COHORT IMAGE -->
            <div class="tile" id="uploadContainer">
              <v-col>
                <v-row v-if="percentage > 0">
                  <v-progress-linear :value="percentage"></v-progress-linear>
                </v-row>
                <v-row>
                  <v-file-input
                    accept="image/*"
                    v-model="uploadedImage"
                    label="UPLOAD COHORT IMAGE"
                    @change="storeImage()"
                    style="width:100% "
                  ></v-file-input>
                </v-row>
                <v-row v-if="cohort.image.url" class="d-flex justify-center">
                  <v-img :src="cohort.image.url" max-height="150px" max-width="150px"></v-img>
                </v-row>
              </v-col>
            </div>

            <!-- ORGANISATION -->
            <div class="tile fullWidth">
              <v-select
                v-model="cohort.organisation.id"
                :items="organisationsToSelect"
                item-text="name"
                item-value="id"
                label="ORGANISATION"
              >
              </v-select>
            </div>

            <!-- SAVE -->
            <div class="tile fullWidth">
              <v-btn
                outlined
                color="green darken-1"
                @click="saveCohort(cohort)"
              >
                <v-icon left>
                  mdi-check
                </v-icon>
                SAVE COHORT
              </v-btn>
            </div>
          </div>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from "vuex";
import { db, storage } from "../store/firestoreConfig";

export default {
  name: "CreateCohortButtonDialog",
  computed: {
    ...mapState(["organisations"]),
    organisationsToSelect() {
      return [{ name: "none", id: 0 }, ...this.organisations];
    },
  },
  data: () => ({
    dialog: false,
    cohort: {
      name: "",
      description: "",
      organisation: {
        name: "",
        id: "",
      },
      people: [],
      courses: [],
      image: {
        name: "",
        url: "",
      },
    },
    uploadedImage: {},
    percentage: 0,
  }),
  methods: {
    saveCohort(cohort) {
      // Add a new document in collection "cohorts"
      db.collection("cohorts")
        .add(cohort)
        .then((docRef) => {
          console.log("Document successfully written!");
          this.dialog = false;
          //get doc id from firestore (aka course id)
          const cohortId = docRef.id;
          //set cohortId to Store state 'state.currentcohortId' (so not relying on router params)
          this.$store.commit("setCurrentCohortId", cohortId);
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
      this.course = {};
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
    storeImage() {
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
            this.cohort.image.name = this.uploadedImage.name;
          });
        }
      );
    },
  },
};
</script>

<style lang="scss" scoped>
/* Dialog */
.createCohortDialog {
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

.fullWidth {
  width: 100%;
  justify-content: center;
}
</style>
