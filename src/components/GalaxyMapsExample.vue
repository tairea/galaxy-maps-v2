<template>
<div class="full-height">
    <network
      ref="network"
      class="full-height"
      :nodes="network.nodes"
      :edges="network.edges"
      :options="network.options"
      @click="networkEvent('click')"
      @double-click="networkEvent('doubleClick')"
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
      @drag-end="networkEvent('dragEnd')"
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
      @resize="networkEvent('resize')"
      @init-redraw=""

      @after-drawing=""
      @animation-finished="networkEvent('animationFinished')"
      @config-change="networkEvent('configChange')"
      @nodes-mounted="networkEvent('nodes-mounted')"
      @nodes-add="networkEvent('nodes-add')"
      @nodes-update="networkEvent('nodes-update')"
      @nodes-remove="networkEvent('nodes-remove')"
      @edges-mounted="networkEvent('edges-mounted')"
      @edges-add="networkEvent('edges-add')"
      @edges-update="networkEvent('edges-update')"
      @edges-remove="networkEvent('edges-remove')"
    ></network>
    <!-- <img
      id="scream"
      src="@/assets/logo.png"
      style="display: none;"
      alt="Noth Pole"
    /> -->

    <!-- EXAMPLE BUTTONS -->
    <!-- <div class="mt-8">
      <v-btn @click="addNode" class="ma-1" small>Add node</v-btn>
      <v-btn @click="addEdge" class="ma-1" small>Add edge</v-btn>
      <v-btn @click="resetNetwork" class="ma-1" small>Reset Network</v-btn>
      <v-btn @click="removeNode" class="ma-1" small>Remove Node</v-btn>
      <v-btn @click="removeEdge" class="ma-1" small>Remove Edge</v-btn>
    </div> -->
    <div id="network-popUp">
      <span id="operation">node</span> <br />
      <table style="margin: auto">
        <tbody>
          <tr>
            <td>id</td>
            <td><input id="node-id" value="new value" /></td>
          </tr>
          <tr>
            <td>label</td>
            <td><input id="node-label" value="new value" /></td>
          </tr>
        </tbody>
      </table>
      <input type="button" value="save" id="saveButton" />
      <input type="button" value="cancel" id="cancelButton" />
    </div>

</div>
</template>

<script>

import { Network } from "vue2vis";
import "vue2vis/dist/vue2vis.css";

let defNodes = [
  { id: 1, label: "Node 1" },
  { id: 2, label: "Node 2" },
  {
    id: 3,
    label: "Node 3. Picture clipped",
    shape: "image",
    image: require("@/assets/svgIcons/star-plus.svg"),
    imagePadding: 4,
    size: 25,
  },
  {
    id: 4,
    label: "Node 4 with PNG picture",
    shape: "image",
    image: require("@/assets/svgIcons/star-plus.svg"),
    imagePadding: { top: 10, right: 15, left: 15, bottom: 10 },
    shapeProperties: { useImageSize: true },
  },
  {
    id: 5,
    label: "Node 5 with SVG picture",
    shape: "image",
    image: require("@/assets/logo.svg"),
    imagePadding: 5,
    shapeProperties: { useImageSize: false },
  },
];
let defEdges = [
  { id: 1, from: 1, to: 3 },
  { id: 2, from: 1, to: 2 },
  { id: 3, from: 2, to: 4 },
  { id: 4, from: 2, to: 5 },
  { id: 5, from: 3, to: 3 },
];
export default {
  data: () => ({
    networkEvents: "",
    network: {
      nodes: defNodes.slice(0),
      edges: defEdges.slice(0),
      options: {
        physics: {
          enabled: false,
        },
        nodes: {
          shape: "circle",
          size: 24,
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
          font: { color: "black" },
          shapeProperties: {
            useBorderWithImage: true,
          },
        },
        manipulation: {
          enabled: true,
          initiallyActive: false,
          addNode: (data, callback) => {
            // filling in the popup DOM elements
            document.getElementById("operation").innerText = "Add Node";
            document.getElementById("node-id").value = data.id;
            document.getElementById("node-label").value = data.label;
            document.getElementById("saveButton").onclick = saveData.bind(
                this,
              data,
              callback
            );
            document.getElementById("cancelButton").onclick = this.clearPopUp();
            document.getElementById("network-popUp").style.display = "block";
          },
          editNode: (data, callback) => {
            // filling in the popup DOM elements
            document.getElementById("operation").innerText = "Edit Node";
            document.getElementById("node-id").value = data.id;
            document.getElementById("node-label").value = data.label;
            document.getElementById("saveButton").onclick = this.saveData.bind(
              this,
              data,
              callback
            );
            document.getElementById("cancelButton").onclick = cancelEdit.bind(
              this,
              callback
            );
            document.getElementById("network-popUp").style.display = "block";
          },
          addEdge: (data, callback) => {
            if (data.from == data.to) {
              var r = confirm("Do you want to connect the node to itself?");
              if (r == true) {
                callback(data);
              }
            } else {
              callback(data);
            }
          },
        },
      },
    },
  }),
  components: {
    Network,
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
    },

    // EXAMPLE FUNCTIONS
    // addNode() {
    //   const id = new Date().getTime();
    //   this.network.nodes.push({ id, label: "New node" });
    // },
    // addEdge() {
    //   const n1 = Math.floor(Math.random() * this.network.nodes.length);
    //   const n2 = Math.floor(Math.random() * this.network.nodes.length);
    //   this.network.edges.push({
    //     id: `${this.network.nodes[n1].id}-${this.network.nodes[n2].id}`,
    //     from: this.network.nodes[n1].id,
    //     to: this.network.nodes[n2].id,
    //   });
    // },
    // resetNetwork() {
    //   this.network = {
    //     nodes: defNodes.slice(0),
    //     edges: defEdges.slice(0),
    //     options: {},
    //   };
    // },
    // removeNode() {
    //   this.network.nodes.splice(0, 1);
    // },
    // removeEdge() {
    //   this.network.edges.splice(0, 1);
    // },

    clearPopUp() {
      document.getElementById("saveButton").onclick = null;
      document.getElementById("cancelButton").onclick = null;
      document.getElementById("network-popUp").style.display = "none";
    },

    cancelEdit(callback) {
      clearPopUp();
      callback(null);
    },

    saveData(data, callback) {
      data.id = document.getElementById("node-id").value;
      data.label = document.getElementById("node-label").value;
      clearPopUp();
      callback(data);
    },
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
#network-popUp {
  display: none;
  position: absolute;
  top: 350px;
  left: 170px;
  z-index: 299;
  width: 250px;
  height: 120px;
  background-color: #f9f9f9;
  border-style: solid;
  border-width: 3px;
  border-color: #5394ed;
  padding: 10px;
  text-align: center;
}
</style>
