<template>
  <div class="edgeInfoPanel" :style="selectedEdge ? 'right: 0px' : ''">
    <div class="panelContent">
      <div class="panelContentInner" v-if="selectedEdge">
        <!-- <v-btn
          icon
          small
          color="missionAccent"
          class="close-button mt-2"
          @click="closeInfoPanel" 
        >
          <v-icon>{{mdiClose}}</v-icon>
        </v-btn>
        <div class="topicTitleContainer">
          <p class="topicTitle overline">Delete Edge?</p>
        </div> -->
        <div class="card-container">
          <p class="deleteEdge">Would you like to delete this edge?</p>
          <div class="d-flex">
            <v-btn
              class="edgeButtons pa-5"
              dark
              small
              color="error"
              outlined
              tile
              @click="deleteEdge"
              :loading="deleting"
            >
              Delete Edge
            </v-btn>
            <v-btn
              class="edgeButtons pa-5"
              dark
              small
              color="white"
              outlined
              tile
              @click="closeInfoPanel"
            >
              Cancel
            </v-btn>
          </div>
        </div>
        <!-- <div class="bottom">
         
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "@/store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "EdgeInfoPanel",
  props: ["selectedEdge"],
  components: {},
  data() {
    return {
      deleting: false,
    };
  },
  async mounted() {
    // console.log("selected edge is:", this.inselectedEdge);
  },
  computed: {
    ...mapState(["currentCourseId"]),
  },
  methods: {
    closeInfoPanel() {
      this.$emit("closeInfoPanel");
    },
    deleteEdge() {
      this.deleting = true;
      db.collection("courses")
        .doc(this.currentCourseId)
        .collection("map-edges")
        .doc(this.selectedEdge.id)
        .delete()
        .then(() => {
          console.log("Edge successfully deleted!");
          this.deleting = false;
          this.closeInfoPanel();
        })
        .catch((error) => {
          console.error("Error deleting edge: ", error);
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.edgeInfoPanel {
  background: var(--v-background-darken1);
  width: 350px;
  height: 300px;
  position: fixed;
  top: calc(50% - 150px);
  right: -350px;
  transition: all 0.3s ease-out;
  z-index: 200;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 95%);

  .panelContent {
    height: calc(100% - 40px);
    width: auto;
    margin: 20px 0px 30px 20px;
    background: var(--v-missionAccent-base);
    margin-right: -2px;
    position: relative;

    .panelContentInner {
      position: relative;
      height: 99%;
      width: 99.5%;
      overflow-y: hidden;
      overflow-x: hidden;

      .topicTitleContainer {
        border-bottom: 1px solid var(--v-missionAccent-base);
        display: flex;
      }

      .topicTitle {
        // color: var(--v-missionAccent-base);
        font-weight: 800;
        padding: 10px 0px 10px 20px;
        margin: 0px;
      }

      .card-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;

        .deleteEdge {
          color: var(--v-missionAccent-base);
          font-size: 0.9rem;
        }

        .edgeButtons {
          margin: 10px;
        }
      }
    }
  }

  .panelContent:before {
    content: "";
    width: 99%;
    height: calc(100% - 2px);
    background: var(--v-background-darken1);
    display: block;
    position: absolute;
    top: 1px;
    left: 1px;
  }

  .panelContent,
  .panelContent:before {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0% 95%);
  }
}

.galaxyListPanel:hover {
  left: 0px;
}

*::-webkit-scrollbar {
  width: 5px;
}

/* Track */
*::-webkit-scrollbar-track {
  background: var(--v-background-base);
  margin-top: 1px;
  margin-bottom: 25px;
}

/* Handle */
*::-webkit-scrollbar-thumb {
  background: var(--v-missionAccent-base);
}

/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}
</style>
