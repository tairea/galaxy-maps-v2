<template>
  <div
    class="d-flex cohort-panel"
    @click="isCohortTeacher ? routeToCohort(cohort) : null"
    :style="borderColor"
  >
    <!-- top row -->
    <div class="left-col">
      <p class="label text-center mt-4 mb-0">Squad:</p>
      <div class="d-flex flex-column justify-start align-center pa-2">
        <v-avatar v-if="cohort.image.url" class="cohort-image">
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
          <p class="label text-center mt-2 mb-2">{{ captainLabel }}</p>
          <div>
            <Avatar
              v-for="teacherId in cohort.teachers"
              :key="teacherId.id"
              :size="40"
              :personId="teacherId"
              :colourBorder="true"
              :cohort="cohort"
              class="mb-2"
            />
          </div>
        </div>
        <p v-else class="label text-center" style="font-weight: 800">NO CAPTAIN DATA</p>
        <!-- Students avatars row -->
        <div class="student-row">
          <div
            v-if="cohort.students && cohort.students.length"
            class="d-flex justify-center align-center flex-wrap py-2"
          >
            <!-- v-show not working to hide tooltip, so using v-if v-else  -->
            <!-- <v-tooltip v-if="isCohortTeacher" v-show="isCohortTeacher" top color="subBackground">
              <template v-slot:activator="{ on, attrs }">
                <p class="label text-center mt-4 mb-2" v-bind="attrs" v-on="on">Navigators:</p>
              </template>
              <span>Select students to show only their data</span>
            </v-tooltip>
            <p v-else class="label text-center mt-4 mb-2">Navigators:</p>

            <Avatar
              v-for="(person, index) in studentsWithData"
              ref="avatar"
              :key="person.id"
              :size="30"
              :personId="person.id"
              :profile="person"
              class="my-2 mx-1 avatar"
              :colourBorder="true"
              @click.native="clickedPerson($event, person, index)"
              :hideTooltips="!isCohortTeacher"
              :cohort="cohort"
            /> -->
            <p class="label text-center mt-4 mb-2" v-bind="attrs" v-on="on">Navigators:</p>
            <!-- active navigators in this timeframe -->
            <p class="label text-center mt-2 mb-1">{{ activeInactive.active }}<br />Active</p>

            <!-- inactive navigators in this timeframe -->
            <p class="label text-center mt-0">{{ activeInactive.inactive }}<br />Inactive</p>
          </div>
          <p v-else class="label text-center pa-4" style="font-weight: 800">NO NAVIGATOR DATA</p>
        </div>
      </div>
    </div>

    <div class="main-col" :class="{ 'premium-restricted': isPremiumFeatureRestricted }">
      <!-- Progression Line Charts -->
      <div :class="{ 'premium-content-blurred': isPremiumFeatureRestricted }">
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
      <div :class="{ 'premium-content-blurred': isPremiumFeatureRestricted }">
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
            :showFirstNameOnly="!isCohortTeacher"
          />
        </div>
        <div v-else class="d-flex justify-center align-center" style="padding: 50px 0px">
          <p class="label text-center" style="font-weight: 800">NO ACTIVITY DATA</p>
        </div>
      </div>

      <!-- Premium overlay -->
      <div v-if="isPremiumFeatureRestricted && !paywall.show" class="premium-overlay">
        <div class="premium-message overline">
          <p class="mb-2">Premium feature</p>
          <p class="mb-0">
            Please
            <a href="#" @click.prevent="handleUpgradeClick" class="upgrade-link">upgrade</a>
            to access this feature
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "@/components/Reused/Avatar.vue";
import ProgressionLineChart from "@/components/Reused/ProgressionLineChart.vue";
import ActivityBarChart from "@/components/Reused/ActivityBarChart.vue";
import Organisation from "@/components/Reused/Organisation.vue";
import { DateTime } from "luxon";
import {
  fetchCohortCoursesActivityByCohortId,
  fetchCohortStudentsActivityTimeByCohortId,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import { mdiInformationVariant } from "@mdi/js";
import { mapActions, mapState } from "pinia";

export default {
  name: "CohortPanelV2",
  props: ["cohort", "cols", "tooltip", "studentView", "timeframe"],
  components: { Avatar, ProgressionLineChart, ActivityBarChart, Organisation },

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
    // checkIfCohortTeacher
    this.checkIfCohortTeacher();

    // Skip data fetching if premium is restricted
    if (this.isPremiumFeatureRestricted) {
      this.cohortsCoursesData = [];
      this.cohortActivityData = [];
      this.cohortsCoursesDataLoading = false;
      this.cohortActivityDataLoading = false;
      return;
    }

    this.cohortsCoursesDataLoading = true;
    this.cohortActivityDataLoading = true;
    // ==== get cohort course data from LRS
    this.cohortsCoursesData = await fetchCohortCoursesActivityByCohortId(this.cohort.id);
    // console.log("this.cohortsCoursesData", this.cohortsCoursesData);

    console.log("this.cohortsCoursesData", this.cohortsCoursesData);

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
    this.cohortActivityData = await fetchCohortStudentsActivityTimeByCohortId(this.cohort.id);
    // console.log("this.cohortActivityData", this.cohortActivityData);
    this.cohortActivityDataLoading = false;

    // ==== VQL Test
    // const VQL = await VQLXAPIQuery();
  },
  computed: {
    ...mapState(useRootStore, [
      "getOrganisationById",
      "currentCohort",
      "person",
      "user",
      "paywall",
    ]),
    hasActiveSubscription() {
      return Boolean(this.user?.data?.hasActiveSubscription);
    },
    isPremiumFeatureRestricted() {
      return !this.hasActiveSubscription;
    },
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
    captainLabel() {
      return this.cohort.teachers.length > 1 ? "Captains:" : "Captain:";
    },
    activeInactive() {
      // Count students who completed at least one mission (task) within the timeframe
      if (!this.studentsWithData || this.studentsWithData.length === 0) {
        return { active: 0, inactive: 0 };
      }

      const activeSet = new Set();
      const timeframeType = this.timeframe?.type;
      const min = this.timeframe?.min ? DateTime.fromJSDate(this.timeframe.min) : null;
      const max = this.timeframe?.max ? DateTime.fromJSDate(this.timeframe.max) : null;

      for (const student of this.studentsWithData) {
        let hasCompletedInWindow = false;

        for (const course of this.cohortsCoursesData || []) {
          const studentEntry = (course.students || []).find(
            (s) => s.person && s.person.id === student.id,
          );
          if (!studentEntry || !studentEntry.activities) continue;

          const activities = studentEntry.activities;
          const found = activities.some((activity) => {
            if (!activity?.timeStamp) return false;
            if (activity.status !== "Completed" || activity.type !== "Task") return false;

            const ts = DateTime.fromISO(activity.timeStamp);

            if (timeframeType === "day") {
              // Match exact day against timeframe max day
              const targetDay = DateTime.fromJSDate(this.timeframe.max).toISODate();
              return ts.toISODate() === targetDay;
            }

            if (!min || !max) return false;
            // Inclusive window similar to other charts (use strict bounds like ActivityBarChart)
            return ts > min && ts < max;
          });

          if (found) {
            hasCompletedInWindow = true;
            break;
          }
        }

        if (hasCompletedInWindow) activeSet.add(student.id);
      }

      const active = activeSet.size;
      const total = this.studentsWithData.length;
      const inactive = total - active;
      return { active, inactive };
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCohortId", "setPaywall"]),
    handleUpgradeClick() {
      this.setPaywall({
        show: true,
        text: "A Galaxy Maps subscription is required to see Squad data.",
      });
    },
    clickedPerson(e, person, index) {
      if (!this.isCohortTeacher) {
        return;
      }
      // prevent route to cohortView
      e.stopPropagation();
      // get all avatar elements
      const avatarEls = this.$refs.avatar;
      // loop avatar els
      for (let i = 0; i < avatarEls.length; i++) {
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
        for (let y = 0; y < avatarEls.length; y++) {
          avatarEls[y].$el.classList.add("dim");
        }
        //remove dim for selected avatar els
        for (let x = 0; x < this.selectedIndexs.length; x++) {
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
      await this.setCurrentCohortId(this.cohort.id);
      this.$router.push({
        name: "CohortView",
        params: { cohortName: this.camelize(this.cohort.name), cohortId: this.cohort.id },
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
  margin-bottom: 25px;
  flex-wrap: wrap;
  cursor: pointer;

  .left-col {
    width: 15%;
    // height: 100%;
    // border-right: 1px solid var(--v-missionAccent-base);

    .cohort-image {
      width: auto;
      max-width: 80px;
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

/* Premium restriction styles */
.main-col {
  position: relative;

  &.premium-restricted {
    /* Keep border visible */
  }

  .premium-content-blurred {
    filter: blur(4px);
    pointer-events: none;
    user-select: none;
  }

  /* Premium overlay */
  .premium-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 150;
    pointer-events: auto;
  }

  .premium-message {
    background-color: var(--v-background-base);
    padding: 15px 10px;
    text-align: center;
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-size: 0.65rem !important; /* Override overline font-size */
    line-height: 1.4 !important; /* Override overline line-height for better readability */
    letter-spacing: 1px;

    p {
      margin: 0;
      font-size: inherit !important;
      line-height: inherit !important;
    }

    .upgrade-link {
      color: var(--v-missionAccent-base);
      text-decoration: underline;
      cursor: pointer;
      font-weight: 600;
      font-size: inherit !important;
      line-height: inherit !important;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
