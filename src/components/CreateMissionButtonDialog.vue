<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="70%" light>
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn outlined color="missionAccent" v-bind="attrs" v-on="on">
              <v-icon left>
                mdi-plus
              </v-icon>
              CREATE MISSION
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div class="createMissionDialog">
            <!-- TITLE -->
            <div class="create-field">
              <v-text-field
                label="MISSION TITLE"
                color="missionAccent"
                v-model="task.title"
              ></v-text-field>
            </div>

            <!-- DESCRIPTION -->
            <div class="create-field">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                color="missionAccent"
                label="MISSION DESCRIPTION"
                v-model="task.description"
              ></v-textarea>
            </div>

            <!-- DURATION -->
            <div class="create-field">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="MISSION DURATION"
                color="missionAccent"
                v-model="task.duration"
              ></v-textarea>
            </div>

            <!-- VIDEO -->
            <div class="create-field">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="MISSION VIDEO"
                color="missionAccent"
                v-model="task.video"
              ></v-textarea>
            </div>

            <!-- SLIDES -->
            <div class="create-field">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="MISSION SLIDES"
                color="missionAccent"
                v-model="task.slides"
              ></v-textarea>
            </div>

            <!-- SAVE -->
            <div class="create-field" :style="{ justifyContent: 'center' }">
              <v-btn
                outlined
                color="missionAccent"
                v-bind="attrs"
                v-on="on"
                @click="saveTask(task)"
              >
                <v-icon left>
                  mdi-check
                </v-icon>
                SAVE
              </v-btn>
            </div>
          </div>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import firebase from "firebase/app";

import { db } from "../store/firestoreConfig";
import { mapState } from "vuex";

export default {
  name: "CreateMissionButtonDialog",
  props: ["topicId", "on", "attrs"],
  data: () => ({
    dialog: false,
    task: {
      title: "",
      description: "",
      duration: "",
      video: "",
      slides: "",
    },
  }),
  computed: {
    ...mapState(["currentCourseId"]),
  },
  methods: {
    saveTask(task) {
      // format video & slides url with "http://"
      if (task.video) {
        if (!/^https?:\/\//i.test(task.video)) {
          task.video = "http://" + task.video;
        }
      }
      if (task.slides) {
        if (!/^https?:\/\//i.test(task.slides)) {
          task.slides = "http://" + task.slides;
        }
      }

      // Add a new document in collection "courses"
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("topics")
        .doc(this.topicId)
        .update({
          // update tasks array with new task
          tasks: firebase.firestore.FieldValue.arrayUnion(task)
        })
        .then(() => {
          console.log("Task successfully written!");
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.task = {};
    },
  },
};
</script>

<style scoped lang="scss">

/* Dialog */
.createMissionDialog {
  color: var(--v-missionAccent-base);
  background: lightGrey;
  display: flex;
  flex-wrap: wrap;
}

.create-field {
  width: 33.33%;
  height: 200px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: var(--v-missionAccent-base);
  padding: 20px;
  text-transform: uppercase;
  font-size: 0.6rem;
  // border: 1px solid var(--v-missionAccent-base);
}

.v-input .v-label {
  font-size: 0.8em;
}

// color of textareas
// .theme--light.v-text-field > .v-input__control > .v-input__slot:before {
//   border-color: var(--v-missionAccent-base);
// }

// .theme--light.v-text-field:hover {
//   border-color: var(--v-missionAccent-base);
// }


// .theme--light.v-label {
//   color: var(--v-missionAccent-base);
// }

// .theme--light.v-input:not(.v-input--is-disabled) input,
// .theme--light.v-input:not(.v-input--is-disabled) textarea {
//   color: var(--v-missionAccent-base);
// }
</style>
