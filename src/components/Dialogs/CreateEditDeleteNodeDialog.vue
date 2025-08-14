<template>
  <div>
    <v-dialog v-model="dialog" width="40%" light>
      <!-- Start create-dialog -->
      <div class="create-dialog">
        <div class="create-dialog-content">
          <!-- Title/Desc Header -->
          <div class="dialog-info">
            <p class="dialog-title">{{ dialogTitle }}</p>
            <div class="d-flex align-center">
              <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
              <p class="dialog-description">
                This Node is a <span class="mission-text">System</span> of the
                <span class="galaxy-text">{{ this.course?.title }}</span> Galaxy map
              </p>
            </div>
          </div>

          <!-- Fields -->
          <div class="fields my-4 py-4">
            <!-- Node Label -->
            <!-- <p class="dialog-description">Topic Title:</p> -->
            <v-text-field
              class="input-field mt-4"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              v-model="currentNode.label"
              :autofocus="!editing"
              label="Node title"
              placeholder="Enter name of this node"
            ></v-text-field>

            <!-- side by side div 50/50 -->
            <div class="d-flex mt-4">
              <!-- Node image (as requested by Dion) -->
              <img
                v-if="currentNode.image"
                :src="currentNode.image"
                style="width: 30%; object-fit: contain; height: 50px"
              />
              <div class="left" :style="{ width: currentNode.image ? '40%' : '70%' }">
                <v-file-input
                  v-model="uploadedImage"
                  class="input-field"
                  color="missionAccent"
                  outlined
                  :dark="dark"
                  :light="!dark"
                  label="Node image"
                  placeholder="Upload an image for this node"
                  @change="storeImage()"
                  prepend-icon=""
                  hide-details
                  accept="image/*"
                ></v-file-input>
                <v-progress-linear
                  color="missionAccent"
                  :value="percentageImage"
                  class="mb-4"
                ></v-progress-linear>
              </div>

              <!-- Node Size -->
              <div class="right pl-2" style="width: 30%">
                <v-text-field
                  class="input-field"
                  outlined
                  :dark="dark"
                  :light="!dark"
                  color="missionAccent"
                  v-model.number="currentNode.size"
                  label="Size"
                  placeholder="20"
                  type="number"
                  hide-details
                ></v-text-field>
              </div>
            </div>

            <!-- Node Color -->
            <p class="dialog-description">
              Node color:
              <v-color-picker
                v-model="currentNode.color"
                class="ma-2 color-picker"
                show-swatches
                hide-canvas
                hide-inputs
                hide-sliders
                mode="hexa"
                value="#69a1e2"
                width="90%"
                :swatches="darkSwatches"
              >
              </v-color-picker>

              <!-- <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    left
                    color="missionAccent"
                    small
                    class="circle-outline ma-1"
                    v-bind="attrs"
                    v-on="on"
                    >{{mdiInformationVariant}}</v-icon
                  >
                </template>
                <span>
                  INTRODUCTION Nodes - Introduce the user to the start of a
                  branch<br /><br />
                  TASKS nodes - Have a number of missions/tasks/activities for a
                  user to complete<br /><br />
                  PROJECT nodes - Represent a project task for the user to
                  complete
                </span>
              </v-tooltip>
            </p>
            <v-select
              v-model="currentNode.group"
              :items="nodeTypes"
              item-text="type"
              item-value="value"
              outlined
              :dark="dark"
              :light="!dark"
              color="missionAccent"
              class="input-field"
              :menu-props="{
                closeOnClick: true,
                closeOnContentClick: true,
              }"
            ></v-select> -->

              <!-- Node Pre-requisites -->
            </p>

            <p class="dialog-description">
              Node Prerequisites:
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    left
                    color="missionAccent"
                    small
                    class="circle-outline ma-1"
                    v-bind="attrs"
                    v-on="on"
                  >
                    {{ mdiInformationVariant }}</v-icon
                  >
                </template>
                <span>
                  Prerequisites are nodes that need to be completed before this one can be unlocked
                </span>
              </v-tooltip>
            </p>
            <v-checkbox
              v-model="prerequisites"
              class="ma-0 pa-0"
              color="blue"
              :dark="dark"
              :light="!dark"
            >
              <template v-slot:label>
                <span class="dialog-description"
                  >Does another Node need to be completed before starting this one?</span
                >
              </template>
            </v-checkbox>
            <v-select
              v-if="prerequisites"
              v-model="currentNode.prerequisites"
              :items="sortedTopics"
              item-text="label"
              item-value="id"
              outlined
              :dark="dark"
              :light="!dark"
              class="input-field"
              color="missionAccent"
              multiple
              chips
              :menu-props="{
                closeOnContentClick: true,
              }"
            ></v-select>
          </div>

          <!-- Action buttons -->
          <div class="action-buttons">
            <v-btn
              v-if="!editing"
              outlined
              color="baseAccent"
              @click="saveNodeHandler(currentNode)"
              class="mr-2"
              :loading="loading"
            >
              <v-icon left> {{ mdiCheck }} </v-icon>
              SAVE
            </v-btn>
            <v-btn
              v-else
              outlined
              color="baseAccent"
              @click="saveNodeHandler(currentNode, true)"
              class="mr-2"
              :loading="loading"
            >
              <v-icon left> {{ mdiCheck }} </v-icon>
              UPDATE
            </v-btn>

            <v-btn v-if="editing" outlined color="error" @click="deleteDialog()" class="mr-2">
              <v-icon left> {{ mdiDelete }} </v-icon>
              DELETE
            </v-btn>

            <v-btn outlined :color="dark ? 'yellow' : '#577399'" class="ml-2" @click="close">
              <v-icon left> {{ mdiClose }} </v-icon>
              Cancel
            </v-btn>
          </div>
          <!-- End action-buttons -->
        </div>
        <!-- End create-dialog-content -->
      </div>
      <!-- End create-dialog -->
    </v-dialog>

    <!-- CONFIRM DELETE DIALOG -->
    <v-dialog v-model="dialogConfirm" width="40%" light>
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header py-10">
          <p class="dialog-title">
            <strong>Warning!</strong> Delete {{ currentNode?.label }} System?
          </p>
          <div class="d-flex align-start">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <p class="dialog-description">
              Are you sure you want to <strong>DELETE</strong> this
              <span class="mission-text">{{ currentNode?.label }} System</span>?
              <br />
              <br />
              Deleting is permanent!!!
              <br />
              <br />
              <strong>YOU WILL LOSE ALL </strong>
              <span class="mission-text">Mission</span> data.
            </p>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <!-- DELETE -->
          <v-btn outlined color="error" @click="deleteNode()" class="ml-2" :loading="deleting">
            <v-icon left> {{ mdiDelete }} </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="dark ? 'yellow' : '#577399'"
            class="ml-2"
            @click="cancelDeleteDialog()"
          >
            <v-icon left> {{ mdiClose }} </v-icon>
            Cancel
          </v-btn>
        </div>
        <!-- End action-buttons -->
      </div>
      <!-- End create-dialog-content -->
    </v-dialog>
  </div>
