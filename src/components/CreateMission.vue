<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="70%">
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
                v-model="course.title"
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
                v-model="course.description"
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
                v-model="course.duration"
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
                v-model="course.video"
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
                v-model="course.slides"
              ></v-textarea>
            </div>

            <!-- SAVE -->
            <div class="create-field" :style="{ justifyContent: 'center' }">
              <v-btn
                outlined
                color="missionAccent"
                v-bind="attrs"
                v-on="on"
                @click="saveCourse()"
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
import { mapMutations } from "vuex";

export default {
  name: "CreateGalaxy",

  data: () => ({
    dialog: false,
    createGalaxyButtons: ["Title", "Desc", "Img", "Assign Students", "Save"],
    // colors: ["#F06292", "#9575CD", "#64B5F6", "#4DD0E1", "#81C784", "#DCE775"],
    colors: ["", "", "", "", "", ""],
    course: {
      title: "",
      description: "",
      image: "",
    },
  }),
  methods: {
    ...mapMutations(["addCourse"]),

    saveCourse() {
      this.addCourse(this.course);
      this.dialog = false;
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
</style>
