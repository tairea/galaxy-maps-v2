<template>
  <section class="student-progress-section in-row">
    <div v-for="(activity, i) in activities" :key="activity.course.id + i" :class="divClass">
      <StudentCircularProgress :activity="activity" :student="student" :length="length" />
    </div>
  </section>
</template>

<script>
import StudentCircularProgress from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCircularProgress.vue";

export default {
  name: "StudentCardProgress",
  components: {
    StudentCircularProgress,
  },
  props: ["student", "activities"],
  computed: {
    length() {
      return this.activities.length > 1;
    },
    divClass() {
      return this.length ? "flex-div" : "in-div";
    },
  },
};
</script>

<style scoped>
.student-progress-section {
  width: 25%;
  border-left: 1px dashed var(--v-missionAccent-base);
  /* display: flex; */
  justify-content: center;

  flex-wrap: wrap;
}
.flex-div {
  width: 50%;
  padding-top: 5px;

  /* border: 1px solid pink; */
}

.in-div {
  padding-top: 8px;
  width: 100%;
}

.in-row {
  display: flex;
}
</style>
