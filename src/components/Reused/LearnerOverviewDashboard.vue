<template>
  <v-dialog v-model="dialog" fullscreen hide-overlay>
    <!-- <v-dialog v-model="dialog" width="90%"> -->
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <p class="mb-0 d-flex justify-center align-center">Learner's Overview</p>
        <v-btn icon @click="close">
          <v-icon color="missionAccent">{{ mdiClose }}</v-icon>
        </v-btn>
      </div>
      <!-- CONTENT SECTION -->
      <div id="sticky" class="create-dialog-content mission-border-bottom">
        <!-- STUDENT NAME & EMAIL -->
        <div class="student-details">
          <div class="d-flex justify-center align-center">
            <StudentCardStatus
              :student="student"
              :date="date"
              :status="status"
              :size="100"
              class="pl-1"
            />
          </div>

          <div
            class="student-name-email-id d-flex flex-column justify-center"
            style="width: 40%; padding-left: 50px"
          >
            <div class="d-flex justify-start ml-6 align-center" style="width: 100%">
              <div class="field">
                <p class="label">First Name:</p>
                <p class="value">{{ student.firstName }}</p>
              </div>
              <div class="field ml-8">
                <p class="label">Last Name:</p>
                <p class="value">{{ student.lastName }}</p>
              </div>
              <div class="field ml-8">
                <p class="label">E-mail:</p>
                <p class="value">{{ student.email }}</p>
              </div>
              <div v-if="student.parentEmail" class="field ml-8">
                <p class="label">Parent E-mail:</p>
                <p class="value">{{ student.parentEmail }}</p>
              </div>
            </div>
            <div class="student-id d-flex justify-start ml-6 align-center" style="width: 100%">
              <div v-if="student.nsn" class="field">
                <p class="label">Student NSN:</p>
                <p class="value">{{ student.nsn }}</p>
              </div>
              <div v-if="student.id" class="field">
                <p class="label">Navigator ID:</p>
                <p class="value text-caption" style="color: gray">{{ student.id }}</p>
              </div>
              <!-- edit button -->
            </div>
            <div class="edit-button ml-6">
              <StudentEditDialog :isStudentPopupView="true" :student="student" />
            </div>
          </div>

          <!-- XP Points -->
          <StudentXpPoints :student="student" :studentOverview="true" style="width: 20%" />

          <div class="d-flex flex-column justify-center align-center" style="width: 40%">
            <!-- EMAIL -->
            <v-btn
              @click="sendMail()"
              width="50%"
              class="ma-3 disabledButton"
              color="baseAccent"
              outlined
              :dark="dark"
              :light="!dark"
            >
              Send Email
            </v-btn>
            <!-- DASHBOARD -->
            <v-btn
              @click="routeToStudentDashboard()"
              width="50%"
              class="ma-3 disabledButton"
              color="missionAccent"
              outlined
              disabled
              :dark="dark"
              :light="!dark"
            >
              View Users Dashboard
            </v-btn>
          </div>
        </div>
      </div>

      <!-- STUDENT DATA CONTAINER -->
      <div class="d-flex mission-border-bottom student-data-container">
        <!-- CONTENT SECTION = SUBMISSIONS -->
        <div class="create-dialog-content submissions-container">
          <p class="cohortAccent--text text-center mission-border-bottom py-3 ma-0">SUBMISSIONS</p>
          <div class="submissions-awaiting-review mission-border-bottom">
            <p class="overline text-center">AWAITING REVIEW</p>
            <SubmissionTeacherFrame
              :students="students"
              :isTeacher="true"
              :allStudentsSubmissions="submissions"
              class="ma-4"
              :studentOverview="true"
              @submissionsChanged="submissionsChanged"
              :loading="loadingSubmissions"
              :showCourseImage="true"
              :dense="true"
            />
          </div>
          <div class="submissions-completed mission-border-bottom">
            <p class="overline text-center">COMPLETED</p>
            <SubmissionTeacherFrame
              :students="students"
              :isTeacher="true"
              :allStudentsSubmissions="submissions"
              class="ma-4"
              :studentOverview="true"
              :completedSubmissionsOnly="true"
              @submissionsChanged="submissionsChanged"
              :loading="loadingSubmissions"
              :showCourseImage="true"
              :dense="true"
            />
          </div>
        </div>

        <!-- CONTENT SECTION -->
        <div class="create-dialog-conten student-charts">
          <TimeframeFilters
            @timeframe="timeframe = $event"
            :earliestDate="lowestActivityTimestamp"
            class="d-flex justify-center mt-1"
          />

          <div class="student-courses-linechart">
            <ProgressionLineChartStudentCourses
              :student="student"
              :courseData="studentCoursesActivity"
              :timeframe="timeframe"
              class="line-chart"
            />
          </div>
          <div class="student-courses-barchart">
            <ActivityBarChartStudentCourses
              :student="student"
              :activityData="studentTimeData"
              :timeframe="timeframe"
            />
          </div>
          <div class="student-activity-log">
            <StudentActivityTimeline :student="student" />
          </div>
        </div>

        <!-- CONTENT SECTION = REQUESTS FOR HELP -->
        <div class="create-dialog-content help-container">
          <p class="galaxyAccent--text text-center mission-border-bottom py-3 ma-0">
            REQUESTS FOR HELP
          </p>
          <div class="help-awaiting-reply mission-border-bottom">
            <p class="overline text-center">AWAITING REPLY</p>
            <RequestForHelpTeacherFrame
              :students="students"
              :studentOverview="true"
              :loading="loadingRequests"
              :showCourseImage="true"
              @requestsChanged="requestsChanged"
              :allStudentsRequests="requests"
              :dense="true"
              :isTeacher="true"
              class="ma-4"
            />
          </div>
          <div class="help-completed mission-border-bottom">
            <p class="overline text-center">COMPLETED</p>
            <RequestForHelpTeacherFrame
              :students="students"
              :studentOverview="true"
              :loading="loadingRequests"
              :showCourseImage="true"
              :completedRequestsOnly="true"
              @requestsChanged="requestsChanged"
              :allStudentsRequests="requests"
              :dense="true"
              :isTeacher="true"
              class="ma-4"
            />
          </div>
        </div>
      </div>
      <!-- END of STUDENT DATA CONTAINER -->
    </div>
  </v-dialog>
