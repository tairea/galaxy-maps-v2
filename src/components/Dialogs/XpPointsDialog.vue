<template>
  <div :style="!plain ? 'margin-bottom: -20px' : ''">
    <v-dialog v-model="dialog" width="35%" :light="dark" :dark="!dark">
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          :class="{
            'disable-click': !canManageXpPoints,
            xpPointsPlain: plain,
            xpPointsDashboard: !plain,
          }"
          :light="dark"
          :dark="!dark"
          color="baseAccent"
          v-bind="attrs"
          v-on="on"
          :text="plain"
        >
          <div>
            <v-icon v-if="person.verified" class="pr-2">{{ mdiCheckDecagram }} </v-icon>
            <span v-if="!plain">XP:</span>
            <span class="plain-label-value">{{ xpPoints }}</span>
          </div>
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">XP Points</p>
        </div>
        <!-- CONTENT -->
        <div class="create-dialog-content">
          <p class="overline baseAccent--text text-center">
            {{ person.firstName + " " + person.lastName }}
            <br />has
          </p>
          <p class="overline baseAccent--text text-center text-h3">{{ xpPoints }}</p>
          <p class="overline baseAccent--text text-center">XP points</p>
        </div>
        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <!-- text field to enter xp points to add or remove -->
          <div class="d-flex justify-center align-center">
            <v-text-field
              v-model="xpPointsValue"
              class="input-field my-2"
              label="Enter amount of points"
              :disabled="loading"
              outlined
              type="number"
              :dark="dark"
              :light="!dark"
              color="missionAccent"
            ></v-text-field>
          </div>

          <v-btn
            outlined
            color="baseAccent"
            @click="addRemovePointsDialog('adding')"
            :loading="loading"
          >
            <v-icon left> {{ mdiPlusCircle }} </v-icon>
            ADD POINTS
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="ml-2"
            @click="addRemovePointsDialog('removing')"
          >
            <v-icon left> {{ mdiMinusCircle }} </v-icon>
            REMOVE POINTS
          </v-btn>
        </div>
        <!-- End action-buttons -->
      </div>
    </v-dialog>

    <!-- Confirm points add/remove -->
    <v-dialog v-model="confirmDialog" width="35%" :light="dark" :dark="!dark">
      <!-- DIALOG -->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">Confirm {{ addOrRemove == "adding" ? "Adding" : "Removing" }} Points</p>
        </div>
        <!-- CONTENT -->
        <div class="create-dialog-content">
          <p class="overline baseAccent--text text-center">
            Are you sure you want to
            <span :class="{ 'red--text': addOrRemove == 'removing' }">{{
              addOrRemove == "adding" ? "add" : "remove"
            }}</span>
          </p>
          <p class="overline baseAccent--text text-center text-h3">{{ xpPointsValue }}</p>
          <p class="overline baseAccent--text text-center">
            points {{ addOrRemove == "adding" ? "to " : "from " }}<br />
            {{ person.firstName + " " + person.lastName }} ?
          </p>
        </div>
        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <!-- confirm add points -->
          <v-btn
            outlined
            color="baseAccent"
            @click="confirmUpdateXpPoints(xpPointsValue)"
            :disabled="loading"
          >
            <v-icon left> {{ mdiCheck }} </v-icon>
            CONFIRM
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
            class="ml-2"
            @click="closeConfirmDialog"
            :disabled="loading"
          >
            <v-icon left> {{ mdiClose }} </v-icon>
            CANCEL
          </v-btn>
        </div>
        <!-- End action-buttons -->
      </div>
    </v-dialog>
  </div>
</template>

<script>
import { db, functions } from "@/store/firestoreConfig";
import firebase from "firebase/compat/app";
import { mapActions } from "pinia";
import { mdiCheckDecagram, mdiClose, mdiCheck, mdiPlusCircle, mdiMinusCircle } from "@mdi/js";
import useRootStore from "@/store/index";

export default {
  name: "XpPointsDialog",
  components: {},
  props: ["person", "xpPoints", "canManageXpPoints", "plain"],
  computed: {
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  data: () => ({
    mdiClose,
    mdiCheckDecagram,
    mdiCheck,
    mdiPlusCircle,
    mdiMinusCircle,
    dialog: false,
    confirmDialog: false,
    addOrRemove: null,
    xpPointsValue: 0,
    loading: false,
  }),
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    addRemovePointsDialog(addOrRemove) {
      this.addOrRemove = addOrRemove;
      this.dialog = false;
      this.confirmDialog = true;
    },
    async confirmUpdateXpPoints(points) {
      this.loading = true;
      switch (this.addOrRemove) {
        case "adding":
          await db
            .collection("people")
            .doc(this.person.id)
            .update({
              xpPointsTotal: firebase.firestore.FieldValue.increment(Math.abs(points)),
            });
          break;
        case "removing":
          await db
            .collection("people")
            .doc(this.person.id)
            .update({
              xpPointsTotal: firebase.firestore.FieldValue.increment(-Math.abs(points)),
            });
          break;
        default:
          break;
      }
      this.loading = false;
      this.confirmDialog = false;
      this.dialog = false;
      // snackbar to show success
      this.setSnackbar({
        show: true,
        text: "Points " + (this.addOrRemove == "adding" ? "added to" : "removed from") + " student",
        color: "baseAccent",
      });
    },
    closeConfirmDialog() {
      this.confirmDialog = false;
      this.dialog = true;
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
  },
};
</script>

<style lang="scss" scoped>
.xpPointsPlain {
  margin: 0px;
  text-transform: uppercase;
  // background-color: var(--v-baseAccent-base);
  color: var(--v-baseAccent-base);
  font-size: 1rem;
  text-align: center;
  // border-radius: 50px;
  // position: relative;
  // top: -70px;
  // left: 40%;
  // margin-bottom: -50px;
  .plain-label-value {
    font-size: 1.3rem;
    margin: 0px;
    color: var(--v-baseAccent-base);
  }
}
.xpPointsDashboard {
  margin: 0px;
  text-transform: uppercase;
  background-color: var(--v-baseAccent-base);
  color: var(--v-background-base);
  font-size: 1.5rem;
  text-align: center;
  border-radius: 50px;
  position: relative;
  top: -70px;
  left: 40%;
  margin-bottom: -50px;
  font-style: italic;
}
.disable-click {
  pointer-events: none;
}
// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  display: flex;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }
}

.create-dialog-content {
  background-color: var(--v-background-base);
  // width: 33.33%;
  // min-height: 400px;
  display: flex;
  // justify-content: space-around;
  // align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  text-transform: uppercase;
  width: 100%;
  // font-size: 0.6rem;
  // border: 1px solid var(--v-missionAccent-base);
}

.action-buttons {
  width: 100%;
  padding: 20px;
  background-color: var(--v-background-base);
  text-align: center;
  border-top: 1px solid var(--v-missionAccent-base);

  .input-field {
    width: 50%;
    text-align: center;
    flex: none;
    text-transform: none;
    font-size: 2rem;
  }
}
</style>
