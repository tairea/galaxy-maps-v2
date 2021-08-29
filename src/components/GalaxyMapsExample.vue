<template>
  <div class="full-height">
    <network
      ref="network"
      class="full-height"
      :nodes="currentCourseNodes"
      :edges="currentCourseEdges"
      :options="network.options"
      @click="click()"
      @double-click="doubleClick"
      @oncontext="networkEvent('oncontext')"
      @hold="networkEvent('hold')"
      @release="networkEvent('release')"
      @select="networkEvent('select')"
      @select-node="networkEvent('selectNode')"
      @select-edge="networkEvent('selectEdge')"
      @deselect-node="networkEvent('deselectNode')"
      @deselect-edge="networkEvent('deselectEdge')"
      @drag-start="networkEvent('dragStart')"
      @dragging="networkEvent('dragging')"
      @drag-end="dragEnd"
      @hover-node="networkEvent('hoverNode')"
      @blur-node="networkEvent('blurNode')"
      @hover-edge="networkEvent('hoverEdge')"
      @blur-edge="networkEvent('blurEdge')"
      @zoom="networkEvent('zoom')"
      @show-popup="networkEvent('showPopup')"
      @hide-popup="networkEvent('hidePopup')"
      @start-stabilizing="networkEvent('startStabilizing')"
      @stabilization-progress="networkEvent('stabilizationProgress')"
      @stabilization-iterations-done="
        networkEvent('stabilizationIterationsDone')
      "
      @stabilized="networkEvent('stabilized')"
      @resize="resize()"
      @animation-finished="networkEvent('animationFinished')"
      @config-change="networkEvent('configChange')"
      @nodes-mounted="networkEvent('nodes-mounted')"
      @nodes-add="addNode"
      @nodes-update="updateNode"
      @nodes-remove="deleteNode"
      @edges-mounted="networkEvent('edges-mounted')"
      @control-node-dragging="networkEvent('control node dragging')"
      @control-node-drag-end="networkEvent('control node drag end')"
      @edges-add="addEdge"
      @edges-update="updateEdge"
      @edges-remove="deleteEdge"
    ></network>

    <v-dialog v-model="dialog" width="40%" light>
      <h2>{{ dialogTitle }}</h2>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="createNodeDialog">
        <!-- Node ID -->
        <!-- <div class="create-field">
          <v-text-field
            label="Node ID"
            color="missionAccent"
            v-model="newNodeData.id"
          ></v-text-field>
        </div> -->
        <!-- Node Label -->
        <div class="create-field">
          <v-text-field
            v-if="editingType == 'edge'"
            label="Edge ID"
            color="missionAccent"
            v-model="newEdgeData.id"
            :autofocus="!editing"
          ></v-text-field>
          <v-text-field
            v-else
            label="Node Name"
            color="missionAccent"
            v-model="newNodeData.label"
            :autofocus="!editing"
          ></v-text-field>
        </div>

        <div class="tile saveButton">
          <!-- SAVE -->
          <v-btn
          v-if="!editingType == 'edge' || editingType == ''"
            outlined
            color="green darken-1"
            @click="saveNode(newNodeData)"
            class="mr-2"
            :loading="loading"
          >
            <v-icon left>
              mdi-check
            </v-icon>
            SAVE
          </v-btn>
          <!-- DELETE -->
          <v-btn
            v-if="editing"
            outlined
            color="error"
            @click="deleteFromMap()"
            class="mr-2"
            :loading="deleting"
          >
            <v-icon left>
              mdi-delete
            </v-icon>
            DELETE
          </v-btn>
          <!-- CANCEL -->
          <v-btn outlined color="primary" class="ml-2" @click="cancel">
            <v-icon left>
              mdi-close
            </v-icon>
            Cancel
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import { Network } from "vue2vis";

import { db } from "../store/firestoreConfig";

import "vue2vis/dist/vue2vis.css";

import { mapState, mapGetters } from "vuex";

