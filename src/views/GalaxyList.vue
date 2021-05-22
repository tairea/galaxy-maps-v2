<template>
  <v-container class="d-flex justify-center align-center fullHeight">
    <div class="flexContainer">
      <div class="flexRow">
        <div v-for="galaxy in courses" :key="galaxy.id" class="box" :style="{width: courseWidth}">
          <!-- Galaxy card -->
          <v-card width="100%"> 
            <!-- Galaxy Image -->
            <v-img height="150" :src="galaxy.image"></v-img>
            <!-- Galaxy Title -->
            <v-card-title>{{ galaxy.title }}</v-card-title>
            <!-- Galaxy Description -->
            <v-card-text>
              <div>
                {{ galaxy.description }}
              </div>
            </v-card-text>

            <!-- <v-divider class="mx-4"></v-divider>
          <v-card-title>Schools</v-card-title>
          <v-card-text>
            <v-chip-group
              v-model="selection"
              active-class="deep-purple accent-4 white--text"
              column
            >
              <v-chip>Tai Wānanga TŪ TOA</v-chip>
              <v-chip>Rangitikei College</v-chip>
              <v-chip>Tai Wānanga ki Ruakura</v-chip>
            </v-chip-group>
          </v-card-text> -->
            <!-- <v-card-actions>
            <v-btn color="deep-purple lighten-2" text>
              View Galaxy
            </v-btn>
          </v-card-actions> -->
          </v-card>
        </div>
      </div>
    </div>
     <div class="createButton">
          <CreateGalaxy />
        </div>
  </v-container>
</template>

<script>
import CreateGalaxy from "../components/CreateGalaxy";

import { mapGetters } from "vuex";

export default {
  name: "GalaxyList",
  components: {
    CreateGalaxy,
  },
  computed: {
    ...mapGetters(["courses"]),
    courseWidth() {
      console.log("this.courses.length =",this.courses.length)
      var width = 100 / this.courses.length
      if (width < 25) {
        return "25%"
      } else {
        return width+"%"
      }
    }
  },
  data() {
    return {
      
    };
  },
};
</script>

<style lang="scss" scoped>

.fullHeight {
  height: 100vh;
  overflow: scroll;
}

.flexContainer {
  height: 100%;
  width: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  // border: solid blue 2px;

  .flexRow {
    display: flex;
    // height: 50%;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    // border: solid pink 2px;
    

    .box {
      // width: 25%;
      max-width: 25%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      // margin: 10px;
      padding: 2%;
      box-sizing: border-box;
      // border: 1px solid yellow;
    }
  }
}

.createButton {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%, 0%);
}
</style>
