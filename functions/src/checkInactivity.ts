import admin from "firebase-admin";
import * as functions from "firebase-functions";
import { firestore } from "./_shared.js";
import { sendStudentInActive, sendTeacherStudentInActive } from "./emails.js";

// ====== SCHEDULE CHECK FOR INACTIVITY  ==================
export const checkInactivitySchedule = functions.pubsub
  .schedule("0 8 * * *")
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
  const personSnapshot = await firestore.collection("people").doc(personId).get();

  const person: admin.firestore.DocumentData = {
    id: personSnapshot.id,
    ...personSnapshot.data(),
  };

  return person;
}

/**
 * Get list of cohort names and teacher id
 */
async function getPersonsTeachersById(personId: string) {
  const cohortsSnapshot = await firestore
    .collection("cohorts")
    .where("students", "array-contains", personId)
    .get();

  const teachers: admin.firestore.DocumentData[] = [];

  for (const doc of cohortsSnapshot.docs) {
    const cohort = doc.data();
    for (const teacherId of cohort.teachers) {
      const profile = {
        id: teacherId,
        cohort: cohort.name,
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
  functions.logger.log("checking activity");

  const oneWeek = getPreviousDate(7);
  const twoWeeks = getPreviousDate(14);

  functions.logger.log("1 week ago: ", oneWeek);
  functions.logger.log("2 weeks ago: ", twoWeeks);

  const statusSnapshot = await firestore.collection("status").get();

  const userStatuses: { [id: string]: admin.firestore.DocumentData } = {};
  for (const doc of statusSnapshot.docs) {
    userStatuses[doc.id] = {
      id: doc.id,
      ...doc.data(),
    };
  }

  const userOfflineStatuses: admin.firestore.DocumentData[] = [];
  for (const user in userStatuses) {
    if (userStatuses[user].state === "offline") {
      userOfflineStatuses.push(userStatuses[user]);
    }
  }

  const inActiveOneWeek: admin.firestore.DocumentData[] = [];
  const inActiveTwoWeeks: admin.firestore.DocumentData[] = [];

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

      functions.logger.log("send one week in active email to student :", person.email);
      sendStudentInActive(student, studentEmail, duration);

      const teacherProfiles = await Promise.all(
        teachers.map(async (teacher): Promise<admin.firestore.DocumentData> => {
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

      functions.logger.log("send two weeks in active email to student :", person.email);
      sendStudentInActive(student, studentEmail, duration);

      const teacherProfiles = await Promise.all(
        teachers.map(async (teacher): Promise<admin.firestore.DocumentData> => {
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
