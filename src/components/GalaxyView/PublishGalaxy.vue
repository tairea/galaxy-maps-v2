<template>
  <v-dialog v-model="dialog" width="40%" light>
    <!-- CREATE BUTTON -->
    <template v-slot:activator="{ on, attrs }">
      <!-- ASSIGN COHORT -->
      <v-btn
        outlined
        :color="
          admin && course.status == 'submitted' && course.public == true
            ? 'cohortAccent'
            : 'galaxyAccent'
        "
        v-bind="attrs"
        v-on="on"
        class="publishButton d-inline-flex text-truncate"
        @click="getTopicsWithoutTasks"
      >
        publish galaxy
      </v-btn>
      <!-- ASSIGN GALAXY -->
    </template>

    <!-- NOT OK!!!! TO PUBLISH DIALOG (No missions) -->
    <div v-if="topicsWithoutTasks.length > 0" class="create-dialog">
      <div class="dialog-header">
        <div class="d-flex mb-4">
          <p class="dialog-title ma-0">Important</p>
          <v-icon color="missionAccent" class="ml-2">{{ mdiAlertOutline }}</v-icon>
        </div>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <p class="dialog-description">System's must have <strong>AT LEAST ONE MISSION</strong></p>
        </div>
      </div>
      <v-divider dark color="missionAccent"></v-divider>
      <div class="create-dialog-content">
        <div>
          <p class="caption mb-2 red--text">The following Systems have no Missions:</p>

          <ul>
            <li v-for="topic in topicsWithoutTasks" :key="topic.id" class="overline">
              {{ topic.label }}
            </li>
          </ul>

          <p class="caption mt-2 mb-0">Please create at least one Mission for these Systems</p>
        </div>
      </div>
      <!-- ACTION BUTTONS -->
      <div class="action-buttons">
        <v-btn
          outlined
          :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
          class="ml-2"
          @click="close"
          :disabled="loading"
        >
          <v-icon left> {{ mdiClose }} </v-icon>
          OK
        </v-btn>
      </div>
    </div>

    <!-- NOT OK!!!! TO PUBLISH DIALOG (No introduction node) -->
    <div v-else-if="hasIntro == false" class="create-dialog">
      <div class="dialog-header">
        <div class="d-flex mb-4">
          <p class="dialog-title ma-0">Important</p>
          <v-icon color="missionAccent" class="ml-2">{{ mdiAlertOutline }}</v-icon>
        </div>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <p class="dialog-description">
            System's must have <strong>AT LEAST ONE INTRODUCTION NODE</strong>
          </p>
        </div>
      </div>
      <v-divider dark color="missionAccent"></v-divider>
      <div class="create-dialog-content">
        <div>
          <p class="caption my-2 mb-6">
            An Introduction node is a starting node that is unlocked when the map is started for the
            first time.
          </p>

          <p class="caption my-2">Please select at least one starting node:</p>

          <v-select
            v-model="introNodes"
            :items="sortedObjArr"
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
      </div>
      <!-- ACTION BUTTONS -->
      <div class="action-buttons">
        <v-btn outlined color="baseAccent" @click="saveIntroNode()" :loading="loading" class="ml-2">
          <v-icon left> {{ mdiCheck }} </v-icon>
          SAVE
        </v-btn>

        <v-btn
          outlined
          :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
          class="ml-2"
          @click="close"
          :disabled="loading"
        >
          <v-icon left> {{ mdiClose }} </v-icon>
          CANCEL
        </v-btn>
      </div>
    </div>

    <!-- OK TO PUBLISH DIALOG -->
    <div v-else class="create-dialog">
      <div class="dialog-header">
        <p class="dialog-title">publish galaxy</p>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <div
            v-if="admin && course.status == 'submitted' && course.public == true"
            class="dialog-description"
          >
            <p style="font-weight: 600; color: var(--v-cohortAccent-base)">
              I have reviewed this Galaxy Map
            </p>
            <p>
              Publish
              <span style="font-weight: 600; color: var(--v-galaxyAccent-base)">{{ course.title }}</span>
              galaxy to make publicly visible
            </p>
            <p>
              All Galaxy Maps users will be able to see and start this map.
            </p>
          </div>
          <p v-else class="dialog-description">
            Publish this Galaxy
            <span style="font-weight: 600; color: var(--v-galaxyAccent-base)">{{
              course.title
            }}</span>
          </p>
        </div>
      </div>
      <v-divider dark color="missionAccent"></v-divider>
      <div class="create-dialog-content">
        <!-- LISTED -->
        <div v-if="!admin">
          <p class="caption mb-2">Choose whether you would like this galaxy to be:</p>

          <v-radio-group v-model="courseOptions.public" color="missionAccent" :light="!dark" :dark="dark">
            <v-radio label="private (invite only)" :value="false" color="missionAccent" class="label-text mb-4"></v-radio>

            <v-radio label="public (Available to all Galaxy Maps users)" :value="true" color="missionAccent"
              class="label-text"></v-radio>
          </v-radio-group>
        </div>
        <!-- Is the course editable? -->
        <!-- <div v-if="courseOptions.public">
          <p class="caption">Would you like others to be able to add to this course</p>
          <v-radio-group row v-model="courseOptions.editable" color="missionAccent" :light="!dark" :dark="dark">
            <v-radio
              label="yes"
              :value="true"
              color="missionAccent"
              class="label-text"
            ></v-radio>
            <v-radio
              label="no"
              :value="false"
              color="missionAccent"
              class="label-text"
            ></v-radio>
          </v-radio-group>
        </div> -->
        <p class="caption ma-0" v-if="courseOptions.public && !admin">
          <i>(Public courses need to be submitted for review by Galaxy Map
            moderators.<br>This usually done within 48 hours.)</i>
        </p>
      </div>
      <!-- ACTION BUTTONS -->
      <div v-if="admin" class="action-buttons">
        <v-btn
          outlined
          :color="
            admin && course.status == 'submitted' && course.public == true
              ? 'cohortAccent'
              : 'galaxyAccent'
          "
          @click="publishCourse()"
          :loading="loading"
        >
          <v-icon left> {{ mdiCheck }} </v-icon>
          publish
        </v-btn>

        <v-btn
          outlined
          :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
          class="ml-2"
          @click="close"
          :disabled="loading"
        >
          <v-icon left> {{ mdiClose }} </v-icon>
          CANCEL
        </v-btn>
      </div>
      <div v-else class="action-buttons">
        <v-btn
          v-if="courseOptions.public"
          outlined
          color="baseAccent"
          @click="submitCourse()"
          :loading="loading"
        >
          <v-icon left> {{ mdiSend }} </v-icon>
          SUBMIT
        </v-btn>
        <v-btn v-else outlined color="baseAccent" @click="publishCourse()" :loading="loading">
          <v-icon left> {{ mdiCheck }} </v-icon>
          publish
        </v-btn>

        <v-btn
          outlined
          :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
          class="ml-2"
          @click="close"
          :disabled="loading"
        >
          <v-icon left> {{ mdiClose }} </v-icon>
          CANCEL
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<script>
import { dbMixins } from "@/mixins/DbMixins";
import { db, functions } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiAlertOutline, mdiInformationVariant, mdiClose, mdiCheck, mdiSend } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "PublishGalaxy",
  mixins: [dbMixins],
  props: ["course", "courseTasks"],
  async mounted() {},
  data: () => ({
    mdiAlertOutline,
    mdiInformationVariant,
    mdiClose,
    mdiCheck,
    mdiSend,
    dialog: false,
    loading: false,
    courseOptions: {
      public: false,
    },
    topicsWithoutTasks: 0,
    hasIntro: false,
    introNodes: [],
    sortedObjArr: [],
  }),
  computed: {
    ...mapState(useRootStore, ["user", "currentCourseId", "currentCourseNodes"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    admin() {
      return this.user.data.admin;
    },
  },
  watch: {
    course: {
      immediate: true,
      deep: true,
      handler(newVal) {
        console.log("newVal", newVal);
        this.courseOptions.public = newVal.public;
      },
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourse", "setCurrentCourseId"]),
    getTopicsWithoutTasks() {
      // copy nodes
      let splicedNodes = [...this.currentCourseNodes];

      // loop tasks
      for (const task of this.courseTasks) {
        // get index of nodes that have tasks
        var index = splicedNodes.findIndex(function (node) {
          return node.id === task.topicId;
        });
        // remove topics that have tasks
        if (index !== -1) splicedNodes.splice(index, 1);
      }
      // assign splicedNodes (nodes/topics that DO NOT have tasks)
      this.topicsWithoutTasks = splicedNodes;

      // Now check if there is at least one intro node.
      this.hasIntro = this.currentCourseNodes.some((object) => object.group == "introduction");
      if (this.hasIntro == false) {
        this.sortNodes();
      }
    },
    close() {
      this.dialog = false;
      this.loading = false;
      this.courseOptions = {
        public: this.course.public,
      };
    },

    async submitCourse() {
      this.loading = true;
      let course = {
        ...this.course,
        ...this.courseOptions,
      };
      course.status = "submitted";
      await this.updateCourse(course)
        .then(() => {
          this.sendNewSubmissionEmail(course);
        })
        .then(() => {
          this.setCurrentCourseId(course.id);
          this.setCurrentCourse(course);
          this.close();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    },

    async publishCourse() {
      this.loading = true;
      let course = this.course;
      if (!this.admin) {
        course = {
          ...course,
          ...this.courseOptions,
        };
      }

      let cohort = {
        name: course.title,
        description: course.description,
        organisation: "",
        students: [],
        courses: [course.id],
        image: {
          name: course.image?.name,
          url: course.image?.url,
        },
        teachers: [course.mappedBy.personId],
        courseCohort: true,
      };

      course.status = "published";
      if (!course.cohort) {
        await this.saveCohort(cohort)
          .then((cohortId) => {
            course.cohort = cohortId;
            this.updateCourse(course);
          })
          .then(() => {
            this.setCurrentCourse(course);
            this.close();
          })
          .catch((error) => {
            console.error("Error updating document: ", error);
          });
      } else {
        this.updateCourse(course)
          .then(() => {
            this.setCurrentCourse(course);
            this.close();
          })
          .catch((error) => {
            console.error("Error updating document: ", error);
          });
      }
    },

    async saveIntroNode() {
      this.loading = true;
      // loop selected intro nodes
      for (const nodeId of this.introNodes) {
        // update node in topics db
        db.collection("courses")
          .doc(this.currentCourseId)
          .collection("map-nodes")
          .doc(nodeId)
          .update({ group: "introduction" })
          .catch((error) => {
            console.error("Error writing node: ", error);
          });

        // update node in topics db
        db.collection("courses")
          .doc(this.currentCourseId)
          .collection("topics")
          .doc(nodeId)
          .update({ group: "introduction" })
          .catch((error) => {
            console.error("Error writing node: ", error);
          });

        console.log("node id " + nodeId + " set as introduction node");

        this.close();
      }
    },

    async updateCourse(course) {
      return await db
        .collection("courses")
        .doc(course.id)
        .update(course)
        .then(() => {
          console.log("Document successfully updated!");
          this.setCurrentCourseId(course.id);
          this.setSnackbar({
            show: true,
            text: "Galaxy successfully updated",
            color: "baseAccent",
          });
        });
    },

    async saveCohort(cohort) {
      // Add a new document in collection "cohorts"
      const cohortId = await db
        .collection("cohorts")
        .add(cohort)
        .then(async (docRef) => {
          if (this.admin) {
            const person = await this.MXgetPersonByIdFromDB(cohort.teachers[0]);
            person.inviter = "Galaxy Maps Admin";
            this.sendCoursePublishedEmail(person, this.course);
          } else {
            this.sendCoursePublishedEmail(this.person, cohort);
          }
          return docRef.id;
        });
      return cohortId;
    },

    newCohortCreated(profile, cohort) {
      const data = {
        ...profile,
        cohort: cohort.name,
      };
      const newCohortCreated = functions.httpsCallable("newCohortCreated");
      return newCohortCreated(data);
    },

    sendNewSubmissionEmail(course) {
      let data = {
        author: course.mappedBy.name,
        title: course.title,
      };
      const sendNewSubmissionEmail = functions.httpsCallable("sendNewSubmissionEmail");
      return sendNewSubmissionEmail(data);
    },

    sendCoursePublishedEmail(person, course) {
      let data = {
        email: person.email,
        name: person.firstName + " " + person.lastName,
        course: course.title,
      };
      const sendCoursePublishedEmail = functions.httpsCallable("sendCoursePublishedEmail");
      return sendCoursePublishedEmail(data);
    },

    sortNodes() {
      // this mounted block orders currentCourseNodes by timestamp. this is for selecting easier selecting of an intro node
      let timeCreatedArrs = [];

      for (let index in this.currentCourseNodes) {
        let timeCreatedNode = this.currentCourseNodes[index].nodeCreatedTimestamp?.seconds;

        timeCreatedArrs.push(timeCreatedNode);
        // console.log("unsorted arr", timeCreatedArrs);
      }

      timeCreatedArrs.sort(function (a, b) {
        return a - b;
      });

      // NOTE: the last int in the arr is the largest
      // console.log("sorted arr", timeCreatedArrs);

      for (let a in timeCreatedArrs) {
        // loop over the ordered time array
        let arrTime = timeCreatedArrs[a];
        for (let b in timeCreatedArrs) {
          let timeStamp = this.currentCourseNodes[b].nodeCreatedTimestamp?.seconds;
          if (arrTime == timeStamp) {
            let node = this.currentCourseNodes[b];
            this.sortedObjArr.push(node);
          }
        }
      }

      this.sortedObjArr = this.sortedObjArr.reverse();
    },
  },
};
</script>

<style lang="scss" scoped>
/* Dialog */
.v-input .v-label {
  font-size: 0.8em;
}

.saveButton {
  width: 100%;
  justify-content: center;
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

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
    background-color: var(--v-background-base);
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
    background-color: var(--v-background-base);
  }
}

.create-dialog-content {
  background-color: var(--v-background-base);
  // width: 33.33%;
  // min-height: 400px;
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
    font-size: 0.8rem;
    color: var(--v-missionAccent-base) !important;
    text-transform: none;
  }

  .v-application .primary--text {
    color: var(--v-missionAccent-base) !important;
    caret-color: var(--v-missionAccent-base) !important;
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;
  font-style: italic;

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

.publishButton {
  width: 100%;
  z-index: 3;
  margin-top: 20px;
}

.label-text::v-deep label {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base) !important;
}
</style>
