<template>
  <transition name="slide-up" appear>
    <div v-if="show" class="mobile-panel">
      <div class="mobile-panel-container">
        <!-- Close button positioned at top right -->
        <v-btn text x-small color="missionAccent" class="close-button" @click="closeInfoPanel">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>

        <!-- Loading spinner -->
        <div v-if="!selectedTopic && !topicError" class="mobile-loading-section">
          <v-btn :loading="!selectedTopic" icon color="missionAccent"></v-btn>
          <p class="mobile-loading-text">Loading system</p>
        </div>

        <!-- Error message -->
        <div v-else-if="topicError" class="mobile-error-section">
          <v-icon large color="missionAccent">{{ mdiAlert }}</v-icon>
          <p class="mobile-error-text">{{ topicError }}</p>
        </div>

        <!-- Content when topic is loaded -->
        <div v-else-if="selectedTopic">
          <!-- Header section -->
          <div class="mobile-panel-header">
            <!-- Image and title row -->
            <div class="mobile-content-row">
              <!-- <div class="mobile-image-section">
                <v-img
                  v-if="selectedTopic.image"
                  class="mobile-topic-image"
                  :src="selectedTopic.image"
                  @error="handleImageError"
                ></v-img>
                <div v-else class="mobile-image-placeholder">
                  {{ first3Letters(selectedTopic.label || selectedTopic.title) }}
                </div>
              </div> -->
              <div class="mobile-panel-title">
                <span class="mobile-status-label">STAR SYSTEM</span>
                <h2 class="mobile-topic-title">
                  {{ selectedTopic.label || selectedTopic.title || "Untitled Topic" }}
                </h2>
                <div class="mobile-description-section">
                  <p
                    v-if="selectedTopic.description"
                    class="mobile-description missionAccent--text"
                  >
                    {{ maybeTruncate(selectedTopic.description) }}
                    <a v-if="readmore" class="mobile-read-more" @click="showFullDescription()">
                      Read more
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <!-- Edit button for teachers -->
            <div v-if="teacher" class="mobile-edit-section">
              <v-btn
                icon
                small
                color="missionAccent"
                class="mobile-edit-btn"
                alt="Edit Topic"
                @click="editNode"
              >
                <v-icon>{{ mdiPencil }}</v-icon>
              </v-btn>
              <span class="mobile-edit-label">Edit System</span>
            </div>

            <!-- Missions section -->
            <div class="mobile-panel-content">
              <div class="mobile-missions-section">
                <!-- <h3 class="mobile-missions-title">MISSIONS</h3> -->

                <!-- No missions warning -->
                <div v-if="tasks.length === 0" class="mobile-no-missions">
                  <p class="mobile-no-missions-text">This system has no missions.</p>
                  <p class="mobile-no-missions-subtext">
                    <strong>Systems must have at least one mission</strong>
                  </p>
                </div>

                <!-- Mission cards -->
                <div
                  v-for="(task, index) in sortTasks"
                  :key="task.id"
                  class="mobile-task-card"
                  :style="[task.taskStatus == 'locked' ? { opacity: 0.4 } : { opacity: 1 }]"
                  v-on="enableClick ? { click: routeToSolarSystem } : {}"
                  :class="enableClick ? '' : 'no-click'"
                >
                  <div class="mobile-task-number">MISSION {{ index + 1 }}</div>
                  <div class="mobile-task-title">{{ task.title }}</div>
                  <div class="mobile-task-status">
                    <p
                      v-if="task.taskStatus != 'locked'"
                      class="mobile-status-text"
                      :class="{
                        completed: task.taskStatus == 'completed',
                        locked: task.taskStatus == 'locked',
                        inreview: task.taskStatus == 'inreview',
                        active: task.taskStatus == 'active',
                      }"
                    >
                      {{ task.taskStatus }}
                    </p>
                    <v-icon v-else color="missionAccent" class="mobile-lock-icon">{{
                      mdiLock
                    }}</v-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action button section -->
          <div class="mobile-panel-actions">
            <!-- TEACHER OR STUDENT -->
            <v-btn
              v-if="teacher || student"
              class="mobile-view-system-btn"
              dark
              large
              color="missionAccent"
              outlined
              tile
              @click="routeToSolarSystem"
            >
              View System
            </v-btn>

            <!-- NOT-SIGNED-IN-USER -->
            <div v-else-if="!user.loggedIn" class="mobile-signin-section">
              <LoginDialog />
            </div>

            <!-- SIGNED IN STUDENT, BUT NOT YET ENROLLED -->
            <v-btn
              v-else
              class="mobile-start-galaxy-btn"
              dark
              large
              elevation="10"
              color="galaxyAccent"
              title="View Galaxy"
              @click="startThisGalaxy"
              :loading="loading"
            >
              <p class="mobile-start-text">
                Start <br />
                {{ course.title }} <br />
                Galaxy
              </p>
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { fetchCohortByCohortId, addMeToCohort, assignCourseToMe } from "@/lib/ff";
import useRootStore from "@/store/index";
import { mdiClose, mdiPencil, mdiLock, mdiAlert } from "@mdi/js";
import { mapActions, mapState } from "pinia";
import LoginDialog from "@/components/Dialogs/LoginDialog.vue";

