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
              <p class="dialog-description">{{ dialogDescription }}</p>
            </div>
          </div>

          <!-- Fields -->
          <v-text-field
            class="input-field"
            solo
            color="missionAccent"
            v-model="currentNode.label"
            :autofocus="!editing"
            background-color="white"
          ></v-text-field>

          <!-- Action buttons -->
          <div class="action-buttons">
            <v-btn
              outlined
              color="green darken-1"
              @click="saveNode(currentNode)"
              class="mr-2"
              :loading="loading"
            >
              <v-icon left>
                mdi-check
              </v-icon>
              SAVE
            </v-btn>

            <v-btn
              v-if="editing"
              outlined
              color="error"
              @click="deleteFromMap"
              class="mr-2"
            >
              <v-icon left>
                mdi-delete
              </v-icon>
              DELETE
            </v-btn>

            <v-btn
              outlined
              color="white"
              class="ml-2"
              @click="cancel"
              :disabled="loading"
            >
              <v-icon left>
                mdi-close
              </v-icon>
              Cancel
            </v-btn>
          </div>
          <!-- End action-buttons -->
        </div>
        <!-- End create-dialog-content -->
      </div>
      <!-- End create-dialog -->
    </v-dialog>

    <!-- POPUP -->
    <!-- follow drag -> :style="{ top: getCoords.y - 100 + 'px', left: getCoords.x + 30 + 'px' }" -->
    <div
      v-if="infoPopupShow"
      ref="popup"
      class="ss-info-panel"
      :class="{ centeredFocus: centerFocusPosition }"
      :style="{
        top: centerFocusPosition
          ? infoPopupPosition.y
          : infoPopupPosition.y - 100 + 'px',
        left: centerFocusPosition
          ? infoPopupPosition.x
          : infoPopupPosition.x + 30 + 'px',
      }"
    >
      <div class="ss-preview">
        <!-- Preview: Solar System -->
        <SolarSystem
          :topic="getTopicById(this.currentNode.id)"
          :size="'0.25em'"
        />
        <v-btn
          class="view-ss-button pa-5"
          dark
          small
          color="missionAccent"
          outlined
          tile
          title="Delete"
          @click="routeToSolarSystem"
        >
          View System
        </v-btn>
        <div class="ss-details-buttons mr-2">
          <v-btn
            icon
            small
            color="missionAccent"
            class="close-button"
            @click="close"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-btn
            v-if="!person.accountType == 'student'"
            class="my-2"
            icon
            dark
            x-small
            color="baseAccent"
            title="Edit"
            @click="editNode"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            v-if="!person.accountType == 'student'"
            icon
            dark
            x-small
            color="red"
            title="Delete"
            @click="deleteFromMap"
            :loading="deleting"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>
      <!-- Preview: Topic Label -->
      <div class="ss-details">
        {{ this.currentNode.label }}
      </div>
      <!-- Preview: Table of Topic's Tasks -->
      <div class="ss-missions">
        <div v-if="!getTopicTasks()">
          <h5 class="mission-text" style="text-align:center">
            NO MISSIONS SET
          </h5>
        </div>
        <div v-else v-for="(task, index) in getTopicTasks()" :key="task.id">
          <v-simple-table class="task-table">
            <tr>
              <td>
                <h5 class="mission-text">MISSION {{ index + 1 }}:</h5>
              </td>
              <td>
                <h5 class="mission-text">{{ task.title }}</h5>
              </td>
              <td v-if="task.duration">
                <h5 class="mission-text">{{ task.duration }} MINS</h5>
              </td>
            </tr>
          </v-simple-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

import SolarSystem from "../components/SolarSystem";

