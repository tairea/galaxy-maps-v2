<template>
  <div class="component-container">
    <VisCanvas :currentCourseId="currentCourseId" @ready="init" />
  </div>
</template>

<script>
import VisCanvas from "../components/VisCanvas";
import Vue from 'vue'

import { mapState, mapGetters } from "vuex";

export default {
  name: "Vis",
  components: {
    VisCanvas,
  },
  props: ["currentCourseId"],
  mounted() {},
  data() {
    return {
      fab: "",
      newNode: {},
      newEdge: {},
    };
  },
  computed: {
    ...mapState(["currentCourseNodes","currentCourseNodes"]),
    // ...mapGetters([
    //   "getCourseById",
    //   "getTasksByCourseId",
    //   "getCohortsInThisCourse",
    // ]),
  },
  methods: {
    addNode() {
      console.log("addNode");
      //   this.newItem.set('node')
      this.net.addNodeMode();
    },
    addEdge() {
      //   this.newItem.set('edge')
      console.log("addEdge");
      this.net.addEdgeMode();
    },
    
    edit() {
      console.log("edit");
      this.new.enableEditMode();
    },
    stopEditMode() {
      console.log("stopEditMode");
      this.newItem.set();
      this.net.disableEditMode();
    },
    init({ container, net, nodes, edges }) {
      console.log("init triggered");
      console.log("container", container);
      console.log("net", net);
      console.log("nodes", nodes);
      console.log("edges", edges);
      this.net = net;
      this.nodes = nodes;
      this.edges = edges;
      // Save new positions if any missing
      //   this.commitUncommitedPositions();
      // Manipulation
      this.net.setOptions({
        manipulation: {
          enabled: false,
          addNode: async (node, callback) => {
            console.log("addNode", node);
            // commit node to store
            this.commitNode(node)
            
            // this.nodes.add(node)

            callback(); // Node will be added via reactivity from Vuex
            // const newItem = { ...this.newItem };
            // this.newItem.set();
            // node.group = newItem.type;
            // node.label = newItem.label;

            // if (!edited) {
            //   return;
            // }
            // item.x = edited.x;
            // item.y = edited.y;
            // const items = [item];
            // if (closestId != null) {
            //   const association = {
            //     id: randomUUID(),
            //   };
            //   if (
            //     nodePriorities.indexOf(item.type) >
            //     nodePriorities.indexOf(this.data.items[closestId].type)
            //   ) {
            //     association.from = closestId;
            //     association.to = edited.id;
            //   } else {
            //     association.from = edited.id;
            //     association.to = closestId;
            //   }
            //   items.push({
            //     id: association.id,
            //     type: "association",
            //     from: association.from,
            //     to: association.to,
            //   });
            // }
            // const ports = portAmounts[edited.group] || 0;
            // if (ports > 0) {
            //   const coords = this.generateOrganizedPortCoors(edited, ports);
            //   for (let i = 0; i < ports; ++i) {
            //     const port = {
            //       id: randomUUID(),
            //       label: `eth${i}`,
            //       group: "port",
            //       ...coords[i],
            //     };
            //     items.push({
            //       id: port.id,
            //       hostname: port.label,
            //       type: "port",
            //       ...coords[i],
            //     });
            //     const edge = {
            //       id: randomUUID(),
            //       from: edited.id,
            //       to: port.id,
            //     };
            //     items.push({
            //       id: edge.id,
            //       type: "association",
            //       from: edge.from,
            //       to: edge.to,
            //     });
            //   }
            // }
            // this.commit("replaceItems", items);
          },
          editNode: async (node, callback) => {
            console.log("editNode", node);
            // this.newItem.set();
            // await this.editItem(node);
            // callback();
          },
          addEdge: async (edge, callback) => {
            console.log("addEdge", edge);
            // callback(); // Edge will be added via reactivity from Vuex
            // this.orderNodes(edge);
            // const type = this.getEdgeType(edge);
            // if (this.isEdgeValid(edge, type)) {
            //   edge.id = edge.id || randomUUID();
            //   edge.group = type;
            //   edge.label = "";
            //   await this.editItem(edge);
            // }
            // this.newItem.set();
          },
          editEdge: async (edge, callback) => {
            console.log("editEdge", edge);
            //     this.orderNodes(edge);
            //     if (this.isEdgeValid(edge, this.getEdgeType(edge))) {
            //       await this.editItem(edge);
            //       callback();
            //     } else {
            //       callback();
            //     }
            //     this.newItem.set();
            //   },
          },
        },
      });
      // Events
      this.net.on("deselectNode", () => {
        console.log("deselectNode");
      });
      this.net.on("deselectEdge", () => {
        console.log("deselectEdge");
      });
      //   this.net.on("deselectEdge", deselectHandler.bind(null, this.net));
      this.net.on("doubleClick", async (event) => {
        if (event.nodes.length === 0 && event.edges.length === 1) {
          const id = event.edges[0];
          await this.editItem(this.edges.get(id));
        } else if (event.nodes.length === 1) {
          this.net.editNode();
        }
      });
      this.net.on("dragEnd", (event) => {
        console.log("dragEnd", event);
        // if (event.nodes.length > 0) {
        //   this.commitPositions(event.nodes);
        // }
      });
      this.net.on("dragStart", (event) => {
        console.log("dragStart", event);
        // if (event.nodes.length !== 1) {
        //   return;
        // }
        // const nodeItem = this.data.items[event.nodes[0]];
        // if (!(nodeItem.type === "host" || nodeItem.type === "switch")) {
        //   return;
        // }
        // const toSelect = new Set();
        // this.net.getSelectedEdges().forEach((edgeId) => {
        //   const edge = this.edges.get(edgeId);
        //   toSelect.add(edge.to);
        //   toSelect.add(edge.from);
        // });
        // const toSelectFiltered = [...toSelect].filter(
        //   (nodeId) => this.data.items[nodeId].type === "port"
        // );
        // if (toSelectFiltered.length) {
        //   this.net.selectNodes([event.nodes[0], ...toSelectFiltered]);
        // }
      });
      // URL changing events
      //   this.net.on("dragEnd", delayCall(this.updateURLPosition));
      //   this.net.on("select", delayCall(this.updateURLPosition));
      //   this.net.on("select", delayCall(this.updateURLSelection));
      //   this.net.on("zoom", delayCall(this.updateURLPosition, 200));
      // Focus items
      //   this.applyURL();
      // Set rectangular selection up
      //   const rs = new RectangularSelection(container, this.net, this.nodes, selectionTheme)
      //   rs.attach()
    },
    async editItem(node, commit) {
      console.log("editItem", node);
    },
    commitNode(node) {
      // this.$store.dispatch(`${type}`,payload)

      // push to nodes
      console.log("pushing to this.nodes")
      this.nodes.push(node)
      console.log("new this.nodes",this.nodes)

      // commit to store
      // this.$store.commit("addNodeToCurrentNodes",node)
    }
  },
};
</script>

<style lang="scss" scoped>
.component-container {
  height: 100%;
  width: 100%;
  border: solid yellow 1px;
  z-index: 3;
}
</style>
