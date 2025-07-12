<template>
  <div id="container" class="bg">
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content" style="width: 100%">
        <!-- LOADING INDICATOR -->
        <v-progress-circular
          v-if="!isSavingToDB"
          indeterminate
          size="50"
          color="galaxyAccent"
          class="mb-4"
        >
          <v-icon color="galaxyAccent" size="24" class="robot-dance">{{
            mdiRobotExcited
          }}</v-icon>
        </v-progress-circular>

        <!-- PROGRESS BAR FOR DATABASE SAVING -->
        <div v-if="isSavingToDB" class="saving-progress-container">
          <v-progress-linear
            :value="savingProgress"
            color="baseAccent"
            height="8"
            rounded
            class="mb-2"
          ></v-progress-linear>
          <p class="saving-progress-text">
            {{ Math.round(savingProgress) }}% Complete ({{
              completedPlanets
            }}/{{ totalPlanets }}
            planets)
          </p>
        </div>

        <p
          class="loading-message overline"
          :class="{ 'baseAccent--text': isSavingToDB }"
        >
          {{ currentLoadingMessage }}
        </p>

        <!-- TOKEN USAGE -->
        <p class="token-usage overline mt-2">
          Total Tokens: {{ totalTokensUsed.toLocaleString() }}
        </p>
        <p class="token-breakdown overline mt-2">
          Input: {{ totalInputTokens.toLocaleString() }} | Output:
          {{ totalOutputTokens.toLocaleString() }}
        </p>
        <p class="token-breakdown overline mt-2">
          Est. cost: ${{
            (this.totalInputTokens / 1000000) * 0.15 +
            (this.totalOutputTokens / 1000000) * 0.6
          }}
        </p>
      </div>
    </div>

    <!-- <div class="left-section" :class="{ hide: hideLeftPanelsFlag }"> -->
    <div class="left-section" data-v-step="1">
      <GalaxyInfo :course="boundCourse" :teacher="teacher" :draft="draft" />
      <div class="mt-6">
        <!-- <PublishGalaxy v-if="showPublish" :course="boundCourse" :courseTasks="courseTasks" /> -->
        <v-btn @click="createGalaxy">Create Galaxy</v-btn>
      </div>
      <BackButton :toPath="'/'" />
    </div>

    <!--==== Main section ====-->
    <div id="main-section">
      <!-- Galaxy editing Treeview goes here -->
      <!-- CREATION STATUS v-treeview of stars > planets > missions -->
      <div
        v-if="transformedStarDetails.length > 0"
        class="galaxy-treeview-container"
      >
        <div class="galaxy-treeview-wrapper">
          <div
            v-for="(star, starIndex) in transformedStarDetails"
            :key="`star-${starIndex}`"
            class="star-treeview-item"
          >
            <!-- <h4 class="star-title">{{ star.name }}</h4> -->
            <v-treeview
              :items="[star]"
              :value="expandedNodes"
              item-key="id"
              class="galaxy-treeview"
              dense
              @update:value="updateExpandedNodes"
            >
              <template v-slot:label="{ item }">
                <span class="treeview-label">
                  <span v-if="item.type === 'star'" class="star-emoji">⭐</span>
                  <span v-else-if="item.type === 'planet'" class="planet-emoji"
                    >🪐</span
                  >
                  <span
                    v-else-if="item.type === 'mission'"
                    class="mission-emoji"
                    >🎯</span
                  >
                  {{ item.name }}
                </span>
              </template>
            </v-treeview>
          </div>
        </div>
      </div>
    </div>
    <!--==== Right section ====-->
    <div id="right-section"></div>

    <!-- Prompt Dialog -->
    <!-- <PromptDialog v-if="promptDialog" :context="promptContext" /> -->
  </div>
</template>

<script>
import { mdiRobotExcited } from "@mdi/js";
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import GalaxyInfo from "@/components/GalaxyView/GalaxyInfo.vue";
import PublishGalaxy from "@/components/GalaxyView/PublishGalaxy.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
// import PromptDialog from "@/components/Dialogs/PromptDialog.vue";

