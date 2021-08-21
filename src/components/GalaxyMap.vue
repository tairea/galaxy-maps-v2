<template>
  <div>
    <network
      ref="network"
      :nodes="nodes"
      :edges="edges"
      :options="options"
      class="galaxy-map"
    ></network>

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
// demo: https://visjs.github.io/vis-network/examples/network/other/manipulation.html
// library: https://github.com/r3code/vue-vis-network
// docs: https://visjs.github.io/vis-network/docs/network/

import Vue from "vue";

import { Network } from "vue2vis";

// import "vue-vis-network/node_modules/vis-network/dist/vis-network.css";

Vue.component("network", Network);

export default {
  name: "GalaxyMap",
  props: [],

  data() {
    return {
      // randomly create some nodes and edges
      seed: 2,
      nodes: [
        { id: 0, label: 0, x: -147, y: -77 },
        { id: 1, label: 1, x: -186, y: 88 },
        { id: 2, label: 2, x: 8, y: 160 },
        { id: 3, label: 3, x: 159, y: 28 },
        { id: 4, label: 4, x: 45, y: -111 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 0, to: 3 },
        { from: 0, to: 4 },
        { from: 0, to: 4 },
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 1, to: 3 },
        { from: 2, to: 3 },
        { from: 2, to: 4 },
        { from: 3, to: 4 },
      ],
      options: {
        layout: { randomSeed: this.seed },
        manipulation: {
          enabled: true,
          initiallyActive: false,
          addNode: (data, callback) => {
            // filling in the popup DOM elements
            document.getElementById("operation").innerText = "Add Node";
            document.getElementById("node-id").value = data.id;
            document.getElementById("node-label").value = data.label;
            document.getElementById("saveButton").onclick = this.saveData(
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
        nodes: {
          physics: false,
        },
      },
      container: "",
    };
  },
  computed: {},
  methods: {
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

<style lang="scss" scoped>
.full {
  width: 100%;
  height: 100%;
}
.galaxy-map {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss" scoped>
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
