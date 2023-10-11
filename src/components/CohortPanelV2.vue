<template>
  <div
    class="d-flex cohort-panel"
    @click="isCohortTeacher ? routeToCohort(cohort) : null"
    :style="borderColor"
  >
    <!-- top row -->
    <div class="left-col">
      <p class="label text-center mt-4 mb-0">Cohort:</p>
      <div class="d-flex flex-column justify-start align-center pa-2">
        <v-avatar v-if="cohort.image.url" size="80">
          <v-img :src="cohort.image.url"></v-img>
        </v-avatar>
        <div v-else class="imagePlaceholder">
          {{ first3Letters(cohort.name) }}
        </div>
        <!-- Cohort Name -->
        <p class="cohort-name text-center mt-4">
          {{ cohort.name }}
        </p>
        <!-- Teacher -->
        <div
          v-if="cohort.teachers && cohort.teachers.length > 0"
          class="d-flex justify-center align-center flex-wrap py-2"
        >
          <p class="label text-center mt-2 mb-2">Teachers:</p>
          <div>
            <Avatar
              v-for="teacherId in cohort.teachers"
              :key="teacherId.id"
              :size="40"
              :personId="teacherId"
              :colourBorder="true"
            />
          </div>
        </div>
        <p v-else class="label text-center" style="font-weight: 800">NO TEACHER DATA</p>
        <!-- Students avatars row -->
        <div class="student-row">
          <div
            v-if="cohort.students && cohort.students.length"
            class="d-flex justify-center align-center flex-wrap py-2"
          >
            <!-- v-show not working to hide tooltip, so using v-if v-else  -->
            <v-tooltip v-if="isCohortTeacher" v-show="isCohortTeacher" top color="subBackground">
              <template v-slot:activator="{ on, attrs }">
                <p class="label text-center mt-4 mb-2" v-bind="attrs" v-on="on">Students:</p>
              </template>
              <span>Select students to show only their data</span>
            </v-tooltip>
            <p v-else class="label text-center mt-4 mb-2">Students:</p>

            <Avatar
              v-for="(person, index) in studentsWithData"
              ref="avatar"
              :key="person.id"
              :size="30"
              :personId="person.id"
              class="my-2 mx-1 avatar"
              :colourBorder="true"
              @click.native="clickedPerson($event, person, index)"
              :hideTooltips="!isCohortTeacher"
            />
          </div>
          <p v-else class="label text-center pa-4" style="font-weight: 800">NO STUDENT DATA</p>
        </div>
      </div>
    </div>

    <div class="main-col">
      <!-- Progression Line Charts -->
      <div>
        <!-- loading spinner -->
        <div
          class="d-flex justify-center align-center"
          style="padding: 50px"
          v-if="cohortsCoursesDataLoading"
        >
          <v-btn :loading="cohortsCoursesDataLoading" icon color="missionAccent"></v-btn>
        </div>
        <div v-else-if="cohortsCoursesData.length > 0" style="padding: 20px">
          <ProgressionLineChart
            v-for="courseData in cohortsCoursesData"
            :key="courseData.id"
            :courseData="courseData"
            :timeframe="timeframe"
            :selectedPersons="selectedPersons"
            :unselectedPersons="unselectedPersons"
            class="line-chart"
          />
        </div>
        <div v-else class="d-flex justify-center align-center" style="padding: 50px 0px">
          <p class="label text-center" style="font-weight: 800">NO COURSE DATA</p>
        </div>
      </div>
      <!-- Activity Bar Chart -->
      <div>
        <!-- loading spinner -->
        <div class="d-flex justify-center align-center" v-if="cohortActivityDataLoading">
          <v-btn
            :loading="cohortActivityDataLoading"
            icon
            color="missionAccent"
            class="d-flex justify-center align-center"
          ></v-btn>
        </div>
        <div v-else-if="cohortActivityData.length > 0" class="pt-0 px-5 pb-4">
          <ActivityBarChart
            :activityData="cohortActivityData"
            :timeframe="timeframe"
            :selectedPersons="selectedPersons"
            :unselectedPersons="unselectedPersons"
            :shortenNames="!isCohortTeacher"
          />
        </div>
        <div v-else class="d-flex justify-center align-center" style="padding: 50px 0px">
          <p class="label text-center" style="font-weight: 800">NO ACTIVITY DATA</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "@/components/Avatar.vue";
