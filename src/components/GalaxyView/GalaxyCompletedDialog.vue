<template>
  <v-dialog transition="dialog-bottom-transition" max-width="600" :value="value">
    <template v-slot:default="dialog">
      <v-card style="border: 1px solid var(--v-baseAccent-base)">
        <v-toolbar color="baseAccent overline" light>congratulations</v-toolbar>
        <v-card-text class="pa-0">
          <div class="overline text-center pa-12 baseAccent--text">
            You have completed this Galaxy Map
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="$emit('close')">Close</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
export default {
  name: "GalaxyCompletedDialog",
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["close"],
};
</script>
