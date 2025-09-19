<template>
  <v-app>
    <v-main>
      <router-view />
      <SnackBar />
      <PaywallSnackbar />
      <VersionStatus />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import SnackBar from "@/components/Reused/SnackBar.vue";
import PaywallSnackbar from "@/components/Reused/PaywallSnackbar.vue";
import Alpha from "@/components/GalaxyList/VersionStatus.vue";

export default {
  name: "App",
  components: {
    SnackBar,
    PaywallSnackbar,
    Alpha,
  },
};
</script>
