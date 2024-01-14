import { type DocumentData } from "firebase-admin/firestore";
import { log } from "firebase-functions/logger";
import { schedule } from "firebase-functions/v1/pubsub";
import { db } from "./_shared.js";
import { sendStudentInActive, sendTeacherStudentInActive } from "./emails.js";

// ====== SCHEDULE CHECK FOR INACTIVITY  ==================
export const checkInactivitySchedule = schedule("0 8 * * *")
  .timeZone("Pacific/Auckland")
  .onRun(() => {
    return checkInactivity();
  });

/**
 * Get date `preDays` ago
 */
function getPreviousDate(preDays: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - preDays).toDateString();
}

/**
 * Get person doc
 */
async function getPersonByIdFromDB(personId: string) {
  const personDoc = await db.collection("people").doc(personId).get();

  const person: DocumentData = {
    ...personDoc.data(),
    id: personDoc.id,
  };

  return person;
}

/**
 * Get list of cohort names and teacher id
 */
async function getPersonsTeachersById(personId: string) {
  const cohortsSnapshot = await db
    .collection("cohorts")
    .where("students", "array-contains", personId)
    .get();

  const teachers: DocumentData[] = [];

  for (const doc of cohortsSnapshot.docs) {
    const cohort = doc.data();
    for (const teacherId of cohort.teachers) {
      const profile = {
        cohort: cohort.name,
        id: teacherId,
      };
      teachers.push(profile);
    }
  }

  return teachers;
}

/**
 * Check for student inactivity
 */
async function checkInactivity() {
  log("checking activity");

  const oneWeek = getPreviousDate(7);
  const twoWeeks = getPreviousDate(14);

  log("1 week ago: ", oneWeek);
  log("2 weeks ago: ", twoWeeks);

  const statusSnapshot = await db.collection("status").get();

  const userStatuses: { [id: string]: DocumentData } = {};
  for (const doc of statusSnapshot.docs) {
    userStatuses[doc.id] = {
      ...doc.data(),
      id: doc.id,
    };
  }

  const userOfflineStatuses: DocumentData[] = [];
  for (const user in userStatuses) {
    if (userStatuses[user].state === "offline") {
      userOfflineStatuses.push(userStatuses[user]);
    }
  }

  const inActiveOneWeek: DocumentData[] = [];
  const inActiveTwoWeeks: DocumentData[] = [];

  for (const userStatus of userOfflineStatuses) {
    const date = userStatus.last_changed.toDate().toDateString();
    if (date === oneWeek) inActiveOneWeek.push(userStatus);
    if (date === twoWeeks) inActiveTwoWeeks.push(userStatus);
  }

  if (inActiveOneWeek.length) {
    for (const userStatus of inActiveOneWeek) {
      const person = await getPersonByIdFromDB(userStatus.id);
      const teachers = await getPersonsTeachersById(userStatus.id);

      const student = person.firstName + " " + person.lastName;
      const studentEmail = person.email;
      const duration = "one week";

      log("send one week in active email to student :", person.email);
      sendStudentInActive(student, studentEmail, duration);

      const teacherProfiles = await Promise.all(
        teachers.map(async (teacher): Promise<DocumentData> => {
          const fullProfile = await getPersonByIdFromDB(teacher.id);
          return {
            ...fullProfile,
            cohort: teacher.cohort,
          };
        }),
      );

      for (const profile of teacherProfiles) {
        const { email, cohort } = profile;
        const teacher = profile.firstName + " " + profile.lastName;
        sendTeacherStudentInActive(student, studentEmail, duration, email, cohort, teacher);
      }
    }
  }

  if (inActiveTwoWeeks.length) {
    for (const userStatus of inActiveTwoWeeks) {
      const person = await getPersonByIdFromDB(userStatus.id);
      const teachers = await getPersonsTeachersById(userStatus.id);

      const student = person.firstName + " " + person.lastName;
      const studentEmail = person.email;
      const duration = "two weeks";

      log("send two weeks in active email to student :", person.email);
      sendStudentInActive(student, studentEmail, duration);

      const teacherProfiles = await Promise.all(
        teachers.map(async (teacher): Promise<DocumentData> => {
          const fullProfile = await getPersonByIdFromDB(teacher.id);
          return {
            ...fullProfile,
            cohort: teacher.cohort,
          };
        }),
      );

      for (const profile of teacherProfiles) {
        const { email, cohort } = profile;
        const teacher = profile.firstName + " " + profile.lastName;
        sendTeacherStudentInActive(student, studentEmail, duration, email, cohort, teacher);
      }
    }
  }
}