export default {
  name: "AiGalaxyEdit",
  components: {
    LoadingSpinner,
    GalaxyInfo,
    BackButton,
    PublishGalaxy,
    // PromptDialog,
  },
  props: ["parsedResponse"],
  data() {
    return {
      loading: false,
      promptDialog: false,
      promptContext: null,
      courseTasks: [],
      mdiRobotExcited,
      // Loading and progress tracking
      isSavingToDB: false,
      savingProgress: 0,
      completedPlanets: 0,
      totalPlanets: 0,
      currentLoadingMessage: "",
      loadingMessageInterval: null,

      // Token usage tracking
      totalTokensUsed: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,

      // Galaxy treeview data
      transformedStarDetails: [],
      expandedNodes: [],

      // AI Generated Galaxy Map
      aiGeneratedGalaxyMap: {},

      // Loading messages
      loadingMessages: [
        "Exploring the cosmos for knowledge...",
        "Charting new learning pathways...",
        "Mapping distant galaxies of consciousness...",
        "Calculating interstellar alignments...",
        "Assembling galactic sources of creation...",
        "Searching the stars for enlightenment...",
        "Gathering cosmic learning resources...",
        "Preparing your journey through the stars...",
        "Creating your learning universe...",
        "Calibrating educational coordinates...",
      ],
      savingMessages: [
        "Beaming data to the cosmic database...",
        "Transmitting knowledge to the stars...",
        "Uploading wisdom to the galactic cloud...",
        "Storing secrets in the nebula network...",
        "Saving discoveries to the void...",
        "Archiving adventures in space-time...",
        "Backing up brilliance to the cosmos...",
        "Securing stories in the stellar vault...",
        "Preserving pathways in the quantum realm...",
        "Caching creativity in the cosmic cache...",
        "Stashing strategies in the space station...",
        "Hoarding hopes in the heavenly hard drive...",
        "Depositing dreams in the deep space drive...",
        "Storing solutions in the solar system...",
        "Saving sagas in the stellar sanctuary...",
      ],
    };
  },
  watch: {
    loading(newValue) {
      if (newValue) {
        this.startLoadingMessages();
      } else {
        this.stopLoadingMessages();
      }
    },
    aiGeneratedGalaxyMap: {
      handler(newVal, oldVal) {
        console.log("updating transform");
        this.updateTransformedStarDetails();
      },
      deep: true,
      immediate: true,
    },
    transformedStarDetails: {
      handler(newVal, oldVal) {
        // Update open nodes when new data is added
        if (newVal && newVal.length > 0) {
          this.$nextTick(() => {
            // Use setTimeout to ensure DOM is fully updated
            setTimeout(() => {
              // Get all current node IDs
              const allNodeIds = this.getAllNodeIds(newVal);

              // Get previously existing node IDs (if oldVal exists)
              const existingNodeIds = oldVal ? this.getAllNodeIds(oldVal) : [];

              // Find newly added node IDs
              const newlyAddedNodeIds = allNodeIds.filter(
                (id) => !existingNodeIds.includes(id)
              );

              // Preserve existing expanded state and add newly added nodes
              this.expandedNodes = [
                ...new Set([...this.expandedNodes, ...newlyAddedNodeIds]),
              ];
            }, 100);
          });
        }
      },
      deep: true,
    },
  },
  beforeDestroy() {
    // Clear stored data when component is destroyed
    this.clearStoredData();
  },
  async mounted() {
    console.log(
      "ai galaxy edit view mounted with parsedResponse... = ",
      this.parsedResponse
    );

    // Check if we have parsedResponse from props or need to restore from store
    let responseData = this.parsedResponse;

    if (!responseData) {
      // Try to restore from store
      responseData = this.aiGalaxyEditData;
      if (responseData) {
        console.log("Restored parsedResponse from store:", responseData);
      }
    } else {
      // Save to store for persistence
      this.setAiGalaxyEditData(responseData);
      console.log("Saved parsedResponse to store");
    }

    // Convert parsedResponse into aiGeneratedGalaxyMap format
    if (responseData && responseData.stars) {
      this.aiGeneratedGalaxyMap = {
        journeyTitle: responseData.journeyTitle,
        journeyDescription: responseData.journeyDescription,
        starDetails: responseData.stars.map((star, index) => ({
          star: star.title || star, // Handle both object and string formats
          description: star.description || `Star ${index + 1}: ${star.title || star}`,
          planets: star.planets || [],
          planetDetails: star.planetDetails || [],
        })),
      };

      console.log(
        "Converted parsedResponse to aiGeneratedGalaxyMap:",
        this.aiGeneratedGalaxyMap
      );
    }
  },
  computed: {
    ...mapState(useRootStore, ["aiGalaxyEditData"]),
    boundCourse() {
      // Get data from props or store
      let responseData = this.parsedResponse;
      if (!responseData) {
        responseData = this.aiGalaxyEditData;
      }

      return {
        title: responseData?.journeyTitle || "Untitled Galaxy",
        description:
          responseData?.journeyDescription || "No description available",
        status: "draft",
      };
    },
    teacher() {
      return true; // For AI editing, assume teacher permissions
    },
    draft() {
      return true; // For AI editing, assume draft mode
    },
    showPublish() {
      return true; // For AI editing, show publish option
    },
  },
  methods: {
    ...mapActions(useRootStore, [
      "setAiGalaxyEditData",
      "clearAiGalaxyEditData",
    ]),
    // Loading message management
    startLoadingMessages() {
      const messages = this.isSavingToDB
        ? this.savingMessages
        : this.loadingMessages;
      this.currentLoadingMessage = messages[0];
      this.loadingMessageInterval = setInterval(() => {
        const currentIndex = messages.indexOf(this.currentLoadingMessage);
        const nextIndex = (currentIndex + 1) % messages.length;
        this.currentLoadingMessage = messages[nextIndex];
      }, 3000);
    },
    stopLoadingMessages() {
      if (this.loadingMessageInterval) {
        clearInterval(this.loadingMessageInterval);
        this.loadingMessageInterval = null;
      }
      this.currentLoadingMessage = "";
    },

    // Treeview management
    updateExpandedNodes(newValue) {
      this.expandedNodes = newValue;
    },
    getAllNodeIds(items) {
      const ids = [];
      const collectIds = (nodes) => {
        nodes.forEach((node) => {
          ids.push(node.id);
          if (node.children && node.children.length > 0) {
            collectIds(node.children);
          }
        });
      };
      collectIds(items);
      return ids;
    },

    // Token usage tracking
    trackTokenUsage(response) {
      try {
        if (response.usage) {
          const inputTokens = response.usage.input_tokens || 0;
          const outputTokens = response.usage.output_tokens || 0;
          const totalTokens = response.usage.total_tokens || 0;

          this.totalInputTokens += inputTokens;
          this.totalOutputTokens += outputTokens;
          this.totalTokensUsed += totalTokens;
        }
      } catch (error) {
        console.warn("Error tracking token usage:", error);
      }
    },

    // Placeholder for createGalaxy method
    createGalaxy() {
      console.log("Create Galaxy method called");
      // TODO: Implement galaxy creation logic
    },

    // Clear store data when component is destroyed
    clearStoredData() {
      this.clearAiGalaxyEditData();
      console.log("Cleared stored parsedResponse from store");
    },

    // Transform aiGeneratedGalaxyMap into treeview format
    updateTransformedStarDetails() {
      console.log(
        "updating Transformed Star Details from aiGeneratedGalaxyMap..."
      );
      if (
        !this.aiGeneratedGalaxyMap ||
        !this.aiGeneratedGalaxyMap.starDetails ||
        !this.aiGeneratedGalaxyMap.starDetails.length
      ) {
        this.transformedStarDetails = [];
        return;
      }

      this.transformedStarDetails = this.aiGeneratedGalaxyMap.starDetails.map(
        (starDetail, starIndex) => {
          const starNode = {
            id: `star-${starIndex}`,
            name: starIndex + 1 + ": " + starDetail.star,
            type: "star",
            children: [],
          };

          if (starDetail.planets && starDetail.planets.length > 0) {
            starNode.children = starDetail.planets.map(
              (planet, planetIndex) => {
                // Handle planet as either string or object
                const planetName = typeof planet === 'string' ? planet : (planet.title || planet.name || 'Unknown Planet');
                
                const planetNode = {
                  id: `star-${starIndex}-planet-${planetIndex}`,
                  name: planetName,
                  type: "planet",
                  children: [],
                };

                if (
                  starDetail.planetDetails &&
                  starDetail.planetDetails[planetIndex] &&
                  starDetail.planetDetails[planetIndex].missions
                ) {
                  planetNode.children = starDetail.planetDetails[
                    planetIndex
                  ].missions.map((mission, missionIndex) => ({
                    id: `star-${starIndex}-planet-${planetIndex}-mission-${missionIndex}`,
                    name: mission,
                    type: "mission",
                  }));
                }
                return planetNode;
              }
            );
          }
          return starNode;
        }
      );
      console.log("Transformed star details:", this.transformedStarDetails);
    },
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
}

#container {
  height: 100vh;
  width: 100%;
  display: flex;
  overflow: hidden;
  margin: 0 !important;
}

