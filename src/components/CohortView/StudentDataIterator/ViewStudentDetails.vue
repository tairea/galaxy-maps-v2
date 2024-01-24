<template>
  <v-dialog v-model="dialog" fullscreen hide-overlay>
    <!-- <v-dialog v-model="dialog" width="90%"> -->
    <div class="create-dialog">
      <!-- HEADER -->
      <div class="dialog-header">
        <p class="mb-0 d-flex justify-center align-center">Student Overview</p>
        <v-btn icon @click="dialog = false">
          <v-icon color="missionAccent">{{ mdiClose }}</v-icon>
        </v-btn>
      </div>
      <div class="create-dialog-content">
        <div class="d-flex justify-center align-center">
          <StudentCardStatus
            :student="student"
            :date="date"
            :status="status"
            :size="100"
            class="pl-1"
          />
        </div>
        <div>
          <div class="field">
            <p class="label">First Name:</p>
            <p class="value">{{ student.firstName }}</p>
          </div>
          <div class="field">
            <p class="label">Last Name:</p>
            <p class="value">{{ student.lastName }}</p>
          </div>
          <div class="field">
            <p class="label">E-mail:</p>
            <p class="value">{{ student.email }}</p>
          </div>
          <div v-if="student.parentEmail" class="field">
            <p class="label">Parent E-mail:</p>
            <p class="value">{{ student.parentEmail }}</p>
          </div>
          <div v-if="student.nsn" class="field">
            <p class="label">Student ID:</p>
            <p class="value">{{ student.nsn }}</p>
          </div>
        </div>
        <v-row class="mt-3 flex-column justify-center align-center">
          <!-- EDIT -->

          <!-- <v-btn
            @click="openEditDialog()"
            outlined
            :dark="dark"
            :light="!dark"
            class="ma-4"
            width="50%"
          >
            Edit
          </v-btn> -->

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
        </v-row>
      </div>
    </div>
  </v-dialog>
</template>

<script>
import StudentCardStatus from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardStatus.vue";
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
    StudentCardStatus,
  },
  created() {
    this.counterInterval = setInterval(
      function () {
        this.setTime();
      }.bind(this),
      10000,
    );
    return this.setTime();
  },
  destroyed() {
    clearInterval(this.counterInterval);
  },
  mounted() {},
  data: () => ({
    mdiClose,
    date: "",
  }),
  computed: {
    ...mapState(useRootStore, ["userStatus"]),
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
      this.$emit("cancel");
      this.$emit("edit", student);
    },
    routeToStudentDashboard() {
      alert("to do: routeToStudentDashboard()");
    },
    setTime() {
      this.date = Date.now();
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
  flex-wrap: wrap;
  overflow-x: hidden;
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
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;
  background-color: var(--v-background-base);

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

.cohort-btn {
  font-weight: 400;
}
</style>
