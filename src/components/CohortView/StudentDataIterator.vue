<template>
  <v-container fluid>
    <v-data-iterator
      v-if="cohort"
      :items="sortedStudents"
      :items-per-page="-1"
      :search="search"
      :sort-by="sortBy !== 'lastActive' ? sortBy : null"
      :sort-desc="sortDesc"
      hide-default-footer
    >
      <!-- HEADER -->
      <template v-slot:header>
        <div class="d-flex justify-end">
          <div v-if="students.length" class="mx-1 d-flex" style="width: 66%">
            <!-- Search -->
            <v-text-field
              v-model="search"
              clearable
              flat
              width="50%"
              hide-details
              :prepend-inner-icon="mdiMagnify"
              label="Search"
              dense
              outlined
              color="missionAccent"
              class="search"
            ></v-text-field>
            <!-- Items Select -->
            <div class="mx-2" style="width: 50%">
              <v-select
                v-model="sortBy"
                outlined
                color="missionAccent"
                hide-details
                :items="keys"
                :prepend-inner-icon="mdiSortAlphabeticalVariant"
                label="Sort by"
                dense
                class="mb-1 sort"
                @click:prepend-inner="sortDesc = !sortDesc"
              ></v-select>
            </div>
            <!-- Arrow buttons -->
            <v-btn-toggle background-color="background" v-model="sortDesc" mandatory dense>
              <v-btn small outlined color="missionAccent" :value="false" style="padding: 18px">
                <v-icon small>{{ mdiArrowUp }}</v-icon>
              </v-btn>
              <v-btn small outlined color="missionAccent" :value="true" style="padding: 18px">
                <v-icon small>{{ mdiArrowDown }}</v-icon>
              </v-btn>
            </v-btn-toggle>
          </div>
          <div class="mx-1">
            <StudentAccountsDialog
              v-if="isTeacher"
              :students="students"
              @updateStudentProfile="updateStudentProfile($event)"
            />
            <!-- <CreateAccountDialog accountType="student" />
          </div>
          <div class="mx-1">
            <ImportCsvDialog /> -->
          </div>
        </div>
      </template>

      <!-- PROPS -->
      <template v-slot:default="props">
        <div class="d-flex justify-center align-center mt-3">
          <TimeframeFilters :showDate="true" @timeframe="setTimeframe($event)" />
        </div>
        <StudentCard
          v-for="student in props.items"
          :key="student.id"
          :cohort="cohort"
          :student="student"
          :timeframe="timeframe"
          :date="date"
          @showStudent="showStudent"
          @updateStudentsWithHours="updateStudentsWithHours($event)"
          @updateStudentsWithTasks="updateStudentsWithTasks($event)"
          @updateStudentsWithLastActive="updateStudentsWithLastActive($event)"
        />
      </template>

      <template v-slot:no-data>
        <div v-if="searchingStudents" class="d-flex align-center flex-column">
          <p class="noStudents mt-10 mb-5">Searching for Navigators</p>
          <v-progress-linear
            color="missionAccent"
            indeterminate
            style="width: 50%"
          ></v-progress-linear>
        </div>
        <p v-else class="ma-10 noStudents">No Navigators in this Squad</p>
      </template>
    </v-data-iterator>
    <!-- Student Dialog -->
    <LearnerOverviewDashboard
      v-if="showStudentFlag && isTeacher"
      :dialog="showStudentFlag"
      :student="student"
      :studentCoursesActivity="studentCoursesActivity"
      :studentTimeData="studentTimeData"
      @cancel="cancelShowStudent"
      @edit="showEdit($event)"
    />
    <!-- <EditStudentDialog
      v-if="editStudentFlag && isTeacher"
      :dialog="editStudentFlag"
      :student="student"
      @updateStudentProfile="updateStudentProfile($event)"
      @cancel="cancelShowEdit"
    /> -->
  </v-container>
</template>

<script>
// import CreateAccountDialog from "@/components/Dialogs/CreateAccountDialog.vue";
// import ImportCsvDialog from "@/components/ImportCsvDialog.vue";
import EditStudentDialog from "@/components/Dialogs/EditStudentDialog.vue";
import LearnerOverviewDashboard from "@/components/Reused/LearnerOverviewDashboard.vue";
import StudentAccountsDialog from "@/components/Dialogs/StudentAccountsDialog.vue";
import StudentCard from "@/components/CohortView/StudentDataIterator/StudentCard.vue";
import TimeframeFilters from "@/components/Reused/TimeframeFilters.vue";

import { fetchPersonByPersonId } from "@/lib/ff";
import { mapState } from "pinia";
import { mdiArrowUp, mdiArrowDown, mdiMagnify, mdiSortAlphabeticalVariant } from "@mdi/js";
import useRootStore from "@/store/index";

