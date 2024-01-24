<template>
  <div class="student-card" :class="status ? '' : 'not-active'">
    <!-- Image & Name -->
    <div class="avatar-section text-center mt-2">
      <Avatar :size="50" :personId="student.id" :colourBorder="true" />
    </div>

    <!-- Name -->
    <div class="student-section">
      <!-- <p class="label">Name & Email:</p> -->
      <div class="student-details">
        <p v-if="student.firstName || student.lastName" class="student-name ma-0">
          {{ student.firstName }} {{ student.lastName }}
        </p>
        <p v-else class="student-name ma-0">[no name]</p>
        <p class="student-email overline ma-0">
          {{ student.email }}
        </p>
        <p class="student-id mt-1">{{ student.id }}</p>
      </div>
    </div>

    <!-- Active Status -->
    <div class="active-section">
      <p class="label">Last active:</p>
      <div class="active-container">
        <p :class="online" class="last-active">{{ loggedIn }}</p>
      </div>
    </div>

    <!-- Courses -->
    <div class="maps-section">
      <p class="label">Galaxy Maps:</p>
      <div class="course-chips">
        <v-chip
          close
          @click:close="removeCourseFromPerson(course)"
          v-for="course in studentsAssignedCourses"
          :key="course.id"
          class="ma-1"
          small
        >
          <v-avatar start v-if="course.image?.url" class="mr-1">
            <v-img :src="course.image.url"></v-img>
          </v-avatar>
          <p v-if="course.title" class="chip-label">
            {{ course.title.toUpperCase() }}
          </p>
          <p v-else class="chip-label"></p>
        </v-chip>
      </div>
    </div>

    <v-dialog v-model="dialogConfirm" width="40%" light>
      <div class="create-dialog">
        <!-- header -->
        <div class="dialog-header py-5">
          <p>
            <v-icon left color="missionAccent">{{ mdiAlertOutline }}</v-icon
            ><strong>Warning!</strong> Delete Map from Person?
          </p>
        </div>

        <!-- content -->
        <div class="dialog-content">
          <div class="d-flex align-start">
            <p class="dialog-description">
              Are you sure you want to <strong>DELETE</strong> the
              <span class="course-text">{{ courseForDialog?.title }} GALAXY MAP</span> from
              <span class="person-text">{{ student.firstName + " " + student.lastName }}</span
              >?
              <br />
              <br />
              <span class="danger">Deleting is permanent!!!</span>
              <br />
              <br />
              <span class="person-text">{{ student.firstName + " " + student.lastName }}</span>
              will lose all data related to this <span class="galaxy-text">GALAXY MAP</span>
            </p>
          </div>
        </div>

        <!-- action buttons -->
        <div class="action-buttons">
          <v-btn
            outlined
            color="error"
            @click="confirmDeleteCourseFromPerson(courseForDialog?.id)"
            class="ml-2"
            :loading="deleting"
          >
            <v-icon left> {{ mdiDelete }} </v-icon>
            DELETE
          </v-btn>

          <v-btn
            outlined
            :color="$vuetify.theme.dark ? 'yellow' : 'f7f7ff'"
            class="ml-2"
            @click="dialogConfirm = false"
            :disabled="disabled"
          >
            <v-icon left> {{ mdiClose }} </v-icon>
            Cancel
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
// TODO: move these components to Reused as used in CohortView and AllStudentsView
import StudentCardStatus from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardStatus.vue";
import StudentCardProgress from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardProgress.vue";
import StudentCardActivities from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardActivities.vue";
import StudentHours from "@/components/CohortView/StudentDataIterator/StudentCard/StudentHours.vue";
import StudentCompletedTasks from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCompletedTasks.vue";
import StudentCohorts from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCohorts.vue";
import StudentActions from "@/components/CohortView/StudentDataIterator/StudentCard/StudentActions.vue";
import StudentActivityTimeline from "@/components/Reused/StudentActivityTimeline.vue";
import StudentXpPoints from "@/components/CohortView/StudentDataIterator/StudentCard/StudentXpPoints.vue";

import {
  //   fetchCohortByCohortId,
  fetchCourseByCourseId,
} from "@/lib/ff";

import useRootStore from "@/store/index";
import { mapState, mapActions } from "pinia";
import { mdiAccount, mdiAlertOutline, mdiDelete, mdiClose } from "@mdi/js";

