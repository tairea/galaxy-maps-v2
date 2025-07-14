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
          <v-icon color="galaxyAccent" size="24" class="robot-dance">{{ mdiRobotExcited }}</v-icon>
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
            {{ Math.round(savingProgress) }}% Complete ({{ completedPlanets }}/{{ totalPlanets }}
            planets)
          </p>
        </div>

        <p class="loading-message overline" :class="{ 'baseAccent--text': isSavingToDB }">
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
            (this.totalInputTokens / 1000000) * 0.15 + (this.totalOutputTokens / 1000000) * 0.6
          }}
        </p>
      </div>
    </div>

    <!-- <div class="left-section" :class="{ hide: hideLeftPanelsFlag }"> -->
    <div id="left-section" data-v-step="1">
      <GalaxyInfo :course="boundCourse" :teacher="teacher" :draft="draft" />
      <div class="mt-6">
        <!-- <PublishGalaxy v-if="showPublish" :course="boundCourse" :courseTasks="courseTasks" /> -->
        <v-btn @click="createGalaxy">Create Galaxy</v-btn>
      </div>
      <BackButton :toPath="'/'" />
    </div>

    <!--==== Main section ====-->
    <div id="main-section">
      <!-- CREATION STATUS v-treeview of stars > planets > missions -->
      <div v-if="transformedStarDetails.length > 0" class="galaxy-treeview-container">
        <div class="galaxy-preview-container">
          <!-- =========== Network Preview =========== -->
          <network
            v-if="nodesToDisplay"
            ref="network"
            class="network-graph"
            :nodes="nodesToDisplay"
            :edges="edgesToDisplay"
            :options="network.options"
            @hook:updated="networkUpdated"
            @before-drawing="beforeDrawing"
            @after-drawing="afterDrawing"
          ></network>

          <!-- =========== Treeview =========== -->
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
                :active="treeviewActiveItems[starIndex] || []"
                item-key="id"
                class="galaxy-treeview"
                dense
                @update:value="updateExpandedNodes"
                @update:active="(newValue) => updateActiveGalaxyItems(newValue, starIndex)"
                hoverable
                activatable
                multiple-active
                open-all
                color="missionAccent"
                active-color="missionAccent"
              >
                <template v-slot:label="{ item }">
                  <span class="treeview-label">
                    <span v-if="item.type === 'star'" class="star-emoji">⭐</span>
                    <span v-else-if="item.type === 'planet'" class="planet-emoji">🪐</span>
                    <span v-else-if="item.type === 'mission'" class="mission-emoji">🎯</span>
                    {{ item.name }}
                  </span>
                </template>
              </v-treeview>
            </div>
          </div>
        </div>

        <!-- =========== Prompt =========== -->
        <div class="galaxy-prompt-container">
          <div class="prompt-textarea-container mt-4">
            <div class="prompt-context-chips pb-2">
              <v-chip
                v-for="item in activeGalaxyItems"
                :key="item"
                class="mr-2 mb-2 theme-chip"
                outlined
                color="missionAccent"
                text-color="missionAccent"
                close
                @click:close="removeChip(item)"
              >
                {{ chipDisplayNames[item] }}
              </v-chip>
            </div>
            <v-textarea
              v-model="galaxyRefineUserInput"
              :dark="dark"
              :light="!dark"
              class="input-field mt-2"
              outlined
              color="missionAccent"
              auto-grow
              clearable
              label="What change would you like me to make?"
              :disabled="loading"
              autofocus
            />
            <div class="action-buttons">
              <v-btn
                outlined
                color="galaxyAccent"
                @click="refineGalaxyMap()"
                class="mr-2"
                :loading="loading"
                :disabled="disabled"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiRobotExcited }} </v-icon>
                REFINE GALAXY MAP
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!--==== Right section ====-->
    <!-- <div id="right-section"></div> -->

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
import Network from "@/vue2vis/Network.vue";
import "vis-network/styles/vis-network.css";
import { Planet } from "@/lib/planet";
import { zodTextFormat } from "openai/helpers/zod";
import { StarsAndPlanetsResponseSchema } from "@/lib/schemas";
// import PromptDialog from "@/components/Dialogs/PromptDialog.vue";