export default {
  data: () => ({
    nowActive: false,
    dialog: false,
    dialogTitle: "",
    loading: false,
    deleting: false,
    editing: false,
    editingType: "",
    newNodeData: {
      id: "",
      label: "",
      x: "",
      y: "",
    },
    newEdgeData: {
      id: "",
      from: "",
      to: "",
    },

    // nodes: [
    //   { id: 1, label: "Node 1" },
    //   { id: 2, label: "Node 2" },
    //   {
    //     id: 3,
    //     label: "Node 3. Picture clipped",
    //     shape: "image",
    //     image: require("@/assets/svgIcons/star-plus.svg"),
    //     imagePadding: 4,
    //     size: 25,
    //   },
    //   {
    //     id: 4,
    //     label: "Node 4 with PNG picture",
    //     shape: "image",
    //     image: require("@/assets/svgIcons/star-plus.svg"),
    //     imagePadding: { top: 10, right: 15, left: 15, bottom: 10 },
    //     shapeProperties: { useImageSize: true },
    //   },
    //   {
    //     id: 5,
    //     label: "Node 5 with SVG picture",
    //     shape: "image",
    //     image: require("@/assets/logo.svg"),
    //     imagePadding: 5,
    //     shapeProperties: { useImageSize: false },
    //   },
    // ],
    // edges: [
    //   { id: 1, from: 1, to: 3 },
    //   { id: 2, from: 1, to: 2 },
    //   { id: 3, from: 2, to: 4 },
    //   { id: 4, from: 2, to: 5 },
    //   { id: 5, from: 3, to: 3 },
    // ],

    networkEvents: "",

    network: {
      options: {
        physics: {
          enabled: false,
          solver: "repulsion",
          repulsion: {
            nodeDistance: 200, // Put more distance between the nodes.
          },
        },
        edges: {
          length: 50, // Longer edges between nodes.
          smooth: false,
        },
        nodes: {
          shape: "dot",
          size: 7,
          color: {
            border: "grey",

            highlight: {
              border: "black",
              background: "white",
            },
            hover: {
              border: "orange",
              background: "grey",
            },
          },
          font: { color: "white" },
          // shapeProperties: {
          //   useBorderWithImage: true,
          // },
          scaling: {
            // min: 10,
            // max: 30,
            label: {
              enabled: true,
              // min: 14,
              // max: 30,
              maxVisible: 20,
              // drawThreshold: 5,
            },
            // customScalingFunction: function(min, max, total, value) {
            //   if (max === min) {
            //     return 0.5;
            //   } else {
            //     let scale = 1 / (max - min);
            //     return Math.max(0, (value - min) * scale);
            //   }
            // },
          },
        },
        manipulation: {
          enabled: true,
          initiallyActive: false,
        },
      },
    },
  }),
  components: {
    Network,
  },
  mounted() {
    console.log("current course id:", this.currentCourseId);
    this.$store.dispatch("bindNodes", this.currentCourseId);
    this.$store.dispatch("bindEdges", this.currentCourseId);
    console.log("nodes:", this.currentCourseNodes);
    // console.log("edges:", this.currentCourseEdges);
    console.log(this.$refs.network);
  },
  computed: {
    ...mapState([
      "currentCourseId",
      "currentCourseNodes",
      "currentCourseEdges",
    ]),
    bindLabel() {
      const label =
        this.editingType == "node"
          ? this.newNodeData.label
          : this.newEdgeData.id;
      console.log("label", label);
      return label;
    },
    // ...mapGetters(["getGalaxyMapByCourseId"]),
  },
  methods: {
    //      @before-drawing="drawBg"   //removed event
    // drawBg(ctx) {
    //   let mapBgWidth = document.getElementById("scream").width;
    //   let mapBgHeight = document.getElementById("scream").height;
    //   ctx.drawImage(
    //     document.getElementById("scream"),
    //     -mapBgWidth / 2,
    //     -mapBgHeight / 2
    //   );
    // },
    networkEvent(eventName) {
      console.log(eventName);
      if (eventName == "nodes-add") {
        // this.addNode()
      }
    },
    // =========== UI EVENT METHODS ===========

    click() {
      console.log("click");
      this.nowActive = true;
    },
    resize() {
      console.log("resize");
      // resive event used as loaded flag
      this.nowActive = true;
    },
    doubleClick(data) {
      console.log("double click");
      console.log(data);
      // if double click an exisiting node. edit node
      if (data.nodes[0]) {
        this.editing = true;
        console.log("node double-clicked");
        const nodeId = data.nodes[0];
        this.newNodeData = this.$refs.network.getNode(nodeId);
        console.log("selected node", this.newNodeData);
        this.editingType = "node";
        this.dialogTitle = "Edit Node";
        this.dialog = true;
      }
      // if double click an exisiting edge. edit edge
      else if (data.edges[0] && !data.nodes[0]) {
        this.editing = true;
        console.log("edge double-clicked");
        const edgeId = data.edges[0];
        this.newEdgeData = this.$refs.network.getEdge(edgeId);
        console.log("selected edge", this.newEdgeData);
        this.editingType = "edge";
        this.dialogTitle = "Delete Edge";
        this.dialog = true;
      } else {
        // nothing double clicked
        console.log("nothing double-clicked");
        this.$refs.network.addNodeMode();
      }
    },
    cancel(data) {
      // delete new node if not in Database (removing node that never got saved (ie. cancelled))
      const doesNodeExist = this.currentCourseNodes.filter(
        (node) => node.id === this.newNodeData.id
      );
      if (!doesNodeExist.length > 0) {
        // console.log("doesnt exists");
        // this.$refs.network.disableEditMode();
        this.$refs.network.deleteSelected(this.newNodeData.id);
        console.log("why cancel no delete!!! :( ");
      }
      this.dialog = false;
      this.editingType = "";
    },
    dragEnd(data) {
      console.log("drag end:", data);
      // only get positions if a node is dragged
      if (data.nodes[0]) {
        const nodeId = data.nodes[0];
        const position = this.$refs.network.getPositions(data.nodes[0]);
        console.log("after drag position", position[nodeId]);
        // update node position in DB
        db.collection("courses")
          .doc(this.currentCourseId)
          .collection("map-nodes")
          .doc(nodeId)
          .update({
            x: position[nodeId].x,
            y: position[nodeId].y,
          })
          .then(() => {
            console.log("Node position successfully updated!");
          })
          .catch((error) => {
            console.error("Error writing node position: ", error);
          });
      }
    },
    // =========== ADD METHODS ===========
    addNode(data) {
      this.newNodeData = {};
      this.editing = false;
      // prevents dialog opening when nodes first load. wait till nowActive by clicking on canvas
      if (this.nowActive == true) {
        this.dialog = true;
      }
        this.dialogTitle = "New Node";
      console.log("addNode");
      console.log(data);
      const nodeId = data.properties.items[0];
      this.newNodeData.id = nodeId;
      const position = this.$refs.network.getPositions(nodeId);
      this.newNodeData.x = position[nodeId].x;
      this.newNodeData.y = position[nodeId].y;
      console.log("this.newNodeData", this.newNodeData);
      // this.newNodeData.id = new Date().getTime()
      // this.$refs.network.stabilize();
    },
    addEdge(data) {
      // console.log("edge is nowActive?", this.nowActive)
      if (this.nowActive) {
        console.log("adding edge");
        this.newEdgeData = this.$refs.network.getEdge(data.properties.items[0]);
        console.log("new edge info:", this.newEdgeData);
        db.collection("courses")
          .doc(this.currentCourseId)
          .collection("map-edges")
          .doc(this.newEdgeData.id)
          .set(this.newEdgeData)
          .then(() => {
            console.log("Edge successfully written!");
          })
          .catch((error) => {
            console.error("Error writing node: ", error);
          });
        this.newEdgeData = {};
      }
      // this.nowActive = false
    },
    // =========== SAVE METHODS ===========
    saveNode(data) {
      this.loading = true;
      this.newNodeData.id = data.id;
      this.newNodeData.label = data.label;
      console.log("newNodeData node data:", this.newNodeData);
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("map-nodes")
        .doc(this.newNodeData.id)
        .set(this.newNodeData)
        .then((docRef) => {
          console.log("Node successfully written!");
          this.loading = false;
          this.dialog = false;
        })
        .catch((error) => {
          console.error("Error writing node: ", error);
        });
    },
    saveEdge(data) {
      console.log("saving Edge data:", data);
    },
    // =========== DELETE METHODS ===========
    deleteFromMap() {
      if (this.editingType == "node") {
        this.deleteNode();
      } else if (this.editingType == "edge") {
        this.deleteEdge();
      }
      this.resetEditing()
      this.resetNewData()
    },
    deleteNode(data) {
      console.log("deleteNode data:", data);
      if (this.nowActive) {
        this.deleting = true;
        db.collection("courses")
          .doc(this.currentCourseId)
          .collection("map-nodes")
          .doc(this.newNodeData.id)
          .delete()
          .then(() => {
            console.log("Node successfully deleted!");
            this.deleting = false;
            this.dialog = false;
          })
          .catch((error) => {
            console.error("Error deleting node: ", error);
          });
      }
      // this.nowActive = false;
    },
    deleteEdge(data) {
      console.log("deleteEdge");
      if (this.nowActive) {
        this.deleting = true;
        db.collection("courses")
          .doc(this.currentCourseId)
          .collection("map-edges")
          .doc(this.newEdgeData.id)
          .delete()
          .then(() => {
            console.log("Edge successfully deleted!");
            this.deleting = false;
            this.dialog = false;
          })
          .catch((error) => {
            console.error("Error deleting edge: ", error);
          });
      }
      // this.nowActive = false;
    },
    // =========== UPDATE METHODS ===========
    updateNode(data) {
      console.log("updateNode data:", data);
      // this.$refs.network.stabilize();
    },
    updateEdge(data) {
      console.log("updateEdge data:", data);
      this.$refs.network.redraw();
    },
    // =========== RESET METHODS ===========
     resetEditing() {
      this.editing = false
      this.editingType = ""
    },
    resetNewData() {
      this.newNodeData = {}
      this.newEdgeData = {}
    }
  },
};
</script>

