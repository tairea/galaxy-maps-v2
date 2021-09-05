<template>
  <div ref="container" class="vis-container">
    <!-- :style="{ width: widthStyle, height: heightStyle }" -->
    <!-- <div ref="vis" class="vis-root" /> -->
    <network
      ref="network"
      class="full-height"
      :nodes="currentCourseNodes"
      :edges="currentCourseEdges"
      :options="options"
      />
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

// import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { Network } from "vue2vis";

export default {
  name: "VisCanvas",
  components: {},
  props: ["currentCourseId"],
  data() {
    return {
      width: null,
      height: null,
      cleanUpCallbacks: [],
    };
  },
  watch: {
    options(v) {
      this.net.setOptions(v);
    },
    
  },
  async mounted() {
    const container = this.$refs.container;
    const options = this.options;

    console.log("current course id:", this.currentCourseId);
    // bind nodes and edges in store
    await this.$store.dispatch("bindNodes", this.currentCourseId);
    await this.$store.dispatch("bindEdges", this.currentCourseId);

    // Create and fill datasets
    // const nodes = (this.nodes = new DataSet());
    // const edges = (this.edges = new DataSet());
    // const nodes = (this.nodes = this.currentCourseNodes);
    // const edges = (this.edges = this.currentCourseEdges);

    // It's necessary to load the items now, otherwise the network would be labeld as ready before the items are visible.
    // this.replaceItems();
    // Create the network
    // const net = new Network(this.$refs.vis, { nodes, edges }, options);
    // const net = this.$refs.network
    // this.net = net;
    //
    // this.$emit("ready", { container, net, nodes, edges });
  },
  computed: {
    ...mapState(["currentCourseNodes", "currentCourseEdges"]),
    options() {
      return {
        physics: {
          enabled: false,
        },
        nodes: {
          // Invisible border, 0 makes selected border dissapear
          borderWidth: 0.0001,
          borderWidthSelected: 2,
          font: {
            align: "center",
            color: "white",
            face: "Source Sans Pro",
            strokeWidth: 0,
          },
          shapeProperties: {
            borderRadius: 6,
            useBorderWithImage: true,
          },
          scaling: {
            label: {
              // Don't hide labels while zooming in too much (useful for image export)
              maxVisible: Number.MAX_SAFE_INTEGER,
            },
          },
        },
        edges: {
          smooth: false,
          font: {
            align: "top",
            color: "grey",
            face: "Source Sans Pro",
            strokeWidth: 0,
          },
        },
        interaction: {
          hover: true,
          navigationButtons: false,
          keyboard: false,
        },
        manipulation: {
          enabled: false,
        },
        groups: {
          locked: {
            // shape: "image",
            shape: "icon",
            color: "grey",
            size: 15,
            // image: this.theme.images.controller,
            icon: "lock-closed-outline",
          },
          unlocked: {
            shape: "dot",
            color: "#69A1E2",
            font: {
              // color: this.theme.foreground,
              // face: "Source Code Pro",
              // align: "left",
            },
            borderWidth: 1,
          },
          completed: {
            shape: "icon",
            color: "#00E676",
            icon: "checkmark-circle-outline",
          },
        },
      };
    },

    // widthStyle() {
    //   return this.width == null ? undefined : `${this.width}px`;
    // },
    // heightStyle() {
    //   return this.height == null ? undefined : `${this.height}px`;
    // },
  },
  methods: {
   
  },
};
</script>

<style lang="scss" scoped>
.vis-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.vis-container > * {
  position: absolute;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
}
</style>