</template>

<script>
import { storage } from "@/store/firestoreConfig";
import {
  fetchPersonsTopicByPersonIdCourseIdTopicId,
  removePrerequisitesFromTopics,
  updateStudentTopicPrerequisites,
  saveTopicToStudents,
  deleteTopicForStudents,
  saveNode,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import { mdiPencil, mdiPlus, mdiClose, mdiCheck, mdiDelete, mdiInformationVariant } from "@mdi/js";
import firebase from "firebase/compat/app";
import { mapState } from "pinia";

export default {
  name: "CreateEditDeleteNodeDialog",
  props: [
    "course",
    "dialog",
    "dialogTitle",
    "dialogDescription",
    "editing",
    "currentNode",
    "currentEdge",
    "students",
  ],
  async mounted() {
    // this.sortedObjArr = arr.sort((a, b) =>
    //   a.topic.topicCreatedTimestamp.seconds > b.topic.topicCreatedTimestamp.seconds ? 1 : -1,
    // );

    this.infoPopupShow = false;
    // hack to make active select white
    if (this.$vuetify.theme.isDark) {
      this.$vuetify.theme.themes.dark.primary = "#fff";
    } else {
      this.$vuetify.theme.themes.dark.primary = "#000";
    }
    if (!this.editing) {
      this.currentNode.label = "";
      this.currentNode.color = "#69a1e2";
    }
    if (this.editing) {
      this.prerequisites = this.currentNode.prerequisites?.length;
    }
  },
  data() {
    return {
      mdiPencil,
      mdiPlus,
      mdiClose,
      mdiDelete,
      mdiCheck,
      mdiInformationVariant,
      sortedObjArr: [],
      dialogConfirm: false,
      newNodeData: {},
      type: "",
      loading: false,
      deleting: false,
      // nodeTypes: [
      //   {
      //     type: "Introduction",
      //     value: "introduction",
      //   },
      //   {
      //     type: "Tasks",
      //     value: "tasks",
      //   },
      //   {
      //     type: "Project",
      //     value: "project",
      //   },
      // ],
      prerequisites: this.currentNode.prerequisites?.length ? true : false,
      darkSwatches: [["#69A1E2"], ["#E269CF"], ["#73FBD3"], ["#F3C969"], ["#54428E"]], //https://coolors.co/69a1e2-e269cf-73fbd3-f3c969-54428e
      lightSwatches: [["#577399"], ["#fe5f55"]],
      uploadedImage: {},
      percentageImage: 0,
    };
  },
  computed: {
    ...mapState(useRootStore, [
      "person",
      "currentCourseNodes",
      "personsTopics",
      "getPersonsTopicById",
    ]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    sortedTopics() {
      let sortedTopics = this.currentCourseNodes
        .filter((node) => node.id !== this.currentNode.id)
        .sort((a, b) => {
          // bruh! sometimes courseNodes have property topicCreatedTimestamp and sometimes they have nodeCreatedTimestamp
          // code as been fixed to no only save as topicCreatedTimestamp
          // but this ternary handles old nodeCreatedTimestamp's
          let aTimestamp = a.hasOwnProperty("topicCreatedTimestamp")
            ? a.topicCreatedTimestamp.seconds
            : a.nodeCreatedTimestamp.seconds;
          let bTimestamp = b.hasOwnProperty("topicCreatedTimestamp")
            ? b.topicCreatedTimestamp.seconds
            : b.nodeCreatedTimestamp.seconds;

          return new Date(bTimestamp) - new Date(aTimestamp);
        });
      return sortedTopics;
    },
  },
  methods: {
    // getTopicTasks() {
    //   console.log("current node", this.currentNode.id);
    //   let topic = this.getPersonsTopicById(this.currentNode.id);
    //   console.log("topic is === ", topic);
    //   if (!topic) {
    //     return;
    //   }
    //   this.topicTasks = topic.tasks;
    //   console.log("this.topicTasks", this.topicTasks);
    //   return this.topicTasks;
    // },

    close() {
      console.log("close");
      this.$emit("closeDialog");
      // remove 'new' node on cancel with var nodes = this.$refs.network.nodes.pop() ???
    },

    async saveNodeHandler(node, isUpdate = false) {
      console.log("isUpdate: ", isUpdate);
      this.loading = true;

      try {
        // Call cloud function to save the node
        const result = await saveNode(this.course.id, node, isUpdate);
        console.log("✅ Node saved successfully:", result);

        // save topic to students
        try {
          const studentResult = await saveTopicToStudents(this.course.id, node, this.students);
          console.log("✅ Topic saved to students:", studentResult);
        } catch (error) {
          console.error("❌ Error saving topic to students:", error);
          // Continue with the operation even if student assignment fails
        }

        this.loading = false;
        this.close();
      } catch (error) {
        console.error("❌ Error saving node:", error);
        this.loading = false;
        // Don't close on error, let user see the error
      }
    },
    deleteDialog() {
      this.dialogConfirm = true;
    },
    cancelDeleteDialog() {
      this.dialogConfirm = false;
      this.$emit("openDialog");
    },
    async deleteNode() {
      console.log("deleting node");
      this.deleting = true;

      // delete node from firestore > map-nodes
      await db
        .collection("courses")
        .doc(this.course.id)
        .collection("map-nodes")
        .doc(this.currentNode.id)
        .delete();
      console.log("Node successfully deleted from map-nodes!");

      // delete node from firestore > topics
      await db
        .collection("courses")
        .doc(this.course.id)
        .collection("topics")
        .doc(this.currentNode.id)
        .delete();
      console.log("Node successfully deleted from topics!");

      // delete prerequisites
      // - we need to check all nodes in collection("topics") and see if this.currentNode.id is in any of their prerequisites array
      const affectedTopics = await this.removePrerequisitesFromTopics(this.currentNode.id);
      console.log(`Prerequisites removed from ${affectedTopics.length} topics`);

      // delete conneceted edge (if there is one)
      if (this.currentNode.connectedEdge) {
        await db
          .collection("courses")
          .doc(this.course.id)
          .collection("map-edges")
          .doc(this.currentNode.connectedEdge)
          .delete();
        console.log("Edge successfully deleted!");
      }
      // decrement topicTotals by 1
      await db
        .collection("courses")
        .doc(this.course.id)
        .update("topicTotal", firebase.firestore.FieldValue.increment(-1));
      console.log("Topic total decreased by 1");

      this.deleting = false;
      this.infoPopupShow = false;

      // Pass affectedTopics to avoid recalculating prerequisites
      try {
        const result = await deleteTopicForStudents(
          this.course.id,
          this.currentNode,
          this.students,
          affectedTopics,
        );
        console.log("✅ Topic deleted from students:", result);
      } catch (error) {
        console.error("❌ Error deleting topic from students:", error);
        // Continue with the operation even if student deletion fails
      }
      // close
      this.close();
    },
    async deleteEdge() {
      this.deleting = true;
      await db
        .collection("courses")
        .doc(this.course.id)
        .collection("map-edges")
        .doc(this.currentEdge.id)
        .delete();

      console.log("Edge successfully deleted!");
      this.deleting = false;
      this.infoPopupShow = false;
    },

    /**
     * Remove prerequisites from topics collection and return list of affected topics
     * @param {string} nodeId - The ID of the node being deleted
     * @returns {Array} Array of topic IDs that had prerequisites updated
     */
    async removePrerequisitesFromTopics(nodeId) {
      try {
        console.log("🗑️ Calling cloud function to remove prerequisites for node:", nodeId);

        const result = await removePrerequisitesFromTopics({
          courseId: this.course.id,
          nodeId: nodeId,
        });

        console.log("✅ Cloud function result:", result.data);

        if (result.data.success) {
          return result.data.affectedTopics;
        } else {
          console.error("❌ Cloud function failed:", result.data);
          return [];
        }
      } catch (error) {
        console.error("❌ Error calling cloud function:", error);
        return [];
      }
    },

    /**
     * Update prerequisites for a specific student's topics
     * @param {string} personId - The student's person ID
     * @param {Array} affectedTopics - Array of topics that had prerequisites updated
     */
    async updateStudentTopicPrerequisites(personId, affectedTopics) {
      try {
        console.log("👤 Calling cloud function to update student prerequisites:", {
          personId,
          affectedTopicsCount: affectedTopics.length,
        });

        const result = await updateStudentTopicPrerequisites({
          courseId: this.course.id,
          personId: personId,
          affectedTopics: affectedTopics,
        });

        console.log("✅ Cloud function result:", result.data);

        if (result.data.success) {
          console.log(
            "✅ Successfully updated prerequisites for",
            result.data.updatedTopicsCount,
            "topics for student",
            personId,
          );
        } else {
          console.error("❌ Cloud function failed:", result.data);
        }
      } catch (error) {
        console.error("❌ Error calling cloud function:", error);
      }
    },

    storeImage() {
      this.disabled = true;
      // ceate a storage ref
      var storageRef = storage.ref(
        "node-images/course-" + this.course.id + "-node-" + this.currentNode.id,
      );

      // upload a file
      var uploadTask = storageRef.put(this.uploadedImage);

      // update progress bar
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // show progress on uploader bar
          this.percentageImage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        // upload error
        (err) => {
          console.log(err);
        },
        // upload complete
        () => {
          // get image url
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // add image url to course obj
            this.currentNode.shape = "image";
            this.currentNode.image = downloadURL;
            this.currentNode.borderWidth = 0;
            this.currentNode.color = "rgba(0,0,0,0)";
            this.currentNode.size = 15;
            this.currentNode.imageName = this.uploadedImage.name;
            // this.currentNode.size = 30;    <--- hardcoded node/image size
            this.disabled = false;
          });
        },
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }
}

.create-dialog-content {
  // width: 33.33%;
  min-height: 400px;
  display: flex;
  // justify-content: space-around;
  // align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  text-transform: uppercase;
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
    text-transform: none;
  }

  .fields {
    border-top: 1px solid var(--v-missionAccent-base);
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;
}

// POPUP
.ss-info-panel {
  // background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  position: absolute;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  z-index: 3;

  .ss-preview {
    min-width: 25vw;
    min-height: 20vh;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: hidden;

    .view-ss-button {
      position: absolute;
      bottom: 20px; // matches 20px padding of ss-details
      background-color: var(--v-background-base);
    }

    .ss-details-buttons {
      position: absolute;
      top: 10px;
      right: 0px;
      padding: 0px !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
    }
  }

  .ss-details {
    border-top: 1px solid var(--v-missionAccent-base);
    padding: 20px;
    text-align: center;
  }

  .ss-missions {
    border-top: 1px solid var(--v-missionAccent-base);
    background-color: var(--v-background-base);

    .task-table {
      background-color: var(--v-background-base);
    }
  }

  .info-panel-label {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.8rem;
  }
}

.centeredFocus {
  margin-top: -100px;
  margin-left: 50px;
}

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

.circle-outline {
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 50%;
}

.action-buttons {
  width: 100%;
  padding: 10px;
}

.color-picker {
  background-color: var(--v-background-base);

  ::-webkit-scrollbar-track {
    background: var(--v-background-lighten1);
  }
}
</style>
