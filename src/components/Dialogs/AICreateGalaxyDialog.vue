<template>
  <v-container>
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <v-progress-circular indeterminate size="50" color="galaxyAccent" class="mb-4">
          <v-icon color="galaxyAccent" size="24" class="robot-dance">{{ mdiRobotExcited }}</v-icon>
        </v-progress-circular>
        <p class="loading-message overline">{{ currentLoadingMessage }}</p>
        <p class="token-usage overline">Total Tokens: {{ totalTokensUsed.toLocaleString() }}</p>
        <p class="token-breakdown overline">
          Input: {{ totalInputTokens.toLocaleString() }} | Output:
          {{ totalOutputTokens.toLocaleString() }}
        </p>
        <!-- v-stepper of stars > planets > missions creation status -->
        <v-stepper dark class="stepper-styles text-center" v-model="stepper"></v-stepper>
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
                    A Galaxy Map is a journey map towards your target destination.
                  </p>
                  <p class="dialog-description">
                    This could be a project, a course, a goal, a skill, a life goal, etc.
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
                <v-stepper-header>
                  <!-- Header step 1: Describe your desired destination -->
                  <v-stepper-step :step="1" color="missionAccent">
                    <div class="text-center">Describe the desired destination</div>
                  </v-stepper-step>
                  <v-divider v-if="showSecondStepperStep"></v-divider>

                  <v-stepper-step v-if="showSecondStepperStep" :step="2" color="missionAccent">
                    <div class="text-center">Some more context</div>
                  </v-stepper-step>
                  <v-divider v-if="showThirdStepperStep"></v-divider>

                  <v-stepper-step v-if="showThirdStepperStep" :step="3" color="missionAccent">
                    <div class="text-center">Galaxy Map Layout</div>
                  </v-stepper-step>
                </v-stepper-header>

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
                    label="What would you like me to create a Galaxy Maps for?"
                    :disabled="loading"
                    autofocus
                  ></v-textarea>

                  <div class="action-buttons">
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
                      NEXT
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
                      NEXT
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

                <v-stepper-content :step="3">
                  <div>
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

                  <!-- TOKEN USAGE SUMMARY -->
                  <div class="token-summary mt-4 mb-4">
                    <p class="dialog-description">
                      <v-icon color="galaxyAccent" small>{{ mdiInformationVariant }}</v-icon>
                      Total AI tokens used so far:
                      <span class="galaxyAccent--text font-weight-bold">{{
                        formattedTokenUsage
                      }}</span>
                    </p>
                    <p class="dialog-description" style="font-size: 0.7rem; opacity: 0.8">
                      Input: {{ totalInputTokens.toLocaleString() }} | Output:
                      {{ totalOutputTokens.toLocaleString() }}
                    </p>
                  </div>

                  <!-- ACTION BUTTONS -->
                  <div class="action-buttons mt-8">
                    <v-btn
                      outlined
                      :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                      class="mr-4"
                      @click="stepper = 2"
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
                      @click="thirdStep()"
                      class="mx-2"
                      :loading="loading"
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
  GalaxyCreationResponseSchema,
  FirstStepResponseSchema,
  StarsPlanetsSchema,
  MissionsSchema,
} from "@/lib/schemas";
import { zodTextFormat } from "openai/helpers/zod";
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
    currentLoadingMessage: "",
    loadingMessageInterval: null,
    aiGeneratedTitle: "",
    aiGeneratedDescription: "",
    aiGeneratedTopics: [],
    aiGeneratedTasks: [],
    aiGeneratedImage: "",
    showSecondStepperStep: false,
    showThirdStepperStep: false,
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
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar"]),
    closeDialog() {
      this.description = "";
      this.totalTokensUsed = 0; // Reset token counter
      this.totalInputTokens = 0; // Reset input token counter
      this.totalOutputTokens = 0; // Reset output token counter
      this.$emit("update:showFirstDialog", false);
    },
    startLoadingMessages() {
      this.currentLoadingMessage = this.loadingMessages[0];
      this.loadingMessageInterval = setInterval(() => {
        const currentIndex = this.loadingMessages.indexOf(this.currentLoadingMessage);
        const nextIndex = (currentIndex + 1) % this.loadingMessages.length;
        this.currentLoadingMessage = this.loadingMessages[nextIndex];
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

        // =========== Generate course Topics using AI ===========
        //         const systemPrompt = `
        // You are a journey path design assistant for a LMS visualisation platform called Galaxy Maps, that helps users create structured, actionable paths toward reaching their destination. This destination might be personal, professional, educational, project-based, or creative.

        // *Your first task* is to ask thoughtful, relevant questions to fully understand the user's goal, context, and constraints before producing any plan. Your objective is to design the most relevant and helpful journey possible by gathering detailed input.

        // If the user's goal is vague or overly broad, help them clarify it before continuing with the journey design. Ask focused questions to narrow down their intent or guide them toward a more specific outcome that can be realistically planned for.

        // Focus your questioning on the following areas:

        // 1. Intended outcome – What is the user trying to achieve?
        // 2. Who is this for – Is this journey for the user or someone else? (Include relevant background or context)
        // 3. Scope and timeline – What is included or excluded in this goal? Is there a deadline or expected timeframe?
        // 4. Preferred style and prerequisites – Should the journey include specific activities? What has already been done toward this goal?
        // 5. Evidence of completion – How should progress and completion be demonstrated?

        // Use thoughtful, adaptive questioning to uncover relevant details naturally. Until enough information is collected, continue asking clarifying questions.

        // Once sufficient context has been gathered, *your second task* is to generate an **exhaustive and logical** sequence of milestones that get the user from their starting point to their destination or desired outcome.

        // *Your third task* is to break down each milestone to contain an **exhaustive and logical** sequence of steps, and each step should contain an **exhaustive and logical** sequence of actions needed to complete it.

        // So the journey has many 'milestones'
        // Milestones have many 'steps'
        // and Steps have many 'actions'

        // Each action, step, and milestone should build upon the last respectively, and contribute meaningfully toward the user's end goal.

        // Definitions:
        // - A **milestone** is a checkpoint or phase of progress toward the goal.
        // - A **step** is a unit of work within a milestone.
        // - An **action** is a concrete activity the user must do to progress the step (e.g., write something, build something, reflect, research, submit, etc.).

        // Ensure the journey is **exhaustive and logical**: include as many actions, steps, and milestones as needed to help the user reach their intended outcome.
        // `;

        const systemPrompt = `
        You are a journey path assistant. Your job is to help users break down a goal into a complete, logical sequence of learning steps (called Stars). Each Star represents a major milestone or stage of progress. The list should be exhaustive—no big jumps—and flow smoothly from start to finish.

        Before generating the Star titles, ask the user for the following if it’s not already clear:
        1. What is the destination? (What should someone be able to do at the end?)
        2. Who is this for? (Age, experience level, background, etc.)
        3. What is the starting point? (What do they already know or can do?)

        Once the above is clear, output only a JSON object with these keys:
        - title: The journey title
        - description: A brief paragraph about the journey
        - stars: An array of Star titles (learning steps), listed in the order they should be completed

        Example output:
        {
          "title": "Journey Title",
          "description": "Brief paragraph about the Journey",
          "stars": [
            "1: Title",
            "2: Title",
            "3: Title"
          ]
        }
        No explanation or extra commentary. Output only the JSON object.
        `;

        const aiResponse = await this.$openai.responses.parse({
          model: "gpt-4o-mini",
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: this.description },
          ],
          text: {
            // format: zodTextFormat(GalaxyCreationResponseSchema, "galaxy_creation"),
            format: zodTextFormat(FirstStepResponseSchema, "first_step_response"),
          },
          store: true,
        });

        console.log("Raw AI response:", aiResponse);

        // Track token usage
        if (aiResponse.usage) {
          const inputTokens = aiResponse.usage.input_tokens || 0;
          const outputTokens = aiResponse.usage.output_tokens || 0;
          const totalTokens = aiResponse.usage.total_tokens || 0;

          this.totalInputTokens += inputTokens;
          this.totalOutputTokens += outputTokens;
          this.totalTokensUsed += totalTokens;

          console.log(
            `Tokens used in this call: ${totalTokens} (Input: ${inputTokens}, Output: ${outputTokens}), Total tokens: ${this.totalTokensUsed}`,
          );
        }

        // store the response id for the next ai call
        this.previousResponseId = aiResponse.id;

        // Get the parsed response (already validated by zodTextFormat)
        let parsed;
        try {
          parsed = aiResponse.output_parsed;
          if (!parsed) {
            throw new Error("No parsed response received from AI");
          }
        } catch (error) {
          console.error("Failed to get parsed response:", error);
          this.setSnackbar({
            show: true,
            text: error.message || "Invalid response format from AI. Please try again.",
            color: "error",
          });
          return;
        }

        // Check if it's gathering context or stars list
        if (parsed.stars && Array.isArray(parsed.stars) && parsed.title && parsed.description) {
          // It's a stars list - proceed to next step
          console.log("Stars list received:", parsed);
          // Store the journey metadata
          this.aiGeneratedGalaxyMap = {
            journeyTitle: parsed.title,
            journeyDescription: parsed.description,
            milestones: parsed.stars,
          };
          // Generate Map from Stars List x 2 more layers (Planets > Missions)
          this.generateMapFromStarsList(parsed);
        } else if (
          parsed.status === "gathering_context" &&
          parsed.questions &&
          Array.isArray(parsed.questions)
        ) {
          // It's gathering context - show questions
          console.log("Gathering context questions:", parsed.questions);
          this.aiGatheringContextQuestions = parsed.questions;
          this.showSecondStepperStep = true;
          this.stepper = 2;
          const endTime = Date.now();
          const timeString = this.formatExecutionTime(startTime, endTime);
          console.log(
            `Stopping to ask questions after ${timeString} (${endTime - startTime}ms total)`,
          );
        } else {
          console.warn("Unknown response format from AI:", parsed);
          this.setSnackbar({
            show: true,
            text: "Unexpected response format from AI. Please try again.",
            color: "warning",
          });
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
      } finally {
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
            // format: zodTextFormat(GalaxyCreationResponseSchema, "galaxy_creation"),
            format: zodTextFormat(FirstStepResponseSchema, "second_step_response"),
          },
          store: true,
        });

        console.log("aiSecondResponse", aiSecondResponse);

        // Track token usage
        if (aiSecondResponse.usage) {
          const inputTokens = aiSecondResponse.usage.input_tokens || 0;
          const outputTokens = aiSecondResponse.usage.output_tokens || 0;
          const totalTokens = aiSecondResponse.usage.total_tokens || 0;

          this.totalInputTokens += inputTokens;
          this.totalOutputTokens += outputTokens;
          this.totalTokensUsed += totalTokens;

          console.log(
            `Tokens used in this call: ${totalTokens} (Input: ${inputTokens}, Output: ${outputTokens}), Total tokens: ${this.totalTokensUsed}`,
          );
        }

        this.previousResponseId = aiSecondResponse.id;

        // Get the parsed response (already validated by zodTextFormat)
        let parsed;
        try {
          parsed = aiSecondResponse.output_parsed;
          if (!parsed) {
            throw new Error("No parsed response received from AI");
          }
        } catch (error) {
          console.error("Failed to get parsed response:", error);
          this.setSnackbar({
            show: true,
            text: error.message || "Invalid response format from AI. Please try again.",
            color: "error",
          });
          return;
        }

        // Check if it's gathering context or stars list
        if (parsed.stars && Array.isArray(parsed.stars) && parsed.title && parsed.description) {
          // It's a stars list - proceed to next step
          console.log("Stars list received:", parsed);
          // Store the journey metadata
          this.aiGeneratedGalaxyMap = {
            journeyTitle: parsed.title,
            journeyDescription: parsed.description,
            stars: parsed.stars,
          };
          // Generate Map from Stars List x 2 more layers (Planets > Missions)
          this.generateMapFromStarsList(parsed);
        } else if (
          parsed.status === "gathering_context" &&
          parsed.questions &&
          Array.isArray(parsed.questions)
        ) {
          // It's gathering context - show questions
          console.log("Gathering context questions:", parsed.questions);
          this.aiGatheringContextQuestions = parsed.questions;
          this.aiGatheringContextAnswers = [];
          this.showSecondStepperStep = true;
          this.stepper = 2;
        } else {
          console.warn("Unknown response format from AI:", parsed);
          this.setSnackbar({
            show: true,
            text: "Unexpected response format from AI. Please try again.",
            color: "warning",
          });
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
      } finally {
        this.loading = false;
      }
    },
    // =========== Save Galaxy Map to DB ===========
    async thirdStep() {
      console.log("thirdStep");
      this.saveGalaxyMaptoDB();
    },
    // =========== Generate Map from Stars List x 2 more layers (Planets > Missions) ===========
    async generateMapFromStarsList(journeyAndStarsList) {
      console.log("generateMapFromStarsList");

      // Prevent multiple simultaneous submissions
      if (this.loading) {
        console.log("Already processing, ignoring duplicate submission");
        return;
      }

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy map generation process...");

      try {
        this.loading = true;

        // Add a small delay to prevent rapid double-clicks
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("Generating Map from Stars List", journeyAndStarsList);

        const systemPrompt = `
      You are a curriculum architect working inside a learning map system.

      You will receive:
      - A list of Star titles (learning steps) that make up the full journey to a learning destination.
      - A specific Star from that list to focus on.

      Your task is to:
      1. Write a description on what this step is about.
      2. Break this Star down into an exhaustive and logical list of Planets (sub-goals) that represent the essential things a learner must understand or be able to do in order to complete this learning step.

      The Planets should:
      - Be logical and actionable.
      - Flow from foundational to advanced (if applicable).
      - Stay tightly focused on this Star's theme.
      - Be appropriate for the target audience and level of the overall map.

      Return your output in this format:
      {
        "star": "Star Title",
        "description": "Brief paragraph about the Star",
        "planets": [
          "1.1: Planet Title",
          "1.2: Planet Title",
          "1.3: Planet Title",
          ...
        ]
      }

      IMPORTANT: The planet numbering should start with the star index + 1 (e.g., if this is star 2, planets should be "2.1:", "2.2:", etc.)

      You may refer to the full list of Star titles for context to help with scope and progression. Do not include extra commentary or explanations.
      `;

        const starDetails = [];

        // Get PLANETS from AI for each Star
        for (let index = 0; index < journeyAndStarsList.stars.length; index++) {
          const star = journeyAndStarsList.stars[index];

          const aiResponse = await this.$openai.responses.parse({
            model: "gpt-4o-mini",
            input: [
              { role: "system", content: systemPrompt },
              { role: "user", content: journeyAndStarsList.stars.join("\n") },
              { role: "user", content: `Star ${index + 1}: ${star}` },
            ],
            text: {
              format: zodTextFormat(StarsPlanetsSchema, "stars_planets"),
            },
            store: true,
          });

          console.log(`Star ${index + 1} response:`, aiResponse);

          // show some updates

          /* 
          aiResponse.output_parsed returns:

          description: "This step focuses on enabling users to manually control the solenoid valves through the web dashboard. Understanding how to operate the valves manually can help in troubleshooting and provide a way to intervene in the irrigation process when necessary. It also ensures that users can readily interact with the system, reinforcing the practical aspects of the automated irrigation setup."
          planetDetails: Array(7)
          0: {
            planet: 'Understanding the Dashboard Interface', 
            description: 'In this Planet, learners will gain a comprehensive…ling them to navigate and utilize it effectively.', 
            missions: Array(5)}
          1: {
            planet: 'Identifying Valve Control Buttons', 
            description: 'In this Planet, learners will explore and identify…nd interact with the control systems effectively.', 
            missions: Array(5)}
          2: {planet: 'Implementing Manual Control Features', description: 'In this Planet, learners will gain hands-on experi…ions without relying solely on automated systems.', missions: Array(5)}
          3: {planet: 'Testing Manual Operation of Valves', description: 'In this Planet, learners will apply their knowledg… the valves respond correctly to manual commands.', missions: Array(6)}
          4: {planet: 'Monitoring Valve Status on the Dashboard', description: 'By completing this Planet, learners will understan… ensuring they can track operations in real-time.', missions: Array(6)}
          5: {planet: 'Safety Protocols for Manual Operation', description: 'Upon completing this Planet, learners will underst…ng safe practices are observed during operations.', missions: Array(7)}
          6: {planet: 'User Feedback Mechanism for Manual Controls', description: 'In this Planet, learners will understand the impor…ance user interaction and operational efficiency.', missions: Array(7)}
          7: {planet: 'User Feedback Mechanism for Manual Controls', description: 'In this Planet, learners will understand the impor…ance user interaction and operational efficiency.', missions: Array(7)}

(7) ['12.1: Understanding the Dashboard Interface', '12.2: Identifying Valve Control Buttons', '12.3: Implementing Manual Control Features', '12.4: Testing Manual Operation of Valves', '12.5: Monitoring Valve Status on the Dashboard', '12.6: Safety Protocols for Manual Operation', '12.7: User Feedback Mechanism for Manual Controls']
star
: 
"Manual Operation of the Valves via the Dashboard"

          */

          // Track token usage
          if (aiResponse.usage) {
            const inputTokens = aiResponse.usage.input_tokens || 0;
            const outputTokens = aiResponse.usage.output_tokens || 0;
            const totalTokens = aiResponse.usage.total_tokens || 0;

            this.totalInputTokens += inputTokens;
            this.totalOutputTokens += outputTokens;
            this.totalTokensUsed += totalTokens;

            console.log(
              `Tokens used in Star ${
                index + 1
              } call: ${totalTokens} (Input: ${inputTokens}, Output: ${outputTokens}), Total tokens: ${
                this.totalTokensUsed
              }`,
            );
          }

          // Process the response and store it
          if (aiResponse.output_parsed) {
            starDetails.push(aiResponse.output_parsed);
          }

          // Get MISSIONS from AI for each Planet
          const systemPromptMissions = `
        You are a mission designer for an interactive learning map.

        You will receive:
        - A list of Planet titles (sub-goals) that belong to a specific Star (learning step).
        - A specific Planet from that list to focus on.
        - The planet number (e.g., "1.1", "1.2", "2.1", etc.)

        Your task is to:
        1. Write a short description of this Planet (1–2 sentences) that explains what the learner should understand or be able to do when this Planet is completed.
        2. Generate an exhaustive and logical list of Missions that will help the learner complete this Planet.

        The Missions should:
        - Be concrete and action-based (e.g. "Watch a video and answer reflection questions", "Complete a challenge", "Create something", "Apply a concept", etc.)
        - Be appropriate to the level and context of the learner.
        - Support progressive mastery of the Planet's goal.
        - Be numbered using the format: "planetNumber.missionNumber: Mission instructions" (e.g., "1.1.1: Watch introduction video", "1.1.2: Complete practice exercise")

        Return your output in this format:
        {
          "planet": "Planet Title",
          "description": "Brief paragraph about the Planet",
          "missions": [
            "1.1.1: Mission instructions",
            "1.1.2: Mission instructions",
            "1.1.3: Mission instructions",
            ...
          ]
        }

        Use the full list of Planets as context to help determine scope and to avoid overlap. Do not include extra commentary or explanations.
        `;

          const planets = aiResponse.output_parsed.planets;
          const planetDetails = [];
          for (let planetIndex = 0; planetIndex < planets.length; planetIndex++) {
            const planet = planets[planetIndex];
            // Extract planet number from the planet title (e.g., "1.1: Planet Title" -> "1.1")
            const planetNumberMatch = planet.match(/^(\d+\.\d+):/);
            const planetNumber = planetNumberMatch
              ? planetNumberMatch[1]
              : `${index + 1}.${planetIndex + 1}`;

            const missionsResponse = await this.$openai.responses.parse({
              model: "gpt-4o-mini",
              input: [
                { role: "system", content: systemPromptMissions },
                { role: "user", content: `Planet number: ${planetNumber}` },
                { role: "user", content: planets.join("\n") },
                { role: "user", content: planet },
              ],
              text: {
                format: zodTextFormat(MissionsSchema, "missions"),
              },
              store: true,
            });

            console.log(`Planet ${planetIndex + 1} missions response:`, missionsResponse);

            // Track token usage
            if (missionsResponse.usage) {
              const inputTokens = missionsResponse.usage.input_tokens || 0;
              const outputTokens = missionsResponse.usage.output_tokens || 0;
              const totalTokens = missionsResponse.usage.total_tokens || 0;

              this.totalInputTokens += inputTokens;
              this.totalOutputTokens += outputTokens;
              this.totalTokensUsed += totalTokens;

              console.log(
                `Tokens used in Planet ${
                  planetIndex + 1
                } missions call: ${totalTokens} (Input: ${inputTokens}, Output: ${outputTokens}), Total tokens: ${
                  this.totalTokensUsed
                }`,
              );
            }

            // Process the response and store it
            if (missionsResponse.output_parsed) {
              planetDetails.push(missionsResponse.output_parsed);
            }
          }
          // Store the planet details in the star details
          starDetails[index].planetDetails = planetDetails;
        }

        // Now you have all the star details to work with
        console.log("All star details:", starDetails);

        // Store the star details in the galaxy map
        this.aiGeneratedGalaxyMap.starDetails = starDetails;

        // Show the third stepper step for layout selection
        this.showThirdStepperStep = true;
        this.stepper = 3;

        // Calculate and log execution time
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `✅ Galaxy map generation completed in ${timeString} (${endTime - startTime}ms total)`,
        );
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
      } finally {
        this.loading = false;
      }
    },
    // =========== Save Galaxy Map to DB ===========
    async saveGalaxyMaptoDB() {
      this.loading = true;

      let courseDocRef;
      let previousNodeId = null;

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy saving to database process...");

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
              .where("label", "==", star.title)
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
          } catch (taskError) {
            console.error("Error creating task:", taskError);
            // If the task already exists, we can continue
            if (taskError.code === "already-exists") {
              console.log("Task already exists, continuing...");
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
      this.$router.push({ name: "GalaxyView", params: { courseId: courseDocRef.id } });
    },
    async sendCourseCreatedEmail(email, name, courseTitle, courseId) {
      const sendCourseCreatedEmail = functions.httpsCallable("sendCourseCreatedEmail");
      return sendCourseCreatedEmail({ email, name, course: courseTitle, courseId });
    },
    getSpiral(index, centerX = 0, centerY = 0, radius = 100) {
      const angle = index * 0.8;
      const spiralGrowth = 50;
      const currentRadius = radius + index * spiralGrowth;
      const x = centerX + currentRadius * Math.cos(angle);
      const y = centerY + currentRadius * Math.sin(angle);
      return { x, y };
    },
    getZigzag(index, startX = 0, startY = 0, spacing = 200, amplitude = 100) {
      // Calculate horizontal position (moving right)
      const x = startX + index * spacing;

      // Calculate vertical position (zigzag pattern)
      // Even indices go up, odd indices go down
      const y = startY + (index % 2 === 0 ? amplitude : -amplitude);

      return { x, y };
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
    font-size: 0.8rem;
    color: var(--v-missionAccent-base);
  }

  .stepper-styles {
    // background: none;
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
}

.token-breakdown {
  color: var(--v-missionAccent-base);
  margin-top: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.8;
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
</style>
