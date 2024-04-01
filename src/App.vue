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
