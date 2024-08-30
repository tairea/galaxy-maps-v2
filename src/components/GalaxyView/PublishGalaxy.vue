<template>
  <v-dialog v-model="dialog" width="40%" light>
    <!-- CREATE BUTTON -->
    <template v-slot:activator="{ on, attrs }">
      <!-- ASSIGN COHORT -->

      <!-- publish button colour -->
      <v-btn
        outlined
        :color="
          admin &&
          course.status == 'submitted' &&
          (course.public == true || course.visibility == 'public')
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
    <div v-if="topicsWithoutTasks.length > 0 && !presentationOnly" class="create-dialog">
      <div class="dialog-header">
        <div class="d-flex mb-4">
          <p class="dialog-title ma-0">Important</p>
          <v-icon color="missionAccent" class="ml-2">{{ mdiAlertOutline }}</v-icon>
        </div>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <p class="dialog-description">
            For Navigators to progress through Galaxy Maps, <strong>ALL SYSTEMS</strong> must have
            <strong>AT LEAST ONE MISSION</strong>
          </p>
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
        <v-btn outlined color="baseAccent" class="ml-2" @click="presentation" :disabled="loading">
          <v-icon left> {{ mdiPresentation }} </v-icon>
          PRESENTATION ONLY
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
            An Introduction node is the starting node of the map. It is where Navigators will begin.
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
        <p class="dialog-title">
          publish galaxy <span v-if="presentationOnly">for presentation only</span>
        </p>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <div
            v-if="
              admin &&
              course.status == 'submitted' &&
              (course.public == true || course.visibility == 'public')
            "
            class="dialog-description"
          >
            <p style="font-weight: 600; color: var(--v-cohortAccent-base)">
              I have reviewed this Galaxy Map
            </p>
            <p>
              Publish
              <span style="font-weight: 600; color: var(--v-galaxyAccent-base)">{{
                course.title
              }}</span>
              galaxy to make publicly visible
            </p>
            <p>All Galaxy Maps users will be able to see and start this map.</p>
          </div>
          <!-- PRESENTATION ONLY -->
          <p v-else-if="presentationOnly" class="dialog-description">
            Publishing a Galaxy Map for
            <span class="baseAccent--text"><strong>Presentation Only</strong></span
            >, means Navigators <span class="red--text"><strong>WILL NOT</strong></span> be able to
            progress through this map.
          </p>
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
        <!-- PUBLISH OPTIONS -->
        <div v-if="!admin">
          <p class="caption mb-2">Choose whether you would like this galaxy to be:</p>

          <v-radio-group v-model="visibility" color="missionAccent" :light="!dark" :dark="dark">
            <v-radio
              v-if="!publicOnly"
              label="private (invite only)"
              value="private"
              color="missionAccent"
              class="label-text mb-4"
            ></v-radio>

            <v-radio
              v-if="!publicOnly"
              label="unlisted (public, but unlisted)"
              value="unlisted"
              color="missionAccent"
              class="label-text mb-4"
            ></v-radio>

            <v-radio
              v-if="!presentationOnly"
              label="public (visible by all Galaxy Maps users)"
              value="public"
              color="missionAccent"
              class="label-text"
            ></v-radio>
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
        <p class="caption ma-0 cohortAccent--text" v-if="visibility == 'public' && !admin">
          <i
            >(Public Galaxy Maps are visible by all users, so they need to be submitted for review by
            Galaxy Map moderators. This is usually done within 48 hours.)</i
          >
        </p>
      </div>

      <!-- ACTION BUTTONS -->
      <div v-if="admin" class="action-buttons">
        <v-btn
          outlined
          :color="
            admin &&
            course.status == 'submitted' &&
            (course.public == true || course.visibility == 'public')
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

      <!--===== Normal user Action Buttons =====-->
      <!-- Public courses get 'submitted' for review with submitCourse() -->
      <!-- Private and Unlisted courses get 'published' with publishCourse() -->
      <div v-else class="action-buttons">
        <v-btn
          v-if="visibility == 'public'"
          outlined
          color="baseAccent"
          @click="submitCourse()"
          :loading="loading"
        >
          <v-icon left> {{ mdiSend }} </v-icon>
          SUBMIT FOR REVIEW
        </v-btn>

        <v-btn v-else outlined color="baseAccent" @click="publishCourse()" :loading="loading">
          <v-icon left> {{ mdiCheck }} </v-icon>
          PUBLISH
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
import { fetchPersonByPersonId } from "@/lib/ff";
import { db, functions } from "@/store/firestoreConfig";
import { DocumentReference } from "firebase/firestore"; // Adjust the import according to your project structure
import useRootStore from "@/store/index";
import {
  mdiAlertOutline,
  mdiInformationVariant,
  mdiClose,
  mdiCheck,
  mdiSend,
  mdiPresentation,
} from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "PublishGalaxy",
  props: ["course", "courseTasks", "publicOnly"],
  async mounted() {},
  data: () => ({
    mdiAlertOutline,
    mdiInformationVariant,
    mdiClose,
    mdiCheck,
    mdiSend,
    mdiPresentation,
    dialog: false,
    loading: false,
    visibility: null,
    topicsWithoutTasks: 0,
    hasIntro: false,
    introNodes: [],
    sortedObjArr: [],
    presentationOnly: false,
  }),
  computed: {
    ...mapState(useRootStore, ["user", "person", "currentCourseId", "currentCourseNodes"]),
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
        this.visibility = newVal.visibility;
      },
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCourseId", "setSnackbar"]),
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

      // if publicOnly, select public by default
      if (this.publicOnly) {
        this.visibility = "public";
      }
    },
    close() {
      this.dialog = false;
      this.loading = false;
      this.visibility = null;
      this.presentationOnly = false;
    },

    // Public course getting submitted for review (by moderators)
    async submitCourse() {
      this.loading = true;
      let course = {
        ...this.course,
        visibility: this.visibility,
      };
      course.status = "submitted";
      await this.updateCourse(course);
      await this.sendNewSubmissionEmail(course);
      this.setCurrentCourseId(course.id);
      this.close();
    },

    async publishCourse() {
      this.loading = true;
      let course = this.course;

      if (!this.admin) {
        course = {
          ...course,
          visibility: this.visibility,
        };
      }

      course.status = "published";

      // if admin is publishing, set course.public to true (this make the course public to all users)
      if (this.admin && course.visibility == "public") {
        course.public = true;
      }

      // if presentationOnly is true, set course.presentationOnly to true
      if (this.presentationOnly) {
        course.presentationOnly = true;
      }

      // if no cohort, create a default cohort (and "presentation" maps should not have cohorts)
      if (!course.cohort && !this.presentationOnly) {
        // this creates a default cohort and sends an email to publisher
        let cohort = {
          name: course.title + " Squad",
          description: "This is the default Squad for " + course.title,
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
        const cohortId = await this.saveCohort(cohort);
        course.cohort = cohortId;
        await this.updateCourse(course, "published");
        this.setCurrentCourseId(course.id);
        this.close();
      } else {
        await this.updateCourse(course, "published");
        this.setCurrentCourseId(course.id);
        this.close();
      }
    },

    async updateCourse(course, context) {
      // Retrieve the course document
      const courseDoc = await db.collection("courses").doc(course.id).get();
      const courseDocData = courseDoc.data();

      const ownerRefString = courseDocData.owner.path;

      // Ensure the owner field is a DocumentReference
      const ownerRef =
        courseDocData.owner instanceof DocumentReference
          ? courseDocData.owner
          : db.doc(ownerRefString);

      const courseData = {
        ...course,
        owner: ownerRef,
      };

      await db.collection("courses").doc(course.id).update(courseData);
      console.log("Document successfully updated!");
      this.setCurrentCourseId(course.id);
      this.setSnackbar({
        show: true,
        text: "Galaxy successfully " + (context ? context : "updated"),
        color: "baseAccent",
      });
    },

    async saveCohort(cohort) {
      // Add a new document in collection "cohorts"
      const cohortDocRef = await db.collection("cohorts").add(cohort);
      console.log(
        "new default cohort created for - ",
        cohort.name,
        " cohort id - ",
        cohortDocRef.id,
      );

      if (this.admin) {
        const person = await fetchPersonByPersonId(cohort.teachers[0]);
        person.inviter = "Galaxy Maps Admin";
        await this.sendCoursePublishedEmail(person, this.course);
      } else {
        await this.sendCoursePublishedEmail(this.person, this.course);
      }
      return cohortDocRef.id;
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
        id: course.id,
      };
      const sendNewSubmissionEmail = functions.httpsCallable("sendNewSubmissionEmail");
      return sendNewSubmissionEmail(data);
    },

    sendCoursePublishedEmail(person, course) {
      console.log("sendCoursePublishedEmail person: ", person, " course: ", course);
      let data = {
        email: person.email,
        name: person.firstName + " " + person.lastName,
        course: course.title ? course.title : course.name, //  course.title is used in the case of a course & course.name is used in the case of a cohort
      };
      const sendCoursePublishedEmail = functions.httpsCallable("sendCoursePublishedEmail");
      return sendCoursePublishedEmail(data);
    },

    sortNodes() {
      // this mounted block orders currentCourseNodes by timestamp. this is for easier selecting of an intro node
      let timeCreatedArrs = [];

      for (let index in this.currentCourseNodes) {
        let timeCreatedNode = this.currentCourseNodes[index].hasOwnProperty("topicCreatedTimestamp")
          ? this.currentCourseNodes[index].topicCreatedTimestamp.seconds
          : this.currentCourseNodes[index].nodeCreatedTimestamp.seconds;

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
          let timeStamp = this.currentCourseNodes[b].hasOwnProperty("topicCreatedTimestamp")
            ? this.currentCourseNodes[b].topicCreatedTimestamp.seconds
            : this.currentCourseNodes[b].nodeCreatedTimestamp.seconds;
          if (arrTime == timeStamp) {
            let node = this.currentCourseNodes[b];
            this.sortedObjArr.push(node);
          }
        }
      }

      this.sortedObjArr = this.sortedObjArr.reverse();
    },

    async saveIntroNode() {
      this.loading = true;
      // loop selected intro nodes
      for (const nodeId of this.introNodes) {
        // update node in topics db
        await db
          .collection("courses")
          .doc(this.currentCourseId)
          .collection("map-nodes")
          .doc(nodeId)
          .update({ group: "introduction" });

        // update node in topics db
        await db
          .collection("courses")
          .doc(this.currentCourseId)
          .collection("topics")
          .doc(nodeId)
          .update({ group: "introduction" });

        console.log("node id " + nodeId + " set as introduction node");
      }
      this.close();
    },

    presentation() {
      this.presentationOnly = true;
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
  // width: 100%;
  z-index: 3;
  // margin-top: 20px;
}

.label-text::v-deep label {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base) !important;
}
</style>
