<template>
  <section class="text-center" :class="sectionClass" @mouseover="show($event)" @mouseleave="hide()">
    <v-progress-circular
      :value="topicsCompletedPercentage"
      color="baseAccent"
      :class="courseClass"
      :size="courseSize"
      :width="width"
      :rotate="-90"
    >
      <v-avatar
        color="secondary"
        :size="avatarSize"
        class="glow"
      >
        <img
          v-if="activity.course.image"
          :src="activity.course.image.url"
          :alt="activity.course.firstName"
          style="object-fit: cover"
        />
        <v-icon v-else>mdi-account</v-icon>
      </v-avatar>
    </v-progress-circular>
    <v-progress-circular
      :value="tasksCompletedPercentage"
      color="missionAccent"
      :class="topicClass"
      :size="topicSize"
      :width="width"
      :rotate="-90"
    >
    </v-progress-circular>
    <v-scale-transition>
      <PopupStudentProgress :show="showPopup" :payload="popupPayload" :e="e"/>
    </v-scale-transition>
  </section>
</template>
<script>
import PopupStudentProgress from "./PopupStudentProgress.vue"

import { getStudentTasksByTopicId } from "@/lib/ff"

export default {
  name: "StudentCircularProgress",
  props: ["student", "activity", "length"],
  components: {
    PopupStudentProgress
  },
  data () {
    return {
      showPopup: false,
      e: {},
      completedTasksInTopic: 0,
      tasksInCurrentTopic: [],
      topicsCompletedPercentage: 0,
      tasksCompletedPercentage: 0,
    }
  },
  mounted () {
    this.calcTopicsCompletedPercentage()
    this.calcTasksCompletedPercentage()
  },
  computed: {
    courseSize() {
      return this.length ? 50 : 90
    },
    width () {
     return this.length ? 5 : 8
    },
    topicSize () {
      return this.length ? 38 : 70
    },
    avatarSize () {
      return this.length ? 24 : 40
    },
    courseClass () {
      return this.length ? "flex-course-progress" : "course-progress"
    },
    topicClass () {
      return this.length ? "flex-topic-progress" : "topic-progress"
    },
    divClass () {
      return this.length ? "flex-div" : "in-div"
    },
    sectionClass () {
      return this.length ? "grow-lg" : "grow-sm"
    },
    popupPayload () {
      return {
        completedTasks: this.completedTasksInTopic,
        totalTasks: this.tasksInCurrentTopic.length,
        completedTopics: this.activity.topicCompletedCount,
        totalTopics: this.activity.course.topicTotal,
        course: this.activity.course.title,
        topic: this.activity.currentTopic?.title
      }
    }
  },
  methods: {
    show(e) {
      if (this.showPopup) return
      this.e = e
      this.showPopup = true
    },
    hide() {
      this.showPopup = false
    },
    calcTopicsCompletedPercentage() {
      let percentage = (this.activity.topicCompletedCount / this.activity.course.topicTotal) * 100;
      this.topicsCompletedPercentage = Math.round(percentage) || 1
    },
    async calcTasksCompletedPercentage() {
      if (this.activity.currentTopic?.status === "completed") this.tasksCompletedPercentage = 100
      if (this.activity.currentTopic) {
        this.tasksInCurrentTopic = await getStudentTasksByTopicId({
          studentId: this.student.id,
          topicId: this.activity.currentTopic?.id,
          courseId: this.activity.course.id
        })

        this.tasksInCurrentTopic.forEach(task => {
          if (task.taskStatus === "completed") this.completedTasksInTopic++;
        })
        let percentage = (this.completedTasksInTopic / this.tasksInCurrentTopic.length) * 100;
        this.tasksCompletedPercentage = Math.round(percentage) || 1
      }
      else {
        let percentage = (this.activity.tasksCompletedCount / this.activity.course.taskTotal) * 100;
        this.tasksCompletedPercentage = Math.round(percentage) || 1
      }
    }
  }
}
</script>
<style scoped>
.student-progress-section {
  width: 25%;
  border-left: 1px dashed var(--v-missionAccent-base);
}
.course-progress {
  position: absolute;
  width: 100%
}

.flex-course-progress {
  position: absolute;
  width:100%
}

.topic-progress {
  position: relative;
  top: 10px;
  left: 10px
}

.flex-topic-progress {
  position: relative;
  top: 6px;
  left: 6px;
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

.grow-lg { 
  position: relative;
  right: 5px;
  transition: all .2s ease-in-out; 
}
.grow-lg:hover { 
  transform: scale(2); 
}
.grow-sm { 
  position: relative;
  right: 10px;
  transition: all .2s ease-in-out; 
}
.grow-sm:hover { 
  transform: scale(1.5); 
}
.glow { 
  transition: all .2s ease-in-out; 
}
.glow:hover { 
  color: rgba(255, 255, 255, 1);
  box-shadow: 0 0 30px var(--v-missionAccent-base);
}
</style>