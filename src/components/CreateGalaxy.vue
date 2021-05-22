<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="70%">
          <!-- CREATE BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn outlined color="neon" v-bind="attrs" v-on="on">
              <v-icon left>
                mdi-plus
              </v-icon>
              CREATE GALAXY
            </v-btn>
          </template>

          <!-- DIALOG (TODO: make as a component)-->
          <div class="createGalaxyDialog">
            <!-- TITLE -->
            <div class="tile" :style="{ backgroundColor: colors[0] }">
              <v-text-field label="TITLE" v-model="course.title"></v-text-field>
            </div>

            <!-- DESCRIPTION -->
            <div class="tile" :style="{ backgroundColor: colors[1] }">
              <v-textarea
                auto-grow
                clearable
                rows="1"
                label="DESCRIPTION"
                v-model="course.description"
              ></v-textarea>
            </div>

            <!-- UPLOAD IMAGE -->
            <div
              class="tile"
              :style="{ backgroundColor: colors[2], justifyContent: 'center' }"
            >
              <v-file-input
                accept="image/*"
                label="Upload Image"
                v-model="course.image"
              ></v-file-input>
            </div>

            <!-- ASSIGN STUDENTS -->
            <!-- <div
              class="tile"
              :style="{ backgroundColor: colors[2], justifyContent: 'center' }"
              style="width: 66.66%"
            >
              <v-btn outlined color="#777" v-bind="attrs" v-on="on">
                <v-icon left>
                  mdi-account-group
                </v-icon>
                ASSIGN STUDENTS
              </v-btn>
            </div> -->

            <!-- SAVE -->
            <div
              class="tile"
              :style="{ backgroundColor: colors[4], justifyContent: 'center' }"
              style="width: 100%"
            >
              <v-btn
                outlined
                color="green darken-1"
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

import { mapMutations } from 'vuex'

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
    ...mapMutations(['addCourse']),

    saveCourse() {
      this.addCourse(this.course)
      this.dialog = false
      this.course = {}

    },
  },
};
</script>

<style>

/* Dialog */
.createGalaxyDialog {
  color: black;
  background: lightGrey;
  display: flex;
  flex-wrap: wrap;
}

.tile {
  width: 33.33%;
  height: 200px;
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
</style>
