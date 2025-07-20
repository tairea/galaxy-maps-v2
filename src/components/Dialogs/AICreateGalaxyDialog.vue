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
                    A Galaxy Map breaks down a goal into clear, visual steps, creating a journey
                    that you can track and monitor progress.
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
  mdiFamilyTree,
} from "@mdi/js";
import { mapState, mapActions } from "pinia";
import useRootStore from "@/store/index";
import { generateGalaxyMap, saveGalaxyMap } from "@/lib/ff";
import { zodTextFormat } from "openai/helpers/zod";
import { StarsAndPlanetsResponseSchema } from "@/lib/schemas";
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
    aiGeneratedGalaxyMap: {
      stars: [],
    },
    totalTokensUsed: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
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

        // =========== (1st a.i. api call) Generate journey's Stars and Planets using AI ===========
        const aiResponse = await generateGalaxyMap(this.description);

        console.log("1st A.I. call: Stars and Planets generated ✅. A.I. Response:", aiResponse);

        // Track token usage
        this.trackTokenUsage({
          usage: aiResponse.tokenUsage,
        });

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
          this.aiGeneratedGalaxyMap.tokens = {
            totalInputTokens: this.totalInputTokens,
            totalOutputTokens: this.totalOutputTokens,
            totalTokensUsed: this.totalTokensUsed,
          };

          // Save to store first, then route to AiGalaxyEdit
          this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
          this.$router.push({ name: "AiGalaxyEdit" });
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

      // Start timing - moved to beginning to ensure it's always defined
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy creation process...");

      try {
        this.loading = true;

        // second ai call with structured output
        const aiSecondResponse = await this.$openai.responses.parse({
          model: "gpt-4o-mini",
          previous_response_id: this.previousResponseId,
          input: [{ role: "user", content: this.prefixedAnswers.join("\n") }],
          text: {
            format: zodTextFormat(StarsAndPlanetsResponseSchema, "second_step_response"),
          },
          store: true,
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
          parsedResponse.title &&
          parsedResponse.description
        ) {
          // It's a journey_ready response - proceed to next step
          console.log("Journey steps ready received:", parsedResponse);

          // add token data to the galaxy map
          this.aiGeneratedGalaxyMap = parsedResponse;
          this.aiGeneratedGalaxyMap.tokens = {
            totalInputTokens: this.totalInputTokens,
            totalOutputTokens: this.totalOutputTokens,
            totalTokensUsed: this.totalTokensUsed,
          };

          // Save to store first, then route to AiGalaxyEdit
          this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
          this.$router.push({ name: "AiGalaxyEdit" });
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

        // Call the Firebase function to save the galaxy map
        const result = await saveGalaxyMap(this.aiGeneratedGalaxyMap, "zigzag");

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
              type: "planet",
              children: [],
            };
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
