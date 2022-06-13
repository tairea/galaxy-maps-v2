<template>
  <div class="text-center" align="center">
    <v-dialog v-model="dialog" width="40%" light>
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on">
          <v-icon left> mdi-plus </v-icon>
          CREATE ADMIN
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title">Add Admin</p>
          <div class="d-flex align-center">
            <v-icon left color="missionAccent">mdi-information-variant</v-icon>
            <p class="dialog-description">
              An admin has unlimited access to records and publish submitted galaxies
            </p>
          </div>
        </div>
        <div class="create-dialog-content">
          <!-- <p class="input-description">Add Admin:</p> -->
          <v-autocomplete
            v-model="administrator"
            :items="people"
            class="text-lowercase"
            color="missionAccent"
            outlined
            dense
            :dark="dark"
            :light="!dark"
            chips
            item-text="firstName"
            item-value="id"
            clearable
            label="Add admin"
          >
            <template v-slot:selection="data">
              <v-chip
                v-bind="data.attrs"
                :input-value="data.selected"
                close
                @click="data.select"
              >
                <template>
                  <v-avatar v-if="data.item.image && data.item.image.url" left>
                    <v-img :src="data.item.image.url"></v-img>
                  </v-avatar>
                  {{ data.item.email }}
                </template>
              </v-chip>
            </template>
            <template v-slot:item="data">
              <template>
                <v-list-item-avatar
                  v-if="data.item.image && data.item.image.url"
                >
                  <img :src="data.item.image.url" />
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title
                    v-html="data.item.firstName"
                  ></v-list-item-title>
                  <v-list-item-subtitle
                    v-html="data.item.email"
                  ></v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </template>
          </v-autocomplete>
          <v-row>
            <v-btn
              class="ma-4"
              :loading="addingAdmin"
              :disabled="addingAdmin"
              color="missionAccent"
              @click="addAdmin()"
              outlined
              width="30%"
            >
              + Add Admin
            </v-btn>
            <v-btn
              :dark="dark"
              :light="!dark"
              class="ma-4"
              @click="cancel()"
              outlined
              width="30%"
            >
              Cancel
            </v-btn>
          </v-row>
        </div>
      </div>
      <!-- End create-dialog -->
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from "vuex";
import { functions } from "../store/firestoreConfig";

export default {
  name: "CreateAdminDialog",
  data: () => ({
    administrator: "",
    addingAdmin: false,
    dialog: false,
  }),
  mounted () {
    this.bindAllPeople()
  },
  computed: {
    ...mapState(["people"]),
    ...mapGetters(["user"]),
    cohortView() {
      return this.$route.name === "CohortView";
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    ...mapActions(['bindAllPeople']),
    cancel() {
      this.dialog = false;
    },
    addAdmin() {
      if (this.administrator) {
        this.addingAdmin = true;
        const addAdminRole = functions.httpsCallable("addAdminRole");
        addAdminRole(this.administrator)
          .then((result) => {
            this.$store.commit("setSnackbar", {
              show: true,
              text: "admin role successfully added for " + this.administrator,
              color: "baseAccent"
            })
            this.addingAdmin = false;
            this.administrator = "";
          })
          .catch((err) => {
            this.$store.commit("setSnackbar", {
              show: true,
              text: "something went wrong trying to add admin: " + err,
              color: "pink"
            })
            console.error(err);
          });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
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

    .dialog-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin: 0;
      font-style: italic;
    }
  }
}

.create-dialog-content {
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  text-transform: uppercase;
  width: 100%;

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 0.9rem;
    color: var(--v-missionAccent-base);
    text-transform: none;
  }
}

.input-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;
}
</style>
