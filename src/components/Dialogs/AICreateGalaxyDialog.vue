<template>
  <v-container>
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
                    A Galaxy Map breaks down a goal into clear, visual steps,
                    creating a journey that you can track and monitor progress.
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

                  <!-- LAYOUT SELECTION -->
                  <div class="mt-4">
                    <p class="dialog-description">Select the starting layout</p>
                    <p class="dialog-description mt-1">
                      <em>(You can customise your Star positions later)</em>
                    </p>
                    <div class="layout-options">
                      <div
                        class="layout-option"
                        :class="{ selected: mapLayout === 'zigzag' }"
                        @click="mapLayout = 'zigzag'"
                      >
                        <div class="layout-icon">
                          <v-icon>{{ mdiChartLineVariant }}</v-icon>
                        </div>
                        <div class="layout-label">Zigzag</div>
                      </div>
                      <div
                        class="layout-option"
                        :class="{ selected: mapLayout === 'spiral' }"
                        @click="mapLayout = 'spiral'"
                      >
                        <div class="layout-icon">🌀</div>
                        <div class="layout-label">Spiral</div>
                      </div>
                    </div>
                  </div>

                  <div class="action-buttons mt-8">
                    <v-btn
                      outlined
                      color="galaxyAccent"
                      @click="firstStep()"
                      class="mr-2"
                      :loading="loading"
                      :disabled="disabled"
                      :dark="dark"
                      :light="!dark"
                    >
                      <v-icon left> {{ mdiRobotExcited }} </v-icon>
                      CREATE GALAXY MAP
                    </v-btn>

                    <v-btn
                      outlined
                      :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                      class="ml-4"
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
                  <div class="action-buttons">
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
                    <!-- CREATE -->
                    <v-btn
                      outlined
                      color="galaxyAccent"
                      @click="secondStep()"
                      class="mx-2"
                      :loading="loading"
                      :disabled="disabled"
                      :dark="dark"
                      :light="!dark"
                    >
                      <v-icon left> {{ mdiRobotExcited }} </v-icon>
                      CREATE GALAXY MAP
                    </v-btn>

                    <v-btn
                      outlined
                      :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                      class="ml-4"
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
  </v-container>
</template>

