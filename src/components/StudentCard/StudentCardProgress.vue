<template>
  <section class="student-progress-section in-row">
    <div 
      v-for="(activity, i) in activities" 
      :key="activity.course.id + i" 
      :class="divClass"
    >
      <StudentCircularProgress :activity="activity" :student="student" :length="length"/>
    </div>
  </section>
</template>
<script>
import PopupStudentProgress from "./PopupStudentProgress"
import StudentCircularProgress from "./StudentCircularProgress"

export default {
  name: "StudentCardProgress",
  components: {
    PopupStudentProgress,
    StudentCircularProgress
  },
  props: ["student", "activities"],
  computed: {
    length () {
      return this.activities.length > 1
    },
    divClass () {
      return this.length ? "flex-div" : "in-div"
    }
  }
}
</script>
<style scoped>
.student-progress-section {
  width: 25%;
  border-left: 1px dashed var(--v-missionAccent-base);
  justify-content: center;
}
.flex-div {
  width: 100%;
  padding-top: 5px
}

.in-div {
  padding-top:8px;
  width: 100%
}

.in-row {
  display: flex;
}
</style>