</template>

<script>
import { fetchStudentSubmissionsByPersonId, fetchStudentRequestsByPersonId } from "@/lib/ff";
import ProgressionLineChartStudentCourses from "@/components/Reused/ProgressionLineChartStudentCourses.vue";
import RequestForHelpTeacherFrame from "@/components/Reused/RequestForHelpTeacherFrame.vue";
import StudentActivityTimeline from "@/components/Reused/StudentActivityTimeline.vue";
import StudentCardStatus from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardStatus.vue";
import StudentEditDialog from "@/components/Dialogs/StudentEditDialog.vue";
import SubmissionTeacherFrame from "@/components/Reused/SubmissionTeacherFrame.vue";
import useRootStore from "@/store/index";
import { mapState } from "pinia";
import { mdiClose } from "@mdi/js";
import TimeframeFilters from "@/components/Reused/TimeframeFilters.vue";
import ActivityBarChartStudentCourses from "@/components/Reused/ActivityBarChartStudentCourses.vue";

export default {
  name: "LearnerOverviewDashboard",
  props: {
    dialog: { type: Boolean },
    student: { type: Object },
    studentCoursesActivity: { type: Array },
    studentTimeData: { type: Array }, // TODO: get locally too as timeframe changes here too
  },
  components: {
    ProgressionLineChartStudentCourses,
    RequestForHelpTeacherFrame,
    StudentActivityTimeline,
    StudentCardStatus,
    StudentEditDialog,
    SubmissionTeacherFrame,
    ActivityBarChartStudentCourses,
  },
  data: () => ({
    mdiClose,
    date: new Date(),
    students: [],
    submissions: null,
    requests: null,
    loadingSubmissions: true,
    loadingRequests: true,
    timeframe: {},
    lowestActivityTimestamp: null,
  }),
  async mounted() {
    this.lowestActivityTimestamp = this.studentCoursesActivity.reduce((lowest, course) => {
      const courseLowestTimestamp = course.activities.reduce((lowest, activity) => {
        // return lowest activity timestamp
        return new Date(activity.timeStamp) < lowest ? new Date(activity.timeStamp) : lowest;
      }, Infinity);
      // return lowest course timestamp
      return courseLowestTimestamp < lowest ? courseLowestTimestamp : lowest;
    }, Infinity);

    this.students.push(this.student);

    // ==== get submission data
    this.submissions = await fetchStudentSubmissionsByPersonId(this.student.id);

    this.loadingSubmissions = false;

    // ==== get request data
    this.requests = await fetchStudentRequestsByPersonId(this.student.id);

    this.loadingRequests = false;
  },
  computed: {
    ...mapState(useRootStore, ["userStatus", "person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
    status() {
      return this.userStatus[this.student.id];
    },
    courses() {
      return this.student?.assignedCourses?.map((course) => {
        return { id: course };
      });
    },
  },
  methods: {
    sendMail() {
      // var subject = document.getElementById("selectList").value;
      // var yourMessage = document.getElementById("message").value;
      const subject = "GalaxyMaps Comms";
      const yourMessage = "Hey " + this.student.firstName + ", ";
      document.location.href =
        "mailto:" +
        this.student.email +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(yourMessage);
    },
    routeToStudentDashboard() {
      alert("to do: routeToStudentDashboard()");
    },
    close() {
      this.$emit("cancel");
    },
    async submissionsChanged() {
      this.loadingSubmissions = true;
      // ==== get submission data
      // this.submissions = await fetchStudentSubmissionsByPersonId(this.student.id);
      this.loadingSubmissions = false;
    },
    async requestsChanged() {
      this.loadingRequests = true;
      // ==== get submission data
      // this.requests = await fetchStudentRequestsByPersonId(this.student.id);
      this.loadingRequests = false;
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
  display: flex;
  // flex-wrap: wrap;
  overflow-x: hidden;
  flex-direction: column;
  height: 100%;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
    display: flex;
    justify-content: space-between;
    height: 80px;
  }
}

.create-dialog-content {
  display: flex;
  // justify-content: space-around;
  // align-items: space-around;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;
  background-color: var(--v-background-base);
  // border-bottom: 1px solid var(--v-missionAccent-base);
  // border: 1px solid yellow;
  .student-details {
    display: flex;
  }

  .label {
    font-size: 0.7rem;
    margin: 0px;
  }

  .value {
    color: white;
  }

  .custom-input {
    color: var(--v-missionAccent-base);
  }
}

.submissions-container,
.help-container {
  width: 20%;
  display: flex;
  flex-direction: column;
  padding: 0px;
  justify-content: flex-start;

  .submissions-awaiting-review,
  .help-awaiting-reply {
    // width: 60%;
    // border-right: 1px solid var(--v-missionAccent-base);
    padding: 20px 0px;
  }
  .submissions-completed,
  .help-completed {
    // width: 40%;
    padding: 20px 0px;
  }
}

.chart {
  padding: 0px 20px 20px 20px;
}

// .student-data-container {
//   border-top: 1px solid var(--v-missionAccent-base);
//   border-bottom: 1px solid var(--v-missionAccent-base);
// }

.student-charts {
  width: 60%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--v-missionAccent-base);
  border-right: 1px solid var(--v-missionAccent-base);

  .student-courses-linechart {
    // width: 60%;
    padding: 0px 20px 10px 20px;
  }
  .student-courses-barchart {
    // width: 40%;
    padding: 10px 20px;
  }
  .student-activity-log {
    // width: 40%;
    padding: 10px 20px;
  }
}

.cohort-btn {
  font-weight: 400;
}

#sticky {
  position: -webkit-sticky; /* Safari */
  position: sticky;
  top: 0;
  z-index: 5;
}

.mission-border-bottom {
  border-bottom: 1px solid var(--v-missionAccent-base);
}
.mission-left-bottom {
  border-left: 1px solid var(--v-missionAccent-base);
}
</style>
