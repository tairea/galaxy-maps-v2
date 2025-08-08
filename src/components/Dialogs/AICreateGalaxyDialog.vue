<template>
  <v-container>
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content" style="width: 100%">
        <!-- LOADING INDICATOR -->
        <RobotLoadingSpinner v-if="!isSavingToDB" size="50" color="galaxyAccent" icon-size="24" />

        <!-- PROGRESS BAR FOR DATABASE SAVING -->
        <div v-if="isSavingToDB" class="saving-progress-container">
          <!-- Saving is a cloud function now so we dont see the individual planets being saved on the frontend for a progress bar -->
          <!-- So show a spinner instead -->
          <RobotLoadingSpinner v-if="isSavingToDB" size="50" color="baseAccent" icon-size="24" />
          <!-- <v-progress-linear
            :value="savingProgress"
            color="baseAccent"
            height="8"
            rounded
            class="mb-2"
          ></v-progress-linear>
          <p class="saving-progress-text">
            {{ Math.round(savingProgress) }}% Complete ({{ completedPlanets }}/{{ totalPlanets }}
            planets)
          </p> -->
        </div>

        <!-- PROGRESS BAR FOR MISSION GENERATION -->
        <div v-if="isGeneratingMissions" class="mission-generation-progress-container">
          <v-progress-linear
            :value="missionGenerationProgress"
            color="galaxyAccent"
            height="8"
            rounded
            class="mb-2"
          ></v-progress-linear>
          <p class="mission-generation-progress-text">
            {{ Math.round(missionGenerationProgress) }}% Complete ({{ completedMissions }}/{{
              totalMissions
            }}
            missions)
          </p>
        </div>

        <p class="loading-message overline" :class="{ 'baseAccent--text': isSavingToDB }">
          {{ currentLoadingMessage }}
        </p>

        <!-- CREATION STATUS v-treeview of stars > planets > missions -->
        <div v-if="transformedStarDetails.length > 0" class="galaxy-treeview-container">
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
                open-all
              >
                <template v-slot:label="{ item }">
                  <div class="treeview-label">
                    <div class="item-header">
                      <span class="treeview-label-text">
                        <span v-if="item.type === 'star'" class="star-emoji">⭐</span>
                        <span v-else-if="item.type === 'planet'" class="planet-emoji">🪐</span>
                        <span v-else-if="item.type === 'instructions'" class="instructions-emoji"
                          >🎯</span
                        >
                        {{ item.name }}
                      </span>
                    </div>
                    <div class="treeview-description" v-if="item.description">
                      <span v-html="renderToHTML(item)"></span>
                    </div>
                  </div>
                </template>
              </v-treeview>
            </div>
          </div>
        </div>

        <!-- TOKEN USAGE -->
        <p class="token-usage overline mt-2">
          Total AI Tokens:
          {{
            aiGeneratedGalaxyMap.tokens
              ? aiGeneratedGalaxyMap.tokens.totalTokens.toLocaleString()
              : "0"
          }}
        </p>
        <p class="token-breakdown overline mt-2">
          Input:
          {{
            aiGeneratedGalaxyMap.tokens
              ? aiGeneratedGalaxyMap.tokens.totalInputTokens.toLocaleString()
              : "0"
          }}
          | Output:
          {{
            aiGeneratedGalaxyMap.tokens
              ? aiGeneratedGalaxyMap.tokens.totalOutputTokens.toLocaleString()
              : "0"
          }}
        </p>
        <p class="token-breakdown overline mt-2">
          Est. cost: ${{
            aiGeneratedGalaxyMap.tokens
              ? aiGeneratedGalaxyMap.tokens.combinedEstimatedCost.toFixed(5)
              : "0.00000"
          }}
        </p>
        <!-- Model breakdown -->
        <!-- <div
          v-if="
            aiGeneratedGalaxyMap.tokens &&
            aiGeneratedGalaxyMap.tokens.modelsUsed &&
            aiGeneratedGalaxyMap.tokens.modelsUsed.length > 0
          "
          class="model-breakdown mt-2"
        >
          <p class="model-breakdown-title overline">Models Used:</p>
          <div
            v-for="model in aiGeneratedGalaxyMap.tokens.modelsUsed"
            :key="model.model"
            class="model-item"
          >
            <span class="model-name">{{ model.model }}</span>
            <span class="model-tokens"> {{ model.totalTokens.toLocaleString() }} tokens </span>
            <span class="model-cost">${{ model.estimatedCost.toFixed(5) }}</span>
          </div>
        </div> -->
      </div>
    </div>

    <v-row class="text-center" align="center">
      <v-col cols="12" class="pa-0">
        <!-- ========== FIRST COURSE PROMPT DIALOG ========== -->
        <v-dialog v-model="showFirstDialog" width="50%" light>
          <!-- CREATE BUTTON -->

          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                Create a new Galaxy Map
                <span class="galaxyAccent--text"
                  >with A.I. <v-icon color="galaxyAccent" small>{{ mdiRobotExcited }}</v-icon></span
                >
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <div>
                  <p class="dialog-description">
                    A Galaxy Map lays out your goal as a clear sequence of visual steps, helping you
                    stay focused and track progress.
                  </p>
                  <p class="dialog-description mt-2">
                    Create a Galaxy Map to complete a project, teach a course, or learn a new skill.
                  </p>
                  <p class="dialog-description galaxyAccent--text mt-2">
                    "Tell me where you want to go, and I'll map your path to get there." >
                    <v-icon color="galaxyAccent" x-small>{{ mdiRobotExcited }}</v-icon>
                  </p>
                </div>
              </div>
            </div>
            <!-- DIALOG CONTENT -->
            <div class="create-dialog-content">
              <v-stepper dark class="stepper-styles text-center" v-model="stepper" alt-labels>
                <!-- <v-stepper-header>
              
                  <v-stepper-step :step="1" color="missionAccent">
                    <div class="text-center">Describe the desired destination</div>
                  </v-stepper-step>
                  <v-divider v-if="showSecondStepperStep"></v-divider>

                  <v-stepper-step v-if="showSecondStepperStep" :step="2" color="missionAccent">
                    <div class="text-center">Some more context</div>
                  </v-stepper-step>
                </v-stepper-header> -->

                <v-stepper-content :step="1">
                  <v-textarea
                    :dark="dark"
                    :light="!dark"
                    class="input-field mt-2"
                    outlined
                    color="missionAccent"
                    auto-grow
                    clearable
                    v-model="description"
                    label="Describe what you want to achieve?"
                    :disabled="loading"
                    autofocus
                  ></v-textarea>

                  <div class="action-buttons mt-8">
                    <v-btn
                      outlined
                      color="galaxyAccent"
                      @click="showCreateOptions"
                      :loading="loading"
                      :disabled="disabled"
                      :dark="dark"
                      :light="!dark"
                    >
                      <v-icon left> {{ mdiRobotExcited }} </v-icon>
                      Create Galaxy Map
                    </v-btn>

                    <v-btn
                      outlined
                      :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                      @click="closeDialog"
                      :disabled="loading"
                      :dark="dark"
                      :light="!dark"
                    >
                      <v-icon left> {{ mdiClose }} </v-icon>
                      Cancel
                    </v-btn>
                  </div>
                </v-stepper-content>

                <v-stepper-content :step="2">
                  <div v-for="(question, index) in aiGatheringContextQuestions" :key="question">
                    <p class="dialog-description">
                      Clarifying question {{ index + 1 }} of
                      {{ aiGatheringContextQuestions.length }}
                    </p>
                    <p class="dialog-description galaxyAccent--text mt-2">
                      "{{ question }}" >
                      <v-icon color="galaxyAccent" x-small>{{ mdiRobotExcited }}</v-icon>
                    </p>
                    <v-textarea
                      :dark="dark"
                      :light="!dark"
                      class="input-field mt-2"
                      outlined
                      color="missionAccent"
                      auto-grow
                      clearable
                      v-model="aiGatheringContextAnswers[index]"
                      :disabled="loading"
                      :autofocus="index === 0"
                    ></v-textarea>
                  </div>

                  <!-- ACTION BUTTONS -->
                  <div class="action-buttons flex-row justify-center">
                    <!-- BACK -->
                    <v-btn
                      outlined
                      :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                      class="mr-4"
                      @click="stepper = 1"
                      :disabled="loading"
                      :dark="dark"
                      :light="!dark"
                    >
                      <v-icon left> {{ mdiArrowLeft }} </v-icon>
                      Back
                    </v-btn>
                    <!-- CONTINUE -->
                    <v-btn
                      outlined
                      :color="'galaxyAccent'"
                      @click="continueWithSelectedFlow()"
                      class="mx-2"
                      :loading="loading"
                      :disabled="disabled"
                      :dark="dark"
                      :light="!dark"
                    >
                      <v-icon left> {{ mdiRobotExcited }} </v-icon>
                      GO!
                    </v-btn>

                    <v-btn
                      outlined
                      :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                      @click="closeDialog"
                      :disabled="loading"
                      :dark="dark"
                      :light="!dark"
                    >
                      <v-icon left> {{ mdiClose }} </v-icon>
                      Cancel
                    </v-btn>
                  </div>
                  <!-- End action-buttons -->
                </v-stepper-content>
              </v-stepper>
            </div>
          </div>
          <!-- End create-dialog -->
        </v-dialog>
      </v-col>
    </v-row>

    <!-- Layout Selection Dialog -->
    <LayoutSelectionDialog
      :show-dialog="showLayoutDialog"
      :loading="loading"
      @cancel="cancelLayoutSelection"
      @confirm="confirmLayoutSelection"
    />

    <!-- Create Galaxy Options Dialog -->
    <!-- <CreateGalaxyOptionsDialog
      :show-dialog="showCreateOptionsDialog"
      :loading="loading"
      @human-help="handleHumanHelp"
      @no-human-help="handleNoHumanHelp"
      @cancel="handleCancelCreateOptions"
    /> -->
  </v-container>
