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
    async handleSubmit() {
      if (!this.loading) {
        try {
          this.loading = true;

          const prompt = `Create a structured learning path based on this description: "${this.description}"
          Return a JSON object with the following structure:
          {
            "title": "A clear, concise title for the learning path",
            "description": "A detailed description of what will be learned",
            "objectives": ["5-10 specific learning objectives, with the first objective being covering onboarding and ensuring the user has the necessary tools and setup to complete the course"]
          }`;

          const response = await this.$openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500
          });

          // The response structure is different in v4
          const courseData = JSON.parse(response.choices[0].message.content);
          
          // Log for debugging
          console.log('AI Response:', response);
          console.log('Parsed Course Data:', courseData);
          
          const formattedCourse = {
            title: courseData.title,
            description: courseData.description,
            // objectives: courseData.objectives,
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

          let courseId;

          // try {
          //   // Add a new document in collection "courses"
          //   const courseDocRef = await db.collection("courses").add(formattedCourse);
          //   console.log("1");
          //   courseDocRef.update({ id: courseDocRef.id }); // add course id to course
          //   courseId = courseDocRef.id;

          //   //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
          //   this.setCurrentCourseId(courseDocRef.id);

          //   console.log("2");
          //   const mapNodeDocRef = await db
          //     .collection("courses")
          //     .doc(courseDocRef.id)
          //     .collection("map-nodes")
          //     .add({
          //       // hardcoded first node
          //       label: course.title ? course.title + " Intro" : "Map intro",
          //       group: "introduction",
          //       color: "#00E676",
          //       topicCreatedTimestamp: new Date(),
          //       x: 0,
          //       y: 0,
          //       topicTotal: 1,
          //       taskTotal: 0,
          //     });

          //   console.log("3");

          //   // update node obj with docRef.id aka nodeId
          //   await db
          //     .collection("courses")
          //     .doc(courseDocRef.id)
          //     .collection("map-nodes")
          //     .doc(mapNodeDocRef.id)
          //     .update({ id: mapNodeDocRef.id });

          //   console.log("4");
          //   // create topic with node id
          //   await db
          //     .collection("courses")
          //     .doc(courseDocRef.id)
          //     .collection("topics")
          //     .doc(mapNodeDocRef.id)
          //     .set({
          //       // hardcoded first node topic
          //       id: mapNodeDocRef.id,
          //       label: course.title + " Intro",
          //       group: "introduction",
          //       color: "#00E676",
          //       topicCreatedTimestamp: new Date(),
          //       taskTotal: 0,
          //       x: 0,
          //       y: 0,
          //     });

          //   // send admins an email notification of a new course (email, name, course, courseId)
          //   await this.sendCourseCreatedEmail(
          //     this.person.email,
          //     this.person.firstName + " " + this.person.lastName,
          //     course.title,
          //     courseId,
          //   );

          //   } catch (error) {
          //     this.cancel();
          //     console.error("Error creating galaxy: ", error);
          //     this.setSnackbar({
          //       show: true,
          //       text: "Error creating galaxy: " + error.message,
          //       color: "pink",
          //     });
          //   }
          } catch (error) {
            console.error('AI Generation Error:', error);
            this.setSnackbar({
              show: true,
              text: "Error generating galaxy: " + error.message,
              color: "pink",
            });
            this.loading = false;
        } finally {
          console.log("5");
          // route to newly created galaxy
          this.setSnackbar({
            show: true,
            text: "Galaxy created",
            color: "baseAccent",
          });
          // this.$router.push({
          //   name: "GalaxyView",
          //   params: {
          //     courseId: courseDocRef.id,
          //   },
          // });
          console.log("formatedCourse", formattedCourse);

          // this.closeDialog();
          this.loading = false;
        }
      }
    }
  },
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