.left-section {
  width: 200px;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
  overflow-y: auto;
  padding: 0px 0px 50px 20px;
  // z-index: 3;
  transition: all 0.3s;
  position: absolute;
  left: 0px;
  top: 0px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

#main-section {
  position: absolute;
  width: 100vw;
  margin: 0px;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  z-index: 1;
}

#right-section {
  width: 20%;
  height: 100%;
  z-index: 3;
  margin-left: auto;
  margin-right: 20px;
}

// Galaxy treeview styles
.galaxy-treeview-container {
  width: 100%;
  height: 100%;
  margin: 1rem auto;
  padding: 1rem;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;

  // Create a mask that fades out at all edges using radial gradient
  mask-image: radial-gradient(
    ellipse at center,
    black 60%,
    rgba(0, 0, 0, 0.9) 75%,
    rgba(0, 0, 0, 0.7) 85%,
    transparent 95%
  );
  -webkit-mask-image: radial-gradient(
    ellipse at center,
    black 60%,
    rgba(0, 0, 0, 0.9) 75%,
    rgba(0, 0, 0, 0.7) 85%,
    transparent 95%
  );
}

.galaxy-treeview-wrapper {
  display: flex;
  flex-direction: row;
  gap: 20px;
  height: 100%;
  padding: 10px;
  overflow-y: auto;
  overflow-x: auto;

  // Custom scrollbar styling
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(var(--v-missionAccent-base), 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-missionAccent-base), 0.5);
    border-radius: 4px;

    &:hover {
      background: rgba(var(--v-missionAccent-base), 0.7);
    }
  }
}

