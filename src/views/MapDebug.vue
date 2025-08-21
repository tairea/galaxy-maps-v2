<template>
  <div class="map-debug-view">
    <v-container class="mt-12">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-3" color="primary">mdi-bug</v-icon>
              Map Performance Debugger
              <v-spacer></v-spacer>
              <v-btn @click="refreshData" :loading="loading" color="primary" outlined>
                <v-icon left>mdi-refresh</v-icon>
                Refresh Data
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-alert v-if="isLoadingCourses" type="info" outlined>
                <v-progress-circular indeterminate size="20" class="mr-2"></v-progress-circular>
                Loading courses and performance data...
              </v-alert>

              <v-alert v-else-if="!courses.length" type="warning" outlined>
                <v-icon left>mdi-alert</v-icon>
                No courses found. Please check your permissions or try refreshing.
              </v-alert>

              <div v-else>
                <v-alert type="success" outlined class="mb-4">
                  <v-icon left>mdi-check-circle</v-icon>
                  Loaded {{ courses.length }} courses with
                  {{ Object.keys(courseNodesMap).length }} node collections and
                  {{ Object.keys(courseEdgesMap).length }} edge collections
                </v-alert>

                <CoursePerformanceDebugger
                  :courseNodesMap="courseNodesMap"
                  :courseEdgesMap="courseEdgesMap"
                  :courses="courses"
                  @refresh-requested="handleRefreshRequested"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import CoursePerformanceDebugger from "@/components/GalaxyList/CoursePerformanceDebugger.vue";
import useGalaxyListViewStore from "@/store/galaxyListView";
import { mapState, mapActions } from "pinia";

export default {
  name: "MapDebug",
  components: {
    CoursePerformanceDebugger,
  },
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapState(useGalaxyListViewStore, [
      "courses",
      "courseNodesMap",
      "courseEdgesMap",
      "isLoadingCourses",
      "user",
    ]),
  },
  methods: {
    ...mapActions(useGalaxyListViewStore, ["loadCourses", "refreshCourses"]),

    async refreshData() {
      console.log("🔄 Starting data refresh...");
      this.loading = true;
      try {
        // Try loadCourses first (with null slug to load all courses)
        console.log("📡 Calling loadCourses action with null slug...");
        await this.loadCourses(null);
        console.log("✅ loadCourses completed successfully");
      } catch (error) {
        console.warn("⚠️ loadCourses failed, trying refreshCourses...", error);
        try {
          // Fallback to refreshCourses if loadCourses fails
          console.log("📡 Calling refreshCourses action...");
          await this.refreshCourses();
          console.log("✅ refreshCourses completed successfully");
        } catch (refreshError) {
          console.error("❌ Both loadCourses and refreshCourses failed:", refreshError);
          throw refreshError;
        }
      } finally {
        // Wait for the loading state to actually complete
        while (this.isLoadingCourses) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        this.loading = false;
        console.log("🔄 Refresh button loading state stopped");
      }

      console.log("📊 Updated state:", {
        coursesCount: this.courses.length,
        nodesMapKeys: Object.keys(this.courseNodesMap).length,
        edgesMapKeys: Object.keys(this.courseEdgesMap).length,
      });
    },

    handleRefreshRequested() {
      this.refreshData();
    },
  },

  async mounted() {
    console.log("🚀 MapDebug view mounted");

    // Check if user is admin - additional safety measure
    if (!this.user?.data?.admin) {
      console.warn("⚠️ Non-admin user attempted to access MapDebug view");
      this.$router.push("/dashboard");
      return;
    }

    console.log("📊 Initial state:", {
      coursesCount: this.courses.length,
      isLoading: this.isLoadingCourses,
      nodesMapKeys: Object.keys(this.courseNodesMap).length,
      edgesMapKeys: Object.keys(this.courseEdgesMap).length,
    });

    // Override body overflow to allow scrolling in this view - multiple approaches
    document.body.style.overflow = "auto";
    document.body.style.setProperty("overflow", "auto", "important");

    // Also try to override html element
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.setProperty("overflow", "auto", "important");

    // Force a reflow to ensure the change takes effect
    document.body.offsetHeight;

    // Always try to load courses when the component mounts
    if (!this.courses.length) {
      console.log("🔄 Loading courses for MapDebug view...");
      await this.refreshData();
    } else {
      console.log("✅ Courses already loaded:", this.courses.length);
    }
  },

  beforeUnmount() {
    // Restore body overflow when leaving this view
    document.body.style.overflow = "hidden";
    document.body.style.setProperty("overflow", "hidden", "important");
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.setProperty("overflow", "hidden", "important");
  },
};
</script>

<style scoped>
.map-debug-view {
  background: var(--v-background-base);
  overflow: visible;
  min-height: 100vh;
  position: relative;
}

/* Ensure scrolling works in this view */
.map-debug-view :deep(.v-container) {
  overflow: visible !important;
  max-height: none !important;
}

.map-debug-view :deep(.v-main) {
  overflow: visible !important;
}

.v-card-title {
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