<style lang="scss">
.full-height {
  width: 100%;
  height: 100%;
}

div.vis-network div.vis-edit-mode {
  top: 20px !important;
  left: 0px !important;

  div.vis-button.vis-edit {
    // ICON
    /* svg in css: https://stackoverflow.com/questions/10768451/inline-svg-in-css */
    background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0MjQyNDIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjE2IDMgMjEgOCA4IDIxIDMgMjEgMyAxNiAxNiAzIj48L3BvbHlnb24+PC9zdmc+");
    background-position: 4px 3px;
    // LABEL
    margin: 0px !important;
    background-color: var(--v-missionAccent-base) !important;
    border: none !important;
    text-transform: uppercase;
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 0px 5px 0px 0px !important;
    border-radius: 0px !important;

    .vis-label {
      color: var(--v-background-base);
    }
  }
}

div.vis-network div.vis-manipulation {
  top: auto !important;
  bottom: 0px !important;
  background: var(--v-missionAccent-base) !important;
  border: none !important;

  .vis-label {
    color: var(--v-background-base);
    text-transform: uppercase;
    font-family: Arial, Helvetica, sans-serif !important;
  }

  .vis-add {
    background-image: url("../assets/svgIcons/star-plus.svg") !important;
  }

  .vis-connect {
    background-image: url("../assets/svgIcons/vector-polyline-edit.svg") !important;
  }
}

.vis-separator-line {
  display: none !important;
}

// from manipulation example
#operation {
  font-size: 28px;
}

.createNodeDialog {
  color: var(--v-missionAccent-base);
  background: lightGrey;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}

.create-field {
  // width: 33.33%;
  height: 200px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: var(--v-missionAccent-base);
  padding: 20px;
  text-transform: uppercase;
  font-size: 0.6rem;
  // border: 1px solid var(--v-missionAccent-base);
}
</style>
