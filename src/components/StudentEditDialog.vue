<template>
  <!-- Edit dialog -->
  <v-dialog v-model="dialog" width="40%" light>
    <!-- CREATE BUTTON -->
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
        class="mission-edit-button mt-4"
        outlined
        color="baseAccent"
        x-small
      >
        <v-icon small> mdi-pencil </v-icon>
      </v-btn>
    </template>

    <!-- DIALOG (TODO: make as a component)-->
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <p class="dialog-title">Edit your profile details</p>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">mdi-information-variant</v-icon>
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
          v-model="person.firstName"
          label="First name"
        ></v-text-field>
        <!-- LAST NAME -->
        <v-text-field
          class="input-field"
          outlined
          :dark="dark"
          :light="!dark"
          color="missionAccent"
          v-model="person.lastName"
          label="Last name"
        ></v-text-field>
        <!-- EMAIL -->
        <v-text-field
          class="input-field"
          outlined
          :dark="dark"
          :light="!dark"
          color="missionAccent"
          v-model="person.email"
          label="Email"
        ></v-text-field>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <v-btn
            outlined
            color="green darken-1"
            @click="updatePerson(person)"
            class="mr-2"
            :loading="loading"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon left> mdi-check </v-icon>
            UPDATE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="ml-2"
            @click="cancel"
            :disabled="loading"
          >
            <v-icon left> mdi-close </v-icon>
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
import { mapState } from "vuex";

import { db } from "../store/firestoreConfig";

export default {
  name: "StudentEditDialog",
  props: ["on", "attrs"],
  components: {},
  mounted() {},
  computed: {
    ...mapState(["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  data() {
    return {
      dialog: false,
      loading: false,
    };
  },
  methods: {
    updatePerson(person) {
      db.collection("people")
        .doc(person.id)
        .update(person)
        .then((res) => {
          console.log("Person successfully updated!");
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    cancel() {
      this.dialog = false;
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
