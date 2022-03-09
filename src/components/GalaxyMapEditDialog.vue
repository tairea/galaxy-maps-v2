<template>
  <div>
    <v-dialog v-model="dialog" width="40%" light>
      <!-- Start create-dialog -->
      <div class="create-dialog">
        <div class="create-dialog-content">
          <!-- Title/Desc Header -->
          <div class="dialog-info">
            <p class="dialog-title">{{ dialogTitle }}</p>
            <div class="d-flex align-center">
              <v-icon left color="missionAccent"
                >mdi-information-variant</v-icon
              >
              <p class="dialog-description">
                This <span class="mission-text">System</span> is a Topic of the
                <span class="galaxy-text">{{ this.course.title }}</span> Galaxy
                map
              </p>
            </div>
          </div>

          <!-- Fields -->
          <div class="fields my-4 py-4">
            <!-- Node Label -->
            <!-- <p class="dialog-description">Topic Title:</p> -->
            <v-text-field
              class="input-field mt-4"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              v-model="currentNode.label"
              :autofocus="!editing"
              label="Topic title"
              placeholder="Enter name of this node/topic"
            ></v-text-field>

            <!-- Node Type -->
            <p class="dialog-description">
              Node Type:
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    left
                    color="missionAccent"
                    small
                    class="circle-outline ma-1"
                    v-bind="attrs"
                    v-on="on"
                    >mdi-information-variant</v-icon
                  >
                </template>
                <span>
                  INTRODUCTION Nodes - Introduce the user to the start of a
                  branch<br /><br />
                  TASKS nodes - Have a number of missions/tasks/activities for a
                  user to complete<br /><br />
                  PROJECT nodes - Represent a project task for the user to
                  complete
                </span>
              </v-tooltip>
            </p>
            <v-select
              v-model="currentNode.group"
              :items="nodeTypes"
              item-text="type"
              item-value="value"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              class="input-field"
              :menu-props="{
                closeOnClick: true,
                closeOnContentClick: true,
              }"
            ></v-select>

            <!-- Node Pre-requisites -->
            <p class="dialog-description">
              Node Prerequisites:
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    left
                    color="missionAccent"
                    small
                    class="circle-outline ma-1"
                    v-bind="attrs"
                    v-on="on"
                    >mdi-information-variant</v-icon
                  >
                </template>
                <span>
                  Prerequisites are topics that need to be completed for this
                  one to be unlocked
                </span>
              </v-tooltip>
            </p>
            <v-checkbox
              v-model="prerequisites"
              class="ma-0 pa-0"
              color="blue"
              :dark="dark"
              :light="!dark"
            >
              <template v-slot:label>
                <span class="dialog-description"
                  >Does another topic need to be completed before starting this
                  one?</span
                >
              </template>
            </v-checkbox>
            <v-select
              v-if="prerequisites"
              v-model="currentNode.prerequisites"
              :items="currentCourseNodes"
              item-text="label"
              item-value="id"
              outlined
              :dark="dark"
              :light="!dark"
              class="input-field"
              color="missionAccent"
              multiple
              chips
              :menu-props="{
                closeOnClick: true,
                closeOnContentClick: true,
              }"
            ></v-select>
          </div>

          <!-- Action buttons -->
          <div class="action-buttons">
            <v-btn
              outlined
              color="green darken-1"
              @click="saveNode(currentNode)"
              class="mr-2"
              :loading="loading"
            >
              <v-icon left> mdi-check </v-icon>
              SAVE
            </v-btn>

            <v-btn
              v-if="editing"
              outlined
              color="error"
              @click="deleteDialog()"
              class="mr-2"
            >
              <v-icon left> mdi-delete </v-icon>
              DELETE
            </v-btn>

            <v-btn outlined color="white" class="ml-2" @click="close">
              <v-icon left> mdi-close </v-icon>
              Cancel
            </v-btn>
          </div>
          <!-- End action-buttons -->
        </div>
        <!-- End create-dialog-content -->
      </div>
      <!-- End create-dialog -->
    </v-dialog>

    <!-- CONFIRM DELETE DIALOG -->
    <v-dialog v-model="dialogConfirm" width="40%" light>
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header py-10">
          <p class="dialog-title">
            <strong>Warning!</strong> Delete {{ currentTopic.title }} System?
          </p>
          <div class="d-flex align-start">
            <v-icon left color="missionAccent">mdi-information-variant</v-icon>
            <p class="dialog-description">
              Are you sure you want to <strong>DELETE</strong> this
              <span class="mission-text">{{ currentTopic.title }} System</span>?
              <br />
              <br />
              Deleting is permanent!!!
              <br />
              <br />
              <strong>YOU WILL LOSE ALL </strong>
              <span class="mission-text">Mission</span> data.
            </p>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <!-- DELETE -->
          <v-btn
            outlined
            color="error"
            @click="deleteNode()"
            class="ml-2"
            :loading="deleting"
          >
            <v-icon left> mdi-delete </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
            class="ml-2"
            @click="cancelDeleteDialog()"
          >
            <v-icon left> mdi-close </v-icon>
            Cancel
          </v-btn>
        </div>
        <!-- End action-buttons -->
      </div>
      <!-- End create-dialog-content -->
    </v-dialog>
  </div>
