<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12">
        <v-dialog v-model="dialog" width="500px" light>
          <!-- DISCOVER BUTTON -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              outlined
              color="baseAccent"
              v-bind="attrs"
              v-on="on"
              :style="hide ? 'opacity:0' : 'opacity:1'"
              class="discoverButton"
            >
              <v-icon left>
                {{ mdiRocketLaunchOutline }}
              </v-icon>
              DISCOVER GALAXY
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">{{ dialogTitle }}</p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  <!-- Discover unlisted Galaxies
                  <br /> -->
                  Enter an <strong>Organisation's name</strong> or <strong>Galaxy Map ID</strong>
                </p>
              </div>
            </div>

            <div class="create-dialog-content">
              <!-- TITLE -->
              <p class="dialog-description">Enter destination:</p>
              <v-text-field
                v-model="courseId"
                class="input-field"
                color="missionAccent"
                outlined
                :dark="dark"
                :light="!dark"
              >
              </v-text-field>
            </div>
            <!-- End create-dialog-content -->

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <v-btn outlined color="baseAccent" @click="routeToGalaxy(courseId)" class="mr-2">
                <v-icon left>
                  {{ mdiRocketLaunchOutline }}
                </v-icon>
                GO TO GALAXY
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-2"
                @click="cancel"
              >
                <v-icon left>
                  {{ mdiClose }}
                </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog -->
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { db, storage } from "@/store/firestoreConfig";
import { mdiRocketLaunchOutline, mdiClose, mdiInformationVariant } from "@mdi/js";
import { mapActions } from "pinia";

export default {
  name: "DiscoverGalaxyButton",
  props: ["hide"],
  data: () => ({
    mdiRocketLaunchOutline,
    mdiClose,
    mdiInformationVariant,
    dialog: false,
    dialogTitle: "Discover hidden Galaxies",
    dialogDescription:
      "Discover an unlisted Galaxy. Enter an <strong>Organisations name</strong> or a Galaxy Map ID",
    courseId: "",
  }),
  mounted() {},
  computed: {
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId"]),
    cancel() {
      console.log("cancel");
      this.dialog = false;
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
    routeToGalaxy(courseId) {
      // route to galaxy
      this.setCurrentCourseId(courseId);
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: courseId,
        },
      });
      this.courseId = "";
    },
  },
};
</script>

<style lang="scss" scoped>
// new dialog ui

.discoverButton {
  transition: all 0.3s;
}

.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
  }
}

.create-dialog-content {
  // width: 33.33%;
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  text-transform: uppercase;
  width: 100%;
  // font-size: 0.6rem;
  // border: 1px solid var(--v-missionAccent-base);

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 0.9rem;
    color: var(--v-missionAccent-base);
    text-transform: none;
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;

  .galaxy-text {
    color: var(--v-galaxyAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }

  .mission-text {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }
}
</style>