<script>
import {
  mdiClose,
  mdiCheck,
  mdiRobotExcited,
  mdiInformationVariant,
  mdiArrowLeft,
  mdiChartLineVariant,
  mdiFamilyTree,
} from "@mdi/js";
import { mapState, mapActions } from "pinia";
import useRootStore from "@/store/index";
import { db, functions } from "@/store/firestoreConfig";
import {
  // GalaxyCreationResponseSchema,
  FirstStepResponseSchema,
  StarsPlanetsSchema,
  MissionsSchema,
  StarsAndPlanetsResponseSchema,
} from "@/lib/schemas";
import { zodTextFormat } from "openai/helpers/zod";
import {
  PlanetsSystemPrompt,
  MissionsSystemPrompt,
  StarsAndPlanetsSystemPrompt,
} from "@/lib/GalaxyMapPrompts";
export default {
  name: "AICreateGalaxyDialog",
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
    mdiChartLineVariant,
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
    savingProgress: 0,
    completedPlanets: 0,
    totalPlanets: 0,
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
    mapLayout: "zigzag",
    aiGeneratedGalaxyMap: {},
    totalTokensUsed: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    transformedStarDetails: [], // <-- add this as a data property
    expandedNodes: [], // <-- add this to track expanded nodes
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
    formattedTokenUsage() {
      return this.totalTokensUsed.toLocaleString();
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
    "aiGeneratedGalaxyMap.starDetails": {
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
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar"]),
    closeDialog() {
      this.description = "";
      this.totalTokensUsed = 0; // Reset token counter
      this.totalInputTokens = 0; // Reset input token counter
      this.totalOutputTokens = 0; // Reset output token counter
      this.aiGeneratedGalaxyMap = {}; // Reset galaxy map
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
      // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
      const inputCost = (this.totalInputTokens / 1000000) * 0.15;
      const outputCost = (this.totalOutputTokens / 1000000) * 0.6;
      const totalCost = inputCost + outputCost;

      return {
        inputCost: inputCost.toFixed(4),
        outputCost: outputCost.toFixed(4),
        totalCost: totalCost.toFixed(4),
      };
    },
    // =========== Generate Galaxy Map with AI ===========
    async firstStep() {
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

        // =========== Generate journey's Stars and Planetsusing AI ===========
        const aiResponse = await this.$openai.responses.parse({
          model: "gpt-4o-mini",
          input: [
            { role: "system", content: StarsAndPlanetsSystemPrompt },
            { role: "user", content: this.description },
          ],
          text: {
            // format: zodTextFormat(GalaxyCreationResponseSchema, "galaxy_creation"),
            format: zodTextFormat(StarsAndPlanetsResponseSchema, "first_step_response"),
          },
          store: true
        });

        console.log("1st A.I. call: Stars and Planets generated ✅. A.I. Response:", aiResponse);

        // Track token usage
        this.trackTokenUsage(aiResponse);

        // store the response id for the next ai call
        this.previousResponseId = aiResponse.id;

        // Get the parsed response (already validated by zodTextFormat)
        const parsedResponse = aiResponse.output_parsed;

        // Check if it's clarification_needed, journey_ready, or stars list
        if (
          parsedResponse.status === "journey_ready" &&
          parsedResponse.stars &&
          Array.isArray(parsedResponse.stars) &&
          parsedResponse.journeyTitle &&
          parsedResponse.journeyDescription
        ) {
          // It's a journey_ready response - proceed to next step
          console.log("Journey stars and planets ready received:", parsedResponse);
          // route to AiGalaxyEdit
          this.$router.push({ name: "AiGalaxyEdit", params: { parsedResponse: parsedResponse } });

        } else if (
          parsedResponse.status === "clarification_needed" &&
          parsedResponse.questions &&
          Array.isArray(parsedResponse.questions)
        ) {
          // It's clarification_needed - show questions
          console.log("Clarification needed questions:", parsedResponse.questions);
          this.aiGatheringContextQuestions = parsedResponse.questions;
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

        // =========== Generate course Tasks (for each Topic) using AI ===========
        // const topicsWithTasks = [];
        // for (let topic of topicList) {
        //   const microResponse = await this.$openai.responses.create({
        //     // model: "gpt-4o-mini",
        //     // temperature: 0.4,
        //     // messages: [
        //     //   {
        //     //     role: "system",
        //     //     content: `

        //     //     You are a learning experience designer. Given a topic, break it down into **bite-sized lessons**
        //     //     that take **5 minutes or less** to complete. For each micro-lesson, provide:\n
        //     //     \n
        //     //     1. A **short explanation** of the concept\n
        //     //     2. 1–3 short **actions** a learner should take to master the concept.\n
        //     //     \n
        //     //     CRITICAL: Return ONLY a raw JSON array of objects. Each object must have "lesson", "learning", and "actions" keys.
        //     //     Do not include any explanatory text, markdown formatting, or code blocks.
        //     //     The response must be a valid JSON array that can be parsed with JSON.parse().

        //     //     Example valid response format (return exactly this format, no markdown, no code blocks, no explanatory text):
        //     //     [
        //     //       {
        //     //         "lesson": "Basic Concept",
        //     //         "learning": "Explanation of the concept",
        //     //         "actions": ["Action 1", "Action 2"]
        //     //       }
        //     //     ]`,
        //     //   },
        //     //   {
        //     //     role: "user",
        //     //     content: `Break down the topic: \"${topic}\"`
        //     //   }
        //     // ]

        //     // trialing the OpenAI Playground > Prompts: "GM - Mission Builder"
        //     prompt: {
        //       id: "pmpt_6868be6c10188190a25b162f4609a8c90e4471babac802c4",
        //       version: "1",
        //       variables: {
        //         topic: topic,
        //       },
        //     },
        //   });

        //   console.log("Raw Micro Response:", microResponse);
        //   console.log("Micro Response type:", typeof microResponse);
        //   console.log("Micro Response length:", microResponse.length);

        //   let tasks;
        //   try {
        //     const response = microResponse.output_text;
        //     // Extract JSON array from the response
        //     const jsonMatch = response.match(/\[[\s\S]*\]/);
        //     if (!jsonMatch) {
        //       throw new Error("No JSON array found in response");
        //     }
        //     const jsonStr = jsonMatch[0];
        //     console.log("Extracted JSON string:", jsonStr);
        //     tasks = JSON.parse(jsonStr);
        //     console.log("Successfully parsed micro JSON:", tasks);
        //   } catch (error) {
        //     console.error("Error parsing micro response:", error);
        //     console.log("Raw micro response:", microResponse.output_text);
        //     throw new Error("Failed to parse micro response into valid JSON format");
        //   }

        //   topicsWithTasks.push({
        //     title: topic,
        //     description: `Learn about: ${topic}`,
        //     missions: tasks.map((t) => ({
        //       title: t.lesson,
        //       description: `<h3>LEARNING</h3><p>${t.learning}</p><h3>ACTIONS</h3><ul>${t.actions
        //         .map((a) => `<li>${a}</li>`)
        //         .join("")}</ul>`,
        //       submissionRequired: false,
        //       submissionInstructions: "",
        //       color: "#69a1e2",
        //     })),
        //   });
        // }
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

      try {
        this.loading = true;

        // Start timing
        const startTime = Date.now();
        console.log("🚀 Starting Galaxy creation process...");

        // second ai call with structured output
        const aiSecondResponse = await this.$openai.responses.parse({
          model: "gpt-4o-mini",
          previous_response_id: this.previousResponseId,
          input: [{ role: "user", content: this.prefixedAnswers.join("\n") }],
          text: {
            format: zodTextFormat(StarsAndPlanetsResponseSchema, "second_step_response"),
          },
          store: true
        });

        console.log(
          "2nd A.I. call: Stars and Planets Generation (after clarification): Response:",
          aiSecondResponse,
        );

        // Track token usage
        this.trackTokenUsage(aiSecondResponse);

        this.previousResponseId = aiSecondResponse.id;

        // Get the parsed response (already validated by zodTextFormat)
        const parsedResponse = aiSecondResponse.output_parsed;

        // Check if it's clarification_needed, journey_ready, or stars list
        if (
          parsedResponse.status === "journey_ready" &&
          parsedResponse.stars &&
          Array.isArray(parsedResponse.stars) &&
          parsedResponse.journeyTitle &&
          parsedResponse.journeyDescription
        ) {
          // It's a journey_ready response - proceed to next step
          console.log("Journey steps ready received:", parsedResponse);

          // route to AiGalaxyEdit
          this.$router.push({ name: "AiGalaxyEdit", params: { parsedResponse: parsedResponse } });

        } else if (
          parsedResponse.status === "clarification_needed" &&
          parsedResponse.questions &&
          Array.isArray(parsedResponse.questions)
        ) {
          // It's clarification_needed - show questions
          console.log("Clarification needed questions:", parsedResponse.questions);
          this.aiGatheringContextQuestions = parsedResponse.questions;
          this.aiGatheringContextAnswers = [];
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

    // =========== Generate Map from Stars List x 2 more layers (Planets > Missions) ===========
    async generateMapFromStarsList(journeyAndStarsList) {
      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy map generation process...");

      try {
        // Note: loading is already true from the calling method (firstStep or secondStep)

        // Add a small delay to prevent rapid double-clicks
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("Layer 1 finished:", journeyAndStarsList);
        console.log("Layer 2: Generating Planets from Stars...");

        // Initialize the galaxy map with journey metadata
        this.aiGeneratedGalaxyMap = {
          journeyTitle: journeyAndStarsList.title,
          journeyDescription: journeyAndStarsList.description,
          starDetails: [],
        };

        // Generate PLANETS from AI for each STAR
        for (let index = 0; index < journeyAndStarsList.stars.length; index++) {
          const star = journeyAndStarsList.stars[index];

          const aiResponse = await this.$openai.responses.parse({
            model: "gpt-4o-mini",
            previous_response_id: this.previousResponseId,
            input: [
              { role: "system", content: PlanetsSystemPrompt },
              { role: "user", content: journeyAndStarsList.stars.join("\n") },
              { role: "user", content: `Star ${index + 1}: ${star}` },
            ],
            text: {
              format: zodTextFormat(StarsPlanetsSchema, "stars_planets"),
            },
            // store: true,
          });

          // Track token usage
          this.trackTokenUsage(aiResponse);

          console.log(`Star ${index + 1} Planets generated ✅. A.I. response:`, aiResponse);

          const parsedPlanetsResponse = aiResponse.output_parsed;

          console.log("parsedPlanetsResponse:", parsedPlanetsResponse);

          const planets = parsedPlanetsResponse.planets;
          this.$set(this.aiGeneratedGalaxyMap.starDetails, index, parsedPlanetsResponse);

          // Update existing star object with planets
          this.$set(this.aiGeneratedGalaxyMap.starDetails[index], "planets", planets);
          // Initialize planet details array for this star, preserving any existing data
          if (!this.aiGeneratedGalaxyMap.starDetails[index].planetDetails) {
            this.$set(this.aiGeneratedGalaxyMap.starDetails[index], "planetDetails", []);
          }

          // Log what we're working with
          console.log(`🔄 Star ${index + 1}: Generating missions for ${planets.length} planets`);

          // loop all PLANETS in this STAR system
          for (let planetIndex = 0; planetIndex < planets.length; planetIndex++) {
            const planet = planets[planetIndex];

            // Extract planet number from the planet title (e.g., "1.1: Planet Title" -> "1.1")
            const planetNumberMatch = planet.match(/^(\d+\.\d+):/);
            const planetNumber = planetNumberMatch
              ? planetNumberMatch[1]
              : `${index + 1}.${planetIndex + 1}`;

            console.log(
              `🔄 Star ${index + 1}: Generating Missions for Planet ${planetIndex + 1}:`,
              planet,
            );

            // Generate MISSIONS from AI for each PLANET
            // const missionsResponse = await this.$openai.responses.parse({
            //   model: "gpt-4o-mini",
            //   input: [
            //     { role: "system", content: MissionsSystemPrompt },
            //     { role: "user", content: `Planet number: ${planetNumber}` },
            //     { role: "user", content: planets.join("\n") },
            //     { role: "user", content: planet },
            //   ],
            //   text: {
            //     format: zodTextFormat(MissionsSchema, "missions"),
            //   },
            //   store: true,
            // });

            const missionsResponse = await this.$openai.responses.create({
              prompt: {
                id: "pmpt_6868be6c10188190a25b162f4609a8c90e4471babac802c4",
                version: "5",
                variables: {
                  planet_number: planetNumber,
                  planets_list: planets.join("\n"),
                  planet: planet,
                },
              },
            });

            // Track token usage
            this.trackTokenUsage(missionsResponse);

            console.log(
              `Planet ${index + 1}.${planetIndex + 1} Missions generated ✅. A.I. response:`,
              missionsResponse,
            );

            // Parse the output_text JSON string to match the MissionsSchema format
            let parsedMissionsData;
            try {
              const jsonText = missionsResponse.output_text;
              const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                throw new Error("No JSON object found in response");
              }
              const jsonStr = jsonMatch[0];
              console.log("Extracted JSON string:", jsonStr);
              parsedMissionsData = JSON.parse(jsonStr);
              console.log("Successfully parsed missions JSON:", parsedMissionsData);
            } catch (error) {
              console.error("Error parsing missions response:", error);
              console.log("Raw missions response:", missionsResponse.output_text);
              throw new Error("Failed to parse missions response into valid JSON format");
            }

            // Process the response and store it
            // Add the planet details to the star immediately for real-time display
            this.$set(
              this.aiGeneratedGalaxyMap.starDetails[index].planetDetails,
              planetIndex,
              parsedMissionsData,
            );
          } // end of for loop for all MISSIONS in this PLANET
        } // end of for loop for all PLANETS in this STAR system

        // Now you have all the star details to work with
        console.log("All Stars > Planets > Missions Generated ✅✅✅:", this.aiGeneratedGalaxyMap);

        // Calculate and log execution time
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `✅ Galaxy map generation completed in ${timeString} (${endTime - startTime}ms total)`,
        );

        // Automatically save the galaxy map to DB since it's complete
        console.log(
          "🚀 Galaxy map a.i. generation complete, now automatically saving to database...",
        );
        await this.saveGalaxyMaptoDB();
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `❌ Galaxy map generation failed after ${timeString} (${endTime - startTime}ms total)`,
        );

        console.error("Error generating galaxy map:", error);
        this.setSnackbar({
          show: true,
          text: "Error generating galaxy map: " + error.message,
          color: "pink",
        });
        // Set loading to false on error so user can retry
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

      let courseDocRef;
      let previousNodeId = null;

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy saving to database process...");

      // Calculate total planets for progress tracking
      this.totalPlanets = 0;
      for (let star of this.aiGeneratedGalaxyMap.starDetails) {
        this.totalPlanets += star.planets.length;
      }

      this.completedPlanets = 0;
      const updateProgress = () => {
        this.completedPlanets++;
        this.savingProgress = (this.completedPlanets / this.totalPlanets) * 100;
      };

      const courseData = {
        title: this.aiGeneratedGalaxyMap.journeyTitle,
        description: this.aiGeneratedGalaxyMap.journeyDescription,
        topics: this.aiGeneratedGalaxyMap.starDetails,
      };

      // DALL-E image generation
      const imagePrompt = `Create an image that represents: ${courseData.description}`;
      const generatedImage = await this.$openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });

      const downloadAndUploadImage = functions.httpsCallable("downloadAndUploadImage");
      const imageFileName = `course-images/${Date.now()}-${courseData.title
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`;
      const result = await downloadAndUploadImage({
        imageUrl: generatedImage.data[0].url,
        fileName: imageFileName,
      });
      const downloadURL = result.data.downloadURL;

      const formattedCourse = {
        title: courseData.title,
        description: courseData.description,
        image: { url: downloadURL, name: imageFileName },
        mappedBy: {
          name: this.person.firstName + " " + this.person.lastName,
          personId: this.person.id,
        },
        contentBy: {
          name: this.person.firstName + " " + this.person.lastName,
          personId: this.person.id,
        },
        status: "drafting",
        owner: db.collection("people").doc(this.person.id),
      };

      const stars = courseData.topics;

      console.log("saving Course: " + courseData.title + " to db");

      courseDocRef = await db.collection("courses").add(formattedCourse);
      await courseDocRef.update({ id: courseDocRef.id, topicTotal: stars.length });
      this.setCurrentCourseId(courseDocRef.id);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        const { x, y } = this.mapLayout === "zigzag" ? this.getZigzag(i) : this.getSpiral(i);

        // create star/topic node
        const nodeData = {
          label: star.star,
          description: star.description,
          topicCreatedTimestamp: new Date(),
          x,
          y,
          taskTotal: star.planets.length,
          prerequisites: previousNodeId ? [previousNodeId] : [],
        };

        if (i === 0) nodeData.group = "introduction";

        let mapNodeDocRef;
        try {
          // create map node
          mapNodeDocRef = await db
            .collection("courses")
            .doc(courseDocRef.id)
            .collection("map-nodes")
            .add(nodeData);
          await mapNodeDocRef.update({ id: mapNodeDocRef.id });

          // create star
          await db
            .collection("courses")
            .doc(courseDocRef.id)
            .collection("topics")
            .doc(mapNodeDocRef.id)
            .set({ ...nodeData, id: mapNodeDocRef.id });
        } catch (nodeError) {
          console.error("Error creating map node:", nodeError);
          if (nodeError.code === "already-exists") {
            console.log("Map node already exists, continuing...");
            // Try to get the existing node reference
            const existingNodes = await db
              .collection("courses")
              .doc(courseDocRef.id)
              .collection("map-nodes")
              .where("label", "==", star.star)
              .limit(1)
              .get();

            if (!existingNodes.empty) {
              mapNodeDocRef = existingNodes.docs[0].ref;
            } else {
              throw nodeError;
            }
          } else {
            throw nodeError;
          }
        }

        // create planets
        for (let j = 0; j < star.planets.length; j++) {
          const planetString = star.planets[j];

          // Get planet details from planetDetails array
          const planetDetail = star.planetDetails ? star.planetDetails[j] : null;

          // Format planet description
          let formattedDescription = `<h3>DESCRIPTION</h3><p>${
            planetDetail ? planetDetail.description : "Planet description not available"
          }</p>`;

          if (planetDetail && planetDetail.missions && planetDetail.missions.length > 0) {
            formattedDescription += "<h3>ACTIONS</h3><ul>";
            planetDetail.missions.forEach((mission) => {
              formattedDescription += `<li>${mission}</li>`;
            });
            formattedDescription += "</ul>";
          }

          const planetData = {
            title: planetString,
            description: formattedDescription,
            submissionRequired: false,
            submissionInstructions: "",
            color: "#69a1e2",
            orderIndex: j,
            taskCreatedTimestamp: new Date(),
          };
          try {
            // save step to db
            const taskDocRef = await db
              .collection("courses")
              .doc(courseDocRef.id)
              .collection("topics")
              .doc(mapNodeDocRef.id)
              .collection("tasks")
              .add(planetData);

            // Update the document with its ID
            await taskDocRef.update({ id: taskDocRef.id });

            console.log("saved Planet: " + planetString + " to db");
            updateProgress(); // Planet creation completed
          } catch (taskError) {
            console.error("Error creating task:", taskError);
            // If the task already exists, we can continue
            if (taskError.code === "already-exists") {
              console.log("Task already exists, continuing...");
              updateProgress(); // Still count as completed even if already exists
            } else {
              throw taskError;
            }
          }
        }

        if (previousNodeId) {
          try {
            const edgeDocRef = await db
              .collection("courses")
              .doc(courseDocRef.id)
              .collection("map-edges")
              .add({ from: previousNodeId, to: mapNodeDocRef.id, dashes: false });
            await edgeDocRef.update({ id: edgeDocRef.id });
          } catch (edgeError) {
            console.error("Error creating edge:", edgeError);
            if (edgeError.code === "already-exists") {
              console.log("Edge already exists, continuing...");
            } else {
              throw edgeError;
            }
          }
        }

        previousNodeId = mapNodeDocRef.id;

        console.log("saved Star: " + star.star + " to db");
      }

      await this.sendCourseCreatedEmail(
        this.person.email,
        this.person.firstName + " " + this.person.lastName,
        formattedCourse.title,
        courseDocRef.id,
      );

      // Calculate and log execution time
      const endTime = Date.now();
      const timeString = this.formatExecutionTime(startTime, endTime);
      console.log(
        `✅ Galaxy saving to DB completed in ${timeString} (${endTime - startTime}ms total)`,
      );
      const cost = this.calculateEstimatedCost();
      console.log(`💰 Total tokens used: ${this.totalTokensUsed.toLocaleString()}`);
      console.log(
        `📊 Token breakdown: Input: ${this.totalInputTokens.toLocaleString()}, Output: ${this.totalOutputTokens.toLocaleString()}`,
      );
      console.log(
        `💵 Estimated cost: $${cost.totalCost} (Input: $${cost.inputCost}, Output: $${cost.outputCost})`,
      );

      this.setSnackbar({
        show: true,
        text: `Galaxy created! Tokens: ${this.totalTokensUsed.toLocaleString()} | Cost: $${
          cost.totalCost
        }`,
        color: "baseAccent",
      });

      // Reset saving state
      this.isSavingToDB = false;
      this.savingProgress = 0;
      this.loading = false;

      this.$router.push({ name: "GalaxyView", params: { courseId: courseDocRef.id } });
    },
    async sendCourseCreatedEmail(email, name, courseTitle, courseId) {
      const sendCourseCreatedEmail = functions.httpsCallable("sendCourseCreatedEmail");
      return sendCourseCreatedEmail({ email, name, course: courseTitle, courseId });
    },
    getSpiral(index, centerX = 0, centerY = 0, radius = 200) {
      const angle = index * 0.8;
      const spiralGrowth = 100;
      const currentRadius = radius + index * spiralGrowth;
      const x = centerX + currentRadius * Math.cos(angle);
      const y = centerY + currentRadius * Math.sin(angle);
      return { x, y };
    },
    getZigzag(index, startX = 0, startY = 0, spacing = 400, amplitude = 200) {
      // Calculate horizontal position (moving right)
      const x = startX + index * spacing;

      // Calculate vertical position (zigzag pattern)
      // Even indices go up, odd indices go down
      const y = startY + (index % 2 === 0 ? amplitude : -amplitude);

      return { x, y };
    },
    updateTransformedStarDetails() {
      console.log("updating Transformed Star Details...");
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
            starNode.children = starDetail.planets.map((planet, planetIndex) => {
              const planetNode = {
                id: `star-${starIndex}-planet-${planetIndex}`,
                name: planet,
                type: "planet",
                children: [],
              };
              if (
                starDetail.planetDetails &&
                starDetail.planetDetails[planetIndex] &&
                starDetail.planetDetails[planetIndex].missions
              ) {
                planetNode.children = starDetail.planetDetails[planetIndex].missions.map(
                  (mission, missionIndex) => ({
                    id: `star-${starIndex}-planet-${planetIndex}-mission-${missionIndex}`,
                    name: mission,
                    type: "mission",
                  }),
                );
              }
              return planetNode;
            });
          }
          return starNode;
        },
      );
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
    // =========== Token Usage Tracking ===========
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
        // Continue execution even if token tracking fails
      }
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
    width: 100%;
    padding: 20px;
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

.layout-options {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.layout-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 2px solid var(--v-missionAccent-base);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
  background-color: var(--v-background-base);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: var(--v-baseAccent-base);
    background-color: rgba(var(--v-baseAccent-base), 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--v-baseAccent-base), 0.3);
  }
}

.layout-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  .v-icon {
    font-size: 2rem;
    color: var(--v-missionAccent-base);
  }
}

.layout-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--v-missionAccent-base);
  font-weight: 500;
  text-align: center;
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
</style>
