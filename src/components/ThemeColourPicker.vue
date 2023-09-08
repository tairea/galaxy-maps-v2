<template>
  <div>
    <!-- <p class="text-overline" color="primary">Colour Schemes</p> -->
    <!-- LIGHT/DARK MODE SWITCH -->
    <!-- <v-switch
      v-model="darkSwitch" 
      :label="`${ darkSwitch ? 'Dark' : 'Light' }`"
      @change="changeTheme()"
    ></v-switch> -->
    <!-- COLOUR SCHEME #1 -->
    <div
      @click="changeColourTheme('light')"
      class="d-flex justify-space-around align-center color-scheme-choice"
      style="background: #424242; border: 1px solid #00e676"
    >
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #e269cf; color: #e269cf"
      >
        GALAXY
      </p>
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #69a1e2; color: #69a1e2"
      >
        MISSION
      </p>
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #00e676; color: #00e676"
      >
        PRIMARY
      </p>
    </div>
    <!-- COLOUR SCHEME #2 -->
    <div
      @click="changeColourTheme('minimal')"
      class="d-flex justify-space-around align-center color-scheme-choice"
      style="background: #f8f9fa; border: 1px solid #6c757d"
    >
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #343a40; color: #343a40"
      >
        GALAXY
      </p>
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #495057; color: #495057"
      >
        MISSION
      </p>
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #6c757d; color: #6c757d"
      >
        PRIMARY
      </p>
    </div>
    <!-- COLOUR SCHEME #3 -->
    <div
      @click="changeColourTheme('minimal2')"
      class="d-flex justify-space-around align-center color-scheme-choice"
      style="background: #f7f7ff; border: 1px solid #495867"
    >
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #fe5f55; color: #fe5f55"
      >
        GALAXY
      </p>
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #577399; color: #577399"
      >
        MISSION
      </p>
      <p
        class="d-flex justify-center align-center ma-0 pa-2"
        style="border: 1px solid #495867; color: #495867"
      >
        PRIMARY
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data: {
    darkSwitch: false,
    themes: [
      {
        name: "minimal",
        light: {
          background: "#f8f9fa",
          baseAccent: "#6c757d",
          galaxyAccent: "#343a40",
          missionAccent: "#495057",
        },
        dark: {
          background: "#f8f9fa",
          baseAccent: "#6c757d",
          galaxyAccent: "#343a40",
          missionAccent: "#495057",
        },
      },
      {
        name: "minimal2",
        light: {
          background: "#f7f7ff",
          baseAccent: "#495867",
          galaxyAccent: "#fe5f55",
          missionAccent: "#577399",
        },
        dark: {
          background: "#f7f7ff",
          baseAccent: "#495867",
          galaxyAccent: "#fe5f55",
          missionAccent: "#577399",
        },
      },
    ],
  },
  methods: {
    changeTheme() {
      this.$vuetify.theme.dark = this.darkSwitch;
    },
  },
});
</script>

<style lang="scss" scoped>
.color-scheme-choice {
  font-size: 0.6rem;
  margin-bottom: 20px;
  padding: 10px;
  cursor: pointer;
}
</style>