export default {
  name: "AiGalaxyEdit",
  components: {
    LoadingSpinner,
    GalaxyInfo,
    BackButton,
    PublishGalaxy,
    // PromptDialog,
    Network,
  },
  props: ["parsedResponse"],
  data() {
    return {
      loading: false,
      disabled: false,
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
      activeGalaxyItems: [],
      treeviewActiveItems: {}, // Track active items for each treeview
      updateTimeout: null, // Debounce updates to prevent rapid toggling

      // Network data
      nodesToDisplay: [],
      edgesToDisplay: [],

      // AI Generated Galaxy Map
      aiGeneratedGalaxyMap: {},

      // Planet animation properties
      planets: [],
      time: null,
      intervalid1: null,

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

      network: {
        options: {
          // layout: {
          //   hierarchical: {
          //     enabled: true,
          //     sortMethod: "directed",
          //     shakeTowards: "leaves",
          //     direction: "LR",
          //     nodeSpacing: 100,
          //   },
          // },
          physics: {
            enabled: false, // Keep physics disabled to maintain fixed positions
          },
          edges: {
            length: 50, // Longer edges between nodes.
            smooth: false,
            color: {
              inherit: "to",
            },
          },
          nodes: {
            shape: "dot",
            size: 7,
            fixed: {
              x: true,
              y: true,
            },
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
            font: {
              color: "white",
              align: "left",
              face: "Arial",
              size: 16,
            },
            // Disable vis-network labels since we'll draw them manually
            label: "",
          },
          groups: {
            default: {
              shape: "dot",
            },
            completed: {
              shape: "dot",
              color: "#00E676",
            },
            locked: {
              color: "rgba(132,132,132,0.4)", // opaque styling to appear locked
              shape: "dot",
              font: {
                color: "rgba(132,132,132,0.4)", // opaque styling to appear locked
              },
              // opacity: 0.1,
            },
            // unlocked: {
            //   shape: "dot",
            //   color: "#69A1E2",
            // },
            // current: { color: "rgb(0,255,140)" },
            // node status
            // inreview: {
            //   shape: "dot",
            //   color: "#FAF200",
            // },
            // node types
            introduction: {
              shape: "dot",
              color: "#00E676", // baseAccent
            },
            // tasks: {
            //   // color: { background: "yellow", border: "white" },
            //   // shape: "diamond",
            //   shape: "dot",
            //   color: "#69A1E2",
            // },
            // project: {
            //   shape: "dot",
            //   color: "#E269CF",
            // },
            inactive: {
              shape: "dot",
              color: "#696969",
              font: {
                color: "#696969",
              },
            },
          },
          interaction: {
            hover: false,
            hoverConnectedEdges: false,
            dragNodes: false,
            dragView: false,
            multiselect: false,
            zoomView: false,
          },
        },
      },

      // Galaxy Refine Prompt
      galaxyRefineUserInput: "",

      // Resize handling
      resizeTimeout: null,

      // Treeview observer
      treeviewObserver: null,
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
    dark(newValue) {
      // Update planet colors when theme changes
      this.updatePlanetColors();
    },
    aiGeneratedGalaxyMap: {
      handler(newVal, oldVal) {
        this.updateTransformedStarDetails();
        // Set up planets when galaxy map changes
        this.$nextTick(() => {
          this.setupPlanets();
        });
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
              const newlyAddedNodeIds = allNodeIds.filter((id) => !existingNodeIds.includes(id));

              // Preserve existing expanded state and add newly added nodes
              this.expandedNodes = [...new Set([...this.expandedNodes, ...newlyAddedNodeIds])];

              // Update network positions based on treeview item widths
              this.updateNetworkPositionsFromTreeview();
            }, 100);
          });
        }
      },
      deep: true,
    },
  },
  beforeDestroy() {
    // Stop planet animation
    this.stopNodeAnimation();
    // Remove resize listener
    window.removeEventListener("resize", this.handleResize);
    // Disconnect mutation observer
    if (this.treeviewObserver) {
      this.treeviewObserver.disconnect();
    }
    // Clear any pending update timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  },
  async mounted() {
    // Check if we have parsedResponse from props or need to restore from store (Cursor changed AICreatedGalaxyDialog to pass the paresedResponse through the store instead of router params FYI)
    if (this.parsedResponse) {
      this.aiGeneratedGalaxyMap = this.parsedResponse;
      // Save to store for persistence
      this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
    } else {
      // Try to restore from store
      this.aiGeneratedGalaxyMap = this.aiGalaxyEditData;
    }

    // Wait for treeview items to render, then set up nodes and edges based on their positions
    this.setupInitialNetworkNodes();

    // Add resize listener
    window.addEventListener("resize", this.handleResize);

    // Set up MutationObserver to watch for treeview content changes
    this.setupTreeviewObserver();
  },
  computed: {
    ...mapState(useRootStore, ["aiGalaxyEditData"]),
    boundCourse() {
      // Get data from props or store
      let responseData = this.parsedResponse || this.aiGalaxyEditData;

      return {
        title: responseData?.title || "Untitled Galaxy",
        description: responseData?.description || "No description available",
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
    dark() {
      return this.$vuetify.theme.isDark;
    },
    // Computed property to get chip display names without causing reactivity loops
    chipDisplayNames() {
      const names = {};
      this.activeGalaxyItems.forEach((item) => {
        names[item] = this.getChipDisplayName(item);
      });
      return names;
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setAiGalaxyEditData", "clearAiGalaxyEditData"]),
    removeChip(item) {
      this.activeGalaxyItems = this.activeGalaxyItems.filter((i) => i !== item);

      // Also remove from the correct treeview active array to update the visual state
      const starMatch = item.match(/^star\[(\d+)\]/);
      if (starMatch) {
        const starIndex = starMatch[1];
        if (this.treeviewActiveItems[starIndex]) {
          const updatedActiveItems = this.treeviewActiveItems[starIndex].filter((i) => i !== item);
          this.$set(this.treeviewActiveItems, starIndex, updatedActiveItems);
        }
      }
    },
    getChipDisplayName(item) {
      // Parse the item ID to extract the actual name from aiGeneratedGalaxyMap
      // Handle different item ID patterns using object notation
      if (item.startsWith("star[")) {
        // Pattern: star[2] -> get star name
        const starMatch = item.match(/^star\[(\d+)\]$/);
        if (starMatch) {
          const starIndex = parseInt(starMatch[1]);
          return "⭐" + this.aiGeneratedGalaxyMap.stars[starIndex].title;
        }

        // Pattern: star[2].planet[0] -> get planet name
        const planetMatch = item.match(/^star\[(\d+)\]\.planet\[(\d+)\]$/);
        if (planetMatch) {
          const starIndex = parseInt(planetMatch[1]);
          const planetIndex = parseInt(planetMatch[2]);
          return "🪐" + this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex].title;
        }

        // Pattern: star[2].planet[0].mission[0] -> get mission name
        const missionMatch = item.match(/^star\[(\d+)\]\.planet\[(\d+)\]\.mission\[(\d+)\]$/);
        if (missionMatch) {
          const starIndex = parseInt(missionMatch[1]);
          const planetIndex = parseInt(missionMatch[2]);
          const missionIndex = parseInt(missionMatch[3]);
          return (
            "🎯" +
            this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex].missions[missionIndex]
              .title
          );
        }
      }

      // Fallback: return the original item if parsing fails
      return item;
    },

    // Set up initial network nodes and edges based on treeview positions
    setupInitialNetworkNodes() {
      // Use a more robust approach that waits for DOM to be ready
      const waitForTreeview = () => {
        const treeviewItems = document.querySelectorAll(".star-treeview-item");
        const treeviewWrapper = document.querySelector(".galaxy-treeview-wrapper");

        // Check if treeview items are properly rendered with dimensions
        if (treeviewItems.length === 0 || !treeviewWrapper) {
          setTimeout(waitForTreeview, 100);
          return;
        }

        // Check if items have proper dimensions
        const firstItem = treeviewItems[0];
        const firstItemRect = firstItem.getBoundingClientRect();
        if (firstItemRect.width === 0 || firstItemRect.height === 0) {
          setTimeout(waitForTreeview, 100);
          return;
        }

        this.updateNetworkPositionsFromTreeview();
      };

      // Start the waiting process with a longer initial delay to ensure network is ready
      this.$nextTick(() => {
        setTimeout(waitForTreeview, 500);
      });
    },

    // Calculate treeview item widths and update network positions
    updateNetworkPositionsFromTreeview() {
      this.$nextTick(() => {
        // Check if network is ready
        if (!this.$refs.network || !this.$refs.network.network) {
          setTimeout(() => {
            this.updateNetworkPositionsFromTreeview();
          }, 200);
          return;
        }

        // Additional check to ensure network is fully initialized
        try {
          this.$refs.network.network.getPositions();
        } catch (error) {
          setTimeout(() => {
            this.updateNetworkPositionsFromTreeview();
          }, 200);
          return;
        }

        // Get all star-treeview-item elements
        const treeviewItems = document.querySelectorAll(".star-treeview-item");

        if (treeviewItems.length === 0) {
          return;
        }

        // Calculate total width of all treeview items plus gaps
        let totalWidth = 0;
        const gapSize = 20; // 20px gap from flexbox

        treeviewItems.forEach((item, index) => {
          const itemRect = item.getBoundingClientRect();
          const itemWidth = itemRect.width;
          totalWidth += itemWidth;

          // Add gap between items (except for the last item)
          if (index < treeviewItems.length - 1) {
            totalWidth += gapSize;
          }
        });

        // Update network graph width to match treeview total width
        const networkGraph = document.querySelector(".network-graph");
        const treeviewWrapper = document.querySelector(".galaxy-treeview-wrapper");

        if (networkGraph) {
          networkGraph.style.width = `${totalWidth + 100}px`;
        }

        if (treeviewWrapper) {
          treeviewWrapper.style.width = `${totalWidth + 100}px`;
        }

        // Calculate positions for each star using actual treeview item positions
        const updatedNodes = [];
        const yPosition = 100; // Fixed Y position for all nodes (above treeview items)

        treeviewItems.forEach((item, index) => {
          const itemRect = item.getBoundingClientRect();
          const treeviewWrapperRect = treeviewWrapper
            ? treeviewWrapper.getBoundingClientRect()
            : null;

          // Calculate position relative to the treeview wrapper
          let relativeX = 0;
          if (treeviewWrapperRect) {
            relativeX = itemRect.left - treeviewWrapperRect.left + itemRect.width / 2;
          } else {
            // Fallback to sequential positioning
            relativeX = index * 300 + 150;
          }

          // Position nodes in the network's coordinate system
          // Since the network width matches the treeview width, we can use relative positioning
          const canvasX = relativeX;
          const canvasY = yPosition;

          // Update the corresponding network node
          updatedNodes.push({
            id: `star-${index}`,
            label: "", // Do not show star label on the network node
            x: this.$refs.network.network.DOMtoCanvas({ x: canvasX, y: canvasY }).x,
            y: this.$refs.network.network.DOMtoCanvas({ x: canvasX, y: canvasY }).y,
          });
        });

        // Update the network nodes
        this.nodesToDisplay = updatedNodes;

        // Update edges to connect the repositioned nodes
        this.edgesToDisplay = [];
        for (let i = 0; i < updatedNodes.length - 1; i++) {
          this.edgesToDisplay.push({
            from: `star-${i}`,
            to: `star-${i + 1}`,
          });
        }

        // Force network to redraw with new positions
        if (this.$refs.network) {
          this.$refs.network.redraw();

          // Set zoom level to 1 and center the view
          if (this.$refs.network.network) {
            this.$refs.network.network.moveTo({
              scale: 1,
              animation: false,
            });
          }

          // Set up planets after nodes are positioned correctly
          this.$nextTick(() => {
            this.setupPlanets();
            this.startNodeAnimation();
          });
        }
      });
    },

    // Handle window resize to recalculate positions
    handleResize() {
      // Debounce resize events
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.updateNetworkPositionsFromTreeview();
      }, 250);
    },

    // Set up MutationObserver to watch for treeview content changes
    setupTreeviewObserver() {
      const treeviewWrapper = document.querySelector(".galaxy-treeview-wrapper");
      if (treeviewWrapper) {
        this.treeviewObserver = new MutationObserver((mutations) => {
          // Check if any mutations affect the treeview items
          const hasRelevantChanges = mutations.some((mutation) => {
            return (
              mutation.type === "childList" ||
              (mutation.type === "attributes" && mutation.attributeName === "style")
            );
          });

          if (hasRelevantChanges) {
            // Debounce the update to avoid excessive recalculations
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
              this.updateNetworkPositionsFromTreeview();
            }, 100);
          }
        });

        // Observe changes to child elements and attributes
        this.treeviewObserver.observe(treeviewWrapper, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["style", "class"],
        });
      }
    },

    // Loading message management
    startLoadingMessages() {
      const messages = this.isSavingToDB ? this.savingMessages : this.loadingMessages;
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
      // Recalculate network positions when treeview expands/collapses
      this.$nextTick(() => {
        setTimeout(() => {
          this.updateNetworkPositionsFromTreeview();
        }, 200);
      });
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
      // TODO: Implement galaxy creation logic
    },
    // Clear store data when component is destroyed
    clearStoredData() {
      this.clearAiGalaxyEditData();
    },

    // Planet animation methods
    networkUpdated() {
      // Network is ready, but wait for proper positioning before setting up planets
    },

    async setupPlanets() {
      // Reset planets
      this.planets = [];

      // Get node positions from the network
      if (!this.$refs.network || !this.$refs.network.network) {
        return;
      }

      // Get the current positions of all nodes
      const nodeIds = this.nodesToDisplay.map((node) => node.id);
      const nodePositionMap = this.$refs.network.network.getPositions(nodeIds);

      // Create planets for each star (node)
      for (const [starId, starPosition] of Object.entries(nodePositionMap)) {
        // Find the star details for this node
        const starIndex = parseInt(starId.replace("star-", ""));
        const star = this.aiGeneratedGalaxyMap.stars[starIndex];

        if (star && star.planets) {
          // Create planets for each planet in this star
          for (let i = 0; i < star.planets.length; i++) {
            const planet = star.planets[i];

            this.planets.push(
              new Planet(
                starPosition.x,
                starPosition.y,
                2, // planet size
                this.dark ? "white" : this.$vuetify.theme.themes.light.missionAccent, // planet colour
                6.28 / (10 * (i + 1)), // planet speed
                20 * (i + 1), // planet orbit size
                starId, // topicId (using starId)

                "", // planet name
                i, // planet index
              ),
            );
          }
        }
      }
    },

    beforeDrawing(ctx) {
      // get delta
      const oldTime = this.time;
      this.time = new Date();
      let delta;
      if (oldTime == null) {
        delta = 1;
      } else {
        delta = (this.time.getTime() - oldTime.getTime()) / 1000;
      }

      // update planets orbits
      for (const planet of this.planets) {
        const strokeColor = this.dark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";
        planet.update(ctx, delta, strokeColor);
      }
    },

    afterDrawing(ctx) {
      // Draw planet labels
      const labelColor = this.dark ? "#ffffff" : this.$vuetify.theme.themes.light.baseAccent;
      for (const planet of this.planets) {
        planet.drawLabel(ctx, labelColor);
      }
    },

    updateFrameTimer() {
      if (this.$refs.network) {
        this.$refs.network.redraw();
      }
    },

    startNodeAnimation() {
      // start interval
      this.updateFrameVar();
    },

    stopNodeAnimation() {
      clearInterval(this.intervalid1);
    },

    updateFrameVar() {
      this.intervalid1 = setInterval(() => {
        this.updateFrameTimer();
      }, 33);
    },

    updatePlanetColors() {
      const newColor = this.dark ? "white" : this.$vuetify.theme.themes.light.missionAccent;
      for (const planet of this.planets) {
        planet.color = newColor;
      }
    },

    // Transform aiGeneratedGalaxyMap into treeview format
    updateTransformedStarDetails() {
      if (
        !this.aiGeneratedGalaxyMap ||
        !this.aiGeneratedGalaxyMap.stars ||
        !this.aiGeneratedGalaxyMap.stars.length
      ) {
        this.transformedStarDetails = [];
        return;
      }

      this.transformedStarDetails = this.aiGeneratedGalaxyMap.stars.map((star, starIndex) => {
        const starNode = {
          id: `star[${starIndex}]`,
          name: star.title,
          type: "star",
          children: [],
        };

        if (star.planets && star.planets.length > 0) {
          starNode.children = star.planets.map((planet, planetIndex) => {
            const planetNode = {
              id: `star[${starIndex}].planet[${planetIndex}]`,
              name: planet.title,
              type: "planet",
              children: [],
            };

            if (planet.missions && planet.missions.length > 0) {
              planetNode.children = planet.missions.map((mission, missionIndex) => ({
                id: `star[${starIndex}].planet[${planetIndex}].mission[${missionIndex}]`,
                name: mission.title,
                type: "mission",
              }));
            }
            return planetNode;
          });
        }
        return starNode;
      });

      // Update network positions after treeview data changes
      this.$nextTick(() => {
        setTimeout(() => {
          this.updateNetworkPositionsFromTreeview();
        }, 300);
      });
    },
    updateActiveGalaxyItems(newValue, treeviewIndex) {
      // Clear any existing timeout
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }

      // Debounce the update to prevent rapid toggling
      this.updateTimeout = setTimeout(() => {
        // Update the treeview's active state to match what the user selected
        this.$set(this.treeviewActiveItems, treeviewIndex, newValue);

        // Merge new active items with existing ones instead of overwriting
        // Remove any items that belong to the current treeview (to avoid duplicates)
        const currentTreeviewPrefix = `star[${treeviewIndex}]`;
        const filteredExistingItems = this.activeGalaxyItems.filter(
          (item) => !item.startsWith(currentTreeviewPrefix),
        );

        // Add the new active items from this treeview
        this.activeGalaxyItems = [...filteredExistingItems, ...newValue];

        this.updateTimeout = null;
      }, 100);
    },
    async refineGalaxyMap() {
      this.loading = true;

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy refinement process...");

      const refinementSystemPrompt = `
      You are a Galaxy Map refiner assistant. Your task is to update specific parts of an existing Galaxy Map JSON object based on the user’s request. The Galaxy Map represents a structured learning journey using Stars → Planets → Missions.

      ### Galaxy Map Format (json):

      {
        "status": "journey_steps_ready",
        "title": "Journey Title",
        "description": "Brief description of the overall journey",
        "stars": [
          {
            "title": "1: Title (Theme Name)",
            "description": "Brief description of this theme",
            "planets": [
              {
                "title": "1.1: Title (Task Name)",
                "description": "Brief description of this task",
                "missions": [
                  {
                    "title": "1.1.1: Title (Action Name)",
                    "description": "Brief description of this action"
                  }
                ]
              }
            ]
          }
        ]
      }

      ### Your Responsibilities:
      1. Understand the user’s request — they may want to change titles, descriptions, content, structure, or sequence of Stars, Planets, or Missions.
      2. You will be provided:
      -- The full current Galaxy Map object.
      -- A list of titles in a field called items_user_wants_changed — each title corresponds to a Star, Planet, or Mission the user wants updated.
      3. Only modify the items specified in items_user_wants_changed. Match these titles precisely (e.g., "1.2.1: Title (Action Name)") within the structure.
      4. Preserve everything else in the Galaxy Map exactly as-is.
      5. Return the entire updated Galaxy Map object, not just the modified parts.
      6. Always insert the updates into the correct location in the nested structure: stars[] → planets[] → missions[].

      ### 🧾 Input Structure:
      - galaxy_map: the full Galaxy Map JSON object.
      - items_user_wants_changed: an array of titles of the specific items to change, e.g.:
      - user_request: the user's instruction (e.g., creating extra missions, rethinking star and planet order, etc).
      [
        "1: Introduction (Getting Started)",
        "1.2: Research the Topic (Investigation)",
        "1.2.2: Interview an Expert (Deep Dive)"
      ]

      ### Output Requirements:
      - Return the full updated Galaxy Map object.

      - Do not change any parts not referenced in items_user_wants_changed, unless the user explicitly asks you to.

      - Ensure all changes are inserted into the correct nested position.
      `;

      // 1.refine system prompt
      const inputMessages = [{ role: "system", content: refinementSystemPrompt }];

      // 2. galaxy map json
      const galaxyMapJson = JSON.stringify(this.aiGeneratedGalaxyMap);
      inputMessages.push({ role: "user", content: "galaxy_map: " + galaxyMapJson });

      // 3. selected items
      const activeItems = this.activeGalaxyItems;
      const activeItemsString = activeItems.join("\n");
      if (activeItems.length > 0) {
        inputMessages.push({
          role: "user",
          content: "items_user_wants_changed: " + activeItemsString,
        });
      }

      inputMessages.push({ role: "user", content: "user_request: " + this.galaxyRefineUserInput });

      const refineGalaxyWithAiResponse = await this.$openai.responses.parse({
        model: "gpt-4o-mini",
        previous_response_id: this.aiGeneratedGalaxyMap.aiResponseId,
        input: inputMessages,
        text: {
          format: zodTextFormat(StarsAndPlanetsResponseSchema, "second_step_response"),
        },
        store: true,
      });

      // Calculate and log execution time even on error
      const endTime = Date.now();
      const timeString = this.formatExecutionTime(startTime, endTime);
      console.log(
        `🔍 Galaxy refinement process completed after ${timeString} (${endTime - startTime}ms total)`,
      );

      console.log("🔍 Galaxy refinement response:", refineGalaxyWithAiResponse);

      // Track token usage
      this.trackTokenUsage(refineGalaxyWithAiResponse);

      // update response id
      this.aiGeneratedGalaxyMap.aiResponseId = refineGalaxyWithAiResponse.id;

      // update galaxy map data
      this.aiGeneratedGalaxyMap = refineGalaxyWithAiResponse.output_parsed;

      this.loading = false;
    },
    formatExecutionTime(startTime, endTime) {
      const totalTimeMs = endTime - startTime;
      const minutes = Math.floor(totalTimeMs / 60000);
      const seconds = Math.floor((totalTimeMs % 60000) / 1000);
      return `${minutes}m${seconds}s`;
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

#left-section {
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
  width: calc(100vw - 200px);
  margin: 0px 0px 0px 200px;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  z-index: 1;

  // Galaxy treeview styles
  .galaxy-treeview-container {
    width: 100%;
    height: 100%;
    margin: 1rem auto;
    padding: 1rem;
    overflow: hidden;
    // border: 1px solid blue;
    flex-direction: column;

    .galaxy-preview-container {
      // border: 1px solid red;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      height: auto;
      overflow-y: auto;
      margin-bottom: 100px;

      .network-graph {
        height: 250px;
        // min-height: 300px;
        // border: 1px solid yellow;
      }

      .galaxy-treeview-wrapper {
        display: flex;
        flex-direction: row;
        gap: 20px;
        min-height: 80%;
        padding: 10px;
        overflow-y: auto;
        overflow-x: auto;
        margin-top: -100px;
        // border: 1px solid green;

        .star-treeview-item {
          flex: 0 0 auto;
          width: auto;
          // padding: 15px;
          background-color: rgba(var(--v-background-base), 0.9);
          border-radius: 8px;
          height: auto;
          // border: 1px solid pink;

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
              cursor: pointer; // Add pointer cursor to treeview content
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
            cursor: pointer; // Add pointer cursor to indicate clickable items
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
        }
      }
    }

    .galaxy-prompt-container {
      width: 100%;
      height: 30%;
      // border: 1px solid yellow;
      display: flex;
      justify-content: center;
      align-items: flex-start;

      .prompt-textarea-container {
        width: 50%;

        .input-field {
          width: 100%;
          text-align: center;
          flex: none;
          font-size: 1rem;
          color: var(--v-missionAccent-base);
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin-top: -10px;
        }

        .theme-chip {
          border: 1px solid var(--v-missionAccent-base) !important;
          color: var(--v-missionAccent-base) !important;
          background-color: transparent !important;
          font-weight: 500;
          transition: all 0.3s ease;

          &:hover {
            background-color: rgba(var(--v-missionAccent-base), 0.1) !important;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(var(--v-missionAccent-base), 0.3);
          }

          .v-chip__close {
            color: var(--v-missionAccent-base) !important;

            &:hover {
              background-color: rgba(var(--v-missionAccent-base), 0.2) !important;
            }
          }
        }
      }
    }
  }
}

#right-section {
  width: 20%;
  height: 100%;
  z-index: 3;
  margin-left: auto;
  margin-right: 20px;
}

// Loading overlay styles
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--v-background-base);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.95;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

.loading-message {
  color: var(--v-missionAccent-base);
  margin-top: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: fadeInOut 3s ease-in-out infinite;
}

.token-usage {
  color: var(--v-galaxyAccent-base);
  margin-top: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: normal !important;
  margin: 5px !important;
}

.token-breakdown {
  color: var(--v-missionAccent-base);
  margin-top: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.8;
  line-height: normal !important;
  margin: 5px !important;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.robot-dance {
  animation: robotDance 2s ease infinite;
}
@keyframes robotDance {
  70% {
    transform: translateY(0%);
  }
  80% {
    transform: translateY(-15%);
  }
  90% {
    transform: translateY(0%);
  }
  95% {
    transform: translateY(-7%);
  }
  97% {
    transform: translateY(0%);
  }
  99% {
    transform: translateY(-3%);
  }
  100% {
    transform: translateY(0);
  }
}

.saving-progress-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.saving-progress-text {
  color: var(--v-missionAccent-base);
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
