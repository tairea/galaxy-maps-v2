<template>
  <v-app>
    <v-main>
      <router-view />
      <SnackBar />
      <VersionStatus v-if="shouldShowVersionStatus" />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import SnackBar from "@/components/Reused/SnackBar.vue";
import VersionStatus from "@/components/GalaxyList/VersionStatus.vue";

export default Vue.extend({
  name: "App",
  components: {
    SnackBar,
    VersionStatus,
  },
  computed: {
    shouldShowVersionStatus(): boolean {
      const routeName = (this as any).$route.name;
      return (
        routeName === "AllPublicGalaxiesList" ||
        routeName === "MyGalaxiesList" ||
        routeName === "Login" ||
        routeName === "Verify" ||
        routeName === "Reset" ||
        routeName === "Register" ||
        routeName === "Root"
      );
    },
  },
});
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
