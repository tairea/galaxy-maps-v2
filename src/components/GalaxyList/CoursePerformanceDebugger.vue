<template>
  <div class="course-performance-debugger">
    <v-card class="ma-4">
      <v-card-title>
        Course Performance Analyzer
        <v-spacer></v-spacer>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="!analyzedCourses.length" type="info" outlined>
          <v-icon left>mdi-information</v-icon>
          Click "Analyze All Courses" to start performance analysis
        </v-alert>

        <v-btn
          @click="analyzeAllCourses"
          :disabled="!courses.length"
          color="success"
          block
          class="mb-4"
        >
          Analyze All Courses ({{ courses.length }})
        </v-btn>

        <div v-if="analyzedCourses.length" class="analysis-results">
          <v-divider class="my-4"></v-divider>

          <h3>Performance Analysis Results</h3>

          <!-- Performance Summary -->
          <v-alert v-if="performanceIssues.length > 0" type="warning" outlined class="mb-4">
            <v-icon left>mdi-alert-triangle</v-icon>
            <strong>{{ performanceIssues.length }} performance concern(s) detected</strong>
            <div class="mt-2">
              <span v-for="(issue, index) in performanceIssues" :key="index" class="mr-4">
                • {{ issue.type }}: {{ issue.count }} courses
              </span>
            </div>
          </v-alert>

          <v-alert v-else type="success" outlined class="mb-4">
            <v-icon left>mdi-check-circle</v-icon>
            No performance concerns detected across all courses
          </v-alert>

          <!-- Courses Table -->
          <div class="table-container">
            <v-data-table
              :headers="tableHeaders"
              :items="analyzedCourses"
              :items-per-page="10"
              :sort-by="['complexityScore']"
              :sort-desc="[true]"
              class="elevation-1 performance-table"
              dense
            >
              <template v-slot:item.courseName="{ item }">
                <div class="d-flex align-center">
                  <v-icon
                    v-if="item.performanceIssues.length > 0"
                    color="warning"
                    small
                    class="mr-2"
                  >
                    mdi-alert-triangle
                  </v-icon>
                  <span>{{ item.courseName || item.courseId }}</span>
                </div>
              </template>

              <template v-slot:item.nodeCount="{ item }">
                <span :class="getNodeCountClass(item.nodeCount)">
                  {{ item.nodeCount }}
                </span>
              </template>

              <template v-slot:item.edgeCount="{ item }">
                <span :class="getEdgeCountClass(item.edgeCount)">
                  {{ item.edgeCount }}
                </span>
              </template>

              <template v-slot:item.boundaryArea="{ item }">
                <span :class="getBoundaryClass(item.totalArea)">
                  {{ item.totalArea?.toFixed(0) || "N/A" }}
                </span>
              </template>

              <template v-slot:item.complexityScore="{ item }">
                <span :class="getComplexityClass(item.complexityScore)">
                  {{ item.complexityScore?.toFixed(1) || "N/A" }}
                </span>
              </template>

              <template v-slot:item.performanceIssues="{ item }">
                <div v-if="item.performanceIssues.length > 0">
                  <v-chip
                    v-for="issue in item.performanceIssues"
                    :key="issue.type"
                    :color="getIssueColor(issue.severity)"
                    small
                    class="ma-1"
                  >
                    {{ issue.type }}
                  </v-chip>
                </div>
                <span v-else class="text-success">None</span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn @click="showCourseDetails(item)" color="primary" small outlined>
                  Details
                </v-btn>
              </template>
            </v-data-table>
          </div>
        </div>

        <!-- Course Details Dialog -->
        <v-dialog v-model="showDetailsDialog" max-width="800px">
          <v-card v-if="selectedCourse">
            <v-card-title>
              Course Details: {{ selectedCourse.courseName || selectedCourse.courseId }}
              <v-spacer></v-spacer>
              <v-btn icon @click="showDetailsDialog = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <h4>Basic Metrics</h4>
                  <div><strong>Nodes:</strong> {{ selectedCourse.nodeCount }}</div>
                  <div><strong>Edges:</strong> {{ selectedCourse.edgeCount }}</div>
                  <div>
                    <strong>Boundary Width:</strong> {{ selectedCourse.boundaryWidth?.toFixed(2) }}
                  </div>
                  <div>
                    <strong>Boundary Height:</strong>
                    {{ selectedCourse.boundaryHeight?.toFixed(2) }}
                  </div>
                  <div><strong>Total Area:</strong> {{ selectedCourse.totalArea?.toFixed(2) }}</div>
                  <div>
                    <strong>Avg Node Distance:</strong>
                    {{ selectedCourse.avgNodeDistance?.toFixed(2) }}
                  </div>
                  <div>
                    <strong>Complexity Score:</strong>
                    {{ selectedCourse.complexityScore?.toFixed(2) }}
                  </div>
                </v-col>

                <v-col cols="6">
                  <h4>Performance Issues</h4>
                  <div v-if="selectedCourse.performanceIssues.length > 0">
                    <v-alert
                      v-for="issue in selectedCourse.performanceIssues"
                      :key="issue.type"
                      :type="getIssueAlertType(issue.severity)"
                      outlined
                      dense
                      class="mb-2"
                    >
                      <strong>{{ issue.type }}:</strong> {{ issue.description }}
                    </v-alert>
                  </div>
                  <div v-else class="text-success">
                    <v-icon>mdi-check-circle</v-icon>
                    No performance issues detected
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <h4>Node Sample (First 10)</h4>
              <div class="node-details">
                <div
                  v-for="node in selectedCourse.nodes?.slice(0, 10)"
                  :key="node.id"
                  class="node-detail"
                >
                  <strong>{{ node.label || node.id }}:</strong>
                  x: {{ node.x?.toFixed(2) }}, y: {{ node.y?.toFixed(2) }}
                  <span v-if="node.prerequisites" class="prereq-count">
                    ({{ node.prerequisites.length }} prereqs)
                  </span>
                </div>
                <div v-if="selectedCourse.nodes?.length > 10" class="text-caption">
                  ... and {{ selectedCourse.nodes.length - 10 }} more nodes
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "CoursePerformanceDebugger",
  props: {
    courseNodesMap: {
      type: Map,
      required: true,
    },
    courseEdgesMap: {
      type: Map,
      required: true,
    },
    courses: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      analyzedCourses: [],
      performanceIssues: [],
      showDetailsDialog: false,
      selectedCourse: null,
      tableHeaders: [
        { text: "Course", value: "courseName", sortable: true },
        { text: "Nodes", value: "nodeCount", sortable: true, align: "center" },
        { text: "Edges", value: "edgeCount", sortable: true, align: "center" },
        { text: "Boundary Area", value: "boundaryArea", sortable: true, align: "center" },
        { text: "Complexity Score", value: "complexityScore", sortable: true, align: "center" },
        { text: "Performance Issues", value: "performanceIssues", sortable: false },
        { text: "Actions", value: "actions", sortable: false, align: "center" },
      ],
    };
  },
  methods: {
    analyzeAllCourses() {
      this.analyzedCourses = [];
      this.performanceIssues = [];

      const allIssues = [];
      const issueCounts = {};

      this.courses.forEach((course) => {
        const analysis = this.analyzeCourse(course.id);
        if (analysis) {
          // Add course name if available
          analysis.courseName = course.name || course.title || course.slug || "Unknown";

          // Analyze performance issues
          const issues = this.identifyPerformanceIssues(analysis);
          analysis.performanceIssues = issues;

          // Track issue types for summary
          issues.forEach((issue) => {
            if (!issueCounts[issue.type]) {
              issueCounts[issue.type] = 0;
            }
            issueCounts[issue.type]++;
          });

          allIssues.push(...issues);
          this.analyzedCourses.push(analysis);
        }
      });

      // Create performance summary
      this.performanceIssues = Object.entries(issueCounts).map(([type, count]) => ({
        type,
        count,
        severity: this.getIssueSeverity(type, count),
      }));

      console.log(
        `Analyzed ${this.analyzedCourses.length} courses with ${allIssues.length} total issues`,
      );
    },

    analyzeCourse(courseId) {
      const nodes = this.courseNodesMap.get(courseId);
      const edges = this.courseEdgesMap.get(courseId);

      if (!nodes || !edges) {
        console.warn(`No data found for course: ${courseId}`);
        return null;
      }

      // Calculate boundaries
      const boundaries = this.calculateBoundaries(nodes);

      // Calculate complexity metrics
      const complexityScore = this.calculateComplexityScore(nodes, edges, boundaries);

      // Calculate average node distance
      const avgNodeDistance = this.calculateAverageNodeDistance(nodes);

      return {
        courseId,
        nodes,
        edges,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        boundaryWidth: boundaries.width,
        boundaryHeight: boundaries.height,
        totalArea: boundaries.width * boundaries.height,
        avgNodeDistance,
        complexityScore,
      };
    },

    calculateBoundaries(nodes) {
      if (!nodes || nodes.length === 0) return { width: 0, height: 0 };

      const xCoords = nodes.map((n) => n.x).filter((x) => x != null && !isNaN(x));
      const yCoords = nodes.map((n) => n.y).filter((y) => y != null && !isNaN(y));

      if (xCoords.length === 0 || yCoords.length === 0) return { width: 0, height: 0 };

      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);

      return {
        width: maxX - minX,
        height: maxY - minY,
      };
    },

    calculateComplexityScore(nodes, edges, boundaries) {
      let score = 0;

      // Base score from node and edge count
      score += nodes.length * 0.1;
      score += edges.length * 0.05;

      // Boundary size penalty
      if (boundaries.width > 1000 || boundaries.height > 1000) {
        score += (boundaries.width + boundaries.height) * 0.001;
      }

      // Node density penalty
      const area = boundaries.width * boundaries.height;
      if (area > 0) {
        const density = nodes.length / area;
        if (density > 0.01) {
          score += density * 100;
        }
      }

      // Prerequisites complexity
      const nodesWithPrereqs = nodes.filter((n) => n.prerequisites && n.prerequisites.length > 0);
      score += nodesWithPrereqs.length * 0.2;

      return score;
    },

    calculateAverageNodeDistance(nodes) {
      if (!nodes || nodes.length < 2) return 0;

      let totalDistance = 0;
      let pairCount = 0;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];

          if (node1.x != null && node1.y != null && node2.x != null && node2.y != null) {
            const distance = Math.sqrt(
              Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2),
            );
            totalDistance += distance;
            pairCount++;
          }
        }
      }

      return pairCount > 0 ? totalDistance / pairCount : 0;
    },

    identifyPerformanceIssues(courseData) {
      const issues = [];

      // High node count
      if (courseData.nodeCount > 100) {
        issues.push({
          type: "High Node Count",
          description: `Course has ${courseData.nodeCount} nodes, which may cause rendering performance issues.`,
          severity: "high",
        });
      } else if (courseData.nodeCount > 50) {
        issues.push({
          type: "Moderate Node Count",
          description: `Course has ${courseData.nodeCount} nodes, monitor for performance issues.`,
          severity: "medium",
        });
      }

      // High edge count
      if (courseData.edgeCount > 200) {
        issues.push({
          type: "High Edge Count",
          description: `Course has ${courseData.edgeCount} edges, which may cause layout complexity.`,
          severity: "high",
        });
      } else if (courseData.edgeCount > 100) {
        issues.push({
          type: "Moderate Edge Count",
          description: `Course has ${courseData.edgeCount} edges, monitor for layout issues.`,
          severity: "medium",
        });
      }

      // Large boundary area
      if (courseData.totalArea > 1000000) {
        issues.push({
          type: "Large Boundary",
          description: `Course has a very large boundary area (${courseData.totalArea.toFixed(0)}), which may slow down zoom animations.`,
          severity: "high",
        });
      } else if (courseData.totalArea > 500000) {
        issues.push({
          type: "Moderate Boundary",
          description: `Course has a large boundary area (${courseData.totalArea.toFixed(0)}), monitor zoom performance.`,
          severity: "medium",
        });
      }

      // High complexity score
      if (courseData.complexityScore > 50) {
        issues.push({
          type: "High Complexity",
          description: `Course has a very high complexity score (${courseData.complexityScore.toFixed(1)}), indicating potential performance issues.`,
          severity: "high",
        });
      } else if (courseData.complexityScore > 25) {
        issues.push({
          type: "Moderate Complexity",
          description: `Course has a high complexity score (${courseData.complexityScore.toFixed(1)}), monitor performance.`,
          severity: "medium",
        });
      }

      // High edge density
      const edgeDensity = courseData.edgeCount / Math.max(courseData.nodeCount, 1);
      if (edgeDensity > 3) {
        issues.push({
          type: "High Edge Density",
          description: `Course has high edge density (${edgeDensity.toFixed(2)}), which may cause network layout issues.`,
          severity: "medium",
        });
      }

      return issues;
    },

    getIssueSeverity(type, count) {
      if (count > 5) return "high";
      if (count > 2) return "medium";
      return "low";
    },

    getIssueColor(severity) {
      switch (severity) {
        case "high":
          return "error";
        case "medium":
          return "warning";
        case "low":
          return "info";
        default:
          return "grey";
      }
    },

    getIssueAlertType(severity) {
      switch (severity) {
        case "high":
          return "error";
        case "medium":
          return "warning";
        case "low":
          return "info";
        default:
          return "info";
      }
    },

    getNodeCountClass(count) {
      if (count > 100) return "text-error font-weight-bold";
      if (count > 50) return "text-warning font-weight-medium";
      return "text-success";
    },

    getEdgeCountClass(count) {
      if (count > 200) return "text-error font-weight-bold";
      if (count > 100) return "text-warning font-weight-medium";
      return "text-success";
    },

    getBoundaryClass(area) {
      if (area > 1000000) return "text-error font-weight-bold";
      if (area > 500000) return "text-warning font-weight-medium";
      return "text-success";
    },

    getComplexityClass(score) {
      if (score > 50) return "text-error font-weight-bold";
      if (score > 25) return "text-warning font-weight-medium";
      return "text-success";
    },

    showCourseDetails(course) {
      this.selectedCourse = course;
      this.showDetailsDialog = true;
    },
  },
};
</script>

