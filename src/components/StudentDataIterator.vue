<template>
  <v-container fluid>
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
            <v-btn-toggle
              background-color="background"
              v-model="sortDesc"
              mandatory
              dense
            >
              <v-btn
                small
                outlined
                color="missionAccent"
                :value="false"
                style="padding: 18px"
              >
                <v-icon small>{{ mdiArrowUp }}</v-icon>
              </v-btn>
              <v-btn
                small
                outlined
                color="missionAccent"
                :value="true"
                style="padding: 18px"
              >
                <v-icon small>{{ mdiArrowDown }}</v-icon>
              </v-btn>
            </v-btn-toggle>
          </div>
          <div class="mx-1">
            <StudentAccountsDialog
              v-if="currentCohort.teacher"
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
          <TimeframeFilters
            :showDate="true"
            @timeframe="setTimeframe($event)"
          />
        </div>
        <StudentCard
          v-for="student in props.items"
          :key="student.id"
          :student="student"
          :timeframe="timeframe"
          :date="date"
          @updateStudentsWithHours="updateStudentsWithHours($event)"
          @updateStudentsWithTasks="updateStudentsWithTasks($event)"
        />
      </template>

      <template v-slot:no-data>
        <p class="ma-10 noStudents">No Students in this Cohort</p>
      </template>
    </v-data-iterator>
  </v-container>
</template>

<script>
// import CreateAccountDialog from "../components/CreateAccountDialog";
// import ImportCsvDialog from "../components/ImportCsvDialog";
import StudentAccountsDialog from "../components/CohortView/StudentAccountsDialog";
import StudentCard from "../components/StudentCard/StudentCard";
import TimeframeFilters from "../components/TimeframeFilters";
import { mapGetters } from "vuex";
import { dbMixins } from "../mixins/DbMixins";
import {
  mdiArrowUp,
  mdiArrowDown,
  mdiMagnify,
  mdiSortAlphabeticalVariant,
} from "@mdi/js";

export default {
  name: "StudentsDataIterator",
  components: {
    // EditStudentButtonDialog,
    StudentCard,
    // CreateAccountDialog,
    // ImportCsvDialog,
    TimeframeFilters,
    StudentAccountsDialog,
  },
  mixins: [dbMixins],
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
        "hours",
        "tasks",
      ],
      students: [],
      timeframe: {},
      date: "",
      prevVal: "",
    };
  },
  created() {
    this.counterInterval = setInterval(
      function () {
        this.setTime();
      }.bind(this),
      10000
    );
    return this.setTime();
  },
  destroyed() {
    clearInterval(this.counterInterval);
  },
  mounted() {
    // this is needed incase there is no change in currentCohort to catch with the watch
    if (this.$route.params.cohortId === this.currentCohort.id) {
      this.getStudentProfiles();
    }
  },
  watch: {
    currentCohort: {
      deep: true,
      handler(newVal, oldVal) {
        if (oldVal.students?.length !== newVal.students?.length) {
          if (oldVal.students?.length > newVal.students?.length)
            this.removeStudentProfile();
          else this.getStudentProfiles();
        }
        if (oldVal.id !== newVal.id) {
          this.getStudentProfiles();
        }
      },
    },
  },
  computed: {
    ...mapGetters(["currentCohort"]),
    filteredKeys() {
      return this.keys.filter((key) => key !== "Name");
    },
  },
  methods: {
    updateStudentProfile(obj) {
      const index = this.students.findIndex((student) => student.id === obj.id);
      this.students.splice(index, 1, obj);
    },
    setTime() {
      this.date = Date.now();
    },
    getStudentProfiles() {
      if (this.currentCohort.students?.length) {
        const studentsArr = this.currentCohort.students.filter((a) => {
          return !this.students.some((b) => a === b.id);
        });
        studentsArr.forEach(async (id) => {
          const student = await this.MXgetPersonByIdFromDB(id);
          if (!this.students.some((a) => a.id === student.id)) {
            this.students.push(student);
          }
        });
      }
    },
    removeStudentProfile() {
      this.students = this.students.filter((a) => {
        return this.currentCohort.students.some((b) => a.id === b);
      });
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    setTimeframe(timeframeEmitted) {
      this.timeframe = timeframeEmitted;
    },
    updateStudentsWithHours(payload) {
      const foundIndex = this.students.findIndex(
        (student) => student.id == payload.person.id
      );
      this.students[foundIndex].hours = payload.hours;
    },
    updateStudentsWithTasks(payload) {
      const foundIndex = this.students.findIndex(
        (student) => student.id == payload.person.id
      );
      this.students[foundIndex].tasks = payload.tasks;
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
