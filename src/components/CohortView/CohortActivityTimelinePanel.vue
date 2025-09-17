<template>
  <div class="cohort-activity-panel" @mouseenter="emitFocus(true)" @mouseleave="emitFocus(false)">
    <div class="panel-header">
      <span class="overline header-title">Squad Timeline</span>
      <div v-if="coursesForFilter.length" class="course-chips-inline">
        <v-chip
          v-for="c in coursesForFilter"
          :key="c.id"
          x-small
          :outlined="isCourseHidden(c.id)"
          color="missionAccent"
          class="mr-2 course-chip"
          :class="{ dimmed: isCourseHidden(c.id) }"
          @click="toggleCourse(c.id)"
          clickable
        >
          <v-avatar left>
            <img :src="c.image || '/avatar_placeholder.png'" alt="" />
          </v-avatar>
          <span class="overline chip-label">{{ c.title }}</span>
        </v-chip>
      </div>
      <v-spacer></v-spacer>
      <!-- <v-btn
        v-if="selectedCourseId"
        small
        outlined
        color="missionAccent"
        class="ml-3"
        @click="$emit('clearCourseFilter')"
      >
        Show all courses
      </v-btn> -->
      <v-btn icon small color="missionAccent" class="ml-2" @click="$emit('close')">
        <v-icon small>{{ mdiClose }}</v-icon>
      </v-btn>
    </div>
    <div ref="timeline" class="timeline-container"></div>
  </div>
</template>

<script>
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import { mdiClose } from "@mdi/js";

