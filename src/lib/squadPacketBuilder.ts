// buildSquadPacket.ts

type Activity = {
  timeStamp: string;
  index: number;
  status: "Started" | "Completed";
  type: "Task" | "Topic" | "Course";
  title: string;
  id?: string | null;
};

type RawCourseBlock = {
  course: {
    id: string;
    title: string;
    topicTotal?: number;
    taskTotal?: number;
  };
  students: Array<{
    activities: Activity[];
    topicCompletedCount?: number;
    taskCompletedCount?: number;
    person: {
      firstName?: string;
      lastName?: string;
      xpPointsTotal?: number;
      id: string;
      assignedCourses?: string[];
    };
  }>;
};

type CourseMeta = { id: string; title: string; topicTotal: number; taskTotal: number };

export function buildSquadPacket(
  raw: RawCourseBlock[],
  options?: {
    windowDays?: number; // activity window for velocity
    nowISO?: string; // packet creation time
    squadName?: string;
    timezone?: string; // for metadata only
  },
) {
  const windowDays = options?.windowDays ?? 30;
  const now = options?.nowISO ? new Date(options.nowISO) : new Date();
  const timezone = options?.timezone ?? "Pacific/Rarotonga";
  const reportEndISO = isoDateOnly(now);
  const reportStart = new Date(+now - windowDays * 24 * 3600 * 1000);
  const reportStartISO = isoDateOnly(reportStart);

  // 1) Collect course metadata
  const courses: CourseMeta[] = [];
  const courseIndex = new Map<string, CourseMeta>(); // id -> meta

  for (const block of raw) {
    const c = block.course;
    const topicTotal = numberOrZero(c.topicTotal);
    // Ensure taskTotal is always present (0 if missing)
    const taskTotal = numberOrZero(c.taskTotal);
    const meta: CourseMeta = {
      id: c.id,
      title: c.title,
      topicTotal,
      taskTotal,
    };
    courses.push(meta);
    courseIndex.set(c.id, meta);
  }

  // 2) Aggregate per student across courses
  const studentMap = new Map<
    string,
    {
      id: string;
      name: string;
      xp: number;
      assignedCourses: string[];
      perCourse: any[];
      _allLastActiveISO?: string | null;
      _avgPctAcc: number[];
    }
  >();

  for (const block of raw) {
    const cmeta = courseIndex.get(block.course.id)!;

    for (const s of block.students) {
      const pid = s.person.id;
      if (!studentMap.has(pid)) {
        studentMap.set(pid, {
          id: pid,
          name: `${s.person.firstName ?? ""} ${s.person.lastName ?? ""}`.trim(),
          xp: numberOrZero(s.person.xpPointsTotal),
          assignedCourses: s.person.assignedCourses ?? [],
          perCourse: [],
          _allLastActiveISO: null,
          _avgPctAcc: [],
        });
      }
      const entry = studentMap.get(pid)!;

      const acts = (s.activities ?? [])
        .slice()
        .sort((a, b) => Date.parse(b.timeStamp) - Date.parse(a.timeStamp));

      const summary = summarizePerCourse({
        courseId: cmeta.id,
        courseTitle: cmeta.title,
        topicTotal: cmeta.topicTotal,
        taskTotal: cmeta.taskTotal,
        activities: acts,
        topicsDone: numberOrZero(s.topicCompletedCount),
        tasksDone: numberOrZero(s.taskCompletedCount),
        windowStart: reportStart,
        now,
      });

      entry.perCourse.push(summary);

      // Track lastActiveOverall (max per course)
      const la = summary.velocity.lastActive;
      if (la) {
        if (!entry._allLastActiveISO || Date.parse(la) > Date.parse(entry._allLastActiveISO)) {
          entry._allLastActiveISO = la;
        }
      }

      // Track average pct across courses present
      entry._avgPctAcc.push(summary.progress.pct);
    }
  }

  // Finalize students
  const students = Array.from(studentMap.values()).map((s) => {
    const avgPct = s._avgPctAcc.length
      ? round2(s._avgPctAcc.reduce((a, b) => a + b, 0) / s._avgPctAcc.length)
      : 0;
    return {
      id: s.id,
      name: s.name,
      xp: s.xp,
      assignedCourses: s.assignedCourses,
      avgPct, // 0..1
      avgPct100: Math.round(avgPct * 100),
      lastActiveOverall: s._allLastActiveISO ?? null,
      perCourse: s.perCourse,
    };
  });

  // 3) Cohort KPIs
  const cohortKPIs = computeCohortKPIs(students);

  return {
    report_window: {
      start: reportStartISO,
      end: reportEndISO,
      timezone,
      ageBaseline: "now", // clarifies ageDays baseline
    },
    squad: options?.squadName ?? "Your Squad Name",
    courses,
    students,
    cohortKPIs,
  };
}

// ---- helpers ---------------------------------------------------------------