export default {
  name: "StudentCardAdmin",
  components: {
    StudentCardStatus,
    StudentCardActivities,
    StudentCardProgress,
    StudentHours,
    StudentCompletedTasks,
    StudentCohorts,
    StudentActions,
    StudentActivityTimeline,
  },
  props: ["student", "timeframe", "date"],
  data() {
    return {
      mdiAccount,
      mdiAlertOutline,
      mdiDelete,
      mdiClose,
      topic: "",
      task: "",
      missions: [],
      hours: "",
      work: [],
      help: [],
      assignedCourse: null,
      studetProfile: [],
      activities: [],
      studentTimeData: [],
      studentsAssignedCourses: [],
      dialogConfirm: false,
      deleting: false,
      disabled: false,
      courseForDialog: null,

      // studentTimeDataLoading: false
    };
  },
  async mounted() {
    // get course data (from LRS.io)
    //this.studentsAssignedCourses = await getStudentsCoursesXAPIQuery(this.student); // this is getting the data from LRS.io. limit is 10,000 calls. might need to change this to get data to get from firestore

    // get course data (from firestore)
    // this.student.assignedCourses is an array of course ids

    this.student.assignedCourses?.forEach(async (courseId) => {
      const course = await fetchCourseByCourseId(courseId);
      this.studentsAssignedCourses.push(course);
    });

    // console.log("this.studentsAssignedCourses", this.studentsAssignedCourses);
  },
  // watch that watches student for any student.assignedCourses changes
  watch: {
    "student.assignedCourses": {
      handler: function (val, oldVal) {
        this.studentsAssignedCourses = [];
        val.forEach(async (courseId) => {
          const course = await fetchCourseByCourseId(courseId);
          this.studentsAssignedCourses.push(course);
        });
      },
      deep: true,
    },
  },
  computed: {
    ...mapState(useRootStore, ["currentCohort", "userStatus"]),
    status() {
      return this.userStatus[this.student.id];
    },
    online() {
      if (this.loggedIn === "online") return "online";
    },
    loggedIn() {
      if (!this.status) return "inactive";
      if (this.status.state === "online") {
        return "online";
      } else return this.timePassed(this.date);
    },
  },
  methods: {
    ...mapActions(useRootStore, ["deleteCourseFromPerson"]),

    removeCourseFromPerson(course) {
      this.courseForDialog = course;
      console.log("get course and remove it", course.id);
      // trigger delete confirm dialog
      this.dialogConfirm = true;
    },
    async confirmDeleteCourseFromPerson() {
      this.disabled = true;
      this.deleting = true;
      console.log("deleting course from person", this.courseForDialog);

      await this.deleteCourseFromPerson(this.student.id, this.courseForDialog.id);
      this.dialogConfirm = false;
      this.disabled = false;
      this.deleting = false;
    },
    timePassed(now) {
      var date = Math.round(now / 1000);
      var delta = date - this.status?.last_changed?.seconds;

      this.$emit("updateStudentsWithLastActive", {
        person: this.student,
        lastActive: delta ? delta : 0,
      });

      // calculate (and subtract) whole days
      var days = Math.floor(delta / 86400);

      // calculate (and subtract) whole hours
      var hours = Math.floor(delta / 3600);

      // calculate (and subtract) whole minutes
      var minutes = Math.floor(delta / 60);

      if (minutes < 1) return `just now`;
      if (minutes < 60) return `${minutes} mins ago`;
      if (hours < 24) return `${hours} hrs ago`;
      return `${days} days ago`;
    },
  },
};
</script>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

a {
  color: var(--v-missionAccent-base) !important;
}

.student-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;
  // height: 120px;
  width: 100%;

  // ==== Image ====
  .avatar-section {
    min-width: 15%;
    max-width: 20%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .imagePlaceholder {
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 0.6rem;
      background-color: var(--v-subBackground-base);
      width: 50px;
      height: 50px;
    }
  }

  // ==== Name & Email ====
  .student-section {
    width: 30%;

    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);

    .student-details {
      padding: 5px;

      .student-name {
        font-size: 1.2rem;
        color: var(--v-missionAccent-base);
        font-weight: 600;
        text-transform: uppercase;
        margin: 5px 0px;
      }
      .student-email {
        line-height: 1;
      }

      .student-id {
        font-size: 0.6rem;
        color: gray;
        // font-style: italic;
        text-transform: uppercase;
      }
    }
  }

  // ==== Active ====
  .active-section {
    width: 20%;
    display: flex;
    flex-direction: column;
    border-left: 1px dashed var(--v-missionAccent-base);

    .active-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;

      .last-active {
        font-size: 0.8rem;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .online {
        color: var(--v-baseAccent-base);
      }
    }
  }

  .maps-section {
    width: 35%;
    display: flex;
    flex-direction: column;
    border-left: 1px dashed var(--v-missionAccent-base);

    .course-chips {
      width: 100%;
      height: 100%;

      .chip-label {
        font-size: 0.6rem;
        text-transform: uppercase;
        margin: 0px !important;
      }
    }
  }
}

.label {
  font-size: 0.6rem;
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  padding: 5px;
  padding-bottom: 0px;
}

.not-active {
  color: grey;
  // border-color: grey !important;
}

.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow: hidden !important;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .dialog-content {
    padding: 20px;
    border-bottom: 1px solid var(--v-missionAccent-base);
    width: 100%;
    .dialog-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin: 0;

      .course-text {
        color: var(--v-galaxyAccent-base);
        text-transform: uppercase;
        font-weight: 700;
        background-color: var(--v-subBackground-base);
        padding: 0px 5px;
      }
      .person-text {
        color: var(--v-cohortAccent-base);
        text-transform: uppercase;
        font-weight: 700;
        background-color: var(--v-subBackground-base);
        padding: 0px 5px;
      }

      .danger {
        font-size: 1.3rem;
        color: red;
      }
    }
  }

  .action-buttons {
    width: 100%;
    padding: 20px;
  }
}
</style>