export default {
  name: "CohortActivityTimelinePanel",
  props: {
    activityData: { type: Array, default: () => [] },
    height: { type: Number, default: 260 },
    selectedCourseId: { type: String, default: null },
  },
  data() {
    return {
      mdiClose,
      timeline: null,
      items: null,
      groups: null,
      hiddenCourses: [],
    };
  },
  mounted() {
    this.items = new DataSet([]);
    this.groups = new DataSet([]);
    this.timeline = new Timeline(
      this.$refs.timeline,
      this.items,
      this.groups,
      this.timelineOptions,
    );
    this.rebuildTimeline();
    this.updateTimelineHeight();
    window.addEventListener("resize", this.updateTimelineHeight, { passive: true });
    // console.log kept minimal to avoid noisy devtools messages
    console.log("timeline mounted. course activity data:", this.activityData);
  },
  beforeDestroy() {
    if (this.timeline) this.timeline.destroy();
    window.removeEventListener("resize", this.updateTimelineHeight);
  },
  computed: {
    timelineOptions() {
      return {
        height: this.height - 36, // will be overridden by updateTimelineHeight()
        stack: true,
        showCurrentTime: true,
        orientation: "top",
        zoomMin: 1000 * 60 * 10, // 10 minutes
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 5, // 5 years
        selectable: true,
        dataAttributes: ["data-status", "data-type"],
        stackSubgroups: true,
        margin: { item: 1, axis: 12 },
        format: {
          minorLabels: {
            day: "D - ddd",
            weekday: "D - ddd",
            hour: "HH:mm",
            month: "MMM", // show 3-letter month only
          },
          // suppress major labels (year) to keep axis compact
          majorLabels: {
            day: "",
            month: "",
            year: "",
          },
        },
        // subgroup stacking uses lexicographic order of subgroup keys;
        // we prefix subgroups with a zero-padded ordinal computed per student
        groupTemplate: (group) => {
          const wrap = document.createElement("div");
          wrap.className = "gm-group-label";
          // avatar image
          if (group.avatar) {
            const img = document.createElement("img");
            img.src = group.avatar;
            img.alt = "";
            img.setAttribute("data-avatar", "true");
            img.style.width = "18px";
            img.style.height = "18px";
            img.style.borderRadius = "50%";
            img.style.objectFit = "cover";
            img.style.verticalAlign = "middle";
            img.style.marginRight = "6px";
            wrap.appendChild(img);
          }
          const span = document.createElement("span");
          span.textContent = group.labelText || group.content || "";
          wrap.appendChild(span);
          if (group.type === "student") {
            wrap.classList.add("student-label");
          } else if (group.type === "course") {
            wrap.classList.add("course-label", "overline");
          } else if (group.type === "task") {
            wrap.classList.add("task-label");
          } else if (group.type === "taskRow") {
            wrap.classList.add("task-row-label");
            if (group.accent) wrap.style.color = group.accent;
          }
          return wrap;
        },
      };
    },
    coursesForFilter() {
      try {
        const arr = [];
        const seen = new Set();
        for (const entry of this.activityData || []) {
          const c = entry?.course;
          if (!c?.id || seen.has(c.id)) continue;
          seen.add(c.id);
          arr.push({
            id: c.id,
            title: c.title || c.name || c.id,
            image: c?.image?.url || c?.image || null,
          });
        }
        return arr.sort((a, b) => a.title.localeCompare(b.title));
      } catch (e) {
        return [];
      }
    },
  },
  watch: {
    activityData: {
      handler() {
        this.rebuildTimeline();
      },
      deep: true,
    },
    height() {
      if (!this.timeline) return;
      this.timeline.setOptions({ height: this.height - 36 });
    },
    hiddenCourses: {
      handler() {
        this.rebuildTimeline();
      },
      deep: true,
    },
  },
  methods: {
    emitFocus(val) {
      this.$emit("panelFocus", !!val);
    },
    isCourseHidden(id) {
      return this.hiddenCourses.includes(id);
    },
    toggleCourse(id) {
      const i = this.hiddenCourses.indexOf(id);
      if (i >= 0) this.hiddenCourses.splice(i, 1);
      else this.hiddenCourses.push(id);
    },
    _makeTopicContent(avatarUrl, labelText) {
      try {
        const wrap = document.createElement("span");
        wrap.className = "topic-item overline";
        const img = document.createElement("img");
        img.src = avatarUrl || "/avatar_placeholder.png";
        img.alt = "";
        img.className = "topic-avatar";
        const p = document.createElement("p");
        p.className = "topic-item-label";
        p.textContent = String(labelText || "");
        wrap.appendChild(img);
        wrap.appendChild(p);
        return wrap;
      } catch (_) {
        const fallback = document.createElement("span");
        fallback.textContent = String(labelText || "");
        return fallback;
      }
    },
    _makeTaskContent(title) {
      const span = document.createElement("span");
      span.className = "task-item overline";
      span.textContent = String(title || "Task");
      return span;
    },
    getCourseColors(courseId) {
      // Deterministic HSL color based on courseId
      let hash = 0;
      for (let i = 0; i < String(courseId).length; i++)
        hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
      const hue = hash % 360;
      const border = `hsl(${hue}, 70%, 55%)`;
      const bg = `hsla(${hue}, 80%, 55%, 0.5)`;
      return { border, bg };
    },
    updateTimelineHeight() {
      try {
        const h = Math.max(160, (this.$el?.clientHeight || this.height) - 36);
        this.timeline?.setOptions({ height: h });
      } catch (_) {}
    },
    rebuildTimeline() {
      if (!this.timeline) return;
      const { groups, items } = this.buildStudentTopicTaskData(this.activityData || []);

      this.groups.clear();
      this.items.clear();
      if (groups.length) this.groups.add(groups);
      if (items.length) this.items.add(items);

      // Fit to first and last item timestamps for this dataset
      try {
        const now = new Date();
        const year = now.getFullYear();
        const min = new Date(year, 0, 1, 0, 0, 0, 0);
        const max = new Date(year, 11, 31, 23, 59, 59, 999);
        this.timeline.setOptions({ min, max });
        this.timeline.setWindow(min, max, { animation: false });
      } catch (_) {}
    },
    buildStudentTopicTaskData(activityData) {
      const groups = [];
      const items = [];
      const groupIds = new Set();
      // Prepass: compute earliest start per student+subgroup label, then map to ascending ordinals
      const earliestMap = new Map(); // key: `${studentGroupId}::${subgroupLabel}` -> earliest ts
      try {
        for (const entry of activityData || []) {
          const course = entry?.course;
          if (!course?.id || this.isCourseHidden(course.id)) continue;
          const students = entry?.students || [];
          for (const student of students) {
            const person = student?.person || {};
            const personId = person.id || person.email || person.displayName || Math.random();
            const studentGroupId = `stu:${personId}`;
            // build topic ranges for this student's acts
            const topicRanges = new Map();
            const acts = Array.isArray(student.activities) ? student.activities : [];
            for (const a of acts) {
              const t = a?.timeStamp ? new Date(a.timeStamp) : null;
              if (!t || isNaN(t.getTime())) continue;
              const status = (a.status || "").toLowerCase();
              const type = (a.type || "").toLowerCase();
              const title = a.title || "";
              if (type !== "topic") continue;
              const rec = topicRanges.get(title) || { start: null, end: null, title };
              if (status === "started")
                rec.start = rec.start ? new Date(Math.min(+rec.start, +t)) : t;
              else if (status === "completed")
                rec.end = rec.end ? new Date(Math.max(+rec.end, +t)) : t;
              topicRanges.set(title, rec);
            }
            for (const [topicKey, rec] of topicRanges) {
              if (!rec.start) continue;
              const tt = rec.title || topicKey || "Topic";
              const subgroupLabel = `${course.title || course.name || course.id} • ${tt}`;
              const key = `${studentGroupId}::${subgroupLabel}`;
              const ts = +rec.start;
              const cur = earliestMap.get(key);
              earliestMap.set(key, cur == null ? ts : Math.min(cur, ts));
            }
          }
        }
      } catch (_) {}
      // Build ordinal index per student from earliestMap
      const ordinalMap = new Map(); // key: `${studentGroupId}::${subgroupLabel}` -> zero-padded index
      try {
        const buckets = new Map(); // studentGroupId -> Array<{label, ts}>
        for (const [composite, ts] of earliestMap) {
          const [studentGroupId, label] = composite.split("::");
          const arr = buckets.get(studentGroupId) || [];
          arr.push({ label, ts });
          buckets.set(studentGroupId, arr);
        }
        for (const [studentGroupId, arr] of buckets) {
          arr.sort((a, b) => a.ts - b.ts);
          const pad = String(arr.length).length < 2 ? 2 : String(arr.length).length;
          arr.forEach((e, idx) => {
            const ord = String(idx + 1).padStart(pad, "0");
            ordinalMap.set(`${studentGroupId}::${e.label}`, ord);
          });
        }
      } catch (_) {}

      const ensureGroup = (id, labelText, parentId = null, opts = {}) => {
        if (groupIds.has(id)) return;
        const g = {
          id,
          content: labelText,
          labelText,
          showNested: false,
          type: opts.type || undefined,
          avatar: opts.avatar || undefined,
          ...opts,
        };
        // For student rows, define how subgroups are ordered and stacked.
        // This makes topic rows stack in a stable, ascending order using
        // the numeric `subgroupOrder` set on each item.
        if (opts.type === "student") {
          g.subgroupOrder = "subgroupOrder";
          g.subgroupStack = true;
        }
        groups.push(g);
        groupIds.add(id);
        if (parentId) {
          const parent = groups.find((x) => x.id === parentId);
          if (parent) {
            parent.nestedGroups = parent.nestedGroups || [];
            if (!parent.nestedGroups.includes(id)) parent.nestedGroups.push(id);
          }
        }
      };

      for (const courseEntry of activityData) {
        const course = courseEntry?.course;
        if (!course?.id) continue;
        if (this.isCourseHidden(course.id)) continue;

        const students = courseEntry?.students || [];
        for (const student of students) {
          const person = student?.person || {};
          const personId = person.id || person.email || person.displayName || Math.random();
          const studentName =
            person.displayName ||
            person.name ||
            [person.firstName, person.lastName].filter(Boolean).join(" ") ||
            person.email ||
            personId;

          // Level 1 student group
          const studentGroupId = `stu:${personId}`;
          // Student label with avatar (if available), else placeholder
          const studentAvatar = person?.image?.url || person?.image || "/avatar_placeholder.png";
          ensureGroup(studentGroupId, studentName, null, {
            type: "student",
            avatar: studentAvatar || undefined,
          });

          // No course-level rows anymore; everything renders inside the student row
          const courseImg = course?.image?.url || course?.image || "";
          const courseTitle = course.title || course.name || course.id;

          // Ranges
          const topicRanges = new Map(); // key: topic title
          const taskRanges = new Map(); // key: task id or title
          const completedTaskDots = [];

          const acts = Array.isArray(student.activities) ? student.activities : [];
          for (const a of acts) {
            const t = a?.timeStamp ? new Date(a.timeStamp) : null;
            if (!t || isNaN(t.getTime())) continue;
            const status = (a.status || "").toLowerCase();
            const type = (a.type || "").toLowerCase();
            const title = a.title || "";
            const keyTask = a.id || title;
            const keyTopic = title;

            if (type === "task") {
              const rec = taskRanges.get(keyTask) || { start: null, end: null, title };
              if (status === "started")
                rec.start = rec.start ? new Date(Math.min(+rec.start, +t)) : t;
              else if (status === "completed") {
                rec.end = rec.end ? new Date(Math.max(+rec.end, +t)) : t;
                completedTaskDots.push({ when: t, title });
              }
              taskRanges.set(keyTask, rec);
            } else if (type === "topic") {
              const rec = topicRanges.get(keyTopic) || { start: null, end: null, title };
              if (status === "started")
                rec.start = rec.start ? new Date(Math.min(+rec.start, +t)) : t;
              else if (status === "completed")
                rec.end = rec.end ? new Date(Math.max(+rec.end, +t)) : t;
              topicRanges.set(keyTopic, rec);
            }
          }

          // Topics visible as compact ranges with content: avatar + "{course} | {topic}"
          for (const [topicKey, rec] of topicRanges) {
            const tt = rec.title || topicKey || "Topic";
            const start = rec.start;
            let end = rec.end;
            if (start && !end) end = new Date(+start + 60 * 60 * 1000);
            if (!start) continue;
            const colors = this.getCourseColors(course.id);
            const label = `${tt}`;
            const avatar = courseImg || "/avatar_placeholder.png";
            const content = this._makeTopicContent(avatar, label);
            const subgroupLabel = `${course.title || course.name || course.id} • ${tt}`;
            const ord = ordinalMap.get(`${studentGroupId}::${subgroupLabel}`) ?? "99";
            const subgroup = `${ord}::${subgroupLabel}`;
            items.push({
              id: `${studentGroupId}:topic:${course.id}:${tt}:${+start}`,
              content,
              start,
              end,
              group: studentGroupId,
              title: label,
              className: "item-topic item-topic-range overline",
              subgroup,
              // numeric order used by vis-timeline to keep stacks stable.
              // Use negative to flip to ascending visual order top-to-bottom.
              subgroupOrder: -parseInt(ord, 10),
              style: `border:1px solid ${colors.border};background-color:${colors.bg}; border-radius:2px;`,
            });
          }

          // Level 2 (nested groups under student): each task has its own row with the task title in the left label
          for (const [, rec] of taskRanges) {
            if (!rec.start || !rec.end) continue; // only ranges
            const taskTitle = rec.title || "Task";
            const taskGroupId = `${studentGroupId}:taskRow:${course.id}:${taskTitle}`;
            const taskColors = this.getCourseColors(course.id);
            ensureGroup(taskGroupId, taskTitle, studentGroupId, {
              type: "taskRow",
              accent: taskColors.border,
            });
            const content = this._makeTaskContent(taskTitle);
            items.push({
              id: `${taskGroupId}:task:${+rec.start}`,
              content,
              start: rec.start,
              end: rec.end,
              group: taskGroupId,
              title: taskTitle,
              className: "item-task item-task-range overline",
              subgroup: `task-range`,
              style: `border:1px solid ${taskColors.border};background-color: color-mix(in srgb, ${taskColors.border} 30%, transparent); color: var(--v-background-base); border-radius:2px;`,
            });
          }

          // If topic has any active (uncompleted) task, we conceptually extend to now
          // (No visible topic range; connector-open already shows active state.)
        }
      }

      return { groups, items };
    },
    buildDataSets(activityData) {
      const groups = [];
      const items = [];

      // activityData: [ { course, students: [ { person, activities: [ { timeStamp, status, type, title } ] } ] } ]
      for (const courseEntry of activityData) {
        const course = courseEntry?.course;
        if (!course?.id) continue;

        groups.push({ id: course.id, content: course.title || course.name || course.id });

        const students = courseEntry?.students || [];
        for (const student of students) {
          const person = student?.person || {};
          const personName =
            person.displayName ||
            person.name ||
            [person.firstName, person.lastName].filter(Boolean).join(" ") ||
            person.email ||
            person.id ||
            "Unknown";

          for (const act of student.activities || []) {
            if (!act?.timeStamp) continue;
            const when = new Date(act.timeStamp);
            if (isNaN(when.getTime())) continue;

            const status = act.status || "";
            const type = act.type || "";
            const title = act.title || "";

            items.push({
              id: `${course.id}-${person.id || personName}-${act.index || when.getTime()}`,
              content: `<span class="tl-item ${status.toLowerCase()} ${type.toLowerCase()}"><b>${this.escapeHtml(
                personName,
              )}</b> ${this.escapeHtml(status)} ${this.escapeHtml(type)}: ${this.escapeHtml(title)}</span>`,
              start: when,
              group: course.id,
              title: `${personName} ${status} ${type}: ${title}`,
              className: `status-${status.toLowerCase()} type-${type.toLowerCase()}`,
              "data-status": status,
              "data-type": type,
              type: "point",
            });
          }
        }
      }

      return { groups, items };
    },
    escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },
  },
};
</script>

