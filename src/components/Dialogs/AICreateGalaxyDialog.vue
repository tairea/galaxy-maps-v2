<template>
 <v-container>
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
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar"]),
    closeDialog() {
      this.description = "";
      this.$emit('update:showDialog', false);
    },
    // Add this helper function to calculate spiral coordinates
    getSpiral(index, centerX = 0, centerY = 0, radius = 100) {
      const angle = index * 0.8;
      const spiralGrowth = 30;
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

          const prompt = `Create a structured learning path based on this description: "${this.description}"
          Return only a JSON object with the following structure:
          {
            "title": "A clear, concise title for the learning path",
            "description": "A detailed description of what will be learned in the course",
            "objectives": ["5-10 specific learning objectives, with the first objective covering onboarding and ensuring the user has the necessary tools and setup to complete the course. 
              {
                "title": "A concise title for the objective with a maximum of 30 characters",
                "description": "The objective description should be concise with a maximum of 200 characters."
              }
            ]
          }`;

          const response = await this.$openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { 
                role: 'system', 
                content: 'You are a helpful assistant that returns only valid JSON without any markdown formatting or code blocks.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
          });

          let jsonString = response.choices[0].message.content;
          // Remove any potential markdown code block syntax
          jsonString = jsonString.replace(/```json\s?|\s?```/g, '');
          const courseData = JSON.parse(jsonString);
          
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
          console.log('formattedCourse', formattedCourse);
          
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
                taskTotal: 0,
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
                
              console.log('adding node '+ i + ': ',  mapNodeDocRef.id);

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
              console.log('- adding topic')

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
          this.closeDialog();
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

</style> 