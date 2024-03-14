<template>
  <div>
  <v-dialog v-model="dialog" width="40%" light>
    <!-- CREATE BUTTON -->
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
        class="mission-edit-button mt-4"
        outlined
        color="baseAccent"
        x-small
      >
        <v-icon small> {{ mdiAccountCheck }} </v-icon>
      </v-btn>
    </template>

    <!-- DIALOG (TODO: make as a component)-->
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <v-row class="pa-2">
          <p class="dialog-title">Verify your student account</p>
          <v-icon
            class="ml-auto cancel-button"
            color="missionAccent"
            @click="cancel"
          >{{ mdiClose }}</v-icon>
        </v-row>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <p class="dialog-description">Verify your account to participate in the student rewards programe</p>
        </div>
      </div>

      <div class="create-dialog-content">

          <p>To verify your account you will need to have a tribal membership credential</p>
          <div v-if="link">
            <v-textarea
              :dark="dark"
              :light="!dark"
              type="text"
              outlined
              color="missionAccent"
              :value="link"
              hide-details
            ></v-textarea>
            <div class="d-flex align-end mt-4">
              <v-btn color="missionAccent" @click="copyLink" small class="ml-auto">
                <div v-if="copied">
                  <v-icon small>{{ mdiCheck }}</v-icon>
                  copied
                </div>
                <div v-else>
                  <v-icon small>{{ mdiContentCopy }}</v-icon>
                  copy
                </div>
              </v-btn>
            </div>
          </div>
          <div v-else class="text-center">
            <v-btn
              style="max-width:60%"
              outlined
              color="baseAccent"
              @click="generatePresentationLink()"
              class="mr-2"
              :loading="loading"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon left> {{ mdiShare }} </v-icon>
              Generate presentation link
            </v-btn>
          </div>
  

      </div>
      <!-- End create-dialog-content -->
    </div>
  </v-dialog>
  </div>
</template>

<script>
import { db, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import {
  mdiInformationVariant,
  mdiAccountCheck,
  mdiClose,
  mdiShare,
  mdiContentCopy,
  mdiCheck
} from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "VerifyStudentDialog",
  props: ["on", "attrs", "isDashboardView"],
  components: {},
  mounted() {},
  computed: {
    ...mapState(useRootStore, ["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  data() {
    return {
      mdiAccountCheck,
      mdiInformationVariant,
      mdiClose,
      mdiShare,
      mdiContentCopy,
      mdiCheck,
      dialog: false,
      profile: {},
      link: null,
      loading: false,
      copied: false
    };
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    copyLink () {
      navigator.clipboard.writeText(this.link);
      this.copied = true
    },
    async generatePresentationLink () {
      this.loading = true
      const getConnectionInvitation = functions.httpsCallable("createConnectionInvitation");
      await getConnectionInvitation()
        .then(res => {
          this.loading = false
          this.link = res.data.invitation.invitationUrl
          const data = {
            id: res.data.connectionId,
            state: res.data.state,
            goal: res.data.goal, 
            person: this.person.id,
          }
          this.createNewConnection(data)
        })
        .catch(error => {
          this.loading = false
          console.error("Error writing document: ", error);
          this.setSnackbar({
            show: true,
            text: error.message,
            color: "pink",
          });
        });
    },
    async createNewConnection (conn) {
      await db.collection("connection")
        .doc(conn.id)
        .set(conn)
        .then((res) => {
          this.setSnackbar({
            show: true,
            text: "Connection successfully created",
            color: "baseAccent",
          });
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          this.setSnackbar({
            show: true,
            text: error.message,
            color: "pink",
          });
          this.cancel();
        }); 
    },

    cancel() {
      this.dialog = false;
      this.loading = false;
      this.link = null;
      this.copied = false;
      this.$emit("close");
    },
  },
};
</script>

<style lang="scss" scoped>
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;
  overflow-y: scroll;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .dialog-description {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.7rem;
    margin: 0;
    font-style: italic;
  }

  .create-dialog-content {
    // width: 33.33%;
    min-height: 200px;
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

    .input-field {
      width: 100%;
      text-align: center;
      flex: none;
      font-size: 0.8rem;
      color: var(--v-missionAccent-base);
    }
  }
  .cancel-button {
    position: relative;
    top: -15px;
    right: -15px;
  }
}
</style>
