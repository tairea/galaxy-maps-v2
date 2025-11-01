<template>
  <v-container>
    <v-row class="text-center" align="center">
      <v-col cols="12" class="pa-0">
        <v-dialog
          v-model="dialog"
          :width="$vuetify.breakpoint.mdAndUp ? '50%' : '95%'"
          :max-width="$vuetify.breakpoint.mdAndUp ? '800px' : '95vw'"
          :min-height="$vuetify.breakpoint.mdAndUp ? '400px' : 'auto'"
          light
          style="z-index: 1000"
          @click:outside="handleDialogClose"
          @input="handleDialogInput"
        >
          <!-- CREATE BUTTON -->
          <template v-if="edit" v-slot:activator="{ on, attrs }">
            <v-btn
              v-if="edit"
              v-bind="attrs"
              v-on="on"
              outlined
              :color="draft ? 'cohortAccent' : 'galaxyAccent'"
              small
              class="pa-o"
              style="z-index: 100"
            >
              <v-icon class="pr-2" small> {{ mdiPencil }} </v-icon>
              edit galaxy
            </v-btn>
            <v-btn
              v-else
              outlined
              color="baseAccent"
              v-bind="attrs"
              @click="handleCreateButtonClick"
              style="z-index: 100"
              class="create-galaxy-button"
            >
              <v-icon left> {{ mdiPlus }} </v-icon>
              CREATE GALAXY
            </v-btn>
          </template>

          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header">
              <p class="dialog-title">
                {{ edit ? "Edit Galaxy " + course.title : dialogTitle }}
              </p>
              <div class="d-flex align-center">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <div>
                  <p class="dialog-description">
                    A Galaxy Map is a journey map towards a target destination.
                  </p>
                  <p class="dialog-description mt-2">
                    Like the steps you need to take to complete a project, course, skill, or a life
                    goal.
                  </p>
                </div>
              </div>
            </div>

            <!-- Person data loading indicator -->
            <div v-if="!isPersonLoaded" class="text-center my-12">
              <v-progress-circular indeterminate color="missionAccent"></v-progress-circular>
              <p class="mt-4">Loading user data...</p>
            </div>

            <!-- Choose creation mode buttons -->
            <div
              class="creation-mode-options my-12"
              :class="{ 'mobile-layout': $vuetify.breakpoint.smAndDown }"
              v-if="!edit && !creationMode && isPersonLoaded"
            >
              <!-- AI MODE -->
              <v-tooltip v-if="!edit && $vuetify.breakpoint.mdAndUp" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <div
                    v-bind="attrs"
                    v-on="on"
                    class="creation-mode-option galaxy-border"
                    :class="{ selected: creationMode === 'ai' }"
                    @click="openAIDialog"
                  >
                    <div class="creation-mode-icon">
                      <v-icon color="galaxyAccent">{{ mdiRobotExcited }}</v-icon>
                    </div>
                    <div class="creation-mode-label galaxyAccent--text">Create with AI</div>
                    <!-- <div class="creation-mode-description">
                      Let AI help you design your galaxy map
                    </div> -->
                  </div>
                </template>
                <span>Try this new beta feature</span>
              </v-tooltip>

              <!-- AI MODE (Mobile - No Tooltip) -->
              <div
                v-if="!edit && $vuetify.breakpoint.smAndDown"
                class="creation-mode-option galaxy-border"
                :class="{ selected: creationMode === 'ai' }"
                @click="openAIDialog"
              >
                <div class="creation-mode-icon">
                  <v-icon color="galaxyAccent">{{ mdiRobotExcited }}</v-icon>
                </div>
                <div class="creation-mode-label galaxyAccent--text">Create with AI</div>
                <!-- <div class="creation-mode-description">
                  Let AI help you design your galaxy map
                </div> -->
              </div>

              <!-- MANUAL MODE -->
              <div
                class="creation-mode-option base-border"
                :class="{ selected: creationMode === 'manual' }"
                @click="selectManualMode"
              >
                <div class="creation-mode-icon">
                  <v-icon color="baseAccent">{{ mdiPencil }}</v-icon>
                </div>
                <div class="creation-mode-label baseAccent--text">Create Manually</div>
                <!-- <div class="creation-mode-description">Build your galaxy map step by step</div> -->
              </div>
            </div>

            <!-- LEFT SIDE -->
            <div
              class="left-side"
              :class="{ 'mobile-layout': $vuetify.breakpoint.smAndDown }"
              :style="course.title && $vuetify.breakpoint.mdAndUp ? 'width:50%' : 'width:100%'"
              style="margin-top: 10px"
              v-if="shouldShowForm"
            >
              <!-- DIALOG FIELDS -->
              <div class="create-dialog-content">
                <!-- TITLE -->
                <!-- <p class="dialog-description">Galaxy Name:</p> -->
                <v-text-field
                  :dark="dark"
                  :light="!dark"
                  class="input-field"
                  outlined
                  color="missionAccent"
                  v-model="course.title"
                  label="Galaxy name"
                  @input="validateCourseTitle"
                  :rules="[(v) => !!v || 'Galaxy name is required']"
                  :dense="$vuetify.breakpoint.smAndDown"
                ></v-text-field>

                <!-- DESCRIPTION -->
                <!-- <p class="dialog-description">Galaxy Description:</p> -->
                <v-textarea
                  :dark="dark"
                  :light="!dark"
                  class="input-field"
                  outlined
                  color="missionAccent"
                  auto-grow
                  clearable
                  :rows="$vuetify.breakpoint.smAndDown ? 4 : 1"
                  v-model="course.description"
                  label="Galaxy description"
                  :dense="$vuetify.breakpoint.smAndDown"
                ></v-textarea>

                <!-- IMAGE UPLOAD -->
                <!-- <p class="dialog-description">Galaxy Image:</p> -->

                <v-file-input
                  class="input-field"
                  outlined
                  :dark="dark"
                  :light="!dark"
                  color="missionAccent"
                  accept="image/*"
                  v-model="uploadedImage"
                  label="Upload Galaxy Image"
                  @change="storeImage()"
                  prepend-icon=""
                  hide-details
                  :dense="$vuetify.breakpoint.smAndDown"
                  :class="{ 'mb-6': $vuetify.breakpoint.smAndDown }"
                ></v-file-input>
                <v-progress-linear
                  color="missionAccent"
                  :value="percentageGalaxy"
                  :class="{ 'mb-4': $vuetify.breakpoint.smAndDown }"
                ></v-progress-linear>

                <!-- ===== Collaborators field. This allows adding multiple collaborators to the galaxy map ==== -->
                <div v-if="edit">
                  <p class="input-description mt-6">Galaxy Collaborators:</p>
                  <v-autocomplete
                    v-model="selectedCollaboratorIds"
                    :search-input.sync="search"
                    :items="collaborators"
                    @change="search = ''"
                    menu-props="closeOnContentClick"
                    class="input-field text-lowercase select-color"
                    color="missionAccent"
                    outlined
                    :dark="dark"
                    :light="!dark"
                    chips
                    item-text="email"
                    item-value="id"
                    multiple
                  >
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs"
                        :input-value="data.selected"
                        close
                        @click="data.select"
                        @click:close="removeCollaborator(data.item)"
                      >
                        <template>
                          <v-avatar v-if="data.item.image && data.item.image.url" left>
                            <v-img :src="data.item.image.url"></v-img>
                          </v-avatar>
                          {{ data.item.email }}
                        </template>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <template>
                        <v-list-item-avatar v-if="data.item.image && data.item.image.url">
                          <img :src="data.item.image.url" />
                        </v-list-item-avatar>
                        <v-list-item-content>
                          <v-list-item-title v-html="data.item.firstName"></v-list-item-title>
                          <v-list-item-subtitle v-html="data.item.email"></v-list-item-subtitle>
                        </v-list-item-content>
                      </template>
                    </template>
                    <template v-slot:append-item>
                      <div class="d-flex justify-end">
                        <CreateAccountDialog accountType="teacher" @addTeacher="addCollaborator" />
                      </div>
                    </template>
                    <template v-slot:no-data>
                      <p class="ml-4">No Collaborators currently on this Galaxy Map</p>
                    </template>
                  </v-autocomplete>
                </div>

                <!-- ===== Owner field. This is who owns the course e.g. you might be creating the course for an organisation ==== -->
                <!-- 1. dropdown menu of the organisations that the user is in. -->

                <!-- ===== Credit other learning content course ==== -->
                <!-- <div class="author-checkbox-wrap d-flex flex-column my-4">
                  <v-checkbox
                    v-model="notAuthor"
                    dense
                    :dark="dark"
                    :light="!dark"
                    color="missionAccent"
                    class="author-checkbox ma-0"
                    hide-details
                  >
                    <template v-slot:label>
                      <span class="author-checkbox-label"
                        >Not an original course</span
                      >
                    </template>
                  </v-checkbox>
                  <div class="d-flex align-center">
                    <p class="dialog-description pt-1">
                      Tick this box if your are mapping someone elses content
                    </p>
                  </div>
                </div>
                <div v-if="notAuthor">
                  <v-text-field
                    class="input-field"
                    outlined
                    color="missionAccent"
                    v-model="course.contentBy.name"
                    :dark="dark"
                    :light="!dark"
                    label="Name of content creator"
                  ></v-text-field>
                  <v-file-input
                    class="input-field"
                    outlined
                    :dark="dark"
                    :light="!dark"
                    color="missionAccent"
                    accept="image/*"
                    v-model="authorImage"
                    label="Upload content creator image"
                    @change="storeAuthorImage()"
                    prepend-icon=""
                    hide-details="true"
                  ></v-file-input>
                  <v-progress-linear
                    color="missionAccent"
                    :value="percentageAuthor"
                  ></v-progress-linear>
                  <v-text-field
                    class="input-field mt-4"
                    outlined
                    :dark="dark"
                    :light="!dark"
                    color="missionAccent"
                    v-model="course.contentBy.source"
                    label="Source URL of original content"
                  ></v-text-field>
                </div> -->
                <!-- End original author -->
              </div>
              <!-- End create-dialog-content -->
            </div>
            <!-- End of left-side -->

            <!-- RIGHT SIDE -->
            <div
              v-if="shouldShowForm"
              class="right-side"
              :class="{ 'mobile-layout': $vuetify.breakpoint.smAndDown }"
              :style="course.title && $vuetify.breakpoint.mdAndUp ? 'width:50%' : 'width:100%'"
            >
              <!-- Galaxy info panel -->
              <div id="galaxy-info" v-if="course.title" class="mb-2">
                <h2 class="galaxy-label">Galaxy</h2>
                <h1 class="galaxy-title">{{ course.title }}</h1>
                <!-- Status -->
                <p class="galaxy-status overline mb-0">
                  Status: <span class="font-weight-black">{{ course.status }}</span>
                </p>
                <!-- Visibility -->
                <p
                  v-if="course.status === 'submitted'"
                  class="galaxy-status overline mb-0 in-review"
                >
                  awaiting review
                </p>
                <p v-if="courseToEdit" class="galaxy-status overline mb-0">
                  Visibility:
                  <span class="font-weight-black">{{ courseToEdit.visibility }}</span>
                </p>
                <p v-if="course.presentationOnly" class="galaxy-status overline mb-0">
                  <span class="font-weight-black baseAccent--text">Presentation Map</span>
                </p>
                <v-img
                  v-if="course.image && course.image.url"
                  :src="course.image.url"
                  width="100%"
                ></v-img>
                <p class="galaxy-description">{{ course.description }}</p>
              </div>

              <div class="d-flex">
                <div style="width: 50%" class="mr-2">
                  <v-tooltip v-if="edit && course.status !== 'published'" right>
                    <template v-slot:activator="{ on, attrs }">
                      <div v-bind="attrs" v-on="on">
                        <v-select
                          :disabled="course.status !== 'published'"
                          class="input-field mt-4"
                          outlined
                          :dark="dark"
                          :light="!dark"
                          color="missionAccent"
                          v-model="course.visibility"
                          :items="[
                            { text: 'Private (only people added can see)', value: 'private' },
                            {
                              text: 'Unlisted (publicly available, but hidden)',
                              value: 'unlisted',
                            },
                            // Presentations cannot be public as they are not proper maps navigators can progress through
                            ...(course.presentationOnly == false || course.presentationOnly == null
                              ? [{ text: 'Public (all users can see)', value: 'public' }]
                              : []),
                          ]"
                          label="Galaxy Visibility"
                          style="width: 100%"
                        >
                        </v-select>
                      </div>
                    </template>
                    <span>galaxy map must be published before changing visibility</span>
                  </v-tooltip>
                  <v-select
                    v-else-if="edit"
                    :disabled="course.status !== 'published'"
                    class="input-field mt-4"
                    outlined
                    :dark="dark"
                    :light="!dark"
                    color="missionAccent"
                    v-model="course.visibility"
                    :items="[
                      { text: 'Private (only people added can see)', value: 'private' },
                      { text: 'Unlisted (publicly available, but hidden)', value: 'unlisted' },
                      // Presentations cannot be public as they are not proper maps navigators can progress through
                      ...(course.presentationOnly == false || course.presentationOnly == null
                        ? [{ text: 'Public (all users can see)', value: 'public' }]
                        : []),
                    ]"
                    label="Galaxy Visibility"
                    style="width: calc(100% - 25px)"
                  >
                  </v-select>
                </div>
                <div style="width: 50%" class="d-flex justify-center align-center">
                  <PublishGalaxy
                    v-if="edit && course.status !== 'published'"
                    :course="course"
                    :courseTasks="courseTasks"
                    :publicOnly="true"
                  />
                </div>
              </div>
            </div>

            <!-- End of right-side -->
            <!-- ACTION BUTTONS -->
            <div
              v-if="shouldShowForm"
              class="action-buttons"
              :class="{ 'mobile-layout': $vuetify.breakpoint.smAndDown }"
            >
              <!-- UPDATE -->
              <v-btn
                v-if="edit"
                outlined
                color="baseAccent"
                @click="handleUpdateGalaxy"
                class="mx-2"
                :loading="loading"
                :disabled="disabled"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiCheck }} </v-icon>
                UPDATE
              </v-btn>

              <!-- CREATE -->
              <v-btn
                v-else
                outlined
                color="baseAccent"
                @click="handleCreateGalaxy"
                class="mr-2"
                :loading="loading"
                :disabled="disabled || !isFormValid"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiCheck }} </v-icon>
                CREATE GALAXY
              </v-btn>

              <!-- PUBLISH -->
              <!-- <div
                style="width: 200px"
                v-if="edit && courseToEdit.visibility != 'public' && course.visibility == 'public'"
              > -->

              <!-- </div> -->

              <!-- DELETE -->
              <v-btn
                v-if="edit"
                outlined
                color="error"
                @click="deleteDialog()"
                class="ml-2"
                :dark="dark"
                :light="!dark"
              >
                <v-icon left> {{ mdiDelete }} </v-icon>
                DELETE
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
                class="ml-4"
                @click="cancel"
                :disabled="disabled || loading"
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

        <v-dialog v-model="privateDialog" width="40%" light style="z-index: 1000">
          <div v-if="peopleInCourse.length" class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header py-10">
              <p class="dialog-title">Delete Galaxy Map?</p>
              <div class="d-flex align-start">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  <strong>Warning!</strong> You have at least one person currently active in this
                  galaxy.
                  <br />
                  <br />

                  <span v-if="course.public">
                    If you like you can choose to make this course private instead of deleteing
                    which will allow active learners to continue and finish the galaxy, while
                    preventing new learners from being able to start.
                  </span>
                  <span v-else> Are you sure want to continue to Delete this Galaxy </span>
                </p>
              </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- DELETE -->
              <v-btn
                v-if="course.public"
                outlined
                color="missionAccent"
                @click="changeToPrivate(course)"
                :loading="deleting"
              >
                <v-icon left> {{ mdiDelete }} </v-icon>
                make private
              </v-btn>
              <v-btn
                outlined
                color="error"
                @click="deleteDialog()"
                class="ml-4"
                :loading="deleting"
              >
                <v-icon left> {{ mdiDelete }} </v-icon>
                confirm delete
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-4"
                @click="privateDialog = false"
                :disabled="disabled || loading"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog-content -->
        </v-dialog>

        <!-- CONFIRM DELETE DIALOG -->
        <v-dialog v-model="dialogConfirm" width="40%" light style="z-index: 1000">
          <div class="create-dialog">
            <!-- HEADER -->
            <div class="dialog-header py-10">
              <p class="dialog-title"><strong>Warning!</strong> Delete Galaxy Map?</p>
              <div class="d-flex align-start">
                <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
                <p class="dialog-description">
                  Are you sure you want to <strong>DELETE</strong> this
                  <span class="galaxy-text">Galaxy {{ course.title }}</span
                  >?
                  <br />
                  <br />
                  Deleting is permanent!!!
                  <br />
                  <br />
                  <strong>YOU WILL LOSE ALL </strong>
                  <span class="galaxy-text">Galaxy</span> and related
                  <span class="mission-text">Mission</span> data.
                  <br />
                  <br />
                  To confirm type <span class="destroy">"DESTROY"</span> in the box below
                </p>
              </div>
              <v-text-field
                class="input-field ma-5"
                outlined
                color="missionAccent"
                v-model="destroy"
                :dark="dark"
                :light="!dark"
                placeholder="DESTROY"
              ></v-text-field>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="action-buttons">
              <!-- DELETE -->
              <v-btn
                outlined
                color="error"
                @click="confirmDeleteCourse(course)"
                class="ml-2"
                :loading="deleting"
                :disabled="destroy !== 'DESTROY'"
              >
                <v-icon left> {{ mdiDelete }} </v-icon>
                DELETE
              </v-btn>

              <v-btn
                outlined
                :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
                class="ml-4"
                @click="cancelDeleteDialog"
                :disabled="disabled || loading"
              >
                <v-icon left> {{ mdiClose }} </v-icon>
                Cancel
              </v-btn>
            </div>
            <!-- End action-buttons -->
          </div>
          <!-- End create-dialog-content -->
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * CreateEditDeleteGalaxyDialog Component
 *
 * This component handles the creation, editing, and deletion of galaxy maps.
 *
 * Recent fixes implemented:
 * - Added comprehensive validation for person data and course title
 * - Added debugging logs to track data flow
 * - Fixed cloud function parameter validation
 * - Added form validation before submission
 * - Ensured course data is properly initialized at all lifecycle stages
 * - Added proper error handling for missing or invalid data
 *
 * The component now validates:
 * 1. Person data is available (id, email, firstName)
 * 2. Course title is not empty or just whitespace
 * 3. All required parameters are present before sending email
 */
