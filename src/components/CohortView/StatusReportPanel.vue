<template>
  <div class="status-report">
    <div class="controls mt-12">
      <v-btn color="galaxyAccent" outlined @click="fetchAiReport" :disabled="loading" class="pa-6">
        <v-icon color="galaxyAccent" class="mr-2" :class="loading ? 'robot-dance' : ''">{{
          mdiRobotExcited
        }}</v-icon>
        {{
          loading
            ? "Generating…"
            : aiReport
              ? "Generate New Status Report"
              : "Generate Status Report"
        }}
      </v-btn>
      <div class="error" v-if="error">{{ error }}</div>
    </div>
    <div v-if="aiReport" class="report-ui mx-4">
      <v-card outlined class="mb-6 pa-4">
        <div>
          <!-- Report title -->
          <div class="d-flex">
            <p class="mb-2 mr-4 overline missionAccent--text font-weight-black report-title">
              Squad Status Report
            </p>
            <p class="overline report-window">{{ formatReportWindow(report.report_window) }}</p>
          </div>
          <!-- Stat widgets -->
          <v-row class="stat-cards mt-2" dense>
            <v-col cols="12" sm="4">
              <v-card outlined class="stat-card accent-mission">
                <div class="stat-label">Overall Squad Progress</div>
                <div class="stat-value">
                  {{ aiReport.squadSummary?.overallProgressPct ?? 0 }}<span class="unit">%</span>
                </div>
                <v-progress-linear
                  :value="aiReport.squadSummary?.overallProgressPct ?? 0"
                  color="missionAccent"
                  height="6"
                  rounded
                  class="mt-1"
                />
              </v-card>
            </v-col>
            <v-col cols="12" sm="4">
              <v-card outlined class="stat-card accent-success">
                <div class="stat-label">Active Navigators</div>
                <div class="stat-value">
                  {{ aiReport.squadSummary?.activeVsInactive?.active ?? 0 }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="4">
              <v-card outlined class="stat-card accent-error">
                <div class="stat-label">Inactive Navigators</div>
                <div class="stat-value">
                  {{ aiReport.squadSummary?.activeVsInactive?.inactive ?? 0 }}
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <div class="headline ma-8 galaxyAccent--text text-center squad-summary">
          "{{ aiReport.squadSummary?.headline }}" <
          <v-icon color="galaxyAccent" small>{{ mdiRobotExcited }}</v-icon>
        </div>

        <v-container fluid class="pa-0 mt-4">
          <v-row>
            <!-- Trends Column Card -->
            <v-col cols="12" md="4">
              <v-card outlined class="mb-4 section-widget h-100">
                <v-card-title class="section-header">
                  <v-icon small class="mr-2" color="primary">📈</v-icon>
                  <span class="section-title overline missionAccent--text">Trends</span>
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col
                      v-for="(trend, i) in aiReport.squadSummary?.trends || []"
                      :key="'trend-' + i"
                      cols="12"
                    >
                      <div class="bullet-item">
                        <v-icon small class="bullet-icon mr-2" color="primary">•</v-icon>
                        <span class="bullet-text">{{ trend }}</span>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Risks Column Card -->
            <v-col cols="12" md="4">
              <v-card outlined class="mb-4 section-widget h-100">
                <v-card-title class="section-header">
                  <v-icon small class="mr-2" color="error">⚠️</v-icon>
                  <span class="section-title overline missionAccent--text">Risks</span>
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col
                      v-for="(risk, i) in aiReport.squadSummary?.risks || []"
                      :key="'risk-' + i"
                      cols="12"
                    >
                      <div class="bullet-item">
                        <v-icon small class="bullet-icon mr-2" color="error">•</v-icon>
                        <span class="bullet-text">{{ risk }}</span>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Recommended Actions Column Card -->
            <v-col cols="12" md="4">
              <v-card outlined class="mb-4 section-widget h-100">
                <v-card-title class="section-header">
                  <v-icon small class="mr-2" color="success">💡</v-icon>
                  <span class="section-title overline missionAccent--text"
                    >Recommended Actions</span
                  >
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col
                      v-for="(action, i) in aiReport.squadSummary?.recommendedActions || []"
                      :key="'action-' + i"
                      cols="12"
                    >
                      <div class="bullet-item">
                        <v-icon small class="bullet-icon mr-2" color="success">•</v-icon>
                        <span class="bullet-text">{{ action }}</span>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>

        <!-- Student Data Iterator -->
        <v-card outlined class="mb-4">
          <v-card-title class="section-header">
            <v-icon small class="mr-2" color="primary" style="font-style: normal">👨‍🚀</v-icon>
            <span class="section-title overline missionAccent--text">Navigator Status</span>
          </v-card-title>
          <v-card-text>
            <!-- Status Filter Chips -->
            <div class="mb-12">
              <v-chip
                v-for="status in availableStatuses"
                :key="status"
                :color="getStatusColor(status)"
                :outlined="selectedStatus !== status"
                class="ma-1"
                @click="toggleStatusFilter(status)"
              >
                {{ displayStatusLabel(status) }}
              </v-chip>
            </div>

            <!-- Student Cards -->
            <v-data-iterator :items="filteredStudents" :items-per-page="9999" hide-default-footer>
              <template v-slot:default="props">
                <v-row>
                  <v-col v-for="student in props.items" :key="student.id" cols="12">
                    <v-card outlined class="student-report-card">
                      <!-- Student Header -->
                      <v-card-title class="student-header pa-3">
                        <StudentCardStatus
                          :student="studentForStatus(student)"
                          :date="now"
                          :status="userStatus ? userStatus[student.id] : null"
                          :size="60"
                          class="student-status"
                        />
                        <v-chip
                          small
                          :color="statusColor(student.status)"
                          text-color="white"
                          class="mt-2"
                        >
                          {{ student.status }}
                        </v-chip>
                      </v-card-title>

                      <!-- Reasons and Interventions Widgets -->
                      <v-card-text class="pt-0">
                        <v-row>
                          <!-- Reasons Widget -->
                          <v-col cols="12" sm="6" v-if="student.reasons?.length">
                            <div class="widget-column">
                              <div class="widget-title">🤔 Reasons</div>
                              <ul class="widget-list">
                                <li v-for="(reason, i) in student.reasons" :key="'reason-' + i">
                                  {{ reason }}
                                </li>
                              </ul>
                            </div>
                          </v-col>

                          <!-- Interventions Widget -->
                          <v-col cols="12" sm="6" v-if="student.suggestedInterventions?.length">
                            <div class="widget-column">
                              <div class="widget-title">🔧 Interventions</div>
                              <ul class="widget-list">
                                <li
                                  v-for="(intervention, i) in student.suggestedInterventions"
                                  :key="'intervention-' + i"
                                >
                                  {{ intervention }}
                                </li>
                              </ul>
                            </div>
                          </v-col>
                        </v-row>
                      </v-card-text>

                      <!-- Course Progress -->
                      <v-card-text class="pt-0">
                        <div v-for="(p, idx) in student.progress || []" :key="idx" class="mb-3">
                          <div class="d-flex align-center mb-1">
                            <v-avatar size="24" class="mr-2">
                              <v-img
                                v-if="getCourseImageUrl(p.courseId)"
                                :src="getCourseImageUrl(p.courseId)"
                                :alt="p.course"
                              />
                              <v-icon v-else small color="missionAccent">school</v-icon>
                            </v-avatar>
                            <div class="course-name truncate flex-grow-1">{{ p.course }}</div>
                            <div class="pct">{{ p.pct }}%</div>
                          </div>
                          <v-progress-linear
                            :value="p.pct"
                            color="missionAccent"
                            height="6"
                            rounded
                            class="mb-1"
                          />
                          <div class="done caption">{{ p.done }}</div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </template>
            </v-data-iterator>
          </v-card-text>
        </v-card>
      </v-card>
    </div>
    <!-- <pre class="json-output" v-else>{{ reportJson }}</pre> -->
  </div>
</template>

<script>
import { buildSquadPacket } from "@/lib/squadPacketBuilder";
import { generateSquadReport } from "@/lib/ff";
import StudentCardStatus from "@/components/CohortView/StudentDataIterator/StudentCard/StudentCardStatus.vue";
import useRootStore from "@/store/index";
import { mapState } from "pinia";
import { mdiRobotExcited } from "@mdi/js";
import { db } from "@/store/firestoreConfig";
import { fetchPersonByPersonId } from "@/lib/ff";

export default {
  name: "StatusReportPanel",
  components: { StudentCardStatus },
  props: {
    cohort: {
      type: Object,
      required: true,
    },
    cohortsCoursesData: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      aiReport: null,
      error: null,
      mdiRobotExcited,
      activeStatusReportId: null,
      unsubscribeStatus: null,
      unsubscribeProcessingQuery: null,
      selectedStatus: null, // null means show all
      studentAvatars: {}, // Cache for student avatars
      courseImages: {}, // Cache for course images
      now: Date.now(),
    };
  },
  computed: {
    ...mapState(useRootStore, ["userStatus"]),
    report() {
      return buildSquadPacket(this.cohortsCoursesData, {
        windowDays: 7,
        nowISO: new Date().toISOString(),
        squadName:
          this.cohort?.name || this.cohort?.title || this.cohort?.cohortName || "Your Squad Name",
      });
    },
    reportJson() {
      try {
        return JSON.stringify(this.report, null, 2);
      } catch (e) {
        return "{}";
      }
    },
    aiReportJson() {
      try {
        return this.aiReport ? JSON.stringify(this.aiReport, null, 2) : "";
      } catch (e) {
        return "";
      }
    },
    availableStatuses() {
      if (!this.aiReport?.students) return [];
      const statuses = [...new Set(this.aiReport.students.map((s) => s.status))];
      const orderIndex = (value) => {
        const v = String(value || "").toLowerCase();
        if (v.includes("risk")) return 0; // at-risk
        if (v.includes("watch") || v.includes("monitor")) return 1; // watch
        if (
          v.includes("ok") ||
          v.includes("healthy") ||
          v.includes("on-track") ||
          v.includes("on track")
        )
          return 2; // on-track
        return 99;
      };
      statuses.sort((a, b) => orderIndex(a) - orderIndex(b));
      return ["All", ...statuses];
    },
    filteredStudents() {
      if (!this.aiReport?.students) return [];
      if (this.selectedStatus === null || this.selectedStatus === "All") {
        return this.aiReport.students;
      }
      return this.aiReport.students.filter((s) => s.status === this.selectedStatus);
    },
    // Counts for each status for chip labels
    statusCounts() {
      const counts = {};
      const students = this.aiReport?.students || [];
      for (const s of students) {
        const status = s.status || "";
        counts[status] = (counts[status] || 0) + 1;
      }
      return counts;
    },
    // Map course images from cohortsCoursesData
    courseImageMap() {
      const imageMap = {};
      this.cohortsCoursesData.forEach((cohortData) => {
        if (cohortData.course?.image?.url) {
          imageMap[cohortData.course.id] = cohortData.course.image.url;
        }
      });
      return imageMap;
    },
    colouredBorder(name) {
      return true
        ? {
            width: this.size + "px",
            height: this.size + "px",
            backgroundColor: this.stringToColour(name),
            border: this.online ? "1px solid var(--v-baseAccent-base)" : "",
          }
        : { width: this.size + "px", height: this.size + "px" };
    },
  },
  watch: {
    cohort: {
      deep: true,
      handler(newCohort, oldCohort) {
        // Clear existing report data when cohort changes
        if (oldCohort && newCohort && oldCohort.id !== newCohort.id) {
          this.aiReport = null;
          this.error = null;
          this.selectedStatus = null;
          this.studentAvatars = {};
        }
        // Re-establish processing listener when cohort changes or becomes available
        this.resumeInProgressSubscription();
      },
    },
    aiReport: {
      handler(newReport) {
        if (newReport?.students) {
          this.loadStudentAvatars();
        }
      },
      immediate: true,
    },
    // Keep UI in sync across navigations if an active doc exists
    activeStatusReportId(newId, oldId) {
      if (oldId && this.unsubscribeStatus) {
        this.unsubscribeStatus();
        this.unsubscribeStatus = null;
      }
      if (newId && this.cohort?.id) {
        const ref = db
          .collection("cohorts")
          .doc(this.cohort.id)
          .collection("statusReports")
          .doc(newId);
        this.unsubscribeStatus = ref.onSnapshot((snap) => {
          if (!snap.exists) return;
          const data = snap.data() || {};
          const status = data.status;
          // Reflect processing state
          this.loading = status === "processing";
          if (status === "completed" && data.report) {
            this.aiReport = data.report;
          }
          if (status === "error") {
            this.error = data.errorMessage || "Failed to generate squad report";
          }
        });
      }
    },
  },
  created() {
    console.log("StatusReportPanel created with cohort: ", this.cohort);
    // On mount, find the most recent in-progress report and subscribe
    const cohortId = this.cohort?.id || this.cohort?.cohortId || null;
    if (!cohortId) return;
    console.log("cohortId: ", cohortId);
    // live subscription for in-progress status
    this.resumeInProgressSubscription();

    console.log("getting latest completed report");
    // Also load the latest completed report to populate UI on load
    db.collection("cohorts")
      .doc(cohortId)
      .collection("statusReports")
      .where("status", "==", "completed")
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get()
      .then((snap) => {
        if (!snap.empty) {
          console.log("got latest completed report with updatedAt");
          const data = snap.docs[0].data() || {};
          if (data.report) {
            this.aiReport = data.report;
          }
        } else {
          console.log("no latest completed report with updatedAt");
        }
      })
      .catch((error) => {
        console.log("Primary query failed:", error);
        // Fallback: order by createdAt if index/order not available
        db.collection("cohorts")
          .doc(cohortId)
          .collection("statusReports")
          .where("status", "==", "completed")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get()
          .then((snap) => {
            if (!snap.empty) {
              console.log("got latest completed report with createdAt");
              const data = snap.docs[0].data() || {};
              if (data.report) {
                this.aiReport = data.report;
              }
            }
          })
          .catch((error) => {
            console.log("Fallback query also failed:", error);
            // Last resort: get all completed reports and sort client-side
            this.getLatestCompletedReportClientSide(cohortId);
          });
      });
  },
  beforeDestroy() {
    if (this.unsubscribeStatus) {
      this.unsubscribeStatus();
      this.unsubscribeStatus = null;
    }
    if (this.unsubscribeProcessingQuery) {
      this.unsubscribeProcessingQuery();
      this.unsubscribeProcessingQuery = null;
    }
  },
  methods: {
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    stringToColour(name) {
      // profile or owner
      let str = name;
      return `hsl(${this.hashCode(str) % 360}, 100%, 35%)`;
    },
    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    },
    resumeInProgressSubscription() {
      const cohortId = this.cohort?.id || this.cohort?.cohortId || null;
      if (!cohortId) return;
      if (this.unsubscribeProcessingQuery) {
        this.unsubscribeProcessingQuery();
        this.unsubscribeProcessingQuery = null;
      }
      const q = db
        .collection("cohorts")
        .doc(cohortId)
        .collection("statusReports")
        .where("status", "==", "processing")
        .limit(1);
      this.unsubscribeProcessingQuery = q.onSnapshot((snap) => {
        if (!snap.empty) {
          const doc = snap.docs[0];
          // trigger subscription to this doc
          this.activeStatusReportId = doc.id;
          this.loading = true;
        } else {
          // no processing report
          this.loading = false;
        }
      });
    },
    async fetchAiReport() {
      this.loading = true;
      this.error = null;
      try {
        const cohortId = this.cohort?.id || this.cohort?.cohortId || null;
        if (!cohortId) {
          throw new Error("Missing cohort id");
        }

        // Guard: if an active processing doc exists, do nothing
        if (this.activeStatusReportId) {
          const activeRef = db
            .collection("cohorts")
            .doc(cohortId)
            .collection("statusReports")
            .doc(this.activeStatusReportId);
          const activeSnap = await activeRef.get();
          if (activeSnap.exists && activeSnap.data()?.status === "processing") {
            this.loading = true;
            return;
          }
        }

        // Pre-create status doc with processing state
        const statusRef = await db
          .collection("cohorts")
          .doc(cohortId)
          .collection("statusReports")
          .add({
            status: "processing",
            createdAt: new Date(),
            updatedAt: new Date(),
            requestSummary: {
              packetHash: btoa(unescape(encodeURIComponent(JSON.stringify(this.report)))).slice(
                0,
                64,
              ),
            },
          });
        this.activeStatusReportId = statusRef.id;

        // Call backend and pass identifiers to allow it to update the doc
        const { report } = await generateSquadReport(this.report, cohortId, statusRef.id);
        this.aiReport = report;
        console.log("aiReport", this.aiReport);
      } catch (e) {
        this.error = e?.message || "Failed to generate squad report";
      } finally {
        this.loading = false;
      }
    },
    formatDate(iso) {
      if (!iso) return "—";
      try {
        const d = new Date(iso);
        return d.toLocaleString();
      } catch (e) {
        return iso;
      }
    },
    formatReportWindow(reportWindow) {
      if (!reportWindow || !reportWindow.start || !reportWindow.end) return "—";
      try {
        const startDate = new Date(reportWindow.start);
        const endDate = new Date(reportWindow.end);

        const formatDate = (date) => {
          const day = date.getDate();
          const month = date.toLocaleString("default", { month: "short" }).toUpperCase();
          const year = date.getFullYear();
          return `${day} ${month} ${year}`;
        };

        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      } catch (e) {
        return `${reportWindow.start} - ${reportWindow.end}`;
      }
    },
    statusColor(status) {
      const s = (status || "").toLowerCase();
      if (s.includes("at-risk") || s.includes("risk")) return "error";
      if (s.includes("ok") || s.includes("healthy")) return "success";
      if (s.includes("watch") || s.includes("monitor")) return "warning";
      return "baseAccent";
    },
    getStatusColor(status) {
      if (status === "All") return "primary";
      return this.statusColor(status);
    },
    toggleStatusFilter(status) {
      if (status === "All") {
        this.selectedStatus = null;
      } else {
        this.selectedStatus = this.selectedStatus === status ? null : status;
      }
    },
    displayStatusLabel(status) {
      if (status === "All") {
        const total = this.aiReport?.students?.length || 0;
        return `${total} All`;
      }
      const count = this.statusCounts[status] || 0;
      return `${count} ${status}`;
    },
    // Fetch student avatar by person ID
    async fetchStudentAvatar(personId) {
      if (this.studentAvatars[personId]) {
        return this.studentAvatars[personId];
      }

      try {
        const person = await fetchPersonByPersonId(personId, this.cohort.id);
        if (person?.image?.url) {
          // Ensure reactivity in Vue 2 when adding new keys to an object
          this.$set(this.studentAvatars, personId, person.image.url);
          return person.image.url;
        }
      } catch (error) {
        console.error(`Error fetching avatar for person ${personId}:`, error);
      }
      return null;
    },
    // Get course image URL by course ID
    getCourseImageUrl(courseId) {
      return this.courseImageMap[courseId] || null;
    },
    // Map AI report student to StudentCardStatus expected structure
    studentForStatus(student) {
      return {
        id: student.id,
        firstName: student.name,
        email: student.email || "",
        image: {
          url: this.studentAvatars[student.id] || null,
        },
      };
    },
    // Load avatars for all students in the report
    async loadStudentAvatars() {
      if (!this.aiReport?.students || !this.cohort?.id) return;

      const avatarPromises = this.aiReport.students.map(async (student) => {
        if (!this.studentAvatars[student.id]) {
          await this.fetchStudentAvatar(student.id);
        }
      });

      await Promise.all(avatarPromises);
    },
    // Last resort: get all completed reports and sort client-side
    async getLatestCompletedReportClientSide(cohortId) {
      try {
        console.log("Trying client-side sort for completed reports");
        const snap = await db
          .collection("cohorts")
          .doc(cohortId)
          .collection("statusReports")
          .where("status", "==", "completed")
          .get();

        if (!snap.empty) {
          // Sort by updatedAt (or createdAt if updatedAt doesn't exist) client-side
          const docs = snap.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(0),
            createdAt: doc.data().createdAt?.toDate() || new Date(0),
          }));

          // Sort by updatedAt first, then createdAt as fallback
          docs.sort((a, b) => {
            const aTime = a.updatedAt.getTime() || a.createdAt.getTime();
            const bTime = b.updatedAt.getTime() || b.createdAt.getTime();
            return bTime - aTime; // Descending order (newest first)
          });

          const latestDoc = docs[0];
          if (latestDoc.data.report) {
            console.log("Got latest completed report via client-side sort");
            this.aiReport = latestDoc.data.report;
          }
        } else {
          console.log("No completed reports found");
        }
      } catch (error) {
        console.log("Client-side sort also failed:", error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.status-report {
  width: 100%;
  min-height: 200px;
  color: var(--v-missionAccent-base);
}

.report-ui {
  border: 1px solid var(--v-missionAccent-base);

  .report-title {
    font-size: 1rem !important;
  }

  .report-window {
    font-style: italic;
  }

  .squad-summary {
    font-size: 1.5rem !important;
    font-style: italic;
    line-height: 1.3;
  }
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.error {
  color: #d32f2f;
}

.placeholder {
  padding: 20px;
}

.json-output {
  padding: 16px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.robot-dance {
  animation: robotDance 2s ease infinite;
  transform-origin: center bottom;
}

@keyframes robotDance {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  12.5% {
    transform: translateY(-2px) rotate(-10deg);
  }
  25% {
    transform: translateY(0) rotate(0deg);
  }
  37.5% {
    transform: translateY(-2px) rotate(10deg);
  }
  50% {
    transform: translateY(0) rotate(0deg);
  }
  62.5% {
    transform: translateY(-2px) rotate(-10deg);
  }
  75% {
    transform: translateY(0) rotate(0deg);
  }
  87.5% {
    transform: translateY(-2px) rotate(10deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}

// Dashboard stat cards
.stat-cards {
  .stat-card {
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(122, 122, 122, 0.15);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 84px;
  }

  .stat-label {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.8;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 900;
    line-height: 1;
  }

  .unit {
    font-size: 14px;
    margin-left: 2px;
    opacity: 0.8;
  }

  .accent-mission {
    border-left: 4px solid var(--v-missionAccent-base);
    color: var(--v-missionAccent-base);
  }
  .accent-success {
    border-left: 4px solid var(--v-success-base);
    color: var(--v-success-base);
  }
  .accent-error {
    border-left: 4px solid var(--v-error-base);
    color: var(--v-error-base);
  }
}

// Section widgets
.section-widget {
  .section-header {
    padding: 16px 20px 8px 20px;
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-header .v-icon {
    font-style: normal !important;
  }

  .bullet-item {
    display: flex;
    align-items: flex-start;
    padding: 8px 0;
    min-height: 40px;
  }

  .bullet-icon {
    margin-top: 2px;
    flex-shrink: 0;
  }

  .bullet-text {
    line-height: 1.4;
    font-size: 14px;
  }
}

// Student report cards
.student-report-card {
  height: 100%;

  .student-header {
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .student-status {
      width: 100%;
    }
  }

  .student-info {
    flex-grow: 1;
  }

  .student-name {
    font-weight: 600;
    font-size: 16px;
    line-height: 1.2;
  }

  .last-active {
    font-size: 12px;
    opacity: 0.7;
    margin-top: 2px;
  }

  .course-name {
    font-weight: 500;
    font-size: 14px;
  }

  .pct {
    font-weight: 600;
    font-size: 14px;
    color: var(--v-missionAccent-base);
  }

  .done {
    font-size: 12px;
    opacity: 0.7;
  }

  .widget-column {
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    padding: 12px;
    height: 100%;
  }

  .widget-title {
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
  }

  .widget-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      font-size: 13px;
      line-height: 1.4;
      padding: 4px 0;
      position: relative;
      padding-left: 16px;

      &::before {
        content: "•";
        color: var(--v-missionAccent-base);
        font-weight: bold;
        position: absolute;
        left: 0;
      }
    }
  }
}
</style>
