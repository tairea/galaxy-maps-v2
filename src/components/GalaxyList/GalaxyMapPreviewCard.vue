<template>
  <div class="preview-container" @click="goToGalaxyView">
    <network
      v-if="nodes.length"
      ref="network"
      class="preview-height"
      :nodes="nodes"
      :edges="edges"
      :options="networkOptions"
      @hook:updated="networkUpdated"
    ></network>
  </div>
</template>

<script>
import Network from "@/vue2vis/Network.vue";
import "vis-network/styles/vis-network.css";
import { db } from "@/store/firestoreConfig";

export default {
  name: "GalaxyMapPreviewCard",
  props: {
    course: {
      type: Object,
      required: true,
    },
  },
  components: {
    Network,
  },
  data: () => ({
    nodes: [],
    edges: [],
    baseOptions: {
      physics: {
        enabled: false,
      },
      edges: {
        smooth: false,
        color: {
          inherit: "to",
        },
      },
      nodes: {
        shape: "dot",
        fixed: {
          x: true,
          y: true,
        },
        color: {
          border: "grey",
          background: "#69A1E2",
        },
        font: {
          color: "white",
          size: 0,
        },
      },
      interaction: {
        dragNodes: false,
        dragView: false,
        zoomView: false,
        hover: false,
        selectable: false,
        selectConnectedEdges: false,
      },
    },
  }),
  computed: {
    networkOptions() {
      const dimensions = this.calculateMapDimensions();
      const nodeSize = this.calculateNodeSize(dimensions);

      //   console.log(`Map ${this.course.id}:`, {
      //     dimensions,
      //     nodeSize,
      //   });

      return {
        ...this.baseOptions,
        nodes: {
          ...this.baseOptions.nodes,
          //   size: nodeSize,
          size: nodeSize,
        },
        edges: {
          ...this.baseOptions.edges,
          width: this.calculateEdgeWidth(nodeSize),
        },
      };
    },
  },
  watch: {
    course: {
      handler(newCourse) {
        if (newCourse) {
          this.loadMapData();
        }
      },
      immediate: true,
    },
  },
  methods: {
    async loadMapData() {
      try {
        const nodesSnapshot = await db
          .collection("courses")
          .doc(this.course.id)
          .collection("map-nodes")
          .get();

        this.nodes = nodesSnapshot.docs.map((doc) => {
          const data = doc.data();
          if (
            typeof data.x !== "number" ||
            typeof data.y !== "number" ||
            isNaN(data.x) ||
            isNaN(data.y)
          ) {
            console.error(
              `Invalid node position in course ${this.course.id}, node ${doc.id}:`,
              data,
            );
            return {
              id: doc.id,
              ...data,
              x: data.x || 0,
              y: data.y || 0,
            };
          }
          return {
            id: doc.id,
            ...data,
          };
        });

        const edgesSnapshot = await db
          .collection("courses")
          .doc(this.course.id)
          .collection("map-edges")
          .get();

        this.edges = edgesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (this.$refs.network) {
          this.$refs.network.redraw();
        }
      } catch (error) {
        console.error("Error loading map data:", error);
      }
    },

    calculateMapDimensions() {
      if (!this.nodes.length) return { width: 0, height: 0, nodeCount: 0 };

      let minX = Infinity,
        maxX = -Infinity;
      let minY = Infinity,
        maxY = -Infinity;

      this.nodes.forEach((node) => {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      });

      const width = maxX - minX;
      const height = maxY - minY;
      const area = width * height;
      const density = this.nodes.length / area;

      return {
        width,
        height,
        area,
        nodeCount: this.nodes.length,
        density,
      };
    },

    calculateNodeSize(dimensions) {
      if (!dimensions.area) return 4;

      //   console.log(`Calculating node size for course ${this.course.id}:`, {
      //     dimensions,
      //     nodeCount: dimensions.nodeCount,
      //     area: dimensions.area,
      //     density: dimensions.density,
      //   });

      // Reference values from medium map
      const MEDIUM_AREA = 888592;
      const MEDIUM_DENSITY = 0.000011253;
      const MEDIUM_NODE_COUNT = 10;
      const MEDIUM_SIZE = 20;

      // For very small maps (increase base sizes)
      if (dimensions.nodeCount <= 15) {
        if (dimensions.nodeCount <= 3) return 12;
        if (dimensions.nodeCount <= 8) return 10;
        return 8;
      }

      // Calculate factors with safety checks
      const areaFactor = Math.max(0.1, Math.pow(dimensions.area / MEDIUM_AREA, 0.33));
      const densityFactor = Math.max(
        0.1,
        Math.pow(MEDIUM_DENSITY / (dimensions.density || MEDIUM_DENSITY), 0.25),
      );
      const nodeCountFactor = Math.max(
        0.1,
        Math.log(dimensions.nodeCount) / Math.log(MEDIUM_NODE_COUNT),
      );

      let size = MEDIUM_SIZE * areaFactor * densityFactor * nodeCountFactor;

      //   console.log(`Size calculation factors for ${this.course.id}:`, {
      //     areaFactor,
      //     densityFactor,
      //     nodeCountFactor,
      //     calculatedSize: size,
      //   });

      // Ensure size is positive and within bounds
      return Math.max(20, Math.min(60, size));
    },

    calculateEdgeWidth(nodeSize) {
      // For small maps (increased proportion)
      if (nodeSize <= 12) {
        // Adjusted threshold
        return nodeSize * 0.5; // Increased from 0.4
      }

      // For medium to large maps, constant width
      return 10;
    },

    networkUpdated() {
      if (this.$refs.network && this.nodes.length) {
        this.zoomToFit();
      }
    },

    zoomToFit() {
      const nodeIds = this.nodes.map((node) => node.id);
      this.$refs.network.fit({
        nodes: nodeIds,
        animation: false,
      });
    },

    goToGalaxyView() {
      this.$router.push({
        name: "GalaxyView",
        params: {
          courseId: this.course.id,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.preview-container {
  width: 100%;
  height: 100%;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    scale: 1.1;
  }
}

.preview-height {
  width: 100%;
  height: 100%;
}
</style>
