<template>
  <v-container>
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <v-progress-circular indeterminate size="50" color="galaxyAccent" class="mb-4">
          <v-icon color="galaxyAccent" size="24" class="robot-dance">{{ mdiRobotExcited }}</v-icon>
        </v-progress-circular>
        <p class="loading-message overline">{{ currentLoadingMessage }}</p>
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
                    <div class="text-center">Describe your desired destination</div>
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
import { GalaxyCreationResponseSchema } from "@/lib/schemas";
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
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar"]),
    closeDialog() {
      this.description = "";
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
        const systemPrompt = `
You are a journey path design assistant for a LMS visualisation platform called Galaxy Maps, that helps users create structured, actionable paths toward reaching their destination. This destination might be personal, professional, educational, project-based, or creative.

*Your first task* is to ask thoughtful, relevant questions to fully understand the user's goal, context, and constraints before producing any plan. Your objective is to design the most relevant and helpful journey possible by gathering detailed input.

If the user's goal is vague or overly broad, help them clarify it before continuing with the journey design. Ask focused questions to narrow down their intent or guide them toward a more specific outcome that can be realistically planned for.

Focus your questioning on the following areas:

1. Intended outcome – What is the user trying to achieve?
2. Who is this for – Is this journey for the user or someone else? (Include relevant background or context)
3. Scope and timeline – What is included or excluded in this goal? Is there a deadline or expected timeframe?
4. Preferred style and prerequisites – Should the journey include specific activities? What has already been done toward this goal?
5. Evidence of completion – How should progress and completion be demonstrated?

Use thoughtful, adaptive questioning to uncover relevant details naturally. Until enough information is collected, continue asking clarifying questions.

Once sufficient context has been gathered, *your second task* is to generate an **exhaustive and logical** sequence of milestones that get the user from their starting point to their destination or desired outcome.

*Your third task* is to break down each milestone to contain an **exhaustive and logical** sequence of steps, and each step should contain an **exhaustive and logical** sequence of actions needed to complete it.

So the journey has many 'milestones'
Milestones have many 'steps'
and Steps have many 'actions'

Each action, step, and milestone should build upon the last respectively, and contribute meaningfully toward the user's end goal.

Definitions:
- A **milestone** is a checkpoint or phase of progress toward the goal.
- A **step** is a unit of work within a milestone.
- An **action** is a concrete activity the user must do to progress the step (e.g., write something, build something, reflect, research, submit, etc.).

Ensure the journey is **exhaustive and logical**: include as many actions, steps, and milestones as needed to help the user reach their intended outcome.
`;
        const aiResponse = await this.$openai.responses.parse({
          model: "o4-mini",
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: this.description },
          ],
          text: {
            format: zodTextFormat(GalaxyCreationResponseSchema, "galaxy_creation"),
          },
          store: true,
        });

        console.log("Raw AI response:", aiResponse);

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

        if (parsed.status === "gathering_context") {
          console.log("Still gathering context");
          // ====== show next stepper step 2 (gathering questions view) ======
          this.showSecondStepperStep = true;
          this.stepper = 2;
          this.aiGatheringContext = true;
          this.aiGatheringContextQuestions = parsed.questions || [];
          // this.aiGeneratedImage = parsed.image;

          // Calculate and log execution time even on error
          const endTime = Date.now();
          const timeString = this.formatExecutionTime(startTime, endTime);
          console.log(
            `Stopping to ask questions after ${timeString} (${endTime - startTime}ms total)`,
          );
        } else if (parsed.status === "journey_ready") {
          console.log("journey is ready!");
          console.log("ai response parsed", parsed);
          // Ensure all required fields are present and not null
          if (!parsed.journeyTitle || !parsed.journeyDescription || !parsed.milestones) {
            throw new Error("Missing required fields in journey_ready response");
          }
          this.aiGeneratedGalaxyMap = parsed;
          this.showThirdStepperStep = true;
          this.stepper = 3;

          // Calculate and log execution time
          const endTime = Date.now();
          const timeString = this.formatExecutionTime(startTime, endTime);
          console.log(
            `✅ Galaxy creation completed in ${timeString} (${endTime - startTime}ms total)`,
          );
        } else {
          console.warn("Unknown status in AI response:", parsed.status);
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
          model: "o4-mini",
          previous_response_id: this.previousResponseId,
          input: [{ role: "user", content: this.prefixedAnswers.join("\n") }],
          text: {
            format: zodTextFormat(GalaxyCreationResponseSchema, "galaxy_creation"),
          },
          store: true,
        });

        console.log("aiSecondResponse", aiSecondResponse);
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

        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(`✅ Second step completed in ${timeString} (${endTime - startTime}ms total)`);

        if (parsed.status === "gathering_context") {
          console.log("Still gathering context");
          // ====== show next stepper step 3 (gathering MORE questions view) ======
          this.showThirdStepperStep = true;
          this.stepper = 2;
          this.aiGatheringContextQuestions = parsed.questions || [];
          this.aiGatheringContextAnswers = [];
        } else if (parsed.status === "journey_ready") {
          console.log("journey is ready!");
          console.log("ai response parsed", parsed);
          // Ensure all required fields are present and not null
          if (!parsed.journeyTitle || !parsed.journeyDescription || !parsed.milestones) {
            throw new Error("Missing required fields in journey_ready response");
          }
          this.aiGeneratedGalaxyMap = parsed;
          this.showThirdStepperStep = true;
          this.stepper = 3;
        } else {
          console.warn("Unknown status in AI response:", parsed.status);
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
        topics: this.aiGeneratedGalaxyMap.milestones,
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

      const milestones = courseData.topics;

      console.log("saving Course: " + courseData.title + " to db");

      courseDocRef = await db.collection("courses").add(formattedCourse);
      await courseDocRef.update({ id: courseDocRef.id, topicTotal: milestones.length });
      this.setCurrentCourseId(courseDocRef.id);

      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];

        const { x, y } = this.mapLayout === "zigzag" ? this.getZigzag(i) : this.getSpiral(i);

        // create milestone/topic node
        const nodeData = {
          label: milestone.title,
          description: milestone.description,
          topicCreatedTimestamp: new Date(),
          x,
          y,
          taskTotal: milestone.steps.length,
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

          // create milestone
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
              .where("label", "==", milestone.title)
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

        // create steps
        for (let j = 0; j < milestone.steps.length; j++) {
          const step = milestone.steps[j];

          // Format step description with actions
          let formattedDescription = `<h3>DESCRIPTION</h3><p>${step.description}</p>`;
          if (step.actions && step.actions.length > 0) {
            formattedDescription += "<h3>ACTIONS</h3><ul>";
            step.actions.forEach((action) => {
              formattedDescription += `<li><strong>${action.title}</strong>: ${action.description}</li>`;
            });
            formattedDescription += "</ul>";
          }

          const missionData = {
            title: step.title,
            description: formattedDescription,
            submissionRequired: step.submissionRequired || false,
            submissionInstructions: step.submissionInstructions || "",
            color: step.color || "#69a1e2",
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
              .add(missionData);

            // Update the document with its ID
            await taskDocRef.update({ id: taskDocRef.id });

            console.log("saved Mission: " + step.title + " to db");
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

        console.log("saved Topic: " + milestone.title + " to db");
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

      this.setSnackbar({ show: true, text: "Galaxy created", color: "baseAccent" });
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
