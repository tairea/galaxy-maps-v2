<template>
  <div class="text-center" align="center">
    <v-dialog v-model="dialog" width="40%" light>
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-if="!hideText" outlined color="baseAccent" v-bind="attrs" v-on="on">
          <v-icon left> {{ mdiPlus }} </v-icon>
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
          <v-icon> {{ mdiPlus }} </v-icon>
        </v-btn>
      </template>

      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title">{{ dialogTitle }}</p>
          <div class="d-flex align-center">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <p class="dialog-description">{{ dialogDescription }}</p>
          </div>
        </div>

        <!-- ORG DETAILS -->
        <div class="organisation-details">
          <!-- LEFT SIDE -->
          <div class="left-side" :style="organisation.name ? 'width:50%' : 'width:100%'">
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
                hide-details
              ></v-file-input>
              <v-progress-linear
                color="missionAccent"
                :value="percentage"
                class=""
              ></v-progress-linear>
            </div>
            <!-- End create-dialog-content -->
          </div>
          <!-- End of left-side -->

          <!-- RIGHT SIDE -->
          <div class="right-side" :style="organisation.name ? 'width:50%' : 'width:0%'">
            <div v-if="organisation.name">
              <div class="d-flex flex-column justify-center align-center cursor">
                <v-img
                  v-if="organisation.image?.url"
                  :src="organisation.image?.url"
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
        </div>

        <!-- ORGANISATIONS PEOPLE -->
        <div class="organisation-people">
          <p class="org-people-description">People in this Organisation</p>

          <!-- pills of the people in -->
          <div class="people-in-org d-flex flex-wrap">
            <v-chip
              close
              @click:close="removePersonFromOrganisation(person.email)"
              v-for="person in organisation.people"
              :key="person.id"
              class="mr-2"
            >
              <v-avatar start v-if="person.image?.url" class="mr-1">
                <v-img :src="person.image.url"></v-img>
              </v-avatar>

              {{ person.firstName + " " + person.lastName }}
            </v-chip>
          </div>

          <!-- add a person -->
          <v-row>
            <v-col>
              <v-text-field
                type="email"
                class="input-field pl-5"
                outlined
                :dark="dark"
                :light="!dark"
                color="missionAccent"
                v-model="personsEmail"
                label="Person's email"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-btn
                outlined
                color="missionAccent"
                @click="addPersonToOrganisation(personsEmail)"
                class="mr-2"
                :loading="addPersonLoading"
                :disabled="!personsEmail"
              >
                <v-icon left> {{ mdiPlus }} </v-icon>
                ADD PERSON TO ORG
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <v-btn
            v-if="!edit"
            outlined
            color="baseAccent"
            @click="saveOrganisation(organisation)"
            class="mr-2"
            :loading="loading"
            :disabled="disabled"
          >
            <v-icon left> {{ mdiCheck }} </v-icon>
            SAVE
          </v-btn>
          <v-btn
            v-else
            outlined
            color="baseAccent"
            @click="updateOrganisation(organisation)"
            class="mr-2"
            :loading="loading"
            :disabled="disabled"
          >
            <v-icon left> {{ mdiCheck }} </v-icon>
            UPDATE
          </v-btn>

          <!-- DELETE -->
          <v-btn v-if="edit" outlined color="error" @click="deleteDialog()" class="ml-2">
            <v-icon left> {{ mdiDelete }} </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="ml-2"
            @click="cancel"
            :disabled="disabled || loading"
          >
            <v-icon left> {{ mdiClose }} </v-icon>
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
          <p class="dialog-title"><strong>Warning!</strong> Delete Organisation?</p>
          <div class="d-flex align-start">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <p class="dialog-description">
              Are you sure you want to <strong>DELETE</strong> the
              <span class="organisation-text">{{ organisation.name }} ORGANISATION</span>?
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
import { db, storage } from "@/store/firestoreConfig";
import firebase from "firebase/compat/app";
import { mdiPlus, mdiClose, mdiCheck, mdiDelete, mdiInformationVariant } from "@mdi/js";

