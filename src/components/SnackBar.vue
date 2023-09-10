<template>
  <v-snackbar v-model="snackbar.show" timeout="5000">
    {{ snackbar.text }}
    <template v-slot:action="{ attrs }">
      <v-btn
        :color="snackbar.color"
        text
        v-bind="attrs"
        @click="setSnackbar({ show: false, text: '' })"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

export default {
  name: "SnackBar",
  computed: {
    ...mapState(useRootStore, ["snackbar"]),
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
  },
};
</script>
