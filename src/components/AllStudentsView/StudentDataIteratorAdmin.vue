<template>
  <v-container class="student-data-iterator" fluid>
    <v-data-iterator
      :items="students"
      :items-per-page="-1"
      :search="search"
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      hide-default-footer
    >
      <!-- HEADER -->
      <template v-slot:header>
        <div class="d-flex justify-start">
          <div v-if="students.length" class="mx-1" style="width: 100%">
            <!-- Search -->
            <div style="width: 100%">
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
            </div>
            <div style="width: 100%" class="d-flex mt-2">
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
                <v-btn x-small outlined color="missionAccent" :value="false" style="padding: 18px">
                  <v-icon small>{{ mdiArrowUp }}</v-icon>
                </v-btn>
                <v-btn x-small outlined color="missionAccent" :value="true" style="padding: 18px">
                  <v-icon small>{{ mdiArrowDown }}</v-icon>
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
          <!-- <div class="mx-1">
              <StudentAccountsDialog
                v-if="isTeacher"
                :students="students"
                @updateStudentProfile="updateStudentProfile($event)"
              /> -->
          <!-- <CreateAccountDialog accountType="student" />
            </div>
            <div class="mx-1">
              <ImportCsvDialog /> -->
          <!-- </div> -->
        </div>
      </template>

      <!-- PROPS -->
      <template v-slot:default="props">
        <StudentCardAdmin
          v-for="student in props.items"
          :key="student.id"
          :student="student"
          :timeframe="timeframe"
          :date="date"
          @updateStudentsWithHours="updateStudentsWithHours($event)"
          @updateStudentsWithTasks="updateStudentsWithTasks($event)"
          @showStudent="showStudent($event)"
          @updateStudentsWithLastActive="updateStudentsWithLastActive($event)"
        />
      </template>

      <template v-slot:no-data>
        <p class="ma-10 noStudents">No Students in this Cohort</p>
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
// import CreateAccountDialog from "@/components/CreateAccountDialog.vue";
// import ImportCsvDialog from "@/components/ImportCsvDialog.vue";
import EditStudentDialog from "@/components/Dialogs/EditStudentDialog.vue";
import LearnerOverviewDashboard from "@/components/Reused/LearnerOverviewDashboard.vue";
import StudentAccountsDialog from "@/components/Dialogs/StudentAccountsDialog.vue";
import StudentCardAdmin from "@/components/AllStudentsView/StudentCardAdmin.vue";
import TimeframeFilters from "@/components/Reused/TimeframeFilters.vue";

import { fetchPersonByPersonId } from "@/lib/ff";
import { mapState } from "pinia";
import { mdiArrowUp, mdiArrowDown, mdiMagnify, mdiSortAlphabeticalVariant } from "@mdi/js";
import useRootStore from "@/store/index";

export default {
  name: "StudentDataIteratorAdmin",
  props: [],
  components: {
    // EditStudentButtonDialog,
    StudentCardAdmin,
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
      keys: ["firstName", "lastName", "nsnNumber", "studentEmail", "lastActive"],
      timeframe: {
        min: new Date(-8640000000000000),
        max: new Date(),
      },
      date: "",
      prevVal: "",
      showStudentFlag: false,
      editStudentFlag: false,
      students: [],
      student: [],
      studentCoursesActivity: [],
      studentTimeData: [],
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
  mounted() {
    this.students = this.people;
  },
  watch: {},
  computed: {
    ...mapState(useRootStore, ["currentCohort", "user", "people"]),
    filteredKeys() {
      return this.keys.filter((key) => key !== "Name");
    },
    isTeacher() {
      if (this.user.data.admin) {
        return true;
      } else {
        return this.currentCohort.teachers.includes(this.person.id);
      }
    },
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
      const index = this.students.findIndex((student) => student.id === obj.id);
      this.students.splice(index, 1, obj);
    },
    setTime() {
      this.date = Date.now();
    },
    async getStudentProfiles() {
      if (this.students?.length) {
        const studentsArr = this.students.filter((a) => !this.students.some((b) => a === b.id));

        const students = await Promise.all(
          studentsArr.map((studentId) => fetchPersonByPersonId(studentId)),
        );
        this.students = [...this.students, ...students];
      }
    },
    removeStudentProfile() {
      this.students = this.students.filter((a) => {
        return this.students.some((b) => a.id === b);
      });
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
    customFilter(items, searchQuery) {
      return items.filter((item) => item.lastActive !== undefined); // this removes INACTIVE people from the lastAtive sort.
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

.student-data-iterator {
  overflow-x: hidden;
}
</style>
