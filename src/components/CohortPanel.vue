<template>
  <div
    @click="!studentView ? routeToCohort(cohort) : null"
    class="d-flex flex-column cohort-panel"
    :style="!studentView ? 'cursor: pointer;' : ''"
  >
    <!-- top row -->
    <div class="row-border">
      <div class="d-flex justify-start align-center pa-2">
        <v-img
          v-if="cohort.image.url"
          :src="cohort.image.url"
          max-width="60px"
          max-height="60px"
          class="cohort-image"
        ></v-img>
        <div v-else class="imagePlaceholder">
          {{ first3Letters(cohort.name) }}
        </div>
        <h3 class="ml-4" style="width: 50%">{{ cohort.name }}</h3>
        <div class="d-flex">
          <p class="label">Teachers:</p>
          <div v-if="cohort.teachers">
            <Avatar
              v-for="teacherId in cohort.teachers"
              :key="teacherId.id"
              :size="40"
              :personId="teacherId"
            />
          </div>
          <p v-else class="label" style="font-weight: 800">NO TEACHERS</p>
        </div>
      </div>
    </div>
    <div>
      <div style="padding: 100px"></div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import Avatar from "../components/Avatar";
import { getCohortsCourseDataXAPIQuery } from "../lib/veracityLRS";

export default {
  name: "CohortPanel",
  props: ["cohort", "cols", "tooltip", "studentView"],
  components: {
    Avatar,
  },
  data() {
    return {
      cohortsCoursesData: [],
    };
  },
  async mounted() {
    console.log("cohort panel loaded for: ", this.cohort.name);
    const getCourseData = await getCohortsCourseDataXAPIQuery({
      studentsArr: this.cohort.students,
      coursesArr: this.cohort.courses,
      cohortName: this.cohort.name,
    });
    // .then(() => {
    //   console.log("get cohort data from LRS done");
    // });
    // this.cohortsCoursesData = getCourseData;
    // console.log("this.cohortsCoursesData", this.cohortsCoursesData);
  },
  methods: {
    ...mapActions(["setCurrentCohort"]),
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    async routeToCohort() {
      // this.$store.commit("setCurrentCohort", {})
      await this.setCurrentCohort(this.cohort);
      // console.log('cohort set: ', cohort)
      // route to Galaxy View (passing params as props)
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
  },
};
</script>

<style lang="scss" scoped>
.cohort-panel {
  border: 1px solid var(--v-missionAccent-base);
  width: 100%;
  margin: 20px;

  .cohort-image {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }

  .imagePlaceholder {
    width: 60px;
    height: 60px;
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
    padding-top: 10px;
  }

  .row-border {
    border-bottom: 1px solid var(--v-missionAccent-base);
  }
}

.border-test {
  border: 1px solid red;
}

.label {
  color: var(--v-missionAccent-base);
  font-size: 0.7rem;
  margin: 10px;
  text-transform: uppercase;
}
</style>