export default {
  name: "CreateEditDeleteOrganisationDialog",
  props: ["edit", "organisationToEdit", "hideText"],
  data: () => ({
    mdiPlus,
    mdiClose,
    mdiCheck,
    mdiDelete,
    mdiInformationVariant,
    dialog: false,
    dialogConfirm: false,
    dialogTitle: "Create a new Organisation",
    dialogDescription: "An Organisation is typically a school, business or... an organisation",
    loading: false,
    addPersonLoading: false,
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
    personsEmail: null,
    menu: false,
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
    async saveOrganisation(organisation) {
      this.loading = true;

      // Add a new document in collection "cohorts"
      try {
        db.collection("organisations").add(organisation);

        console.log("Document successfully written!");
        this.loading = false;
        this.dialog = false;
      } catch (error) {
        console.error("Error writing document: ", error);
      }

      this.organisation = {};
      this.uploadedImage = null;
    },
    async updateOrganisation(organisation) {
      this.loading = true;
      // Add a new document in collection "cohorts"
      try {
        await db.collection("organisations").doc(organisation.id).update(organisation);

        console.log("Organisation successfully updated!");
        this.loading = false;
        this.dialog = false;
      } catch (error) {
        console.error("Error writing document: ", error);
      }

      this.organisation = {};
    },
    async addPersonToOrganisation(email) {
      this.addPersonLoading = true;

      // get ref of person with this email
      const people = await db.collection("people").where("email", "==", email).get();
      if (!people.docs[0]) {
        this.addPersonLoading = false;
        return;
      }
      const person = people.docs[0];
      console.log("added person:", person.data());
      const personRef = person.ref;
      console.log("personRef: ", personRef);

      // save person ref to organisation
      try {
        await db
          .collection("organisations")
          .doc(this.organisation.id)
          .update({
            people: firebase.firestore.FieldValue.arrayUnion(personRef),
          });

        this.organisation.people.push(person.data());
        console.log("Person successfully added to organisation!");
        this.addPersonLoading = false;
      } catch (error) {
        console.error("Error writing document: ", error);
        this.addPersonLoading = false;
      }

      this.personsEmail = null;
    },
    async removePersonFromOrganisation(email) {
      console.log("remove me");
      // get ref of person with this email
      const people = await db.collection("people").where("email", "==", email).get();
      const person = people.docs[0];
      const personRef = person.ref;

      // save person ref to organisation
      db.collection("organisations")
        .doc(this.organisation.id)
        .update({
          people: firebase.firestore.FieldValue.arrayRemove(personRef),
        })
        .then((docRef) => {
          // remove from this.organisation.people
          const index = this.organisation.people.findIndex((person) => person.email === email);
          this.organisation.people.splice(index, 1);
          console.log("Person successfully removed to organisation!");
          this.addPersonLoading = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          this.addPersonLoading = false;
        });
      this.personsEmail = null;
    },
    storeImage() {
      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "organisation-images/" + this.organisation.name + "-" + this.uploadedImage.name,
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
            console.log("this.organisation: " + this.organisation);
            // add image url to organisation obj
            const image = {
              url: downloadURL,
              name: this.organisation.name + "-" + this.uploadedImage.name,
            };
            this.organisation["image"] = image;
            this.disabled = false;
            this.percentage = 0;
          });
        },
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
      var storageRef = storage.ref("organisation-images/" + this.organisation.image.name);
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

  .organisation-details {
    display: flex;
    width: 100%;
    border-bottom: 1px solid var(--v-missionAccent-base);
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
  }

  .organisation-people {
    width: 100%;
    height: 300px;
    border-bottom: 1px solid var(--v-missionAccent-base);

    .org-people-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.7rem;
      margin: 0;
      font-style: italic;
      padding: 20px 20px 10px 20px;
    }
    .people-in-org {
      width: 100%;
      padding: 0px 20px 20px 20px;
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