import ProgressionLineChart from "@/components/ProgressionLineChart.vue";
import ActivityBarChart from "@/components/ActivityBarChart.vue";
import Organisation from "@/components/Organisation.vue";
import { getCohortsCourseDataXAPIQuery, getStudentsTimeDataXAPIQuery } from "@/lib/veracityLRS";
import useRootStore from "@/store/index";
import { mdiInformationVariant } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "CohortPanelV2",
  props: ["cohort", "cols", "tooltip", "studentView", "timeframe"],
  components: {
    Avatar,
    ProgressionLineChart,
    ActivityBarChart,
    Organisation,
  },

  data() {
    return {
      mdiInformationVariant,
      cohortsCoursesData: [],
      cohortActivityData: [],
      studentsWithData: [],
      selectedIndexs: [],
      selectedPersons: [],
      unselectedPersons: [],
      cohortsCoursesDataLoading: false,
      cohortActivityDataLoading: false,
      isCohortTeacher: false,
    };
  },

  async mounted() {
    this.cohortsCoursesDataLoading = true;
    this.cohortActivityDataLoading = true;
    // ==== get cohort course data from LRS
    const getCourseData = await getCohortsCourseDataXAPIQuery({
      studentsArr: this.cohort.students,
      coursesArr: this.cohort.courses,
      cohortName: this.cohort.name,
    });
    this.cohortsCoursesData = getCourseData;
    // console.log("this.cohortsCoursesData", this.cohortsCoursesData);

    // add students with data
    const studentsArr = [];
    if (this.cohortsCoursesData) {
      for (const course of this.cohortsCoursesData) {
        for (const person of course.students) {
          studentsArr.push(person.person);
        }
      }
      // this flattens any duplicates of students (eg. student 1 is in more than one course. but only want to show them once)
      this.studentsWithData = studentsArr.filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
      );
    }

    this.cohortsCoursesDataLoading = false;

    // ==== get cohort activity data from LRS
    let getActivityData = await getStudentsTimeDataXAPIQuery({
      studentsArr: this.cohort.students,
    });
    this.cohortActivityData = getActivityData;
    // console.log("this.cohortActivityData", this.cohortActivityData);
    this.cohortActivityDataLoading = false;

    // ==== VQL Test
    // const VQL = await VQLXAPIQuery();

    // checkIfCohortTeacher
    this.checkIfCohortTeacher();
  },
  computed: {
    ...mapState(useRootStore, ["getOrganisationById", "currentCohort", "person"]),
    isDashboardView() {
      return this.$route.name === "Dashboard";
    },
    borderColor() {
      if (this.isDashboardView) return "border: 1px solid var(--v-missionAccent-base)";
      if (this.isCohortTeacher) {
        return "border: 1px solid var(--v-galaxyAccent-base);cursor: pointer";
      } else {
        return "border: 1px solid var(--v-missionAccent-base);cursor:default";
      }
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCohort"]),
    clickedPerson(e, person, index) {
      if (!isCohortTeacher) {
        return;
      }
      // prevent route to cohortView
      e.stopPropagation();
      // get all avatar elements
      const avatarEls = this.$refs.avatar;
      // loop avatar els
      for (var i = 0; i < avatarEls.length; i++) {
        // add index to selected if not already. else remove
        if (i == index && !this.selectedIndexs.includes(index)) {
          this.selectedIndexs.push(index);
          this.selectedPersons.push(person);
        }
        // remove
        else if (i == index && this.selectedIndexs.includes(index)) {
          this.selectedIndexs = this.selectedIndexs.filter((item) => item !== index);
          this.selectedPersons = this.selectedPersons.filter(
            (selectedPerson) => selectedPerson.id !== person.id,
          );
          this.unselectedPersons.push(person);
        }

        //anyone not in selectedPersons becomes unselected (this is used to hide data in chart)
        this.unselectedPersons = this.diffTwoArraysOfObjects(
          this.studentsWithData,
          this.selectedPersons,
        );

        // add dim to all avatar els
        for (var y = 0; y < avatarEls.length; y++) {
          avatarEls[y].$el.classList.add("dim");
        }
        //remove dim for selected avatar els
        for (var x = 0; x < this.selectedIndexs.length; x++) {
          avatarEls[this.selectedIndexs[x]].$el.classList.remove("dim");
        }
      }
    },
    diffTwoArraysOfObjects(array1, array2) {
      return array1.filter((object1) => {
        return !array2.some((object2) => {
          return object1.id === object2.id;
        });
      });
    },
    previousDays(num, start) {
      if (!start) {
        var d = new Date();
      } else {
        var d = new Date(start);
      }
      d.setDate(d.getDate() - num);
      return d;
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    async routeToCohort() {
      await this.setCurrentCohort(this.cohort);
      this.$router.push({
        name: "CohortView",
        params: {
          cohortName: this.camelize(this.cohort.name),
          cohortId: this.cohort.id,
        },
      });
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
    checkIfCohortTeacher() {
      // see if person id is included in cohort.teachers
      if (this.cohort.teachers && this.cohort.teachers.length > 0) {
        const isTeacher = this.cohort.teachers.includes(this.person.id);
        this.isCohortTeacher = isTeacher;
      } else {
        this.isCohortTeacher = false;
      }
      // console.log(
      //   this.person.firstName + " isCohortTeacher of " + this.cohort.name + ": ",
      //   this.isCohortTeacher,
      // );
    },
  },
};
</script>

<style lang="scss" scoped>
.cohort-panel {
  // width: calc(50% - 40px);
  // min-height: 60%;
  margin: 20px;
  margin-bottom: 50px;
  flex-wrap: wrap;
  cursor: pointer;

  .left-col {
    width: 15%;
    // height: 100%;
    // border-right: 1px solid var(--v-missionAccent-base);

    .cohort-image {
      width: 80px;
      border-radius: 50%;
      object-fit: cover;
    }

    .imagePlaceholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: rgba(200, 200, 200, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .cohort-name {
      text-align: center;
      font-size: 0.65rem !important;
      line-height: 1rem;
      font-weight: bold;
      text-transform: uppercase;
    }
  }

  .main-col {
    width: 85%;

    .line-chart:not(:last-child) {
      margin-bottom: 20px;
    }
  }

  .student-row {
    width: 100%;
    // border-top: 1px solid var(--v-missionAccent-base)
  }
}

.border-test {
  border: 1px solid red;
}

.label {
  color: var(--v-missionAccent-base);
  font-size: 0.7rem;
  // margin: 10px;
  text-transform: uppercase;
  width: 100%;
}

.custom-chip {
  padding: 10px;
  text-transform: uppercase;
}

.dim {
  filter: opacity(30%);
}
</style>