.star-treeview-item {
  flex: 0 0 auto;
  width: auto;
  padding: 15px;
  background-color: rgba(var(--v-background-base), 0.9);
  border-radius: 8px;
  height: auto;
  // REMOVE: max-height, overflow-y, scrollbar styling
}

.star-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--v-galaxyAccent-base);
  text-transform: uppercase;
  margin-bottom: 10px;
  text-align: center;
  padding: 8px;
  background-color: rgba(var(--v-galaxyAccent-base), 0.1);
  border-radius: 4px;
  border: 1px solid rgba(var(--v-galaxyAccent-base), 0.3);
}

.galaxy-treeview {
  width: 100%;

  .v-treeview-node {
    margin-bottom: 0.25rem;
  }

  .v-treeview-node__root {
    padding: 0.25rem 0;
  }

  .v-treeview-node__children {
    margin-left: 1rem;
  }

  // Hide the root star node since we're showing it as a title
  .v-treeview-node:first-child > .v-treeview-node__root {
    display: none;
  }

  // Adjust spacing for better readability
  .v-treeview-node__content {
    padding: 0.25rem 0;
  }
}

.treeview-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--v-missionAccent-base);
  font-weight: 500;
  line-height: 1.3;
  word-wrap: break-word;
}

.star-emoji {
  font-size: 1rem;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
}

.planet-emoji {
  font-size: 0.9rem;
  filter: drop-shadow(0 0 3px rgba(138, 43, 226, 0.6));
}

.mission-emoji {
  font-size: 0.8rem;
  filter: drop-shadow(0 0 2px rgba(255, 69, 0, 0.6));
}
</style>