</template>

<script>
import firebase from "firebase/app";
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "GalaxyMapEditDialog",
  props: [
    "course",
    "dialog",
    "dialogTitle",
    "dialogDescription",
    "editing",
    "currentNode",
    "currentEdge",
  ],
  async mounted() {
    this.infoPopupShow = false;
    // hack to make active select white
    if (this.$vuetify.theme.isDark) {
      this.$vuetify.theme.themes.dark.primary = "#fff";
    } else {
      this.$vuetify.theme.themes.dark.primary = "#000";
    }
    if (!this.editing) {
      this.currentNode.label = ""
      console.log('not editing: ', this.currentNode)
    }
  },
  data() {
    return {
      dialogConfirm: false,
      newNodeData: {},
      type: "",
      loading: false,
      deleting: false,
      nodeTypes: [
        {
          type: "Introduction",
          value: "introduction",
        },
        {
          type: "Tasks",
          value: "tasks",
        },
        {
          type: "Project",
          value: "project",
        },
      ],
      prerequisites: false,
    };
  },
  computed: {
    ...mapState([
      "person",
      "currentCourseNodes",
      "personsTopics",
      "currentCourseId",
      "currentTopic",
      "currentTopicId",
    ]),
    ...mapGetters(["getTopicById", "getPersonsTopicById"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    // getTopicTasks() {
    //   console.log("current node", this.currentNode.id);
    //   let topic = this.getPersonsTopicById(this.currentNode.id);
    //   console.log("topic is === ", topic);
    //   if (!topic) {
    //     return;
    //   }
    //   this.topicTasks = topic.tasks;
    //   console.log("this.topicTasks", this.topicTasks);
    //   return this.topicTasks;
    // },

    close() {
      console.log('close')
      this.$emit("closeDialog");
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },

    saveNode(node) {
      console.log("save", node);
      this.loading = true;
      console.log("saving node:", node);
      // save topic node info to map-nodes
      db.collection("courses")
        .doc(this.course.id)
        .collection("map-nodes")
        .doc(node.id)
        .set({ ...node, nodeCreatedTimestamp: new Date() })
        .then((docRef) => {
          console.log("Node successfully written!");
          this.loading = false;
          this.close();
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
      // save topic info to topics
      db.collection("courses")
        .doc(this.course.id)
        .collection("topics")
        .doc(node.id)
        .set({ ...node, topicCreatedTimestamp: new Date() })
        .then((docRef) => {
          console.log("Topic successfully written!");
          this.loading = false;
          this.close();
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
      // increment topicTotals by 1
      db.collection("courses")
        .doc(this.course.id)
        .update("topicTotal", firebase.firestore.FieldValue.increment(1))
        .then(() => {
          console.log("Topic total increased by 1");
        })
        .catch((error) => {
          console.error("Error incrementing topicTotal: ", error);
        });
    },
    deleteDialog() {
      this.dialogConfirm = true;
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.$emit("openDialog");
    },
    deleteNode() {
      console.log("deleting node");
      this.deleting = true;
      // delete node from firestore > map-nodes
      db.collection("courses")
        .doc(this.course.id)
        .collection("map-nodes")
        .doc(this.currentNode.id)
        .delete()
        .then(() => {
          console.log("Node successfully deleted from map-nodes!");
          this.deleting = false;
          this.infoPopupShow = false;
        })
        .catch((error) => {
          console.error("Error deleting node: ", error);
        });
      // delete node from firestore > topics
      db.collection("courses")
        .doc(this.course.id)
        .collection("topics")
        .doc(this.currentNode.id)
        .delete()
        .then(() => {
          console.log("Node successfully deleted from topics!");
          this.deleting = false;
          this.infoPopupShow = false;
        })
        .catch((error) => {
          console.error("Error deleting node: ", error);
        });
      // delete conneceted edge (if there is one)
      if (this.currentNode.connectedEdge) {
        db.collection("courses")
          .doc(this.course.id)
          .collection("map-edges")
          .doc(this.currentNode.connectedEdge)
          .delete()
          .then(() => {
            console.log("Edge successfully deleted!");
            this.deleting = false;
            this.infoPopupShow = false;
          })
          .catch((error) => {
            console.error("Error deleting edge: ", error);
          });
      }
      // decrement topicTotals by 1
      db.collection("courses")
        .doc(this.course.id)
        .update("topicTotal", firebase.firestore.FieldValue.increment(-1))
        .then(() => {
          console.log("Topic total decreased by 1");
        })
        .catch((error) => {
          console.error("Error decrementing topicTotal: ", error);
        });
      // close
      this.close();
    },
    deleteEdge() {
      this.deleting = true;
      db.collection("courses")
        .doc(this.course.id)
        .collection("map-edges")
        .doc(this.currentEdge.id)
        .delete()
        .then(() => {
          console.log("Edge successfully deleted!");
          this.deleting = false;
          this.infoPopupShow = false;
        })
        .catch((error) => {
          console.error("Error deleting edge: ", error);
        });
    }
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
  flex-direction: column;
  flex-wrap: wrap;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }
}

.create-dialog-content {
  // width: 33.33%;
  min-height: 400px;
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

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    text-transform: none;
  }

  .fields {
    border-top: 1px solid var(--v-missionAccent-base);
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;
}

// POPUP
.ss-info-panel {
  // background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  position: absolute;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  z-index: 3;

  .ss-preview {
    min-width: 25vw;
    min-height: 20vh;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: hidden;

    .view-ss-button {
      position: absolute;
      bottom: 20px; // matches 20px padding of ss-details
      background-color: var(--v-background-base);
    }

    .ss-details-buttons {
      position: absolute;
      top: 10px;
      right: 0px;
      padding: 0px !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
    }

    .close-button {
    }
  }
  .ss-details {
    border-top: 1px solid var(--v-missionAccent-base);
    padding: 20px;
    text-align: center;
  }

  .ss-missions {
    border-top: 1px solid var(--v-missionAccent-base);
    background-color: var(--v-background-base);

    .task-table {
      background-color: var(--v-background-base);
    }
  }

  .info-panel-label {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.8rem;
  }
}

.centeredFocus {
  margin-top: -100px;
  margin-left: 50px;
}

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

.circle-outline {
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 50%;
}

.action-buttons {
  width: 100%;
  padding: 20px;
}
</style>
