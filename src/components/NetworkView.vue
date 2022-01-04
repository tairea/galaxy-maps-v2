<template>
  <div>
    <network
      ref="network"
      class="full-height"
      :nodes="nodes"
      :edges="edges"
      :options="network.options"
      @zoom="$emit(zoom)"
      @click="$emit(click)"
      @hover-node="$emit(hoverNode)"
    ></network>
  </div>
</template>
<script>
import { Network } from "vue2vis";
import "vue2vis/dist/vue2vis.css";

import { mapState, mapGetters } from "vuex";

export default {
  name: "NetworkView",
  props: ['nodes', 'edges', 'network'],
  components: {
    Network
  },
  data () {
    return {

    }
  },
}
</script>
<style scoped>
.full-height {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>