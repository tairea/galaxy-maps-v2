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
        <p class="loading-message text-h6">{{ currentLoadingMessage }}</p>
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
                Create new Galaxy Map with AI
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <div>
                  <p class="dialog-description">
                    A Galaxy Map is a path of learning... like a course.
                  </p>
                  <p class="dialog-description">
                    If you would like AI to help create a new Galaxy Map, please describe what you would like to learn.
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
                label="Galaxy description"
                :disabled="loading"
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
      "Searching the starsfor enlightenment...",
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
    // Add this helper function to calculate spiral coordinates
    getSpiral(index, centerX = 0, centerY = 0, radius = 100) {
      const angle = index * 0.8;
      const spiralGrowth = 50;
      const currentRadius = radius + (index * spiralGrowth);
      const x = centerX + (currentRadius * Math.cos(angle));
      const y = centerY + (currentRadius * Math.sin(angle));
      return { x, y };
    },
    async handleSubmit() {
      let courseDocRef;
      let previousNodeId = null;
      console.log('handleSubmit');
      if (!this.loading) {
        try {
          this.loading = true;

          const prompt = `Create a detailed, structured learning path based on this description: "${this.description}"
          Return only a JSON object with the following structure:
          {
            "title": "A clear, concise title for the learning path",
            "description": "A comprehensive description of what will be learned, including prerequisites and expected outcomes",
            "objectives": [
              {
                "title": "A concise title for the objective with a maximum of 30 characters",
                "description": "A detailed description of this learning objective, including what skills or knowledge will be gained",
                "complexity": "basic|intermediate|advanced",
                "missions": [
                  {
                    "title": "Clear, action-oriented title for the task",
                    "description": "Instructions must be structured in the following format with complete sentences:

                      PREREQUISITES:
                      - List all required knowledge, tools, or setup needed before starting
                      - Each prerequisite must be clearly explained

                      CONCEPTS:
                      - Define and explain all key terms and concepts
                      - Provide relevant examples for each concept
                      - Link concepts to practical applications

                      STEP-BY-STEP INSTRUCTIONS:
                      1. Each step must be a complete sentence with a clear action
                      2. Complex steps must be broken down into sub-steps
                      3. Provide validation checks to ensure step completion
                      4. Include example outputs or results where applicable

                      TROUBLESHOOTING:
                      - List common errors or issues that might occur
                      - Provide specific solutions for each problem
                      - Include verification steps to confirm proper resolution

                      ADDITIONAL RESOURCES:
                      - List relevant documentation, tutorials, or references
                      - Specify which parts of the resources are most relevant",
                    "submissionRequired": false,
                    "submissionInstructions": "If submissions is false, this fields should be empty quotes. If submission is required, provide detailed instructions for a submission must include:
                      1. Specific deliverables required
                      2. Format or template to follow
                      3. Success criteria for evaluation
                      4. Common mistakes to avoid
                      5. Examples of successful submissions",
                    "color": "#69a1e2"
                  }
                ]
              }
            ]
          }

          Important formatting guidelines in mission descriptions only:
          1. Use HTML tags for all text formatting
          2. Use <h3> for section headers
          3. Use <ul> and <li> for unordered lists
          4. Use <ol> and <li> for ordered lists/steps
          5. Use <br> for line breaks between sections
          6. Use <p> for paragraphs of text
          7. Use <code> for code examples
          8. Use <strong> for emphasis
          9. Maintain consistent formatting throughout all descriptions
          10. Ensure proper nesting of HTML tags

          Content guidelines before:
          1. Every sentence must be complete and grammatically correct
          2. All instructions must be specific and actionable
          3. Use consistent terminology throughout
          4. Include concrete examples for complex concepts
          5. Break down complex tasks into smaller, manageable steps
          6. The first objective must cover setup and prerequisites
          7. Scale missions per objective based on complexity:
             - Basic: 2-3 missions
             - Intermediate: 3-4 missions
             - Advanced: 4-5 missions
          8. The final mission of each objective must have submissionRequired: true
          9. Technical topics must include:
             - Specific code examples with comments
             - Expected outputs
             - Error messages and solutions
             - Testing/validation steps
          10. Environment-specific instructions must specify:
              - Operating system requirements
              - Version numbers
              - Configuration settings
              - Alternative options where applicable

          Review criteria:
          - Text in the missions descriptions must be properly formatted with HTML tags
          - No raw newlines (\n) or markdown
          - Proper nesting of HTML elements
          - Clear visual hierarchy in the content
          - No incomplete sentences or fragments
          - No undefined terminology
          - No ambiguous instructions
          - No missing steps between concepts
          - Clear progression of complexity
          - Explicit success criteria for each step
          - Comprehensive error handling
          - Concrete examples for validation
          - Provide clear code examlpes for instructions that require it

          Adapt the detail level and technical depth based on the complexity of the subject matter while maintaining completeness, accuracy, and consistent HTML formatting.`;

          const response = await this.$openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              { 
                role: 'system', 
                content: 'You are an expert instructional designer that returns only valid JSON without any markdown formatting or code blocks. Create a detailed course, that breaks down the entire learning journey into objectives, missions and step-by-step instructions for each mission. The number of objectives and missions should be appropriate for the complexity of the course. The step by step instructions should be highly detailed and include all necessary information for someone that is not familiar with the subject.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4096
          });

          let jsonString = response.choices[0].message.content;
          // Remove any potential markdown code block syntax
          jsonString = jsonString.replace(/```json\s?|\s?```/g, '');
          console.log('jsonString', jsonString);
          const courseData = JSON.parse(jsonString);
          console.log('courseData', courseData);
          // 2. Generate image with DALL-E
          const imagePrompt = `Create a symbolic representation for a learning course about: ${courseData.title}. The image should be minimalist, professional, and educational.`;
          const generatedImage = await this.$openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
          });

          // 3. Use Cloud Function to handle image download and upload
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
            image: {
              url: downloadURL,
              name: imageFileName,
            },
            mappedBy: {
              name: "",
              image: {
                url: "",
                name: "",
              },
              source: "",
            },
            status: "drafting",
          };
          
          const objectives = courseData.objectives;

          formattedCourse.contentBy = {
            name: this.person.firstName + " " + this.person.lastName,
            personId: this.person.id,
          };
          // add user to mappedBy
          formattedCourse.mappedBy = {
            name: this.person.firstName + " " + this.person.lastName,
            personId: this.person.id,
          };

          formattedCourse.owner = db.collection("people").doc(this.person.id);

          console.log('formattedCourse', formattedCourse);
          console.log('objectives', objectives);

          let courseId;

          try {
            // Add a new document in collection "courses"
            courseDocRef = await db.collection("courses").add(formattedCourse);
            courseDocRef.update({ 
              id: courseDocRef.id,
              topicTotal: objectives.length // Add total number of objectives
            });
            courseId = courseDocRef.id;
            console.log("1: galaxy created - ", courseId);

            //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
            this.setCurrentCourseId(courseDocRef.id);

            // Create nodes and topics for each objective
            for (let i = 0; i < objectives.length; i++) {
              const objective = objectives[i];
              const { x, y } = this.getSpiral(i);
              
              // Create node
              const nodeData = {
                label: objective.title,
                description: objective.description,
                color: "#69a1e2",
                topicCreatedTimestamp: new Date(),
                x: x,
                y: y,
                taskTotal: objective.missions.length,
                prerequisites: previousNodeId ? [previousNodeId] : []
              };

              // Only add group for first node
              if (i === 0) {
                nodeData.group = "introduction";
              }

              const mapNodeDocRef = await db
                .collection("courses")
                .doc(courseDocRef.id)
                .collection("map-nodes")
                .add(nodeData);
                
              console.log('adding node '+ i + ': ',  nodeData.label);

              // Update node with its ID
              await mapNodeDocRef.update({ id: mapNodeDocRef.id });
              
              // Create topic
              await db
                .collection("courses")
                .doc(courseDocRef.id)
                .collection("topics")
                .doc(mapNodeDocRef.id)
                .set({
                  ...nodeData,
                  id: mapNodeDocRef.id
                });
              console.log('- added topic: ', nodeData.label)

              // Create missions for this topic
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

                await db
                  .collection("courses")
                  .doc(courseDocRef.id)
                  .collection("topics")
                  .doc(mapNodeDocRef.id)
                  .collection("tasks")
                  .add(missionData);
                console.log('- added mission '+ j + ': ', mission.title)
              }

              // Create edge if there's a previous node
              if (previousNodeId) {
                const edgeDocRef = await db
                  .collection("courses")
                  .doc(courseDocRef.id)
                  .collection("map-edges")
                  .add({
                    from: previousNodeId,
                    to: mapNodeDocRef.id,
                    dashes: false
                  });

                await edgeDocRef.update({ id: edgeDocRef.id });
                console.log('- adding edge')
              }

              previousNodeId = mapNodeDocRef.id;
            }

            // send admins an email notification of a new course (email, name, course, courseId)
            await this.sendCourseCreatedEmail(
              this.person.email,
              this.person.firstName + " " + this.person.lastName,
              formattedCourse.title,
              courseId,
            );
            console.log("5: email sent to author");

            } catch (error) {
              this.loading = false;
              console.error("Error creating galaxy: ", error);
              this.setSnackbar({
                show: true,
                text: "Error creating galaxy: " + error.message,
                color: "pink",
              });
            }
        } catch (error) {
          console.error('AI Generation Error:', error);
          this.setSnackbar({
            show: true,
            text: "Error generating galaxy: " + error.message,
            color: "pink",
          });
          this.loading = false;
        } finally {
          console.log("5: Galaxy map successfully created");
          this.loading = false;
          // this.closeDialog();
          // route to newly created galaxy
          this.setSnackbar({
            show: true,
            text: "Galaxy created",
            color: "baseAccent",
          });
          if (courseDocRef) {
            this.$router.push({
              name: "GalaxyView",
              params: {
                courseId: courseDocRef.id,
              },
            });
          }
        }
      }
    },
    sendCourseCreatedEmail(email, name, courseTitle, courseId) {
      let data = {
        email: email,
        name: name,
        course: courseTitle,
        courseId: courseId,
      };
      console.log("sending new map created email");
      const sendCourseCreatedEmail = functions.httpsCallable("sendCourseCreatedEmail");
      return sendCourseCreatedEmail(data);
    },
    startLoadingMessages() {
      // Set initial message
      this.currentLoadingMessage = this.loadingMessages[0];
      
      // Change message every 3 seconds
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
    // Make sure to clear interval when component is destroyed
    beforeDestroy() {
      this.stopLoadingMessages();
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