<style scoped>
.course-performance-debugger {
  max-width: 1400px;
  margin: 0 auto;
  margin-top: 20px;
  overflow: visible;
}

.analysis-results {
  margin-top: 20px;
  overflow: visible;
}

.node-details {
  max-height: 300px;
  overflow-y: auto;
  /* border: 1px solid #e0e0e0; */
  border-radius: 4px;
  padding: 12px;
  /* background-color: var(--v-surface-base, #f5f5f5); */
}

.node-detail {
  margin: 4px 0;
  font-family: monospace;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 2px;
}

.node-detail:hover {
  background-color: #e3f2fd;
}

.prereq-count {
  color: #666;
  font-style: italic;
}

h3,
h4 {
  margin: 16px 0 8px 0;
  color: #333;
}

.text-error {
  color: #f44336 !important;
}

.text-warning {
  color: #ff9800 !important;
}

.text-success {
  color: #4caf50 !important;
}

.font-weight-bold {
  font-weight: 700 !important;
}

.font-weight-medium {
  font-weight: 500 !important;
}

/* Ensure the data table can scroll properly */
.table-container {
  overflow: visible;
}

.performance-table {
  overflow: visible;
}

.v-data-table {
  overflow: visible !important;
}

.v-data-table__wrapper {
  overflow: visible !important;
}

/* Remove any height constraints that might prevent scrolling */
.v-card {
  overflow: visible;
}

.v-card-text {
  overflow: visible;
}
</style>
