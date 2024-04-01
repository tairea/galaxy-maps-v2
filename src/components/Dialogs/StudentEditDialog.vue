<template>
  <!-- Edit dialog -->
  <v-dialog v-model="dialog" width="40%" light>
    <!-- CREATE BUTTON -->
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-if="isDashboardView"
        v-bind="attrs"
        v-on="on"
        class="mission-edit-button mt-4"
        outlined
        color="baseAccent"
        x-small
      >
        <v-icon small> {{ mdiPencil }} </v-icon>
      </v-btn>
      <v-btn
        v-if="isStudentPopupView"
        v-bind="attrs"
        v-on="on"
        class="mission-edit-button"
        outlined
        color="white"
        x-small
      >
        <v-icon small> {{ mdiPencil }} </v-icon>
      </v-btn>
      <v-btn v-else v-bind="attrs" v-on="on" color="baseAccent" class="ma-4" outlined>
        <v-icon class="pr-2">{{ mdiPencil }}</v-icon>
        edit account
      </v-btn>
    </template>

    <!-- DIALOG (TODO: make as a component)-->
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <div class="d-flex justify-space-between mb-4">
          <p class="dialog-title ma-0">Edit your profile details</p>
          <v-btn icon @click="dialog = false">
            <v-icon color="missionAccent">{{ mdiClose }}</v-icon>
          </v-btn>
        </div>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <p class="dialog-description">Update your profile information</p>
        </div>
      </div>

      <div class="create-dialog-content">
        <!-- FIRST NAME -->
        <v-text-field
          class="input-field"
          outlined
          :dark="dark"
          :light="!dark"
          color="missionAccent"
          v-model="profile.firstName"
          label="First name"
        ></v-text-field>
        <!-- LAST NAME -->
        <v-text-field
          class="input-field"
          outlined
          :dark="dark"
          :light="!dark"
          color="missionAccent"
          v-model="profile.lastName"
          label="Last name"
        ></v-text-field>
        <!-- LAST NAME -->
        <v-text-field
          class="input-field"
          outlined
          :dark="dark"
          :light="!dark"
          color="missionAccent"
          v-model="profile.discord"
          label="Discord handle"
        ></v-text-field>
        <!-- EMAIL -->
        <v-row>
          <v-col cols="10">
            <v-text-field
              class="input-field"
              outlined
              :disabled="!editEmail"
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              v-model="profile.email"
              label="Email"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-icon
              class="mt-2"
              large
              color="missionAccent"
              v-if="!editEmail"
              @click="editEmail = true"
            >
              {{ mdiPencilBox }}
            </v-icon>
            <v-icon class="mt-2" large color="missionAccent" v-else @click="saveEmail">{{
              mdiContentSave
            }}</v-icon>
          </v-col>
        </v-row>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <v-btn
            outlined
            color="baseAccent"
            @click="updatePerson(profile)"
            class="mr-2"
            :loading="loading"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon left> {{ mdiCheck }} </v-icon>
            UPDATE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="ml-2"
            @click="cancel"
            :disabled="loading"
          >
            <v-icon left> {{ mdiClose }} </v-icon>
            Cancel
          </v-btn>
        </div>
        <!-- End action-buttons -->
      </div>
      <!-- End create-dialog-content -->
    </div>
  </v-dialog>
</template>

<script>
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import {
  mdiPencil,
  mdiInformationVariant,
  mdiPencilBox,
  mdiContentSave,
  mdiCheck,
  mdiClose,
} from "@mdi/js";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";

export default {
  name: "StudentEditDialog",
  props: ["on", "attrs", "isDashboardView", "isStudentPopupView", "student"],
  components: {},
  mounted() {
    if (this.student) {
      Object.assign(this.profile, this.student);
    } else {
      Object.assign(this.profile, this.person);
    }
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  data() {
    return {
      mdiPencil,
      mdiInformationVariant,
      mdiPencilBox,
      mdiContentSave,
      mdiCheck,
      mdiClose,
      dialog: false,
      loading: false,
      editEmail: false,
      profile: {},
    };
  },
  watch: {
    dialog(newVal) {
      if (newVal) {
        console.log("dialog is true");
        if (student) {
          Object.assign(this.profile, this.student);
        } else {
          Object.assign(this.profile, this.person);
        }
      }
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    updatePerson(profile) {
      db.collection("people")
        .doc(profile.id)
        .update(profile)
        .then((res) => {
          this.setSnackbar({
            show: true,
            text: "Profile successfully updated",
            color: "baseAccent",
          });
          this.cancel();
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          this.setSnackbar({
            show: true,
            text: error.message,
            color: "pink",
          });
          this.cancel();
        });
    },
    saveEmail() {
      firebase
        .auth()
        .currentUser.updateEmail(this.profile.email)
        .then(() => {
          // TODO: Possibly add logic to send new email to previous email to confirm email change
          var actionCodeSettings = {
            url: window.location.origin + "/login",
            handleCodeInApp: true,
          };
          firebase.auth().currentUser.sendEmailVerification(actionCodeSettings);
          this.setSnackbar({
            show: true,
            text: "Email successfully updated, check your email to verify your new email account",
            color: "baseAccent",
          });
        })
        .catch((error) => {
          this.setSnackbar({
            show: true,
            text: error.message,
            color: "pink",
          });
          this.cancel;
        });
      this.editEmail = false;
    },
    cancel() {
      this.dialog = false;
      this.loading = false;
      this.editEmail = false;
      this.$emit("close");
    },
  },
};
</script>

<style lang="scss" scoped>
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;
  overflow-y: scroll;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .dialog-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.7rem;
    margin: 0;
    font-style: italic;
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
      font-size: 0.8rem;
      color: var(--v-missionAccent-base);
    }
  }
}
</style>