export default {
  name: "StudentsDataIterator",
  props: ["cohort"],
  components: {
    // EditStudentButtonDialog,
    StudentCard,
    // CreateAccountDialog,
    // ImportCsvDialog,
    TimeframeFilters,
    StudentAccountsDialog,
    EditStudentDialog,
    LearnerOverviewDashboard,
  },
  data() {
    return {
      mdiArrowUp,
      mdiArrowDown,
      mdiMagnify,
      mdiSortAlphabeticalVariant,
      search: "",
      sortDesc: false,
      sortBy: "firstName",
      keys: [
        "firstName",
        "lastName",
        "nsnNumber",
        "studentEmail",
        "lastActive",
        "hours",
        "tasks",
        "xpPointsTotal",
      ],
      students: [],
      timeframe: {},
      date: "",
      prevVal: "",
      showStudentFlag: false,
      editStudentFlag: false,
      student: [],
      studentCoursesActivity: [],
      studentTimeData: [],
      searchingStudents: false,
    };
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
  async mounted() {
    // this is needed incase there is no change in cohort.id to catch with the watch
    if (this.$route.params.cohortId === this.cohort.id) {
      await this.getStudentProfiles();
    }
  },
  watch: {
    cohort: {
      deep: true,
      async handler(newCohort, oldCohort) {
        if (oldCohort.students?.length !== newCohort.students?.length) {
          console.log("watch cohort. student lenght changed");
          if (oldCohort.students?.length > newCohort.students?.length) this.removeStudentProfiles();
          else await this.getStudentProfiles();
        }
        if (oldCohort.id !== newCohort.id) {
          await this.getStudentProfiles();
        }
      },
    },
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
    filteredKeys() {
      return this.keys.filter((key) => key !== "Name");
    },
    isTeacher() {
      return this.cohort.teachers?.includes(this.person.id);
    },
    sortedStudents() {
      if (this.sortBy !== 'lastActive') {
        return this.students;
      }

      return [...this.students].sort((a, b) => {
        // Always put undefined values at the bottom regardless of sort direction
        if (a.lastActive === undefined) return 1;
        if (b.lastActive === undefined) return -1;
        
        // For defined values, sort normally
        return this.sortDesc 
          ? a.lastActive - b.lastActive  // Descending: oldest first
          : b.lastActive - a.lastActive; // Ascending: most recent first
      });
    }
  },
  methods: {
    // show/hide student details
    showStudent(payload) {
      this.showStudentFlag = false;
      this.student = payload.student;
      this.studentCoursesActivity = payload.coursesActivity;
      this.studentTimeData = payload.timeData;
      this.showStudentFlag = true;
    },
    cancelShowStudent() {
      this.student = [];
      this.showStudentFlag = false;
      this.$emit("learnerOverviewDialogClosed");
    },
    // showEdit(student) {
    //   this.editStudentFlag = false;
    //   this.student = student;
    //   this.editStudentFlag = true;
    // },
    // cancelShowEdit(student) {
    //   this.student = [];
    //   this.editStudentFlag = false;
    // },
    updateStudentProfile(obj) {
      // update student in students array
      const index = this.students.findIndex((student) => student.id === obj.id);
      // replace the student with the updated one/obj
      this.students.splice(index, 1, obj);
    },
    setTime() {
      this.date = Date.now();
    },
    async getStudentProfiles() {
      this.searchingStudents = true;
      if (this.cohort?.students?.length) {
        const studentsArr = this.cohort.students.filter(
          (a) => !this.students.some((b) => a === b.id),
        );

        const students = await Promise.all(
          studentsArr.map((studentId) => fetchPersonByPersonId(studentId)),
        );
        this.students = [...this.students, ...students];
        this.searchingStudents = false;
      } else {
        this.searchingStudents = false;
      }
    },
    removeStudentProfiles() {
      this.students = this.students.filter((a) => this.cohort.students.some((b) => a.id === b));
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    setTimeframe(timeframeEmitted) {
      this.timeframe = timeframeEmitted;
    },
    updateStudentsWithHours(payload) {
      const foundIndex = this.students.findIndex((student) => student.id == payload.person.id);
      this.students[foundIndex].hours = payload.hours;
    },
    updateStudentsWithTasks(payload) {
      const foundIndex = this.students.findIndex((student) => student.id == payload.person.id);
      this.students[foundIndex].tasks = payload.tasks;
    },
    updateStudentsWithLastActive(payload) {
      const foundIndex = this.students.findIndex((student) => student.id == payload.person.id);
      this.students[foundIndex].lastActive = payload.lastActive;
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

  .student-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    padding: 20px 0px;
    flex-grow: 1;
  }

  .student-main-section {
    // flex-grow: 2 !important;
    width: 30%;
    position: relative;

    .student-edit-button {
      // position: absolute;
      // bottom: 10px;
      // left: 10px;
      font-size: 0.7rem;
    }
  }

  .student-title {
    font-size: 1.2rem;
    color: var(--v-missionAccent-base);
    font-weight: 600;
    text-transform: uppercase;
    margin: 5px 0px;
  }

  .student-image-section {
    // flex-grow: 0 !important;
    // flex-shrink: 1 !important;
    width: 30px;

    .imagePlaceholder {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: rgba(200, 200, 200, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      margin: auto;
    }

    .studentName {
      font-size: 0.6rem;
      letter-spacing: 2px;
      text-align: center;
    }
  }

  .student-section-overUnder {
    padding: 0px !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .section-overUnder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    .section-overUnder:first-child {
      border-bottom: 1px dashed var(--v-missionAccent-base);
    }
  }
}

.noStudents {
  font-size: 0.8rem;
  letter-spacing: 2px;
  text-align: center;
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
}

// overide vuetify default height
.search ::v-deep .v-input__slot {
  min-height: 37px !important;
}
// overide vuetify default height
.sort ::v-deep .v-input__slot {
  min-height: 37px !important;
  max-height: 37px !important;
}

.timeframe-chips {
  border-top: 1px solid var(--v-missionAccent-base);
  border-bottom: 1px solid var(--v-missionAccent-base);
}
</style>
