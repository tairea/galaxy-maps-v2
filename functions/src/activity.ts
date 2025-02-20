import { runWith } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { DateTime } from "luxon";
import { requireAuthenticated } from "./_shared.js";
import {
  VERACITY_LRS_SECRET,
  getCohortCoursesDataXAPIQuery,
  getCohortStudentsTimeDataXAPIQuery,
  getStudentActivityLogXAPIQuery,
  getStudentCoursesDataXAPIQuery,
  getStudentCoursesTimeDataXAPIQuery,
} from "./veracityLRS.js";

// Get student activity log by personId
export const getStudentActivityLogByPersonIdHttpsEndpoint = runWith({
  secrets: [VERACITY_LRS_SECRET],
}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }

  // TODO: permissions checks

  const activityData = await getStudentActivityLogXAPIQuery(personId);

  return { activityData };
});

// Get student courses activity by personId
export const getStudentCoursesActivityByPersonIdHttpsEndpoint = runWith({
  secrets: [VERACITY_LRS_SECRET],
}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }

  // TODO: permissions checks

  const activityData = await getStudentCoursesDataXAPIQuery(personId);

  return { activityData };
});

// Get cohort courses activity by cohortId
export const getCohortCoursesActivityByCohortIdHttpsEndpoint = runWith({
  secrets: [VERACITY_LRS_SECRET],
}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const cohortId = data.cohortId as string | null;
  if (cohortId == null) {
    throw new HttpsError("invalid-argument", "missing cohortId");
  }

  // TODO: permissions checks

  const activityData = await getCohortCoursesDataXAPIQuery(cohortId);

  console.log("Cohort courses activity data:", activityData);

  return { activityData };
});

// Get cohort students activity time by cohortId
export const getCohortStudentsActivityTimeByCohortIdHttpsEndpoint = runWith({
  secrets: [VERACITY_LRS_SECRET],
}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const cohortId = data.cohortId as string | null;
  if (cohortId == null) {
    throw new HttpsError("invalid-argument", "missing cohortId");
  }

  // TODO: permissions checks

  const activityData = await getCohortStudentsTimeDataXAPIQuery(cohortId);

  return { activityData };
});

// Get student courses time data by personId
export const getStudentCoursesTimeDataByPersonIdStartAtEndAtHttpsEndpoint = runWith({
  secrets: [VERACITY_LRS_SECRET],
}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  const startAt = data.startAt as string | null;
  const endAt = data.endAt as string | null;
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }
  if (startAt == null) {
    throw new HttpsError("invalid-argument", "missing startAt");
  }
  if (endAt == null) {
    throw new HttpsError("invalid-argument", "missing endAt");
  }

  // Check that startAt and endAt are valid dates
  const startAtDateTime = DateTime.fromISO(startAt);
  const endAtDateTime = DateTime.fromISO(endAt);
  if (!startAtDateTime.isValid) {
    throw new HttpsError(
      "invalid-argument",
      `invalid startAt: ${startAtDateTime.invalidExplanation}`,
    );
  }
  if (!endAtDateTime.isValid) {
    throw new HttpsError("invalid-argument", `invalid endAt: ${endAtDateTime.invalidExplanation}`);
  }

  // TODO: permissions checks

  const activityData = await getStudentCoursesTimeDataXAPIQuery(personId, startAt, endAt);

  return { activityData };
});