</template>

<script>
import {
  mdiClose,
  mdiCheck,
  mdiRobotExcited,
  mdiInformationVariant,
  mdiArrowLeft,
  mdiFamilyTree,
} from "@mdi/js";
import { mapState, mapActions } from "pinia";
import useRootStore from "@/store/index";
import {
  generateGalaxyMap,
  generateGalaxyMapWithClarification,
  generateInstructionsForMission,
  saveGalaxyMap,
  downloadAndUploadImage,
} from "@/lib/ff";
import { zodTextFormat } from "openai/helpers/zod";
import { StarsAndPlanetsResponseSchema } from "@/lib/schemas";
import RobotLoadingSpinner from "@/components/Reused/RobotLoadingSpinner.vue";
import LayoutSelectionDialog from "@/components/Dialogs/LayoutSelectionDialog.vue";
// import CreateGalaxyOptionsDialog from "@/components/Dialogs/CreateGalaxyOptionsDialog.vue";
export default {
  name: "AICreateGalaxyDialog",
  components: {
    RobotLoadingSpinner,
    LayoutSelectionDialog,
    // CreateGalaxyOptionsDialog,
  },
  props: {
    showFirstDialog: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  data: () => ({
    valid: false,
    description: "",
    mdiClose,
    mdiCheck,
    mdiRobotExcited,
    mdiInformationVariant,
    mdiArrowLeft,
    mdiFamilyTree,
    rules: {
      required: (v) => !!v || "This field is required",
    },
    loading: false,
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
    currentLoadingMessage: "",
    loadingMessageInterval: null,
    isSavingToDB: false,
    isGeneratingMissions: false,
    savingProgress: 0,
    completedPlanets: 0,
    totalPlanets: 0,
    missionGenerationProgress: 0,
    completedMissions: 0,
    totalMissions: 0,
    showLayoutDialog: false,
    // showCreateOptionsDialog: false,
    selectedFlow: null, // Track which flow was selected: 'human-help' or 'no-human-help'
    selectedLayout: null, // Store the selected layout for the flow
    aiGeneratedTitle: "",
    aiGeneratedDescription: "",
    aiGeneratedTopics: [],
    aiGeneratedTasks: [],
    aiGeneratedImage: "",
    showSecondStepperStep: false,
    aiGatheringContext: false,
    aiGatheringContextQuestions: [],
    aiGatheringContextAnswers: [],
    previousResponseId: "",
    stepper: 1,
    aiGeneratedGalaxyMap: {
      stars: [],
    },
    transformedStarDetails: [],
    expandedNodes: [],
  }),
  computed: {
    ...mapState(useRootStore, ["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    disabled() {
      return this.loading || this.description.length === 0;
    },
    prefixedAnswers() {
      return this.aiGatheringContextAnswers.map((answer, index) => `${index + 1}) ${answer}`);
    },
  },
  watch: {
    loading(newValue) {
      if (newValue) {
        this.startLoadingMessages();
      } else {
        this.stopLoadingMessages();
      }
    },
    aiGatheringContextQuestions: {
      handler(newQuestions) {
        if (newQuestions && newQuestions.length > 0) {
          // Initialize the answers array with empty strings for each question
          this.aiGatheringContextAnswers = new Array(newQuestions.length).fill("");
        }
      },
      immediate: true,
    },
    "aiGeneratedGalaxyMap.stars": {
      handler(newVal, oldVal) {
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
              const newlyAddedNodeIds = allNodeIds.filter((id) => !existingNodeIds.includes(id));

              // Preserve existing expanded state and add newly added nodes
              this.expandedNodes = [...new Set([...this.expandedNodes, ...newlyAddedNodeIds])];
            }, 100);
          });
        }
      },
      deep: true,
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar", "setAiGalaxyEditData"]),
    closeDialog() {
      this.description = "";
      this.aiGeneratedGalaxyMap = {}; // Reset galaxy map
      this.selectedFlow = null; // Reset selected flow
      this.selectedLayout = null; // Reset selected layout
      // this.showCreateOptionsDialog = false; // Reset create options dialog
      this.$emit("update:showFirstDialog", false);
    },
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
    formatExecutionTime(startTime, endTime) {
      const totalTimeMs = endTime - startTime;
      const minutes = Math.floor(totalTimeMs / 60000);
      const seconds = Math.floor((totalTimeMs % 60000) / 1000);
      return `${minutes}m${seconds}s`;
    },
    calculateEstimatedCost() {
      // Use the token usage from aiGeneratedGalaxyMap if available
      if (
        this.aiGeneratedGalaxyMap.tokens &&
        this.aiGeneratedGalaxyMap.tokens.combinedEstimatedCost > 0
      ) {
        return {
          inputCost: "0.0000", // Not calculated separately in new structure
          outputCost: "0.0000", // Not calculated separately in new structure
          totalCost: this.aiGeneratedGalaxyMap.tokens.combinedEstimatedCost.toFixed(4),
        };
      }

      // Fallback for legacy structure
      // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
      const inputTokens = this.aiGeneratedGalaxyMap.tokens
        ? this.aiGeneratedGalaxyMap.tokens.totalInputTokens
        : 0;
      const outputTokens = this.aiGeneratedGalaxyMap.tokens
        ? this.aiGeneratedGalaxyMap.tokens.totalOutputTokens
        : 0;
      const inputCost = (inputTokens / 1000000) * 0.15;
      const outputCost = (outputTokens / 1000000) * 0.6;
      const totalCost = inputCost + outputCost;

      return {
        inputCost: inputCost.toFixed(4),
        outputCost: outputCost.toFixed(4),
        totalCost: totalCost.toFixed(4),
      };
    },
    // Helper method to accumulate tokens from multiple API calls
    accumulateTokens(newTokenUsage) {
      if (!newTokenUsage) return this.aiGeneratedGalaxyMap.tokens || {};

      const currentTokens = this.aiGeneratedGalaxyMap.tokens || {};

      // Initialize accumulated tokens structure
      const accumulatedTokens = {
        totalTokens: (currentTokens.totalTokens || 0) + (newTokenUsage.totalTokens || 0),
        totalInputTokens:
          (currentTokens.totalInputTokens || 0) + (newTokenUsage.totalInputTokens || 0),
        totalOutputTokens:
          (currentTokens.totalOutputTokens || 0) + (newTokenUsage.totalOutputTokens || 0),
        combinedEstimatedCost:
          (currentTokens.combinedEstimatedCost || 0) + (newTokenUsage.combinedEstimatedCost || 0),
        modelsUsed: [],
      };

      // Merge models used from both current and new token usage
      const allModels = new Map();

      // Add current models
      if (currentTokens.modelsUsed) {
        currentTokens.modelsUsed.forEach((model) => {
          allModels.set(model.model, {
            model: model.model,
            totalTokens: model.totalTokens || 0,
            estimatedCost: model.estimatedCost || 0,
          });
        });
      }

      // Add new models (accumulate if same model exists)
      if (newTokenUsage.modelsUsed) {
        newTokenUsage.modelsUsed.forEach((model) => {
          const existing = allModels.get(model.model);
          if (existing) {
            existing.totalTokens += model.totalTokens || 0;
            existing.estimatedCost += model.estimatedCost || 0;
          } else {
            allModels.set(model.model, {
              model: model.model,
              totalTokens: model.totalTokens || 0,
              estimatedCost: model.estimatedCost || 0,
            });
          }
        });
      }

      accumulatedTokens.modelsUsed = Array.from(allModels.values());

      return accumulatedTokens;
    },

    // =========== Generate Galaxy Map with AI ===========
    async firstStep(flow = "human-help") {
      // Store the selected flow
      this.selectedFlow = flow;
      console.log("firstStep");
      // Prevent multiple simultaneous submissions
      if (this.loading) {
        console.log("Already processing, ignoring duplicate submission");
        return;
      }

      if (!this.description.trim()) {
        this.setSnackbar({
          show: true,
          text: "Please provide a description for the Galaxy Map",
          color: "warning",
        });
        return;
      }

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy creation process...");

      try {
        this.loading = true;

        // Add a small delay to prevent rapid double-clicks
        await new Promise((resolve) => setTimeout(resolve, 100));

        // =========== (1st a.i. api call) Generate journey's Stars and Planets using AI ===========
        const aiResponse = await generateGalaxyMap(this.description);

        console.log("1st A.I. call: Stars and Planets generated ✅. A.I. Response:", aiResponse);

        // store the response id for the next ai call
        this.previousResponseId = aiResponse.responseId;

        // Get the parsed response
        const parsedResponse = aiResponse.galaxyMap;
        parsedResponse.originResponseId = aiResponse.responseId;

        // Check if it's clarification_needed, journey_ready, or stars list
        if (
          parsedResponse.status === "journey_ready" &&
          parsedResponse.stars &&
          Array.isArray(parsedResponse.stars) &&
          parsedResponse.title &&
          parsedResponse.description
        ) {
          // It's a journey_ready response - proceed to next step
          console.log("Journey stars and planets ready received:", parsedResponse);

          // end timer
          const endTime = Date.now();
          const timeString = this.formatExecutionTime(startTime, endTime);
          console.log(
            `✅ Galaxy map generation completed in ${timeString} (${endTime - startTime}ms total)`,
          );

          // add token data to the galaxy map
          this.aiGeneratedGalaxyMap = parsedResponse;
          this.aiGeneratedGalaxyMap.tokens = this.accumulateTokens(aiResponse.tokenUsage);

          // save a copy of the original galaxy map data for the history
          // Create a deep copy without history to avoid circular reference
          const galaxyMapCopy = JSON.parse(
            JSON.stringify({
              ...this.aiGeneratedGalaxyMap,
              history: undefined, // Remove history from the copy
            }),
          );

          this.aiGeneratedGalaxyMap.history = [
            {
              galaxyMapData: galaxyMapCopy,
            },
          ];

          // Check the selected flow to determine next step
          if (this.selectedFlow === "human-help") {
            // For human-help flow, route to AiGalaxyEdit
            this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
            this.$router.push({ name: "AiGalaxyEdit" });
          }
          // } else if (this.selectedFlow === "no-human-help") {
          //   // For no-human-help flow, continue with automated generation
          //   await this.generateMissionsThenSave(this.selectedLayout);
          // }
        } else if (
          parsedResponse.status === "clarification_needed" &&
          parsedResponse.questions &&
          Array.isArray(parsedResponse.questions)
        ) {
          // It's clarification_needed - show questions
          console.log("Clarification needed questions:", parsedResponse.questions);
          this.aiGatheringContextQuestions = parsedResponse.questions;

          // Store the token usage from the first API call even when clarification is needed
          this.aiGeneratedGalaxyMap = {
            status: "clarification_needed",
            questions: parsedResponse.questions,
          };
          this.aiGeneratedGalaxyMap.tokens = this.accumulateTokens(aiResponse.tokenUsage);

          this.showSecondStepperStep = true;
          this.stepper = 2;
          const endTime = Date.now();
          const timeString = this.formatExecutionTime(startTime, endTime);
          console.log(
            `Stopping to ask questions after ${timeString} (${endTime - startTime}ms total)`,
          );
          // Set loading to false here since we're stopping to ask questions
          this.loading = false;
        } else {
          console.warn("Unknown response format from AI:", parsedResponse);
          this.setSnackbar({
            show: true,
            text: "Unexpected response format from AI. Please try again.",
            color: "warning",
          });
          // Set loading to false here since we're not proceeding
          this.loading = false;
        }
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(`❌ First step failed after ${timeString} (${endTime - startTime}ms total)`);

        console.error("Error creating galaxy:", error);
        this.setSnackbar({
          show: true,
          text: "Error creating galaxy: " + error.message,
          color: "pink",
        });
        // Set loading to false on error
        this.loading = false;
      }
    },
    // =========== Generate course Tasks (for each Topic) using AI ===========
    async secondStep() {
      console.log("secondStep");
      console.log("question answers:", this.prefixedAnswers.join("\n"));

      // Start timing - moved to beginning to ensure it's always defined
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy creation process...");

      try {
        this.loading = true;

        // second ai call with structured output using cloud function
        const aiSecondResponse = await generateGalaxyMapWithClarification(
          this.prefixedAnswers.join("\n"),
          this.previousResponseId,
        );

        console.log(
          "2nd A.I. call: Stars and Planets Generation (after clarification): Response:",
          aiSecondResponse,
        );

        this.previousResponseId = aiSecondResponse.responseId;

        // Get the parsed response (already validated by cloud function)
        const parsedResponse = aiSecondResponse.galaxyMap;

        // Check if it's clarification_needed, journey_ready, or stars list
        if (
          parsedResponse.status === "journey_ready" &&
          parsedResponse.stars &&
          Array.isArray(parsedResponse.stars) &&
          parsedResponse.title &&
          parsedResponse.description
        ) {
          // It's a journey_ready response - proceed to next step
          console.log("Journey steps ready received:", parsedResponse);

          // add token data to the galaxy map
          this.aiGeneratedGalaxyMap = parsedResponse;
          this.aiGeneratedGalaxyMap.tokens = this.accumulateTokens(aiSecondResponse.tokenUsage);

          // save a copy of the original galaxy map data for the history
          // Create a deep copy without history to avoid circular reference
          const galaxyMapCopy = JSON.parse(
            JSON.stringify({
              ...this.aiGeneratedGalaxyMap,
              history: undefined, // Remove history from the copy
            }),
          );

          this.aiGeneratedGalaxyMap.history = [
            {
              galaxyMapData: galaxyMapCopy,
            },
          ];

          // Check the selected flow to determine next step
          if (this.selectedFlow === "human-help") {
            // For human-help flow, route to AiGalaxyEdit
            this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
            this.$router.push({ name: "AiGalaxyEdit" });
          }
          // } else if (this.selectedFlow === "no-human-help") {
          //   // For no-human-help flow, continue with automated generation
          //   await this.generateMissionsThenSave(this.selectedLayout);
          // }
        } else if (
          parsedResponse.status === "clarification_needed" &&
          parsedResponse.questions &&
          Array.isArray(parsedResponse.questions)
        ) {
          // It's clarification_needed - show questions
          console.log("Clarification needed questions:", parsedResponse.questions);
          this.aiGatheringContextQuestions = parsedResponse.questions;
          this.aiGatheringContextAnswers = [];

          // Accumulate tokens from the second API call
          this.aiGeneratedGalaxyMap.tokens = this.accumulateTokens(aiSecondResponse.tokenUsage);

          this.showSecondStepperStep = true;
          this.stepper = 2;
          // Set loading to false here since we're stopping to ask questions
          this.loading = false;
        } else {
          console.warn("Unknown response format from AI:", parsedResponse);
          this.setSnackbar({
            show: true,
            text: "Unexpected response format from AI. Please try again.",
            color: "warning",
          });
          // Set loading to false here since we're not proceeding
          this.loading = false;
        }
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(`❌ Second step failed after ${timeString} (${endTime - startTime}ms total)`);

        console.error("Error creating galaxy:", error);
        this.setSnackbar({
          show: true,
          text: "Error creating galaxy: " + error.message,
          color: "pink",
        });
        // Set loading to false on error
        this.loading = false;
      }
    },

    // =========== Save Galaxy Map to DB ===========
    async saveGalaxyMaptoDB() {
      this.loading = true;
      this.isSavingToDB = true;
      this.savingProgress = 0;

      // Restart loading messages with saving messages
      this.stopLoadingMessages();
      this.startLoadingMessages();

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy saving to database process...");

      try {
        // Calculate total planets for progress tracking
        this.totalPlanets = 0;
        for (let star of this.aiGeneratedGalaxyMap.stars) {
          this.totalPlanets += star.planets.length;
        }

        this.completedPlanets = 0;
        const updateProgress = () => {
          this.completedPlanets++;
          this.savingProgress = (this.completedPlanets / this.totalPlanets) * 100;
        };

        // Call the Firebase function to save the galaxy map with selected layout
        const result = await saveGalaxyMap(this.aiGeneratedGalaxyMap, this.selectedLayout);

        // Calculate and log execution time
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `✅ Galaxy saving to DB completed in ${timeString} (${endTime - startTime}ms total)`,
        );
        const cost = this.calculateEstimatedCost();
        const totalTokens = this.aiGeneratedGalaxyMap.tokens
          ? this.aiGeneratedGalaxyMap.tokens.totalTokens
          : 0;
        const totalInputTokens = this.aiGeneratedGalaxyMap.tokens
          ? this.aiGeneratedGalaxyMap.tokens.totalInputTokens
          : 0;
        const totalOutputTokens = this.aiGeneratedGalaxyMap.tokens
          ? this.aiGeneratedGalaxyMap.tokens.totalOutputTokens
          : 0;

        console.log(`💰 Total tokens used: ${totalTokens.toLocaleString()}`);
        console.log(
          `📊 Token breakdown: Input: ${totalInputTokens.toLocaleString()}, Output: ${totalOutputTokens.toLocaleString()}`,
        );
        console.log(
          `💵 Estimated cost: $${cost.totalCost} (Input: $${cost.inputCost}, Output: $${cost.outputCost})`,
        );

        this.setSnackbar({
          show: true,
          text: `Galaxy created! Tokens: ${totalTokens.toLocaleString()} | Cost: $${
            cost.totalCost
          }`,
          color: "baseAccent",
        });

        // Set the currentCourseId in store before navigating to ensure GalaxyMap has access to it
        this.setCurrentCourseId(result.courseId);

        // Reset saving state
        this.isSavingToDB = false;
        this.savingProgress = 0;
        this.loading = false;

        this.$router.push({ name: "GalaxyView", params: { courseId: result.courseId } });
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(`❌ Galaxy saving failed after ${timeString} (${endTime - startTime}ms total)`);

        console.error("Error saving galaxy:", error);
        this.setSnackbar({
          show: true,
          text:
            "Error saving galaxy: " + (error instanceof Error ? error.message : "Unknown error"),
          color: "pink",
        });

        // Reset saving state on error
        this.isSavingToDB = false;
        this.savingProgress = 0;
        this.loading = false;
      }
    },

    updateTransformedStarDetails() {
      console.log("updating Transformed Star Details...");
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
          id: `star-${starIndex}`,
          name: starIndex + 1 + ": " + star.title,
          type: "star",
          children: [],
        };
        if (star.planets && star.planets.length > 0) {
          starNode.children = star.planets.map((planet, planetIndex) => {
            const planetNode = {
              id: `star-${starIndex}-planet-${planetIndex}`,
              name: planet.title,
              description: planet.description,
              type: "planet",
              children: [],
            };

            // Add mission instructions as subitems if they exist
            if (planet.instructions) {
              console.log("Processing planet instructions:", planet.instructions);
              planetNode.children.push({
                id: `star-${starIndex}-planet-${planetIndex}-instructions`,
                name: "Mission Instructions",
                description: planet.instructions,
                type: "instructions",
              });
            }

            // Add existing missions if they exist
            if (planet.missions && planet.missions.length > 0) {
              planetNode.children.push(
                ...planet.missions.map((mission, missionIndex) => ({
                  id: `star-${starIndex}-planet-${planetIndex}-mission-${missionIndex}`,
                  name: mission.title,
                  type: "mission",
                })),
              );
            }

            return planetNode;
          });
        }
        return starNode;
      });
      console.log(this.transformedStarDetails);
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
    updateExpandedNodes(newValue) {
      // Update expanded nodes when user manually expands/collapses
      this.expandedNodes = newValue;
    },

    showCreateOptions() {
      // Directly start human-help flow instead of showing options dialog
      this.selectedFlow = "human-help";
      this.firstStep("human-help");
    },

    // handleHumanHelp() {
    //   this.showCreateOptionsDialog = false;
    //   this.selectedFlow = "human-help";
    //   this.firstStep("human-help");
    // },

    // handleNoHumanHelp() {
    //   this.showCreateOptionsDialog = false;
    //   this.selectedFlow = "no-human-help";
    //   // For no-human-help flow, we need to select layout first
    //   this.showLayoutDialog = true;
    // },

    // handleCancelCreateOptions() {
    //   this.showCreateOptionsDialog = false;
    // },

    // async createGalaxyMapWithNoHumanHelp(flow = "no-human-help") {
    //   // Store the selected flow
    //   this.selectedFlow = flow;
    //   console.log("createGalaxyMapWithNoHumanHelp");
    //   if (this.loading) {
    //     console.log("Already processing, ignoring duplicate submission");
    //     return;
    //   }

    //   if (!this.description.trim()) {
    //     this.setSnackbar({
    //       show: true,
    //       text: "Please provide a description for the Galaxy Map",
    //       color: "warning",
    //     });
    //     return;
    //   }

    //   // Show layout selection dialog first
    //   console.log("Showing layout selection dialog before galaxy generation...");
    //   this.showLayoutDialog = true;
    // },

    // Continue with the selected flow after clarification questions
    async continueWithSelectedFlow() {
      // Always go to secondStep when clarification is needed, regardless of selected flow
      await this.secondStep();
    },

    // Layout dialog methods
    cancelLayoutSelection() {
      this.showLayoutDialog = false;
      this.loading = false;
    },

    async confirmLayoutSelection(selectedLayout) {
      this.showLayoutDialog = false;
      this.selectedLayout = selectedLayout; // Store the selected layout

      // Use firstStep for both flows - the routing logic is now handled within firstStep and secondStep
      await this.firstStep(this.selectedFlow);
    },

    async saveGalaxyMapToDatabase(selectedLayout) {
      this.isSavingToDB = true;
      this.loading = true; // Show the loading overlay

      // Restart loading messages with saving messages
      this.stopLoadingMessages();
      this.startLoadingMessages();

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy saving to database process...");

      let result = null;

      // convert mission instructions to html for db
      if (this.aiGeneratedGalaxyMap && this.aiGeneratedGalaxyMap.stars) {
        for (let starIndex = 0; starIndex < this.aiGeneratedGalaxyMap.stars.length; starIndex++) {
          const star = this.aiGeneratedGalaxyMap.stars[starIndex];
          if (star.planets) {
            for (let planetIndex = 0; planetIndex < star.planets.length; planetIndex++) {
              const planet = star.planets[planetIndex];
              if (planet.instructions) {
                // Convert instructions object to HTML format for database storage
                planet.instructions = this.formatMissionInstructionsToHtml(planet.instructions);
              }
            }
          }
        }
      }

      try {
        // Call the Firebase function to save the galaxy map with selected layout
        result = await saveGalaxyMap(this.aiGeneratedGalaxyMap, selectedLayout);

        // Calculate and log execution time
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `✅ Galaxy saving to DB completed in ${timeString} (${endTime - startTime}ms total)`,
        );
        const cost = this.calculateEstimatedCost();
        const totalTokens = this.aiGeneratedGalaxyMap.tokens
          ? this.aiGeneratedGalaxyMap.tokens.totalTokens
          : 0;
        const totalInputTokens = this.aiGeneratedGalaxyMap.tokens
          ? this.aiGeneratedGalaxyMap.tokens.totalInputTokens
          : 0;
        const totalOutputTokens = this.aiGeneratedGalaxyMap.tokens
          ? this.aiGeneratedGalaxyMap.tokens.totalOutputTokens
          : 0;

        console.log(`💰 Total tokens used: ${totalTokens.toLocaleString()}`);
        console.log(
          `📊 Token breakdown: Input: ${totalInputTokens.toLocaleString()}, Output: ${totalOutputTokens.toLocaleString()}`,
        );
        console.log(
          `💵 Estimated cost: $${cost.totalCost} (Input: $${cost.inputCost}, Output: $${cost.outputCost})`,
        );

        this.setSnackbar({
          show: true,
          text: `Galaxy created automatically! Tokens: ${totalTokens.toLocaleString()} | Cost: $${
            cost.totalCost
          }`,
          color: "baseAccent",
        });

        // Set the currentCourseId in store before navigating to ensure GalaxyMap has access to it
        this.setCurrentCourseId(result.courseId);

        // Navigate to the created galaxy
        this.$router.push({ name: "GalaxyView", params: { courseId: result.courseId } });
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(`❌ Galaxy saving failed after ${timeString} (${endTime - startTime}ms total)`);

        console.error("Error saving galaxy:", error);
        this.setSnackbar({
          show: true,
          text:
            "Error saving galaxy: " + (error instanceof Error ? error.message : "Unknown error"),
          color: "pink",
        });
      } finally {
        // Reset saving state
        this.isSavingToDB = false;
        this.loading = false;
      }
    },

    async generateMissionsThenSave(selectedLayout) {
      // Calculate total missions
      this.totalMissions = 0;
      for (const star of this.aiGeneratedGalaxyMap.stars) {
        this.totalMissions += star.planets.length;
      }

      // Start mission generation
      this.loading = true;
      this.isGeneratingMissions = true;
      this.completedMissions = 0;
      this.missionGenerationProgress = 0;

      // Start loading messages with mission generation messages
      this.stopLoadingMessages();
      this.startLoadingMessages();

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting mission generation process...");

      try {
        // Generate instructions for each mission
        for (const [starIndex, star] of this.aiGeneratedGalaxyMap.stars.entries()) {
          for (const [planetIndex, planet] of star.planets.entries()) {
            // Create a copy of the galaxy map without history to avoid circular reference
            const galaxyMapForAI = {
              ...this.aiGeneratedGalaxyMap,
              history: undefined, // Remove history for AI processing
            };

            const missionInstructions = await generateInstructionsForMission(
              planet.description,
              galaxyMapForAI,
              this.aiGeneratedGalaxyMap.originResponseId,
            );
            console.log("missionInstructions", missionInstructions);
            console.log(
              "missionInstructions.missionInstructions",
              missionInstructions.missionInstructions,
            );

            // Accumulate tokens from mission generation
            if (missionInstructions.tokenUsage) {
              this.aiGeneratedGalaxyMap.tokens = this.accumulateTokens(
                missionInstructions.tokenUsage,
              );
            }

            // Update the planet with mission instructions
            // The new format returns structured data, so we store it as-is
            const instructionsData =
              missionInstructions.missionInstructions || missionInstructions || "";
            this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex].instructions =
              instructionsData;

            console.log(
              "does this.aiGeneratedGalaxyMap.stars[" +
                starIndex +
                "].planets[" +
                planetIndex +
                "] have instructions: ",
              this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex],
            );

            // Update progress
            this.completedMissions++;
            this.missionGenerationProgress = (this.completedMissions / this.totalMissions) * 100;

            // Update treeview to show progress
            this.updateTransformedStarDetails();
          }
        }

        // Mission generation completed
        this.isGeneratingMissions = false;

        // Calculate and log execution time
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `✅ Mission generation completed in ${timeString} (${endTime - startTime}ms total)`,
        );

        this.setSnackbar({
          show: true,
          text: `Mission instructions generated successfully!`,
          color: "missionAccent",
        });

        // Now save to database with the selected layout
        await this.saveGalaxyMapToDatabase(selectedLayout);
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `❌ Mission generation failed after ${timeString} (${endTime - startTime}ms total)`,
        );

        console.error("Error generating mission instructions:", error);
        this.setSnackbar({
          show: true,
          text:
            "Error generating mission instructions: " +
            (error instanceof Error ? error.message : "Unknown error"),
          color: "pink",
        });
      } finally {
        // Reset mission generation state
        this.loading = false;
      }
    },

    // Helper method to format mission instructions to HTML (copied from AiGalaxyEdit.vue)
    formatMissionInstructionsToHtml(missionInstructions) {
      if (!missionInstructions) return "";

      try {
        // Handle both object and string formats
        let instructions = missionInstructions;
        if (typeof missionInstructions === "string") {
          instructions = JSON.parse(instructions);
        }

        let html = "";

        // Add description
        if (instructions.description && !this.isGeneratingMissions) {
          html += `<p>${instructions.description}</p>`;
        }

        // Add instructions section
        if (instructions.instructions && instructions.instructions.length > 0) {
          if (!this.isGeneratingMissions) {
            html += `<h2>Instructions</h2>`;
          }

          // Loop through each instruction step
          instructions.instructions.forEach((step) => {
            // Add step title
            if (step.title) {
              html += `<h3>${step.title}</h3>`;
            }

            // Add tasks as unordered list
            if (step.tasks && step.tasks.length > 0) {
              html += `<ul>`;
              step.tasks.forEach((task) => {
                if (task.taskContent) {
                  html += `<li>${task.taskContent}</li>`;
                }
              });
              html += `</ul>`;
            }
          });
        }

        console.log("🔄 Formatted mission instructions to HTML:", html);
        return html;
      } catch (error) {
        console.error("❌ Error formatting mission instructions to HTML:", error);
        return ""; // Fallback to empty string
      }
    },

    /**
     * Renders markdown using streaming-markdown library
     * @param markdown - The markdown text to convert
     * @returns HTML string
     */
    renderMarkdownWithStreaming(markdown) {
      if (!markdown) return "";

      try {
        // Check if streaming-markdown is available
        if (typeof smd !== "undefined" && smd.default_renderer && smd.parser) {
          // Create a temporary div element to render into
          const tempDiv = document.createElement("div");

          // Create renderer and parser
          const renderer = smd.default_renderer(tempDiv);
          const parser = smd.parser(renderer);

          // Write the markdown content
          smd.parser_write(parser, markdown);

          // End the stream
          smd.parser_end(parser);

          // Get the HTML content
          const html = tempDiv.innerHTML;

          return html;
        } else {
          // Fallback to plain text if streaming-markdown is not available
          console.warn("streaming-markdown not available, returning plain text");
          return markdown;
        }
      } catch (error) {
        console.error("Error rendering markdown:", error);
        return markdown; // Fallback to plain text
      }
    },

    /**
     * Check if the content is structured mission instructions (JSON object)
     */
    isStructuredMissionInstructions(content) {
      if (!content) return false;

      try {
        // If it's already an object, check if it has the expected structure
        if (typeof content === "object") {
          return content.instructions && Array.isArray(content.instructions);
        }

        // If it's a string, try to parse it and check
        if (typeof content === "string") {
          const parsed = JSON.parse(content);
          return parsed.instructions && Array.isArray(parsed.instructions);
        }

        return false;
      } catch (error) {
        return false;
      }
    },

    /**
     * Renders content for any item, handling structured mission instructions, markdown content, and HTML content
     */
    renderToHTML(item) {
      if (!item || !item.description) return "";

      console.log("🔄 Rendering html for item:", item);

      try {
        // If the item already has renderedDescription, use it
        if (item.renderedDescription) {
          return item.renderedDescription;
        }

        // Check if content is structured mission instructions (JSON object)
        if (this.isStructuredMissionInstructions(item.description)) {
          return this.formatMissionInstructionsToHtml(item.description);
        }

        // Check if content is already HTML
        if (this.isHtmlContent(item.description)) {
          return item.description;
        }

        // Check if content contains markdown syntax
        if (this.containsMarkdown(item.description)) {
          return this.renderMarkdownWithStreaming(item.description);
        }

        // For plain text content, escape HTML and return
        return this.escapeHtml(item.description);
      } catch (error) {
        console.error("❌ Error rendering HTML for item:", error);
        return this.escapeHtml(item.description || "");
      }
    },

    /**
     * Detects if content is already HTML
     * @param {string} content - The content to analyze
     * @returns {boolean} - true if content contains HTML tags
     */
    isHtmlContent(content) {
      if (!content || typeof content !== "string") return false;

      // Check for common HTML tags
      const htmlTagRegex = /<[^>]*>/;
      return htmlTagRegex.test(content);
    },

    /**
     * Detects if content contains markdown syntax
     * @param {string} content - The content to analyze
     * @returns {boolean} - true if content contains markdown syntax
     */
    containsMarkdown(content) {
      if (!content || typeof content !== "string") return false;

      // Check for common markdown patterns
      const markdownPatterns = [
        /^#{1,6}\s/, // Headers
        /\*\*.*?\*\*/, // Bold
        /\*.*?\*/, // Italic
        /\[.*?\]\(.*?\)/, // Links
        /!\[.*?\]\(.*?\)/, // Images
        /^[-*+]\s/, // Unordered lists
        /^\d+\.\s/, // Ordered lists
        /`.*?`/, // Inline code
        /```[\s\S]*?```/, // Code blocks
        /^>\s/, // Blockquotes
        /~~.*?~~/, // Strikethrough
        /^---$/, // Horizontal rules
      ];

      return markdownPatterns.some((pattern) => pattern.test(content));
    },

    /**
     * Escapes HTML characters to prevent XSS
     * @param {string} text - The text to escape
     * @returns {string} - The escaped text
     */
    escapeHtml(text) {
      if (!text || typeof text !== "string") return "";

      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
  },
};
</script>

