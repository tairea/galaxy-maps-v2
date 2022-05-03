<template>
  <div class="d-flex flex-column map-buttons">
    <div class="d-inline-flex">
      <v-btn
        class="map-button"
        :color="!addNodeMode ? 'missionAccent' : 'baseAccent'"
        fab
        dark
        small
        outlined
        tile
        title="Add Node"
        @click="toggleAddNodeMode"
      >
        <v-icon v-if="!addNodeMode">mdi-dots-hexagon</v-icon>
        <v-icon v-else color="baseAccent">mdi-close</v-icon>
      </v-btn>
      <div class="ui-message-wrap">
        <p v-if="!editMode" class="ui-message pt-4 ml-n1">
          <v-icon color="missionAccent" class="bounce"
            >mdi-hand-pointing-left</v-icon
          >
          Add a new node to extend your Galaxy map
        </p>
        <p v-else class="ui-message active">{{ uiMessage }}</p>
      </div>
    </div>

    <!-- Add edge button -->
    <v-btn
      class="map-button"
      :color="!addEdgeMode ? 'missionAccent' : 'baseAccent'"
      fab
      dark
      small
      outlined
      tile
      title="Add Edge"
      @click="toggleAddEdgeMode"
    >
      <v-icon v-if="!addEdgeMode">mdi-chart-timeline-variant</v-icon>
      <v-icon v-else color="baseAccent">mdi-close</v-icon>
    </v-btn>

    <!-- New node positions Save Button -->
    <v-btn
      v-if="editMode && changeInPositions"
      class="map-button pa-5"
      color="baseAccent"
      dark
      small
      outlined
      tile
      title="Save new node positions"
      @click="saveNodePositions"
      :loading="nodePositionsChangeLoading"
    >
      Save new positions
    </v-btn>
  </div>
</template>

<script>
export default {
  name: "GalaxyMapButtons",
  components: {},
  props: [
    "addNodeMode",
    "addEdgeMode",
    "changeInPositions",
    "nodePositionsChangeLoading",
    "uiMessage",
  ],
  async mounted() {},
  data() {
    return {};
  },
  computed: {
    editMode() {
      return this.addNodeMode || this.addEdgeMode;
    },
  },
  methods: {
    toggleAddNodeMode() {
      this.$emit("toggleAddNodeMode");
    },
    toggleAddEdgeMode() {
      this.$emit("toggleAddEdgeMode");
    },
    saveNodePositions() {
      this.$emit("saveNodePositions");
    },
  },
};
</script>

<style lang="scss" scoped>
.map-buttons {
  position: fixed;
  top: 20px;
  left: 25%;
  z-index: 2;
  width: auto;

  .map-button {
    margin: 10px;
    background-color: var(--v-background-base);
  }

  .ui-message-wrap {
    // border: 1px solid var(--v-missionAccent-base);

    .ui-message {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      text-align: left;
      margin-left: 10px;
    }
    .active {
      color: var(--v-baseAccent-base) !important;
    }
  }
}
</style>
