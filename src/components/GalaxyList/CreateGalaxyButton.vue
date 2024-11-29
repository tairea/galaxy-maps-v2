<template>
  <div>
    <v-tooltip v-if="!user.loggedIn" top color="subBackground">
      <template v-slot:activator="{ on, attrs }">
        <v-row class="text-center" align="center" v-bind="attrs" v-on="on">
          <v-col cols="12">
            <v-btn
              outlined
              color="baseAccent"
              @click="showDialog = true"
              :disabled="!user.loggedIn"
              class="createButton"
              :style="selectedCourseId ? 'opacity:0' : 'opacity:1'"
            >
              <v-icon left>
                {{ mdiPlus }}
              </v-icon>
              CREATE GALAXY
            </v-btn>
          </v-col>
        </v-row>
      </template>
      <div>
        <p class="overline galaxyAccent--text ma-0" style="font-size: 0.8rem">
          Sign in to Create a Galaxy
        </p>
      </div>
    </v-tooltip>
    <v-row v-else class="text-center" align="center">
      <v-col cols="12">
        <v-btn
          outlined
          color="baseAccent"
          @click="showDialog = true"
          :disabled="!user.loggedIn"
          class="createButton"
          :style="selectedCourseId ? 'opacity:0' : 'opacity:1'"
        >
          <v-icon left>
            {{ mdiPlus }}
          </v-icon>
          CREATE GALAXY
        </v-btn>
      </v-col>
    </v-row>

    <!-- Create Galaxy DIALOG -->
    <CreateEditDeleteGalaxyDialog :showDialog="showDialog" @close="showDialog = false" />
  </div>
</template>

<script>
import { mdiPlus } from "@mdi/js";
import { mapState } from "pinia";
import useRootStore from "@/store/index";
import useGalaxyListViewStore from "@/store/galaxyListView";
import CreateEditDeleteGalaxyDialog from "@/components/Dialogs/CreateEditDeleteGalaxyDialog.vue";

export default {
  name: "CreateGalaxyButton",
  components: {
    CreateEditDeleteGalaxyDialog,
  },
  data() {
    return {
      mdiPlus,
      showDialog: false,
    };
  },
  computed: {
    ...mapState(useRootStore, ["user"]),
    ...mapState(useGalaxyListViewStore, ["selectedCourseId"]),
  },
};
</script>

<style scoped>
.createButton {
  transition: all 0.3s;
}
</style>