<style lang="scss" scoped>
// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .action-buttons {
    width: auto;
    padding: 20px;
    margin: 0 100px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.create-dialog-content {
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 1rem;
    color: var(--v-missionAccent-base);
  }

  .stepper-styles {
    background: none !important;
    // background-color: var(--v-background-base);

    // Remove box-shadow from v-stepper
    &.v-sheet.v-stepper:not(.v-sheet--outlined) {
      box-shadow: none !important;
    }
  }
}

.v-stepper__label {
  text-align: center !important;
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;

  .galaxy-text {
    color: var(--v-galaxyAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }

  .mission-text {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }
}

.v-btn:not(.v-btn--round).v-size--default {
  background-color: var(--v-background-base) !important;
}

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

.model-breakdown {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(var(--v-background-base), 0.1);
  border-radius: 4px;
  border: 1px solid rgba(var(--v-missionAccent-base), 0.2);
}

.model-breakdown-title {
  color: var(--v-galaxyAccent-base);
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.125rem 0;
  font-size: 0.65rem;
  color: var(--v-missionAccent-base);
  opacity: 0.9;
}

.model-name {
  font-weight: 600;
  color: var(--v-galaxyAccent-base);
}

.model-tokens {
  opacity: 0.7;
}

.model-cost {
  font-weight: 600;
  color: var(--v-missionAccent-base);
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

// Fix scrolling issues with textareas
.input-field {
  .v-text-field__slot {
    textarea {
      scroll-behavior: smooth;
      overflow-y: auto;
    }
  }
}

// Ensure smooth scrolling for the entire dialog content
.create-dialog-content {
  scroll-behavior: smooth;
}

// Galaxy treeview styles
.galaxy-treeview-container {
  width: 90vw;
  max-width: 90vw;
  height: 60vh;
  margin: 1rem auto;
  padding: 1rem;
  background-color: rgba(var(--v-background-base), 0.8);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  margin-top: 0px;
  padding-top: 0px;

  // Create a mask that fades out at left and right edges using linear gradients
  mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
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
  flex-direction: column;
  width: 100%;
  // gap: 0.5rem;
  margin-top: 10px;
  margin-bottom: 10px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.treeview-label-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--v-missionAccent-base);
  font-weight: 500;
  line-height: 1.3;
  word-wrap: break-word;
}

.treeview-description {
  font-size: 0.7rem;
  color: var(--v-missionAccent-base);
  opacity: 0.8;
  line-height: 1.4;
  margin-left: 50px;
  margin-top: -3px;

  // margin-left: 50px;
  // margin-top: -3px;
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
  max-width: 280px;
  width: 100%;
  text-align: left;

  h2 {
    font-size: 0.8rem;
    font-weight: 600;
    margin: 0.5rem 0 0.25rem 0;
    color: var(--v-galaxyAccent-base);
  }

  h3 {
    font-size: 0.75rem;
    font-weight: 600;
    margin: 0.25rem 0 0.125rem 0;
    color: var(--v-missionAccent-base);
  }

  p {
    margin: 0.125rem 0;
  }

  ul {
    margin: 0.125rem 0;
    padding-left: 1rem;
  }

  li {
    margin: 0.0625rem 0;
  }
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

.instructions-emoji {
  font-size: 0.8rem;
  filter: drop-shadow(0 0 2px rgba(0, 150, 255, 0.6));
}

.debug-info {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.7rem;
  color: var(--v-missionAccent-base);
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

.mission-generation-progress-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mission-generation-progress-text {
  color: var(--v-galaxyAccent-base);
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
