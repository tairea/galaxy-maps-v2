<template>
  <v-app>
    <v-main>
      <router-view />
      <SnackBar />
      <VersionStatus />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import SnackBar from "@/components/Reused/SnackBar.vue";
import Alpha from "@/components/GalaxyList/VersionStatus.vue";

export default {
  name: "App",
  components: {
    SnackBar,
    Alpha,
  },
};
</script>

<style>
/* Ensure stable viewport dimensions on mobile */
.v-application {
  height: 100vh !important;
  height: calc(var(--vh, 1vh) * 100) !important;
  width: 100vw !important;
  overflow: hidden;
  background: var(--v-background-base) !important;
}

.v-main {
  height: 100% !important;
  width: 100% !important;
  overflow: hidden;
  background: var(--v-background-base) !important;
}

/* Set background color for html and body to prevent white background showing */
html,
body {
  background: var(--v-background-base) !important;
}

/* Ensure the app container has the background color */
#app {
  background: var(--v-background-base) !important;
}
</style>