import { db, storage, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import {
  mdiPencil,
  mdiPlus,
  mdiClose,
  mdiCheck,
  mdiDelete,
  mdiInformationVariant,
  mdiRobotExcited,
} from "@mdi/js";
import firebase from "firebase/compat/app";
import clone from "lodash/clone";
import { mapActions, mapState } from "pinia";
import PublishGalaxy from "@/components/GalaxyView/PublishGalaxy.vue";
import CreateAccountDialog from "@/components/Dialogs/CreateAccountDialog.vue";

export default {
  name: "CreateEditDeleteGalaxyDialog",
  components: { PublishGalaxy, CreateAccountDialog },
  props: ["showDialog", "edit", "draft", "courseToEdit"],
  data: () => ({
    mdiPencil,
    mdiPlus,
    mdiClose,
    mdiDelete,
    mdiCheck,
    mdiInformationVariant,
    mdiRobotExcited,
    notAuthor: false,
    dialog: false,
    dialogConfirm: false,
    privateDialog: false,
    destroy: "",
    dialogTitle: "Create a new Galaxy",
    course: {
      title: "",
      description: "",
      image: {
        url: "",
        name: "",
      },
      // contentBy: {
      //   name: "",
      //   image: {
      //     url: "",
      //     name: "",
      //   },
      //   source: "",
      // },
      mappedBy: {
        name: "",
        image: {
          url: "",
          name: "",
        },
        source: "",
      },
      collaboratorIds: [],
      status: "drafting",
    },
    uploadedImage: {},
    authorImage: {},
    percentageGalaxy: 0,
    percentageAuthor: 0,
    disabled: false,
    loading: false,
    deleting: false,
    creationMode: "",
    search: "",
    collaborators: [],
  }),
  computed: {
    ...mapState(useRootStore, ["person", "peopleInCourse", "currentCourseId", "courseTasks"]),

    dark() {
      return this.$vuetify.theme.isDark;
    },
    selectedCollaboratorIds: {
      get() {
        const list =
          this.course && Array.isArray(this.course.collaboratorIds)
            ? this.course.collaboratorIds
            : [];
        return list;
      },
      set(newVal) {
        const ids = Array.isArray(newVal) ? newVal : [];
        this.$set(this.course, "collaboratorIds", ids);
      },
    },
    isFormValid() {
      return (
        this.course.title &&
        this.course.title.trim() &&
        this.course.title.trim().length > 0 &&
        this.person &&
        this.person.id
      );
    },
    isPersonLoaded() {
      return this.person && this.person.id;
    },
    shouldShowForm() {
      return this.isPersonLoaded && (this.edit || this.creationMode === "manual");
    },
  },
  watch: {
    courseToEdit: {
      immediate: true,
      async handler(newVal) {
        if (newVal) {
          this.course = { ...newVal };
          // Ensure required nested objects exist when editing existing course
          this.initializeCourseData();
          await this.initializeCollaborators();
          if (!Array.isArray(this.course.collaboratorIds)) {
            this.$set(this.course, "collaboratorIds", []);
          }
        }
      },
    },
    showDialog(newVal) {
      this.dialog = newVal;
      if (newVal && !this.edit) {
        // Reset course data when opening creation dialog
        this.resetCourseData();
      }
    },
    edit: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // When in edit mode, we don't need creation mode selection
          this.creationMode = "manual";
        }
      },
    },
    person: {
      immediate: true,
      handler(newVal) {
        // console.log("Person data changed:", newVal);
        if (newVal && newVal.id && (!newVal.firstName || !newVal.email)) {
          console.warn(
            "Profile incomplete for person id",
            newVal.id,
            "— missing",
            !newVal.firstName ? "firstName" : "",
            !newVal.email ? "email" : "",
          );
        }
      },
    },
  },
  created() {
    // Initialize course data only once when component is created
    // Only initialize if not already set
    if (!this.course.title) {
      this.initializeCourseData();
    }
  },

  async mounted() {
    if (this.courseToEdit) {
      this.course = { ...this.courseToEdit };
      // Ensure required nested objects exist when editing existing course
      this.initializeCourseData();
      await this.initializeCollaborators();
      if (!Array.isArray(this.course.collaboratorIds)) {
        this.$set(this.course, "collaboratorIds", []);
      }
    }
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar"]),
    cancel() {
      this.dialog = false;
      // Always reset disabled state when canceling
      this.disabled = false;
      if (!this.edit) {
        this.creationMode = "";
        // Reset course data when canceling creation
        this.resetCourseData();
      }
      this.$emit("close");
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },
    async saveCourse(course) {
      this.loading = true;

      // Validate form before proceeding
      if (!this.validateForm()) {
        this.loading = false;
        return;
      }

      // Trim the course title to remove any whitespace
      course.title = course.title.trim();

      // not notAuthor means user is the author
      if (!this.notAuthor) {
        // TODO: add users photo to contentBy
        // TODO: need to allow users to add their photo first
        // get user. save them to contentBy & mappedBy
        this.course.contentBy = {
          name: this.person.firstName + " " + this.person.lastName,
          personId: this.person.id,
        };
      }
      // add user to mappedBy
      this.course.mappedBy = {
        name: this.person.firstName + " " + this.person.lastName,
        personId: this.person.id,
      };

      this.course.owner = db.collection("people").doc(this.person.id);

      let nodeId;
      let courseId;

      try {
        // Add a new document in collection "courses"
        const courseDocRef = await db.collection("courses").add(course);
        console.log("1");
        courseDocRef.update({ id: courseDocRef.id }); // add course id to course
        courseId = courseDocRef.id;

        //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
        this.setCurrentCourseId(courseDocRef.id);
        this.setSnackbar({
          show: true,
          text: "Galaxy created",
          color: "baseAccent",
        });

        console.log("2");
        const mapNodeDocRef = await db
          .collection("courses")
          .doc(courseDocRef.id)
          .collection("map-nodes")
          .add({
            // hardcoded first node
            label: course.title ? course.title + " Intro" : "Map intro",
            group: "introduction",
            color: "#00E676",
            topicCreatedTimestamp: new Date(),
            x: 0,
            y: 0,
            topicTotal: 1,
            taskTotal: 0,
          });

        console.log("3");

        // update node obj with docRef.id aka nodeId
        await db
          .collection("courses")
          .doc(courseDocRef.id)
          .collection("map-nodes")
          .doc(mapNodeDocRef.id)
          .update({ id: mapNodeDocRef.id });

        console.log("4");
        // create topic with node id
        await db
          .collection("courses")
          .doc(courseDocRef.id)
          .collection("topics")
          .doc(mapNodeDocRef.id)
          .set({
            // hardcoded first node topic
            id: mapNodeDocRef.id,
            label: course.title + " Intro",
            group: "introduction",
            color: "#00E676",
            topicCreatedTimestamp: new Date(),
            taskTotal: 0,
            x: 0,
            y: 0,
          });

        // send admins an email notification of a new course (email, name, course, courseId)
        // console.log("Person data:", this.person);
        // console.log("Course data:", course);
        // console.log("CourseId:", courseId);

        // Final validation before sending email
        if (!this.person || !this.person.email || !this.person.firstName) {
          // console.error("Person data is incomplete:", this.person);
          throw new Error("Person data is incomplete");
        }

        if (!course.title || !course.title.trim()) {
          // console.error("Course title is missing or empty:", course.title);
          throw new Error("Course title is missing or empty");
        }

        // console.log("Sending email with data:", {
        //   email: this.person.email,
        //   name: this.person.firstName + " " + this.person.lastName,
        //   course: course.title,
        //   courseId: courseId,
        // });

        try {
          await this.sendCourseCreatedEmail(
            this.person.email,
            this.person.firstName + " " + this.person.lastName,
            course.title,
            courseId,
          );
        } catch (emailError) {
          console.warn("Failed to send 'course created' email. Proceeding anyway.", emailError);
        }

        console.log("5");
        // route to newly created galaxy
        this.$router.push({
          name: "GalaxyView",
          params: {
            courseId: courseDocRef.id,
          },
        });

        this.dialog = false;
        this.loading = false;
      } catch (error) {
        this.cancel();
        console.error("Error writing document: ", error);
      }
      this.course = {};
    },
    async updateCourse(course) {
      // If there is no course id yet, we're in pre-save mode (AI edit before DB save)
      if (!course || !course.id) {
        this.$emit("preSaveUpdate", {
          title: course?.title,
          description: course?.description,
          image: course?.image,
        });
        this.setSnackbar({
          show: true,
          text: "Galaxy details updated (pending save)",
          color: "baseAccent",
        });
        this.dialog = false;
        this.loading = false;
        return;
      }

      this.loading = true;

      // Validate form before proceeding
      if (!this.validateForm()) {
        this.loading = false;
        return;
      }
      if (course.public !== this.courseToEdit.public) {
        course.status = "drafting";
      }

      // changing from public to private/unlisted (no longer visible to all)
      if (this.courseToEdit.public == true && course.visibility != "public") {
        course.public = false;
      }

      try {
        // Retrieve the latest course document
        const courseDoc = await db.collection("courses").doc(course.id).get();
        const courseDocData = courseDoc.data() || {};

        // Resolve owner as a Firestore DocumentReference in a safe, backward-compatible way
        const ownerSource = courseDocData.owner || course.owner || this.person?.id || null;
        let ownerRef;

        if (
          ownerSource &&
          typeof ownerSource === "object" &&
          typeof ownerSource.path === "string"
        ) {
          // Looks like a Firestore DocumentReference-like object
          ownerRef = db.doc(ownerSource.path);
        } else if (typeof ownerSource === "string") {
          // Owner stored as a person id string
          ownerRef = db.collection("people").doc(ownerSource);
        } else {
          // Fallback to current user
          ownerRef = db.collection("people").doc(this.person.id);
        }

        const courseData = {
          ...course,
          owner: ownerRef,
        };

        await db.collection("courses").doc(course.id).update(courseData);

        this.setSnackbar({
          show: true,
          text: "Galaxy updated",
          color: "baseAccent",
        });
      } catch (err) {
        console.error("Failed to update course:", err);
        this.setSnackbar({
          show: true,
          text: "Failed to update galaxy",
          color: "error",
        });
      } finally {
        this.dialog = false;
        this.loading = false;
        // set courseID to Store state 'state.currentCourseId' (so not relying on router params)
        this.setCurrentCourseId(course.id);
      }
    },
    storeImage() {
      this.disabled = true;
      // ceate a storage ref
      const courseOrTemp =
        this.currentCourseId || (this.person && this.person.id ? `temp-${this.person.id}` : "temp");
      const unique = Date.now();
      const storageRef = storage.ref(
        "course-images/" + courseOrTemp + "-" + unique + "-" + this.uploadedImage.name,
      );

      // upload a file
      const uploadTask = storageRef.put(this.uploadedImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentageGalaxy = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        // upload error
        (err) => {
          console.log(err);
          this.disabled = false;
          this.setSnackbar({
            show: true,
            text: "Image upload failed. Please try again.",
            color: "error",
          });
        },
        // upload complete
        () => {
          // get image url
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // add image url to course obj
            if (!this.course) this.course = {};
            if (!this.course.image || typeof this.course.image !== "object") {
              this.$set(this.course, "image", { url: "", name: "" });
            }
            this.course.image.url = downloadURL;
            this.course.image.name = this.uploadedImage.name;
            this.disabled = false;
          });
        },
      );
    },
    storeAuthorImage() {
      this.disabled = true;
      // ceate a storage ref
      const storageRef = storage.ref(
        "author-images/" + this.course.author + "-" + this.authorImage.name,
      );

      // upload a file
      const uploadTask = storageRef.put(this.authorImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentageAuthor = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        // upload error
        (err) => {
          console.log(err);
          this.disabled = false;
          this.setSnackbar({
            show: true,
            text: "Author image upload failed. Please try again.",
            color: "error",
          });
        },
        // upload complete
        () => {
          // get image url
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            console.log("author image url is: " + downloadURL);
            // add image url to course obj
            if (!this.course) this.course = {};
            if (!this.course.contentBy || typeof this.course.contentBy !== "object") {
              this.$set(this.course, "contentBy", {
                name: "",
                image: { url: "", name: "" },
                source: "",
              });
            } else if (
              !this.course.contentBy.image ||
              typeof this.course.contentBy.image !== "object"
            ) {
              this.$set(this.course.contentBy, "image", { url: "", name: "" });
            }
            this.course.contentBy.image.url = downloadURL;
            this.course.contentBy.image.name = this.uploadedImage.name;
            this.disabled = false;
          });
        },
      );
    },
    // delete
    deleteDialog() {
      if (this.privateDialog == false && this.peopleInCourse.length) {
        this.privateDialog = true;
      } else {
        ((this.privateDialog = false), (this.dialog = false), (this.dialogConfirm = true));
      }
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.dialog = true;
    },
    async confirmDeleteCourse(course) {
      this.deleting = true;
      console.log("course: ", course);

      // delete courseCohort
      await db.collection("cohorts").doc(this.course.cohort).delete();

      // delete for any students in course
      await this.deleteCourseForStudents();

      // delete image
      await this.deleteImage();

      // delete document in collection "courses"
      await db.collection("courses").doc(course.id).delete();

      this.deleting = false;
      this.dialog = false;
      // after delete... route back to home
      this.$router.push({ path: "/" });
      this.setSnackbar({
        show: true,
        text: this.destroyedText(),
        color: "baseAccent",
      });
    },
    async deleteImage() {
      // if no image, dont worry bout it cuz
      if (!this.course.image || !this.course.image.url) return;

      try {
        // Extract the full path from the URL
        const imageUrl = new URL(this.course.image.url);
        const pathFromUrl = decodeURIComponent(imageUrl.pathname.split("/o/")[1].split("?")[0]);

        // Create a reference using the full path
        const storageRef = storage.ref(pathFromUrl);

        // Delete the file
        await storageRef.delete();
      } catch (error) {
        console.error("Error deleting image:", error);
        // Continue with course deletion even if image deletion fails
      }
    },
    async deleteCourseForStudents() {
      await Promise.all(
        this.peopleInCourse.map(async (person) => {
          const student = db.collection("people").doc(person.id);

          await student.update({
            assignedCourses: firebase.firestore.FieldValue.arrayRemove(this.currentCourseId),
          });

          const data = {
            email: person.email,
            teacher: this.person.firstName + " " + this.person.lastName,
            course: this.course.title,
            student: person.firstName ? person.firstName + " " + person.lastName : "",
            teacherEmail: this.person.email,
          };
          // Not sure we need an email to students when a course is deleted (but its here anyway if we change our mind)
          // console.log("sending delete galaxy email: ", data);
          // const sendCourseDeleted = functions.httpsCallable("sendCourseDeleted");
          // await sendCourseDeleted(data);
        }),
      );
    },
    async changeToPrivate(course) {
      await db.collection("courses").doc(course.id).update({ public: false });

      this.setSnackbar({
        show: true,
        text: "Course updated",
        color: "baseAccent",
      });
      this.privateDialog = false;
      this.dialog = false;
      this.loading = false;
      course.public = false;
      //get doc id from firestore (aka course id)
      //set courseID to Store state 'state.currentCourseId' (so not relying on router params)
      this.setCurrentCourseId(course.id);
    },
    destroyedText() {
      const options = [
        "Galaxy deleted",
        "Galaxy destroyed",
        "Galaxy was destroyed by a deathstar",
        "Galaxy destroyed by a Space Bat Angel Dragon",
        "Galaxy destroyed by its own inhabitants",
        "Galaxy was swallowed by a black hole",
        "Galaxy has mysteriously disappeared",
      ];
      return options[Math.floor(Math.random() * options.length)];
    },
    sendCourseCreatedEmail(email, name, courseTitle, courseId) {
      // console.log("sendCourseCreatedEmail called with:", { email, name, courseTitle, courseId });

      // Final validation before sending to cloud function
      if (!email || !name || !courseTitle || !courseId) {
        console.error("Missing required parameters:", { email, name, courseTitle, courseId });
        throw new Error("Missing required parameters for course created email");
      }

      // Ensure course title is not empty
      if (!courseTitle.trim()) {
        console.error("Course title is empty:", courseTitle);
        throw new Error("Course title cannot be empty");
      }

      const data = {
        email: email,
        name: name,
        course: courseTitle.trim(),
        courseId: courseId,
      };
      // console.log("Data object being sent to cloud function:", data);

      const sendCourseCreatedEmail = functions.httpsCallable("sendCourseCreatedEmail");
      return sendCourseCreatedEmail(data);
    },
    removeCollaborator(item) {
      // Also remove from collaborators array for autocomplete display
      const collaboratorIndex = this.collaborators.findIndex(
        (collaborator) => collaborator.id === item.id,
      );
      if (collaboratorIndex >= 0) this.collaborators.splice(collaboratorIndex, 1);

      // keep collaboratorIds in sync
      if (Array.isArray(this.course.collaboratorIds)) {
        const idIndex = this.course.collaboratorIds.indexOf(item.id);
        if (idIndex >= 0) this.course.collaboratorIds.splice(idIndex, 1);
      }
    },
    addCollaborator(collaborator) {
      console.log("adding collaborator", collaborator);
      // Add to local list for autocomplete display
      this.collaborators.push(collaborator);

      // keep collaboratorIds in sync
      if (!Array.isArray(this.course.collaboratorIds))
        this.$set(this.course, "collaboratorIds", []);
      if (!this.course.collaboratorIds.includes(collaborator.id))
        this.course.collaboratorIds.push(collaborator.id);

      // Send notification email to the new collaborator
      this.sendCollaboratorAddedEmail(
        collaborator.email,
        collaborator.firstName + " " + collaborator.lastName,
        this.course.title || "Untitled Galaxy",
        this.person.firstName + " " + this.person.lastName,
        this.course.id || "new",
      );

      this.setSnackbar({
        show: true,
        text: "New collaborator added to Galaxy",
        color: "baseAccent",
      });
    },
    async initializeCollaborators() {
      if (
        this.courseToEdit &&
        this.courseToEdit.collaboratorIds &&
        this.courseToEdit.collaboratorIds.length > 0
      ) {
        console.log(
          "course has collaborators, fetching collaborator details from db to populate dropdown",
        );
        // Fetch collaborator details from Firebase using collaboratorIds
        const collaboratorPromises = this.courseToEdit.collaboratorIds.map((personId) =>
          db.collection("people").doc(personId).get(),
        );

        const collaboratorSnapshots = await Promise.all(collaboratorPromises);

        this.collaborators = collaboratorSnapshots.map((snapshot) => {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            ...data,
          };
        });
      } else {
        this.collaborators = [];
      }
    },
    openAIDialog() {
      this.creationMode = "ai";
      this.cancel(); // Close current dialog
      this.$nextTick(() => {
        this.$emit("openAiDialog"); // Emit event to open AI dialog
      });
    },
    sendCollaboratorAddedEmail(email, name, courseTitle, inviterName, courseId) {
      const data = {
        collaboratorEmail: email,
        collaboratorName: name,
        galaxyTitle: courseTitle,
        inviterName: inviterName,
        galaxyId: courseId,
      };
      console.log("sending added collaborator an email");
      const sendCollaboratorAddedEmail = functions.httpsCallable("sendCollaboratorAddedEmail");
      return sendCollaboratorAddedEmail(data);
    },
    validateCourseTitle() {
      if (this.course.title) {
        this.course.title = this.course.title.trim();
      }
    },
    validateForm() {
      // Ensure course title is properly set
      if (!this.course.title || !this.course.title.trim()) {
        this.setSnackbar({
          show: true,
          text: "Please enter a galaxy name",
          color: "error",
        });
        return false;
      }

      // Ensure person data is available
      if (!this.person || !this.person.id || !this.person.email || !this.person.firstName) {
        this.setSnackbar({
          show: true,
          text: "User data not available. Please refresh and try again.",
          color: "error",
        });
        return false;
      }

      // Log the validation
      console.log("Form validation passed:", {
        courseTitle: this.course.title,
        personData: this.person,
      });

      return true;
    },
    handleCreateGalaxy() {
      // Ensure course title is properly set before submission
      if (this.course.title) {
        this.course.title = this.course.title.trim();
      }

      // Log the submission
      //console.log("Creating galaxy with data:", this.course);
      //console.log("Person data:", this.person);

      // Call the save method
      this.saveCourse(this.course);
    },
    handleUpdateGalaxy() {
      // Ensure course title is properly set before submission
      if (this.course.title) {
        this.course.title = this.course.title.trim();
      }

      // Log the submission
      //console.log("Updating galaxy with data:", this.course);
      //console.log("Person data:", this.person);

      // Call the update method
      this.updateCourse(this.course);
    },
    selectManualMode() {
      this.creationMode = "manual";

      // Log the current state
      //console.log("Manual mode selected, course data:", this.course);
      //console.log("Person data:", this.person);
    },
    initializeCourseData() {
      // Ensure course data is properly initialized
      if (!this.course.title) {
        this.course.title = "";
      }
      if (!this.course.description) {
        this.course.description = "";
      }
      if (!this.course.image) {
        this.course.image = { url: "", name: "" };
      }
      if (!this.course.mappedBy) {
        this.course.mappedBy = { name: "", image: { url: "", name: "" }, source: "" };
      }
      if (!this.course.collaboratorIds) {
        this.course.collaboratorIds = [];
      }
      if (!this.course.status) {
        this.course.status = "drafting";
      }
    },
    resetCourseData() {
      // Reset course data to initial state
      this.course = {
        title: "",
        description: "",
        image: {
          url: "",
          name: "",
        },
        mappedBy: {
          name: "",
          image: {
            url: "",
            name: "",
          },
          source: "",
        },
        collaboratorIds: [],
        status: "drafting",
      };
      // Reset UI state
      this.disabled = false;
      this.percentageGalaxy = 0;
      this.percentageAuthor = 0;
      this.uploadedImage = {};
      this.authorImage = {};
    },
    handleCreateButtonClick() {
      // Toggle dialog state
      this.dialog = !this.dialog;

      // If opening dialog, reset creation mode and course data
      if (this.dialog) {
        this.creationMode = "";
        this.resetCourseData();
      }

      console.log("Dialog toggled to:", this.dialog);
    },

    handleDialogClose() {
      // This method is called when clicking outside the dialog
      this.dialog = false;

      // Reset disabled state when closing
      this.disabled = false;

      // Sync with parent component
      this.$emit("close");

      // Reset creation mode when closing
      this.creationMode = "";

      console.log("Dialog closed by outside click");
    },

    handleDialogInput(value) {
      // This method is called whenever the dialog's v-model changes
      console.log("Dialog input event:", value);

      // Sync with parent component
      this.$emit("close");

      // If closing dialog, reset creation mode and disabled state
      if (!value) {
        this.creationMode = "";
        this.disabled = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.author-checkbox >>> .v-input--selection-controls__input.v-icon {
  color: purple !important;
}

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
  min-height: 400px;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .left-side {
    width: 50%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    transition: all 0.3s;

    .author-checkbox-label {
      font-size: 0.8rem !important;
      // padding: 10px 20px;
      color: var(--v-missionAccent-base) !important;
      // border-top: 1px solid var(--v-missionAccent-base);
      // border-bottom: 1px solid var(--v-missionAccent-base);
    }
  }

  .right-side {
    width: 50%;
    display: flex;
    align-items: flex-start;
    transition: all 0.3s;
    flex-direction: column;
    // border-left: 1px solid var(--v-missionAccent-base);

    // galaxy info
    #galaxy-info {
      width: calc(100% - 25px);
      // min-height: 100%;
      border: 1px solid var(--v-galaxyAccent-base);
      margin-top: 30px;
      padding: 20px;
      // background: var(--v-baseAccent-base);
      position: relative;
      z-index: 3;

      .galaxy-label {
        font-size: 0.8rem;
        font-weight: 400;
        text-transform: uppercase;
        // ribbon label
        position: absolute;
        top: -1px;
        left: -1px;
        background-color: var(--v-galaxyAccent-base);
        color: var(--v-background-base);
        padding: 0px 15px 0px 5px;
        clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
      }

      .galaxy-title {
        font-size: 1.2rem;
        color: var(--v-galaxyAccent-base);
        font-weight: 600;
        text-transform: uppercase;
        margin: 20px 0px 5px 0px;
      }

      .galaxy-description {
        margin-top: 10px;
        color: var(--v-galaxyAccent-base);
        // font-size: 0.9rem;
      }
    }
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
  }
}

