<template>
 <v-container>
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <v-progress-circular
          indeterminate
          size="64"
          color="galaxyAccent"
          class="mb-4"
        ></v-progress-circular>
        <p class="loading-message overline">{{ currentLoadingMessage }}</p>
      </div>
    </div>

    <v-row class="text-center" align="center">
      <v-col cols="12" class="pa-0">
        <v-dialog v-model="showDialog" width="50%" light>
          <!-- CREATE BUTTON -->
          
          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                Create new Galaxy Map with A.I.
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <div>
                  <p class="dialog-description">
                    A Galaxy Map is a path of learning... like a course.
                  </p>
                  <p class="dialog-description">
                    Please describe the learning you would like the A.I. to map
                  </p>
                </div>
              </div>
            </div>
            <!-- DIALOG FIELDS -->
            <div class="create-dialog-content">
              <!-- DESCRIPTION -->
              <v-textarea
                :dark="dark"
                :light="!dark"
                class="input-field"
                outlined
                color="missionAccent"
                auto-grow
                clearable
                v-model="description"
                label="Describe what the Galaxy Map should cover"
                :disabled="loading"
                autofocus
              ></v-textarea>
            </div>
            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- CREATE -->
              <v-btn
                outlined
                color="baseAccent"
                @click="handleSubmit()"
                class="mr-2"
                :loading="loading"
                :disabled="disabled"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiCheck }} </v-icon>
                CREATE GALAXY
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
  mdiInformationVariant 
} from "@mdi/js";
import { mapState, mapActions } from "pinia";
import useRootStore from "@/store/index";
import { db, functions } from "@/store/firestoreConfig";
export default {
  name: "AICreateGalaxyDialog",
  props: {
    showDialog: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  data: () => ({
    valid: false,
    description: "",
    mdiClose,
    mdiCheck,
    mdiRobotExcited,
    mdiInformationVariant,
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
      "Calibrating educational coordinates..."
    ],
    currentLoadingMessage: "",
    loadingMessageInterval: null
  }),
  computed: {
    ...mapState(useRootStore, ["person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    disabled() {
      return this.loading || this.description.length === 0;
    },
  },
  watch: {
    loading(newValue) {
      if (newValue) {
        this.startLoadingMessages();
      } else {
        this.stopLoadingMessages();
      }
    }
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar"]),
    closeDialog() {
      this.description = "";
      this.$emit('update:showDialog', false);
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
    async handleSubmit() {
      if (!this.loading && this.description.trim()) {
        let courseDocRef;
        let previousNodeId = null;
        try {
          this.loading = true;

          const topicResponse = await this.$openai.chat.completions.create({
            model: "o4-mini",
            // temperature: 0.4,
            messages: [
              {
                role: "system",
                content: `
                
                You are a master curriculum architect. Given a subject, generate an **exhaustive and logical** sequence of learning topics 
                that build from beginner to mastery. Each topic should be phrased as a **short, descriptive title**. 

                CRITICAL: You must return ONLY a raw JSON array of strings. 
                Do not include any markdown formatting, code blocks, or explanations. 
                The response must be a valid JSON array that can be parsed with JSON.parse().

                Example valid response format (return exactly this format, no markdown, no code blocks):
                ["Introduction to Basic Concepts", "Core Principles", "Advanced Techniques"]

                Do not include lesson content or tasks.`,
              },
              {
                role: "user",
                content: `Generate a topic sequence for mastering ${this.description}`
              }
            ]
          });

          console.log("Raw AI Response:", topicResponse.choices[0].message.content);
          console.log("Response type:", typeof topicResponse.choices[0].message.content);
          console.log("Response length:", topicResponse.choices[0].message.content.length);
          console.log("First 100 characters:", topicResponse.choices[0].message.content.substring(0, 100));

          let topicList;
          try {
            const response = topicResponse.choices[0].message.content;
            // Extract JSON array from the response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
              throw new Error("No JSON array found in response");
            }
            const jsonStr = jsonMatch[0];
            console.log("Extracted JSON string:", jsonStr);
            topicList = JSON.parse(jsonStr);
            console.log("Successfully parsed micro JSON:", topicList);
          } catch (error) {
            console.error("Error parsing micro response:", error);
            console.log("Raw micro response:", topicResponse.choices[0].message.content);
            throw new Error("Failed to parse micro response into valid JSON format");
          }

          // Generate title and description using AI
          const titleResponse = await this.$openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `
                
                You are a course title and description generator. Given a user's learning request and a list of topics, 
                generate a compelling title and concise description for the course.

                CRITICAL: Return ONLY a raw JSON object with "title" and "description" keys. 
                Do not include any explanatory text, markdown formatting, or code blocks. 
                The response must be a valid JSON object that can be parsed with JSON.parse().

                Example valid response format:
                {
                  "title": "Mastering Vue.js: From Basics to Advanced Patterns",
                  "description": "A comprehensive journey through Vue.js development, covering everything from fundamental concepts to advanced implementation patterns."
                }`,
              },
              {
                role: "user",
                content: `Generate a title and description for a course about: ${this.description}\n\nTopics to be covered:\n${topicList.join('\n')}`
              }
            ]
          });

          let courseMetadata;
          try {
            const response = titleResponse.choices[0].message.content;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error("No JSON object found in response");
            }
            const jsonStr = jsonMatch[0];
            console.log("Extracted metadata JSON:", jsonStr);
            courseMetadata = JSON.parse(jsonStr);
            console.log("Successfully parsed metadata:", courseMetadata);
          } catch (error) {
            console.error("Error parsing metadata response:", error);
            console.log("Raw metadata response:", titleResponse.choices[0].message.content);
            throw new Error("Failed to parse course metadata into valid JSON format");
          }

          const topicsWithTasks = [];
          for (let topic of topicList) {
            const microResponse = await this.$openai.chat.completions.create({
              model: "gpt-4o-mini",
              temperature: 0.4,
              messages: [
                {
                  role: "system",
                  content: `
                  
                  You are a learning experience designer. Given a topic, break it down into **bite-sized lessons** 
                  that take **5 minutes or less** to complete. For each micro-lesson, provide:\n
                  \n
                  1. A **short explanation** of the concept\n
                  2. 1–3 short **actions** a learner should take to master the concept.\n
                  \n
                  CRITICAL: Return ONLY a raw JSON array of objects. Each object must have "lesson", "learning", and "actions" keys. 
                  Do not include any explanatory text, markdown formatting, or code blocks. 
                  The response must be a valid JSON array that can be parsed with JSON.parse().

                  Example valid response format (return exactly this format, no markdown, no code blocks, no explanatory text):
                  [
                    {
                      "lesson": "Basic Concept",
                      "learning": "Explanation of the concept",
                      "actions": ["Action 1", "Action 2"]
                    }
                  ]`,
                },
                {
                  role: "user",
                  content: `Break down the topic: \"${topic}\"`
                }
              ]
            });

            console.log("Raw Micro Response:", microResponse.choices[0].message.content);
            console.log("Micro Response type:", typeof microResponse.choices[0].message.content);
            console.log("Micro Response length:", microResponse.choices[0].message.content.length);

            let tasks;
            try {
              const response = microResponse.choices[0].message.content;
              // Extract JSON array from the response
              const jsonMatch = response.match(/\[[\s\S]*\]/);
              if (!jsonMatch) {
                throw new Error("No JSON array found in response");
              }
              const jsonStr = jsonMatch[0];
              console.log("Extracted JSON string:", jsonStr);
              tasks = JSON.parse(jsonStr);
              console.log("Successfully parsed micro JSON:", tasks);
            } catch (error) {
              console.error("Error parsing micro response:", error);
              console.log("Raw micro response:", microResponse.choices[0].message.content);
              throw new Error("Failed to parse micro response into valid JSON format");
            }

            topicsWithTasks.push({
              title: topic,
              description: `Learn about: ${topic}`,
              missions: tasks.map(t => ({
                title: t.lesson,
                description: `<h3>LEARNING</h3><p>${t.learning}</p><h3>ACTIONS</h3><ul>${t.actions.map(a => `<li>${a}</li>`).join('')}</ul>`,
                submissionRequired: false,
                submissionInstructions: "",
                color: "#69a1e2"
              }))
            });
          }

          const courseData = {
            title: courseMetadata.title,
            description: courseMetadata.description,
            topics: topicsWithTasks
          };

          // DALL-E image generation
          const imagePrompt = `Create an image that represents: ${courseData.title}`;
          const generatedImage = await this.$openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
          });

          const downloadAndUploadImage = functions.httpsCallable('downloadAndUploadImage');
          const imageFileName = `course-images/${Date.now()}-${courseData.title.toLowerCase().replace(/\s+/g, '-')}.png`;
          const result = await downloadAndUploadImage({
            imageUrl: generatedImage.data[0].url,
            fileName: imageFileName
          });
          const downloadURL = result.data.downloadURL;

          const formattedCourse = {
            title: courseData.title,
            description: courseData.description,
            image: { url: downloadURL, name: imageFileName },
            mappedBy: {
              name: this.person.firstName + " " + this.person.lastName,
              personId: this.person.id
            },
            contentBy: {
              name: this.person.firstName + " " + this.person.lastName,
              personId: this.person.id
            },
            status: "drafting",
            owner: db.collection("people").doc(this.person.id)
          };

          const objectives = courseData.topics;

          courseDocRef = await db.collection("courses").add(formattedCourse);
          await courseDocRef.update({ id: courseDocRef.id, topicTotal: objectives.length });
          this.setCurrentCourseId(courseDocRef.id);

          for (let i = 0; i < objectives.length; i++) {
            const objective = objectives[i];
            const { x, y } = this.getSpiral(i);

            const nodeData = {
              label: objective.title,
              description: objective.description,
              topicCreatedTimestamp: new Date(),
              x, y,
              taskTotal: objective.missions.length,
              prerequisites: previousNodeId ? [previousNodeId] : []
            };

            if (i === 0) nodeData.group = "introduction";

            const mapNodeDocRef = await db.collection("courses").doc(courseDocRef.id).collection("map-nodes").add(nodeData);
            await mapNodeDocRef.update({ id: mapNodeDocRef.id });

            await db.collection("courses").doc(courseDocRef.id).collection("topics").doc(mapNodeDocRef.id).set({ ...nodeData, id: mapNodeDocRef.id });

            for (let j = 0; j < objective.missions.length; j++) {
              const mission = objective.missions[j];
              const missionData = {
                title: mission.title,
                description: mission.description,
                submissionRequired: mission.submissionRequired,
                submissionInstructions: mission.submissionInstructions,
                color: mission.color,
                orderIndex: j,
                taskCreatedTimestamp: new Date()
              };
              await db.collection("courses").doc(courseDocRef.id).collection("topics").doc(mapNodeDocRef.id).collection("tasks").add(missionData);
            }

            if (previousNodeId) {
              const edgeDocRef = await db.collection("courses").doc(courseDocRef.id).collection("map-edges").add({ from: previousNodeId, to: mapNodeDocRef.id, dashes: false });
              await edgeDocRef.update({ id: edgeDocRef.id });
            }

            previousNodeId = mapNodeDocRef.id;
          }

          await this.sendCourseCreatedEmail(
            this.person.email,
            this.person.firstName + " " + this.person.lastName,
            formattedCourse.title,
            courseDocRef.id
          );

          this.setSnackbar({ show: true, text: "Galaxy created", color: "baseAccent" });
          this.$router.push({ name: "GalaxyView", params: { courseId: courseDocRef.id } });

        } catch (error) {
          console.error("Error creating galaxy:", error);
          this.setSnackbar({ show: true, text: "Error creating galaxy: " + error.message, color: "pink" });
        } finally {
          this.loading = false;
        }
      }
    },
    async sendCourseCreatedEmail(email, name, courseTitle, courseId) {
      const sendCourseCreatedEmail = functions.httpsCallable("sendCourseCreatedEmail");
      return sendCourseCreatedEmail({ email, name, course: courseTitle, courseId });
    },
    getSpiral(index, centerX = 0, centerY = 0, radius = 100) {
      const angle = index * 0.8;
      const spiralGrowth = 50;
      const currentRadius = radius + (index * spiralGrowth);
      const x = centerX + (currentRadius * Math.cos(angle));
      const y = centerY + (currentRadius * Math.sin(angle));
      return { x, y };
    }
  }
}
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
</style> 