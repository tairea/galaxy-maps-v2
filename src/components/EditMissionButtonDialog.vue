<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="pa-0">
        <v-dialog v-model="dialog" width="70%">
          <!-- EDIT BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="mission-edit-button mt-4"
              outlined
              color="missionAccent"
              small
            >
              <v-icon small>
                mdi-pencil
              </v-icon>
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
                @click="updateTask(task, index)"
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
import { mapMutations } from "vuex";

export default {
  name: "EditMissionButtonDialog",
  props: ["task", "index", "courseId", "on", "attrs"],
  data: () => ({
    dialog: false,
  }),
  computed: {
    // ...mapGetters(["getTasksByCourseId"]),
  },
  methods: {
    updateTask(task, index) {
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

      // get all tasks array. so can update task with changes.
      // (cant update single task by index in firestore, so have to get all tasks, make the change, then update all the tasks)
      let courseTasks = this.$store.getters.getTasksByCourseId(this.courseId);
      courseTasks[index] = task;

      // Add a new document in collection "courses"
      db.collection("courses")
        .doc(this.courseId)
        .update({
          // update tasks array with new task
          tasks: courseTasks,
        })
        .then((res) => {
          console.log("Task successfully updated!");
          console.log(res);
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      this.course = {};
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
.theme--light.v-text-field > .v-input__control > .v-input__slot:before {
  border-color: var(--v-missionAccent-base);
}

.theme--light.v-text-field:hover {
  border-color: var(--v-missionAccent-base);
}

.theme--light.v-label {
  color: var(--v-missionAccent-base);
}

.theme--light.v-input:not(.v-input--is-disabled) input,
.theme--light.v-input:not(.v-input--is-disabled) textarea {
  color: var(--v-missionAccent-base);
}

.mission-edit-button {
  position: absolute;
  top: 10px;
  right: 20px;
  // font-size: 0.5rem;
}
</style>
