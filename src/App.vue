<template>
  <v-app>
    <v-main>
      <router-view />
      <SnackBar />
      <!-- <Alpha /> -->
    </v-main>
  </v-app>
</template>

<script lang="ts">
import SnackBar from "@/components/SnackBar.vue";
import Alpha from "@/components/Alpha.vue";

export default {
  name: "App",
  components: {
    SnackBar,
    Alpha,
  },
};
</script>