export default {
  name: "MobileSolarSystemInfoPanel",
  props: ["show", "course", "selectedTopic", "tasks", "topicError"],
  components: { LoginDialog },
  data() {
    return {
      mdiClose,
      mdiPencil,
      mdiLock,
      mdiAlert,
      readmore: false,
      loading: false,
    };
  },
  watch: {
    selectedTopic: {
      handler(newTopic) {
        if (newTopic) {
          console.log("MobileSolarSystemInfoPanel - selectedTopic changed:", {
            id: newTopic.id,
            label: newTopic.label,
            title: newTopic.title,
            color: newTopic.color,
            image: newTopic.image,
          });
        }
      },
      immediate: true,
    },
  },
  computed: {
    ...mapState(useRootStore, ["person", "user"]),
    enableClick() {
      if (this.course.presentationOnly && !this.teacher) return false;
      return true;
    },
    teacher() {
      return (
        this.course?.mappedBy?.personId === this.person?.id ||
        this.user.data?.admin ||
        (this.course?.collaboratorIds && this.course?.collaboratorIds.includes(this.person?.id))
      );
    },
    student() {
      return this.person?.assignedCourses?.some((courseId) => courseId === this.course.id);
    },
    sortTasks() {
      return this.tasks.sort((a, b) => a.orderIndex - b.orderIndex);
    },
    first3Letters() {
      return (title) => {
        if (!title) return "";
        return title.substring(0, 3).toUpperCase();
      };
    },
    maybeTruncate() {
      return (description) => {
        if (!description) return "";
        if (description.length > 150) {
          this.readmore = true;
          return description.substring(0, 150) + "...";
        }
        return description;
      };
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentTaskId", "setCurrentTopicId", "setCurrentCourseId"]),
    closeInfoPanel() {
      this.$emit("closeInfoPanel");
    },
    editNode() {
      this.$emit("editNode", this.selectedTopic);
    },
    routeToSolarSystem() {
      // save current topic to store
      this.setCurrentTopicId(this.selectedTopic.id);
      // save active task to store if we know it
      const activeMission = this.tasks.find((topicObj) => topicObj.taskStatus == "active");
      if (activeMission) {
        this.setCurrentTaskId(activeMission.id);
      }
      // route to topic/solar system
      this.$router.push({
        name: "SolarSystemView",
        params: {
          courseId: this.course.id,
          topicId: this.selectedTopic.id,
          teacher: this.teacher,
        },
      });
    },
    async startThisGalaxy() {
      this.loading = true;
      // save current course to store
      this.setCurrentCourseId(this.course.id);

      // assign student to cohort and course
      const cohort = await fetchCohortByCohortId(this.course.cohort);
      await addMeToCohort(cohort.id);
      await assignCourseToMe(this.course.id);

      this.loading = false;

      // emit enrolled in course. reload GalaxyMap
      this.$emit("enrolledInCourse");
    },
    handleImageError() {
      // Handle image loading error
    },
    showFullDescription() {
      // Show full description logic
      this.readmore = false;
    },
  },
};
</script>

<style lang="scss" scoped>
// Slide-up transition animations (Vue 2 class names)
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
    opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.slide-up-leave {
  transform: translateY(0);
  opacity: 1;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

// Mobile panel container
.mobile-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--v-background-darken1);
  z-index: 400;
  max-height: 80vh;
  overflow: hidden;

  .mobile-panel-container {
    border: 1px solid var(--v-missionAccent-base);
    margin: 10px;
    position: relative;
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 0px !important;
    z-index: 10;
  }

  // Loading section
  .mobile-loading-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 50px 20px;
    height: 200px;

    .mobile-loading-text {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin-top: 15px;
      text-align: center;
    }
  }

  // Error section
  .mobile-error-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 50px 20px;
    height: 200px;

    .mobile-error-text {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin-top: 15px;
      text-align: center;
    }
  }
}

