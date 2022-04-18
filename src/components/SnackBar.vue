<template>
 <v-snackbar
    v-model="snackbar.show"
    timeout="8000"
  >
    {{ snackbar.text }}
    <template v-slot:action="{ attrs }">
      <v-btn
        :color="snackbar.color"
        text
        v-bind="attrs"
        @click="setSnackbar({show: false, text: ''})"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { mapState, mapMutations } from 'vuex'

export default{
  name: 'SnackBar',
  computed: {
    ...mapState(['snackbar'])
  },
  methods: {
    ...mapMutations(['setSnackbar'])
  }
}
</script>