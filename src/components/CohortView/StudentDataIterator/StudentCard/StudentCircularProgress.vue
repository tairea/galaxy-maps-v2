<template>
  <v-hover v-model="hover">
    <div class="text-center" :class="sectionClass" ref="circle">
      <v-progress-circular
        :value="tasksCompletedPercentage"
        color="baseAccent"
        :class="courseClass"
        :size="courseSize"
        :width="width"
        :rotate="-90"
      >
        <v-avatar
          v-if="activity.course.image.url"
          color="secondary"
          :size="avatarSize"
          class="glow"
        >
          <img
            :src="activity.course.image.url"
            :alt="activity.course.title"
            style="object-fit: cover"
          />
          <!-- <v-icon v-else>{{ mdiAccount }}</v-icon> -->
        </v-avatar>

        <div
          v-else
          class="imagePlaceholder"
          :style="
            avatarSize
              ? 'max-width:' + avatarSize + 'px; max-height:' + avatarSize + 'px'
              : 'max-width: 60px;max-height:60px'
          "
        >
          {{ first3Letters(activity.course.title) }}
        </div>
      </v-progress-circular>
      <v-progress-circular
        :value="topicsCompletedPercentage"
        color="missionAccent"
        :class="topicClass"
        :size="topicSize"
        :width="width"
        :rotate="-90"
      >
      </v-progress-circular>
      <v-scale-transition>
        <PopupStudentProgress :show="hover" :payload="popupPayload" :e="e" />
      </v-scale-transition>
    </div>
  </v-hover>
</template>

<script>
import PopupStudentProgress from "@/components/CohortView/StudentDataIterator/StudentCard/PopupStudentProgress.vue";
import { fetchPersonsTasksByPersonIdCourseIdTopicId } from "@/lib/ff";
import { mdiAccount } from "@mdi/js";

export default {
  name: "StudentCircularProgress",
  props: ["student", "activity", "length"],
  components: {
    PopupStudentProgress,
  },
  data() {
    return {
      mdiAccount,
      showPopup: false,
      completedTasksInTopic: 0,
      tasksInCurrentTopic: [],
      topicsCompletedPercentage: 0,
      tasksCompletedPercentage: 0,
      hover: false,
      e: {},
    };
  },
  mounted() {
    this.calcTopicsCompletedPercentage();
    this.calcTasksCompletedPercentage();
    this.e = {
      left: this.$refs.circle?.getBoundingClientRect().left,
    };
  },
  watch: {
    hover() {
      this.e.top = this.$refs.circle?.getBoundingClientRect().top;
    },
  },
  computed: {
    courseSize() {
      return this.length ? 50 : 90;
    },
    width() {
      return this.length ? 5 : 8;
    },
    topicSize() {
      return this.length ? 38 : 70;
    },
    avatarSize() {
      return this.length ? 24 : 40;
    },
    courseClass() {
      return this.length ? "flex-course-progress" : "course-progress";
    },
    topicClass() {
      return this.length ? "flex-topic-progress" : "topic-progress";
    },
    divClass() {
      return this.length ? "flex-div" : "in-div";
    },
    sectionClass() {
      return this.length ? "grow-lg" : "grow-sm";
    },
    popupPayload() {
      return {
        completedTasks: this.completedTasksInTopic,
        totalTasks: this.tasksInCurrentTopic?.length,
        completedTopics: this.activity.topicCompletedCount,
        totalTopics: this.activity.course.topicTotal,
        course: this.activity.course.title,
        topic: this.activity.currentTopic?.title, // activity uses title field even for topics
      };
    },
  },
  methods: {
    show(e) {
      setTimeout(() => {
        if (this.showPopup) return;
        else {
          this.e = e;
          this.showPopup = true;
        }
      }, 100);
    },
    hide() {
      setTimeout(() => {
        this.showPopup = false;
      }, 100);
    },
    calcTopicsCompletedPercentage() {
      let percentage = (this.activity.topicCompletedCount / this.activity.course.topicTotal) * 100;
      this.topicsCompletedPercentage = Math.round(percentage) || 1;
    },
    async calcTasksCompletedPercentage() {
      if (this.activity.currentTopic?.status === "completed") this.tasksCompletedPercentage = 100;
      if (this.activity.currentTopic) {
        this.tasksInCurrentTopic = await fetchPersonsTasksByPersonIdCourseIdTopicId(
          this.student.id,
          this.activity.course.id,
          this.activity.currentTopic.id,
        );
        this.tasksInCurrentTopic?.forEach((task) => {
          if (task.taskStatus === "completed") this.completedTasksInTopic++;
        });
        if (this.tasksInCurrentTopic) {
          let percentage = (this.completedTasksInTopic / this.tasksInCurrentTopic.length) * 100;
          this.tasksCompletedPercentage = Math.round(percentage) || 1;
        }
      } else {
        let percentage = (this.activity.tasksCompletedCount / this.activity.course.taskTotal) * 100;
        this.tasksCompletedPercentage = Math.round(percentage) || 1;
      }
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
  },
};
</script>

<style scoped lang="scss">
.student-progress-section {
  width: 25%;
  border-left: 1px dashed var(--v-missionAccent-base);
}

.course-progress {
  position: absolute;
  width: 100%;
}

.flex-course-progress {
  position: absolute;
  width: 100%;
}

.topic-progress {
  position: relative;
  top: 10px;
  left: 10px;
}

.flex-topic-progress {
  position: relative;
  top: 6px;
  left: 6px;
}

.flex-div {
  width: 100%;
  padding-top: 5px;
}

.in-div {
  padding-top: 8px;
  width: 100%;
}

.in-row {
  display: flex;
}

.grow-lg {
  position: relative;
  z-index: 5;
  transition: all 0.2s ease-in-out;
}

.grow-lg:hover {
  transform: scale(2);

  .glow {
    box-shadow: 0 0 30px var(--v-missionAccent-base);
  }
}

.imagePlaceholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(200, 200, 200, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}

.grow-sm {
  position: relative;
  right: 10px;
  transition: all 0.2s ease-in-out;
  z-index: 5;
}

.grow-sm:hover {
  transform: scale(1.5);

  .glow {
    box-shadow: 0 0 60px var(--v-missionAccent-base);
  }
}

.glow {
  transition: all 0.2s ease-in-out;
}
</style>