.create-dialog-content {
  // width: 33.33%;
  min-height: 250px;
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  // text-transform: uppercase;
  width: 100%;
  // font-size: 0.6rem;
  // border: 1px solid var(--v-missionAccent-base);

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

.galaxy-status {
  font-size: 0.6rem !important;
  line-height: 1rem !important;
  color: var(--v-galaxyAccent-base);
}
.in-review {
  color: var(--v-cohortAccent-base);
}

// Creation mode selection styles
.creation-mode-selection {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.creation-mode-options {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin: 20px 0;
  width: 100%;
}

.creation-mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 30px;
  border: 2px solid var(--v-missionAccent-base);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 150px;
  background-color: var(--v-background-base);
  text-align: center;

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

.galaxy-border {
  border: 2px solid var(--v-galaxyAccent-base);
}

.base-border {
  border: 2px solid var(--v-baseAccent-base);
}

.creation-mode-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  .v-icon {
    font-size: 2.5rem;
    color: var(--v-missionAccent-base);
  }
}

.creation-mode-label {
  font-size: 1rem;
  text-transform: uppercase;
  color: var(--v-missionAccent-base);
  font-weight: 600;
  margin-bottom: 8px;
}

.creation-mode-description {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base);
  opacity: 0.8;
  line-height: 1.3;
}