<style lang="scss" scoped>
.cohort-activity-panel {
  border-top: 1px solid var(--v-missionAccent-base);
  border-bottom: none;

  background: var(--v-background-base);
  // backdrop-filter: blur(3px);
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 6px 10px 10px 10px;
}

.panel-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--v-missionAccent-base);
}

.panel-header .header-title {
  flex: 0 0 auto;
}

.course-chips-inline {
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

.panel-header .hint {
  font-size: 0.7rem;
  opacity: 0.7;
}

.course-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 6px 6px 0 6px;
}
.course-chip {
  display: inline-flex;
  align-items: center;
  border-color: var(--v-missionAccent-base) !important;
  font-size: 0.7rem;
}
.course-chip.dimmed {
  opacity: 0.25;
}
.course-chip-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 6px;
}

.chip-label {
  display: inline-block;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeline-container {
  width: 100%;
  height: calc(100% - 24px);
}

/* Light coloring based on status/type */
::v-deep .vis-item .tl-item {
  color: var(--v-missionAccent-base);
}

::v-deep .vis-item.status-completed {
  border-color: var(--v-baseAccent-base);
}

::v-deep .vis-item.status-started {
  border-color: var(--v-missionAccent-base);
}

/* Hide labels until hover for other items only (topic/task ranges stay visible) */
::v-deep .vis-item:not(.item-topic):not(.item-task) .vis-item-content {
  opacity: 0;
  transition: opacity 120ms ease-in-out;
  pointer-events: none;
}
::v-deep .vis-item:not(.item-topic):not(.item-task):hover .vis-item-content {
  opacity: 1;
}

/* Make points compact */
::v-deep .vis-item.vis-point .vis-dot {
  width: 6px;
  height: 6px;
  border-width: 2px;
}

/* Axis/grid and borders: subtle grey/opaque white */
::v-deep .vis-time-axis .vis-text {
  color: var(--v-missionAccent-base);
  font-size: 0.8rem !important;
}
::v-deep .vis-time-axis .vis-grid,
::v-deep .vis-panel {
  border-color: rgba(255, 255, 255, 0.25) !important;
}
::v-deep .vis-grid.vis-vertical,
::v-deep .vis-grid.vis-horizontal {
  border-color: rgba(255, 255, 255, 0.12) !important;
}
::v-deep .vis-timeline {
  background: transparent;
  border: none;
}

::v-deep .vis-label {
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* Group label styles */
::v-deep .vis-label .vis-inner {
  color: var(--v-missionAccent-base); /* all labels */
  padding-left: 0 !important;
}
::v-deep .label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
/* Ensure avatar sizing even if class attributes are stripped by sanitizer */
::v-deep .label-avatar,
::v-deep .vis-label .vis-inner img[data-avatar="true"] {
  width: 25px !important;
  height: 25px !important;
  border-radius: 50% !important;
  object-fit: cover !important;
  margin-right: 6px;
  display: inline-block;
}

/* Ensure our groupTemplate container inherits the right color */
::v-deep .gm-group-label.student-label {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  font-size: 12px;
}
::v-deep .gm-group-label.course-label {
  color: var(--v-missionAccent-base);
}
::v-deep .gm-group-label.task-label {
  color: var(--v-missionAccent-base);
}
::v-deep .student-label {
  color: var(--v-missionAccent-base);
}
::v-deep .course-label {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

/* Task label color handled by .task dot styling above */

/* Show item content also when selected (click) */
::v-deep .vis-item.vis-selected .vis-item-content {
  opacity: 1;
}

/* Reduce level-1 indentation and remove label backgrounds */
::v-deep .vis-label.vis-nested-group {
  background-color: transparent !important;
}
::v-deep .vis-label.vis-nested-group.vis-group-level-0 {
  background-color: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}
::v-deep .vis-label.vis-nested-group.vis-group-level-1 {
  background-color: transparent !important;
}
::v-deep .vis-ltr .vis-label.vis-nested-group.vis-group-level-1 .vis-inner {
  padding-left: 8px !important;
}

/* Truncate overly long labels */
::v-deep .gm-group-label {
  max-width: 260px;
  display: inline-flex;
  align-items: center;
  overflow: hidden;
}
::v-deep .gm-group-label span {
  display: inline-block;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

::v-deep .task-row-label {
  font-size: 0.7rem;
}

/* Topic bars: visible compact range with our inline colors */
::v-deep .vis-item.item-topic {
  height: 24px !important;
  border-width: 1px !important;
  border-style: solid !important;
  background: transparent !important;
  z-index: 3 !important;
}
/* removed point styling (no longer used) */
/* (unused) connector styles removed */

/* Make subgroups compact but allow label */
::v-deep .vis-subgroup {
  min-height: 28px !important;
}
::v-deep .vis-item {
  line-height: 22px !important;
}

::v-deep .item-topic-range .overline {
  padding: 0px;
  line-height: normal;
}

::v-deep .topic-label,
::v-deep .topic-item {
  color: var(--v-missionAccent-base);
  font-size: 12px;
  padding: 0px;
}
::v-deep .vis-item.item-task .task-item {
  color: var(--v-background-base);
  font-size: 12px;
  padding: 0px;
}
::v-deep .topic-item-label {
  display: inline;
  margin: 0;
  padding: 0;
  line-height: inherit;
}

::v-deep .task-item.overline {
  padding: 0px;
  line-height: normal;
  color: var(--v-missionAccent-base) !important;
}

::v-deep .topic-avatar {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 6px;
}

/* Ensure topic labels are visible (we previously hid item content by default) */
::v-deep .vis-item.item-topic .vis-item-content,
::v-deep .vis-item.item-task .vis-item-content {
  opacity: 1 !important;
  pointer-events: auto;
  position: relative !important;
  top: 0 !important;
  transform: none !important;
  display: block !important;
  padding: 0 8px !important;
  line-height: 22px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* Give task ranges a readable height */
::v-deep .vis-item.item-task {
  height: 22px !important;
}
</style>
