<template>
  <v-dialog v-model="dialog" fullscreen hide-overlay>
    <!-- <v-dialog v-model="dialog" width="90%"> -->
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <p class="mb-0 d-flex justify-center align-center">Student Overview</p>
        <v-btn icon @click="close">
          <v-icon color="missionAccent">{{ mdiClose }}</v-icon>
        </v-btn>
      </div>
      <!-- CONTENT SECTION -->
      <div class="create-dialog-content">
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
            style="width: 50%; padding-left: 50px"
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
                <p class="label">Student ID:</p>
                <p class="value text-caption" style="color: gray">{{ student.id }}</p>
              </div>
              <!-- edit button -->
            </div>
            <div class="edit-button ml-6">
              <StudentEditDialog :isStudentPopupView="true" />
            </div>
          </div>

          <div class="d-flex flex-column justify-center align-center" style="width: 50%">
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

      <!-- CONTENT SECTION = SUBMISSIONS -->
      <div class="create-dialog-content submissions-container">
        <div class="submissions-awaiting-review">
          <p class="cohortAccent--text">SUBMISSIONS AWAITING REVIEW</p>
          <SubmissionTeacherFrame
            :students="students"
            :isTeacher="true"
            :allStudentsSubmissions="submissions"
            class="mt-4"
            :studentOverview="true"
            @submissionsChanged="submissionsChanged"
            :loading="loading"
            :showCourseImage="true"
          />
        </div>
        <div class="submissions-completed">
          <p class="cohortAccent--text">SUBMISSIONS COMPLETED</p>
          <SubmissionTeacherFrame
            :students="students"
            :isTeacher="true"
            :allStudentsSubmissions="submissions"
            class="mt-4"
            :studentOverview="true"
            :completedSubmissionsOnly="true"
            @submissionsChanged="submissionsChanged"
            :loading="loading"
            :showCourseImage="true"
          />
        </div>
      </div>

      <!-- CONTENT SECTION = REQUESTS FOR HELP -->
      <div class="create-dialog-content help-container">
        <div class="help-awaiting-reply">
          <p class="galaxyAccent--text">REQUESTS FOR HELP AWAITING REPLY</p>
          <RequestForHelpTeacherFrame :students="students" />
        </div>
        <div class="help-completed">
          <p class="galaxyAccent--text">REQUESTS FOR HELP COMPLETED</p>
        </div>
      </div>

      <!-- CONTENT SECTION -->
      <div class="create-dialog-content">
        <!-- <ProgressionLineChart
          :key="courseData.id"
          :courseData="courseData"
          :timeframe="timeframe"
          :selectedPersons="selectedPersons"
          :unselectedPersons="unselectedPersons"
          class="line-chart"
        /> -->
      </div>
    </div>
  </v-dialog>
</template>

<script>
import { fetchStudentSubmissionsByPersonIdForATeacher } from "@/lib/ff";
import ProgressionLineChart from "@/components/Reused/ProgressionLineChart.vue";
import RequestForHelpTeacherFrame from "@/components/Reused/RequestForHelpTeacherFrame.vue";
import StudentCardStatus from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardStatus.vue";
import StudentEditDialog from "@/components/Dialogs/StudentEditDialog.vue";
import SubmissionTeacherFrame from "@/components/Reused/SubmissionTeacherFrame.vue";
import useRootStore from "@/store/index";
import { mapState } from "pinia";
import { mdiClose } from "@mdi/js";

export default {
  name: "ViewStudentDetails",
  props: {
    dialog: { type: Boolean },
    student: { type: Object },
  },
  components: {
    ProgressionLineChart,
    RequestForHelpTeacherFrame,
    StudentCardStatus,
    StudentEditDialog,
    SubmissionTeacherFrame,
  },
  data: () => ({
    mdiClose,
    date: "",
    students: [],
    submissions: null,
    loading: true,
  }),
  async mounted() {
    this.students.push(this.student);

    // ==== get submission data
    //this.submissions = await fetchStudentSubmissionsByPersonId(this.student.id); // this should be an admin call as it will show all submissions. even submissions that are for other teachers.
    this.submissions = await fetchStudentSubmissionsByPersonIdForATeacher(
      this.student.id,
      this.person.id,
    ); // this should be an admin call as it will show all submissions. even submissions that are for other teachers.
    this.loading = false;
    console.log("submissions from ff", this.submissions);
  },
  computed: {
    ...mapState(useRootStore, ["userStatus", "person"]),
    teacher() {
      return this.accountType === "teacher";
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
    status() {
      return this.userStatus[this.student.id];
    },
  },
  methods: {
    sendMail() {
      // var subject = document.getElementById("selectList").value;
      // var yourMessage = document.getElementById("message").value;
      var subject = "GalaxyMaps Comms";
      var yourMessage = "Hey " + this.student.firstName + ", ";
      document.location.href =
        "mailto:" +
        this.student.email +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(yourMessage);
    },
    openEditDialog() {
      // this.$emit("cancel");
      // this.$emit("edit", student);
      console.log("todo: edit person dialog");
    },
    routeToStudentDashboard() {
      alert("to do: routeToStudentDashboard()");
    },
    close() {
      this.$emit("cancel");
    },
    async submissionsChanged() {
      console.log("submissions changed flag triggered");
      this.loading = true;
      // ==== get submission data
      this.submissions = await fetchStudentSubmissionsByPersonIdForATeacher(
        this.student.id,
        this.person.id,
      );
      this.loading = false;
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
  border-bottom: 1px solid var(--v-missionAccent-base);
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
  width: 100%;
  display: flex;
  flex-direction: row;
  padding: 0px;
  justify-content: flex-start;

  .submissions-awaiting-review,
  .help-awaiting-reply {
    width: 60%;
    border-right: 1px solid var(--v-missionAccent-base);
    padding: 20px;
  }
  .submissions-completed,
  .help-completed {
    width: 40%;
    padding: 20px;
  }
}

.cohort-btn {
  font-weight: 400;
}
</style>
