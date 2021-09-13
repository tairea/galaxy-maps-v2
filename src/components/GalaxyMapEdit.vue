<template>
  <div>
    <v-dialog v-model="dialog" width="40%" light>
      <div class="createNodeDialog">
        <div class="create-field">
          <div class="dialog-info">
            <p class="dialog-title">{{ dialogTitle }}</p>
            <div class="d-flex align-center">
              <v-icon left color="missionAccent"
                >mdi-information-variant</v-icon
              >
              <p class="dialog-description">{{ dialogDescription }}</p>
            </div>
          </div>

          <v-text-field
            class="input-field"
            solo
            color="missionAccent"
            v-model="currentNode.label"
            :autofocus="!editing"
            background-color="white"
          ></v-text-field>

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
        </div>
      </div>
    </v-dialog>

    <!-- POPUP -->
    <!-- popup follow drag -> :style="{ top: getCoords.y - 100 + 'px', left: getCoords.x + 30 + 'px' }" -->
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
      <div class="ss-details">
        <div v-if="type == 'node'">
          <p class="info-panel-label">
            Node: <span style="color: white">{{ currentNode.label }}</span>
          </p>
          <p class="info-panel-label">
            X: <span style="color: white">{{ currentNode.x }}</span>
          </p>
          <p class="info-panel-label">
            Y: <span style="color: white">{{ currentNode.y }}</span>
          </p>
        </div>
        <div v-else-if="type == 'edge'">
          <p class="info-panel-label">
            Edge: <span style="color: white">{{ currentEdge.id }}</span>
          </p>
          <p class="info-panel-label">
            X: <span style="color: white">{{ currentEdge.DOMx }}</span>
          </p>
          <p class="info-panel-label">
            Y: <span style="color: white">{{ currentEdge.DOMy }}</span>
          </p>
        </div>

        <v-btn
          class="map-button"
          fab
          dark
          small
          color="baseAccent"
          outlined
          tile
          title="Edit"
          @click="editNode"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          class="map-button ml-4"
          fab
          dark
          small
          color="red"
          outlined
          tile
          title="Delete"
          @click="deleteFromMap"
          :loading="deleting"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>
      <div class="ss-preview">
        <SolarSystem :topic="getTopicById(this.currentNode.id)" :size="'0.25em'" />
        <v-btn
          class="view-ss-button pa-5 ma-5"
          dark
          small
          color="missionAccent"
          outlined
          tile
          title="Delete"
          @click="routeToSolarSystem"
          :loading="deleting"
        >
          View Solar System
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapGetters } from "vuex";

import SolarSystem from "../components/SolarSystem";

export default {
  name: "EditNode",
  components: {
    SolarSystem,
  },
  props: ["course", "coords"],
  async mounted() {
    // bind to store all topics for this course
    await this.$store.dispatch("bindTopics", this.currentCourseId);
  },
  data() {
    return {
      dialog: false,
      dialogTitle: "Edit something hmmm...",
      dialogDescription: "some kind of description",
      nodeDialogTitle: "Enter the name of this Solar System",
      nodeDialogDescription:
        "This Solar System is an Objective of the " +
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
    };
  },
  computed: {
    ...mapGetters(["getTopicById"]),
    getCoords() {
      return this.coords;
    },
  },
  methods: {
    cancel() {
      console.log("cancel");
      this.dialog = false;
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
    deleteFromMap() {
      console.log("delete");
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
      console.log("route to ss", this.currentNode.id)
      // save current topic to store
      this.$store.commit("setCurrentTopicId", this.currentNode.id);
      // route to topic/solar system
      this.$router.push({
        name: "SolarSystemView",
        params: {
          topicId: this.currentNode.id,
        },
      });
    }
  },
};
</script>

<style lang="scss" scoped>
.createNodeDialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}

.create-field {
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

.ss-info-panel {
  // background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  position: absolute;
  backdrop-filter: blur(8px);
  display: flex;
  z-index: 3;

  .ss-preview {
    border-left: 1px solid var(--v-missionAccent-base);
    min-width: 20vw;
    min-height: 20vh;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;


    .view-ss-button {
      position: absolute;
      bottom: 0;
      background-color: var(--v-background-base);
    }
  }
  .ss-details {
    padding: 20px;
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
</style>