.input-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;
}

// AI creation mode styles
.ai-creation-mode {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ai-creation-content {
  width: 100%;
  max-width: 500px;
  text-align: center;
}

// Mobile-specific improvements
.mobile-layout {
  width: 100% !important;
}

@media (max-width: 768px) {
  .create-dialog {
    flex-direction: column;
    min-height: auto;
    padding: 0;

    .dialog-header {
      padding: 15px;

      .dialog-title {
        font-size: 1.1rem;
        margin-bottom: 10px;
      }

      .dialog-description {
        font-size: 0.65rem;
        line-height: 1.4;
      }
    }

    .left-side {
      width: 100% !important;
      margin-top: 0 !important;

      .create-dialog-content {
        padding: 15px;
        min-height: auto;

        .input-field {
          font-size: 0.9rem;
          margin-bottom: 15px;
        }
      }
    }

    .right-side {
      width: 100% !important;
      margin-top: 0;

      #galaxy-info {
        width: 100%;
        margin: 15px 0;
        padding: 15px;

        .galaxy-title {
          font-size: 1.1rem;
          margin: 15px 0 5px 0;
        }

        .galaxy-description {
          font-size: 0.85rem;
        }
      }
    }

    .action-buttons {
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;

      .v-btn {
        width: 100%;
        max-width: 300px;
        margin: 0 !important;
      }
    }
  }

  .creation-mode-options {
    flex-direction: column;
    gap: 20px;
    align-items: center;
    margin: 15px 0;

    .creation-mode-option {
      width: 200px;
      padding: 40px 20px;

      .creation-mode-icon {
        font-size: 2rem;
        margin-bottom: 10px;

        .v-icon {
          font-size: 2rem;
        }
      }

      .creation-mode-label {
        font-size: 0.9rem;
      }
    }
  }

  .create-dialog-content {
    .input-field {
      margin-bottom: 15px;
    }
  }
}

// Extra small mobile devices
@media (max-width: 480px) {
  .create-dialog {
    .dialog-header {
      padding: 12px;

      .dialog-title {
        font-size: 1rem;
      }

      .dialog-description {
        font-size: 0.6rem;
      }
    }

    .left-side .create-dialog-content {
      padding: 12px;
    }

    .right-side #galaxy-info {
      padding: 12px;
      margin: 12px 0;
    }

    .action-buttons {
      padding: 12px;
      align-items: center;
    }
  }

  .creation-mode-options .creation-mode-option {
    width: 180px;
    padding: 30px 15px;

    .creation-mode-icon {
      font-size: 1.8rem;

      .v-icon {
        font-size: 1.8rem;
      }
    }

    .creation-mode-label {
      font-size: 0.8rem;
    }
  }
}

// Touch-friendly improvements for mobile
@media (max-width: 768px) {
  .input-field {
    .v-input__control {
      min-height: 44px; // Minimum touch target size
    }
  }

  .v-btn {
    min-height: 44px; // Minimum touch target size
    font-size: 0.9rem;
  }

  .creation-mode-option {
    min-height: 120px; // Ensure touch targets are large enough
    cursor: pointer;

    &:active {
      transform: scale(0.98);
    }
  }
}
</style>