function summarizePerCourse(args: {
  courseId: string;
  courseTitle: string;
  topicTotal: number;
  taskTotal: number;
  activities: Activity[];
  topicsDone: number;
  tasksDone: number;
  windowStart: Date;
  now: Date;
}) {
  const {
    courseId,
    courseTitle,
    topicTotal,
    taskTotal,
    activities,
    topicsDone,
    tasksDone,
    windowStart,
    now,
  } = args;

  // Velocity window
  const recent = activities.filter((a) => Date.parse(a.timeStamp) >= +windowStart);
  const completed = recent.filter((a) => a.status === "Completed").length;
  const started = recent.filter((a) => a.status === "Started").length;
  const daysActive = uniqueDates(recent).size;

  const lastActive = activities[0]?.timeStamp ?? null;

  // Streak logic:
  // - streakAtLastActive: consecutive days ending at lastActive
  // - streakCurrent: equals streakAtLastActive only if lastActive is "today" (same local date as now)
  const streakAtLastActive = calcStreakEndingAt(activities, lastActive);
  const streakCurrent = isSameLocalDate(lastActive, now) ? streakAtLastActive : 0;

  // Blockers: items that are Started with no later Completed for same identity
  // Use stable key: courseId|type|idx
  const blockers = detectBlockers(activities, now, 3 /*cap*/).map((b) => ({
    key: `${courseId}|${b.type}|${b.index}`,
    type: b.type,
    title: b.title,
    index: b.index,
    status: "Started" as const,
    ageDays: b.ageDays,
  }));

  // Progress
  const pct = safePct(topicsDone, topicTotal, tasksDone, taskTotal); // 0..1
  const pct100 = Math.round(pct * 100);

  // Cap recent to 3
  const recentCapped = activities.slice(0, 3).map((a) => ({
    t: a.timeStamp,
    type: a.type,
    status: a.status,
    title: a.title,
    idx: a.index,
  }));

  return {
    courseId,
    courseTitle,
    progress: {
      topicsDone,
      tasksDone,
      topicTotal,
      taskTotal,
      pct: round2(pct),
      pct100,
    },
    velocity: {
      events: recent.length,
      completed,
      started,
      daysActive,
      streakDaysCurrent: streakCurrent,
      streakDaysAtLastActive: streakAtLastActive,
      lastActive,
    },
    blockers,
    recent: recentCapped,
  };
}

function detectBlockers(activities: Activity[], now: Date, cap: number) {
  // Keep the *latest* Started for each identity key, and remove it if any later Completed occurs
  // Identity = type|index (title can vary, index is stable in your data)
  const startedByKey = new Map<string, Activity>();
  const completedKeys = new Set<string>();

  for (const a of activities) {
    const key = `${a.type}|${a.index}`;
    if (a.status === "Started") {
      // keep only the most recent Started per key
      if (
        !startedByKey.has(key) ||
        Date.parse(a.timeStamp) > Date.parse(startedByKey.get(key)!.timeStamp)
      ) {
        startedByKey.set(key, a);
      }
    } else if (a.status === "Completed") {
      completedKeys.add(key);
    }
  }

  // Remove any Started that also has Completed
  for (const key of completedKeys) startedByKey.delete(key);

  // Convert to blocker objects sorted by oldest first (largest age)
  const blockers = Array.from(startedByKey.values()).map((s) => ({
    type: s.type,
    title: s.title,
    index: s.index,
    ageDays: ageInDays(s.timeStamp, now),
  }));

  blockers.sort((a, b) => b.ageDays - a.ageDays);
  return blockers.slice(0, cap);
}

function calcStreakEndingAt(activities: Activity[], lastActiveISO: string | null) {
  if (!activities.length || !lastActiveISO) return 0;
  // Use unique local dates from all activities, then count backward from lastActive date
  const dates = Array.from(uniqueDates(activities)).sort(); // asc
  const last = dateOnly(lastActiveISO);
  let streak = 0;

  // Walk backward from the end
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i];
    if (d === last && streak === 0) {
      streak = 1;
      continue;
    }
    if (streak > 0) {
      // expect previous day
      const expected = shiftDate(last, -streak); // last - (streak) days
      if (d === expected) streak++;
      else break;
    }
  }
  return streak;
}

function computeCohortKPIs(students: Array<{ avgPct: number; lastActiveOverall: string | null }>) {
  let active = 0,
    inactive = 0;
  const percs: number[] = [];
  const atRisk: Array<{ studentId: string; reason: string }> = [];

  for (const s of students as any[]) {
    percs.push(s.avgPct ?? 0);

    if (s.lastActiveOverall) active++;
    else inactive++;

    // Example risk heuristics (optional, simple baseline):
    // - inactive
    // - very low avg progress
    if (!s.lastActiveOverall) {
      atRisk.push({ studentId: s.id, reason: "No recorded activity in window." });
    } else if ((s.avgPct ?? 0) < 0.2) {
      atRisk.push({ studentId: s.id, reason: "Low overall progress (<20%)." });
    }
  }

  const overall = percs.length ? round2(percs.reduce((a, b) => a + b, 0) / percs.length) : 0;

  return {
    activeStudents: active,
    inactiveStudents: inactive,
    avgProgressPct: overall, // 0..1
    avgProgressPct100: Math.round(overall * 100),
    atRisk,
  };
}

// ---- small utils -----------------------------------------------------------

function numberOrZero(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function isoDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dateOnly(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function shiftDate(isoYYYYMMDD: string, deltaDays: number) {
  const d = new Date(isoYYYYMMDD + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function ageInDays(timeStampISO: string, now: Date) {
  const diff = +now - Date.parse(timeStampISO);
  return Math.floor(diff / (24 * 3600 * 1000));
}

function uniqueDates(acts: Activity[]) {
  const set = new Set<string>();
  for (const a of acts) set.add(dateOnly(a.timeStamp));
  return set;
}

function isSameLocalDate(iso: string | null, now: Date) {
  if (!iso) return false;
  // Compare date-only in UTC (simple + consistent; adjust if you need true local-time comparison)
  return dateOnly(iso) === isoDateOnly(now);
}

function safePct(td: number, tt: number, kd: number, kt: number) {
  const topicPct = tt > 0 ? td / tt : 0;
  const taskPct = kt > 0 ? kd / kt : tt > 0 ? topicPct : 0; // if no tasks exist, weight topics
  // simple average (or you can weight by totals)
  return (topicPct + taskPct) / 2;
}
