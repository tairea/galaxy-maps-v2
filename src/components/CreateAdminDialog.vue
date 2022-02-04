<template>
  <div class="text-center" align="center">
    <v-dialog v-model="dialog" width="40%" light>
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn outlined color="baseAccent" v-bind="attrs" v-on="on">
          <v-icon left>
            mdi-plus
          </v-icon>
          CREATE ADMIN
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title">
            Add Admin
          </p>
        </div>
        <div class="create-dialog-content">
          <p class="input-description">Add Admin:</p>
          <v-autocomplete
            v-model="administrator"
            :items="people"
            class="input-field text-lowercase"
            solo
            chips
            item-text="firstName"
            item-value="id"
          >
            <template v-slot:selection="data">
              <v-chip
                v-bind="data.attrs"
                :input-value="data.selected"
                close
                @click="data.select"
                @click:close="remove(data.item)"
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
                <v-list-item-avatar v-if="data.item.image && data.item.image.url">
                  <img :src="data.item.image.url">
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title v-html="data.item.firstName"></v-list-item-title>
                  <v-list-item-subtitle v-html="data.item.email"></v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </template>
          </v-autocomplete>
          <v-btn
              class="ma-2"
              :loading="addingAdmin"
              :disabled="addingAdmin"
              color="secondary"
              @click="addAdmin()"
            >
              + Add Admin
          </v-btn>
        </div>
      </div>
      <!-- End create-dialog -->
    </v-dialog>
  </div>
</template>

<script>

import { mapState, mapGetters } from "vuex";
import { db, storage, functions } from "../store/firestoreConfig";

export default {
  name: "CreateAdminDialog",
  computed: {
    ...mapState(["people"]),
    ...mapGetters(["user"]),
    cohortView () {
      return this.$route.name === "CohortView"
    }
  },
  data: () => ({
    administrator: "",
    addingAdmin: false,
    dialog: false,
  }),
  methods: {
    cancel() {
      console.log("cancel");
      this.dialog = false;
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
    addAdmin () {
      if (this.administrator) {
        this.addingAdmin = true
        console.log("admin: ", this.administrator)
        const addAdminRole = functions.httpsCallable('addAdminRole')
        addAdminRole(this.administrator).then(result => {
          console.log(result)
          this.addingAdmin = false
          this.administrator = ""
        }).catch(err => {
          console.error(err)
        })
        
      }
    }
  },
};
</script>

<style lang="scss" scoped>
// new dialog ui
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

    .dialog-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
    }

    .dialog-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin: 0;
      font-style: italic;
    }
  }

  .left-side {
    width: 50%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    transition: all 0.3s;
  }

  .right-side {
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    transition: all 0.3s;
    // flex-direction: column;
    // border-left: 1px solid var(--v-missionAccent-base);

    // cohort info
    #cohort-info {
      width: calc(100% - 40px);
      // min-height: 100%;
      border: 1px solid var(--v-cohortAccent-base);
      margin-top: 30px;
      padding: 20px;
      // background: var(--v-baseAccent-base);
      position: relative;
      z-index: 3;

      .cohort-label {
        font-size: 0.8rem;
        font-weight: 400;
        text-transform: uppercase;
        // ribbon label
        position: absolute;
        top: -1px;
        left: -1px;
        background-color: var(--v-cohortAccent-base);
        color: var(--v-background-base);
        padding: 0px 15px 0px 5px;
        clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
      }

      .cohort-title {
        font-size: 1.2rem;
        color: var(--v-cohortAccent-base);
        font-weight: 600;
        text-transform: uppercase;
        margin: 20px 0px 5px 0px;
      }

      .cohort-description {
        margin-top: 10px;
        color: var(--v-cohortAccent-base);
        // font-size: 0.9rem;
      }
    }
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
  }
}

.create-dialog-content {
  // width: 33.33%;
  min-height: 400px;
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
    font-size: 0.9rem;
  }
}

.input-description {
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
  .cohort-text {
    color: var(--v-cohortAccent-base);
    text-transform: uppercase;
    font-weight: 700;
    background-color: var(--v-subBackground-base);
    padding: 0px 5px;
  }
}
</style>