// Header section
.mobile-panel-header {
  border-bottom: 1px solid var(--v-missionAccent-base);
  margin-bottom: 90px;
  height: 200px;
  overflow-y: scroll;
  mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 5%,
    black 90%,
    transparent 100%
  );

  .mobile-content-row {
    display: flex;
    flex-direction: row;
    gap: 20px;
    margin: 15px;

    .mobile-image-section {
      flex-shrink: 0;

      .mobile-topic-image {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 10px;
      }

      .mobile-image-placeholder {
        width: 120px;
        height: 120px;
        background: var(--v-missionAccent-base);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        border-radius: 10px;
      }
    }

    .mobile-panel-title {
      flex: 1;
      display: flex;
      align-items: flex-start;
      flex-direction: column;

      .mobile-status-label {
        color: var(--v-missionAccent-base);
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: block;
        margin-bottom: 5px;
      }

      .mobile-topic-title {
        color: var(--v-missionAccent-base);
        font-weight: 800;
        font-size: 1.2rem;
        line-height: 1.3;
        margin: 0;
        word-wrap: break-word;
      }

      .mobile-description-section {
        flex: 1;

        .mobile-description {
          color: white;
          font-size: 0.8rem;
          line-height: 1.5;
          margin: 0;

          .mobile-read-more {
            color: var(--v-missionAccent-base);
            text-decoration: none;
            border-bottom: 1px solid var(--v-missionAccent-base);
            cursor: pointer;
            margin-left: 5px;
          }
        }
      }
    }
  }

  .mobile-edit-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 20px;
    gap: 5px;

    .mobile-edit-btn {
      background: var(--v-missionAccent-base);
    }

    .mobile-edit-label {
      color: var(--v-missionAccent-base);
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 500;
    }
  }
}

// Content section
.mobile-panel-content {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
  border-top: 1px solid var(--v-missionAccent-base);

  .mobile-missions-section {
    .mobile-missions-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin: 0 0 20px 0;
      text-align: center;
      font-weight: 800;
    }

    .mobile-no-missions {
      text-align: center;
      padding: 20px;

      .mobile-no-missions-text {
        color: var(--v-missionAccent-base);
        font-size: 0.8rem;
        margin: 0 0 10px 0;
      }

      .mobile-no-missions-subtext {
        color: var(--v-missionAccent-base);
        font-size: 0.7rem;
        margin: 0;
      }
    }

    .mobile-task-card {
      border: 1px solid var(--v-missionAccent-base);
      padding: 15px;
      margin: 0 0 15px 0;
      color: var(--v-missionAccent-base);
      font-size: 0.8rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: default;

      &:not(.no-click) {
        cursor: pointer;
      }

      .mobile-task-number {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        width: 25%;
      }

      .mobile-task-title {
        font-size: 0.8rem;
        font-weight: 500;
        flex: 1;
        text-align: center;
        padding: 0 10px;
      }

      .mobile-task-status {
        width: 25%;
        text-align: center;

        .mobile-status-text {
          margin: 0;
          text-transform: uppercase;
          font-weight: 800;
          font-size: 0.7rem;

          &.completed {
            color: var(--v-baseAccent-base);
          }

          &.inreview {
            color: var(--v-cohortAccent-base);
          }

          &.active {
            color: var(--v-galaxyAccent-base);
          }
        }

        .mobile-lock-icon {
          font-size: 1.2rem;
        }
      }
    }
  }
}

// Action button section
.mobile-panel-actions {
  padding: 20px;
  text-align: center;
  position: absolute;
  bottom: 0;
  width: 100%;
  border-top: 1px solid var(--v-missionAccent-base);
  background-color: var(--v-background-darken1);

  .mobile-view-system-btn {
    width: 100%;
    height: 50px;
    font-size: 1rem;
    font-weight: 500;
    border-width: 2px;
  }

  .mobile-start-galaxy-btn {
    width: 100%;
    height: 50px;
    font-size: 1rem;
    font-weight: 500;
    border-width: 2px;

    .mobile-start-text {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.2;
    }
  }

  .mobile-signin-section {
    width: 100%;
  }
}

// Responsive adjustments for very small screens
@media (max-width: 480px) {
  .mobile-panel-header {
    .mobile-content-row {
      flex-direction: row;
      gap: 15px;

      .mobile-image-section {
        text-align: center;

        .mobile-topic-image,
        .mobile-image-placeholder {
          width: 100px;
          height: 100px;
          margin: 0 auto;
        }
      }
    }
  }
}
</style>
