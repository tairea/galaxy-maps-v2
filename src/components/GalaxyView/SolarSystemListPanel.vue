<template>
  <div class="systemListPanel">
    <!-- USER MENU TOPBAR -->

    <!-- USER MENU HIDDEN-->

    <div class="panelContent">
      <div class="panelContentInner">
        <div v-for="(topic, topicIndex) in topics" :key="topic.id">
          <p
            class="subPanel systemListPanelLabel mx-2 pl-2 clickable-topic"
            @click="focusOnTopic(topic)"
          >
            {{ topicIndex + 1 }}: {{ topic.name }}
          </p>
          <div v-for="(task, taskIndex) in topic.tasks" :key="task.id" class="px-2">
            <p
              class="subPanel systemListTaskLabel pl-2 clickable-task"
              @click="focusOnTopic(topic)"
            >
              {{ topicIndex + 1 }}.{{
                task.orderIndex !== undefined && task.orderIndex !== null
                  ? task.orderIndex + 1
                  : taskIndex + 1
              }}: {{ task.title }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="blackBar">
      <div class="d-flex justify-center align-center">
        <div class="panelTab overline" style="color: var(--v-missionAccent-base)">
          LIST OF STAR SYSTEMS
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapActions, mapState } from "pinia";
import useRootStore from "@/store/index";

export default defineComponent({
  name: "SolarSystemListPanel",
  components: {},
  data() {
    return {};
  },
  async mounted() {},
  computed: {
    ...mapState(useRootStore, [
      "person",
      "user",
      "currentCourseId",
      "currentCourseNodes",
      "personsTopics",
      "personsCourseTasks",
      "courseTasks",
    ]),
    topics() {
      return this.currentCourseNodes
        .map((node) => {
          // Get tasks for this topic and sort them
          const topicTasks = this.courseTasks
            .filter((task) => task.topicId === node.id)
            .map((task) => task.task)
            .sort((a, b) => {
              // Sort tasks by orderIndex if available
              if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                return a.orderIndex - b.orderIndex;
              }
              // Fall back to timestamp sorting
              const aTime = a.taskCreatedTimestamp?.seconds || 0;
              const bTime = b.taskCreatedTimestamp?.seconds || 0;
              if (aTime === bTime) {
                return (
                  (a.taskCreatedTimestamp?.nanoseconds || 0) -
                  (b.taskCreatedTimestamp?.nanoseconds || 0)
                );
              }
              return aTime - bTime;
            });

          return {
            id: node.id,
            name: node.label,
            orderIndex: node.orderIndex,
            topicCreatedTimestamp: node.topicCreatedTimestamp,
            tasks: topicTasks,
          };
        })
        .sort((a, b) => {
          // If using orderIndex (uncomment the preferred sorting method)
          if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
            return a.orderIndex - b.orderIndex;
          }

          // If using topicCreatedTimestamp
          const aTime = a.topicCreatedTimestamp?.seconds || 0;
          const bTime = b.topicCreatedTimestamp?.seconds || 0;
          if (aTime === bTime) {
            // If seconds are equal, compare nanoseconds
            return (
              (a.topicCreatedTimestamp?.nanoseconds || 0) -
              (b.topicCreatedTimestamp?.nanoseconds || 0)
            );
          }
          return aTime - bTime;
        });
    },
  },
  methods: {
    focusOnTopic(topic) {
      // Find the corresponding node from currentCourseNodes
      const node = this.currentCourseNodes.find((node) => node.id === topic.id);
      if (node) {
        this.$emit("focusOnTopic", node);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.systemListPanel {
  background: var(--v-background-darken1);
  width: 320px;
  height: 600px;
  position: fixed;
  // bottom: 0px;
  top: calc(50% - 300px);
  right: -320px;
  transition: all 0.3s ease-out;
  z-index: 100;

  .blackBar {
    position: absolute;
    height: 100%;
    top: 0px;
    right: unset;
    left: -30px;
    width: 30px;
    background: var(--v-background-darken1);
    // padding: 10px;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 95%);
    text-align: right;
    display: flex;
    justify-content: flex-end;
    // border: 1px yellow solid;

    .panelTab {
      width: 100%;
      writing-mode: vertical-rl;
    }
  }

  .panelContent {
    height: calc(100% - 40px);
    width: auto;
    margin: 20px 0px 30px 0px;
    background: var(--v-missionAccent-base);
    // margin-left: -2px;
    // margin-left: 10px;
    position: relative;

    .panelContentInner {
      position: relative;
      height: 99%;
      width: 99.5%;
      overflow-y: auto;
      overflow-x: hidden;

      .subPanel {
        border: 1px solid var(--v-missionAccent-base);
        margin: 10px;
        margin-top: 20px;
      }

      .clickable-topic {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateX(5px);
        }
      }

      .clickable-task {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
          transform: translateX(3px);
        }
      }
    }

    .systemListPanelLabel {
      color: var(--v-missionAccent-base);
      position: relative;
      font-weight: 600;
    }

    .systemListTaskLabel {
      color: var(--v-primary-base);
      position: relative;
      font-size: 0.9rem;
    }
  }

  .panelContent:before {
    content: "";
    width: 98%;
    height: calc(100% - 2px);
    // height: 100%;
    background: var(--v-background-darken1);
    display: block;
    position: absolute;
    top: 1px;
    left: 1px;
  }

  .panelContent,
  .panelContent:before {
    clip-path: polygon(15% 100%, 100% 100%, 100% 0, 0 0, 0 95%);
  }
}

.add-system-icon {
  background-color: rgba(266, 105, 207, 0.2);
  border-radius: 50%;
  width: 20px;
  height: 20px;
}

.systemListPanel:hover {
  right: 0px;
}

*::-webkit-scrollbar {
  width: 5px;
}

/* Track */
*::-webkit-scrollbar-track {
  background: var(--v-background-base);
  margin-top: 1px;
  margin-bottom: 25px;
}

/* Handle */
*::-webkit-scrollbar-thumb {
  background: var(--v-missionAccent-base);
}

/* Handle on hover */
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}
</style>