export default {
  name: "GalaxyMapEdit",
  components: {
    SolarSystem,
  },
  props: ["course", "coords"],
  async mounted() {
    // bind to store all topics for this course
    // await this.$store.dispatch("bindAllCourseTopics", this.currentCourseId);
  },
  data() {
    return {
      dialog: false,
      dialogTitle: "Edit something hmmm...",
      dialogDescription: "some kind of description",
      nodeDialogTitle: "Enter the name of this System",
      nodeDialogDescription:
        "This System is an Objective of the " +
        this.course.title +
        " Galaxy map",
      newNodeData: {},
      editing: false,
      type: "",
      loading: false,
      deleting: false,
      currentNode: {},
      currentEdge: {},
      infoPopupShow: false,
      infoPopupPosition: {},
      centerFocusPosition: false,
      gotTasks: true
    };
  },
  computed: {
    ...mapState(["person"]),
    ...mapGetters(["getTopicById"]),
    getCoords() {
      return this.coords;
    },
  },
  methods: {
    getTopicTasks() {
      console.log("current node",this.currentNode.id)
      const topic = this.getTopicById(this.currentNode.id);
      return topic.tasks;
    },
    cancel() {
      console.log("cancel");
      this.dialog = false;
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
    close() {
      this.deselect();
    },
    saveNode(node) {
      console.log("save", node);
      this.loading = true;
      console.log("saving node:", node);
      db.collection("courses")
        .doc(this.course.id)
        .collection("map-nodes")
        .doc(node.id)
        .set(node)
        .then((docRef) => {
          console.log("Node successfully written!");
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
      db.collection("courses")
        .doc(this.course.id)
        .collection("topics")
        .doc(node.id)
        .set(node)
        .then((docRef) => {
          console.log("Topic successfully written!");
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
    },
    add(node) {
      console.log("from edit: ADD", node);
      this.currentNode = node;
      this.dialogTitle = this.nodeDialogTitle;
      this.dialogDescription = this.nodeDialogDescription;
      this.dialog = true;
    },
    // edit(node) {
    //   console.log("from edit: EDIT", node);
    //   this.currentNode = node;
    //   this.infoPopupShow = true;
    // },
    selected(selected) {
      this.type = selected.type;
      this.infoPopupPosition.x = selected.DOMx;
      this.infoPopupPosition.y = selected.DOMy;
      if (selected.type == "node") {
        this.currentNode = selected;
      } else if (selected.type == "edge") {
        this.currentEdge = selected;
      }
      this.infoPopupShow = true;
    },
    hovered(hoveredNode) {
      this.infoPopupShow = false;
      this.centerFocusPosition = false;
      this.type = hoveredNode.type;
      this.infoPopupPosition.x = hoveredNode.DOMx;
      this.infoPopupPosition.y = hoveredNode.DOMy;
      this.currentNode = hoveredNode;
      this.infoPopupShow = true;
    },
    centerFocus(centerFocusNode) {
      this.centerFocusPosition = true;
      this.type = centerFocusNode.type;
      this.infoPopupPosition.x = "50%"; // 50%
      this.infoPopupPosition.y = "50%"; // 50%
      this.currentNode = centerFocusNode;
      this.infoPopupShow = true;
    },
    deselect() {
      this.infoPopupShow = false;
      this.centerFocusPosition = false;
    },
    editNode() {
      this.dialogTitle = this.nodeDialogTitle;
      this.dialogDescription = this.nodeDialogDescription;
      this.dialog = true;
    },
    deleteFromMap() {
      if (this.currentNode.label == "new") {
        console.log("emiting to remove unsaved");
        this.$emit("removeUnsavedNode");
        this.currentNode.label = {};
      } else if (this.type == "node") {
        this.deleteNode();
      } else if (this.type == "edge") {
        this.deleteEdge();
      }
      // this.resetEditing();
      // this.resetNewData();
    },
    deleteNode() {
      console.log("deleting node");
      this.deleting = true;
      // delete node
      db.collection("courses")
        .doc(this.course.id)
        .collection("map-nodes")
        .doc(this.currentNode.id)
        .delete()
        .then(() => {
          console.log("Node successfully deleted!");
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
    },
    routeToSolarSystem() {
      console.log("route to ss", this.currentNode.id);
      // save current topic to store
      this.$store.commit("setCurrentTopicId", this.currentNode.id);
      // route to topic/solar system
      this.$router.push({
        name: "SolarSystemView",
        params: {
          topicId: this.currentNode.id,
        },
      });
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
  flex-direction: column;
  flex-wrap: wrap;
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

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
  }
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

.mission-text {
  color: var(--v-missionAccent-base);
  padding: 10px 20px;
}
</style>
