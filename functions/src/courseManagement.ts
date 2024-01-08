import adminFirestore from "firebase-admin/firestore";
import * as functions from "firebase-functions";
import { db } from "./_shared.js";
import { startGalaxyXAPIStatement } from "./veracityLRS.js";

// Get a course by id
export const getCourseByIdHttpsEndpoint = functions.https.onCall(async (data, context) => {
  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing courseId");
  }

  const courseDoc = await db.collection("courses").doc(courseId).get();
  const courseData = courseDoc.data();

  if (!courseDoc.exists || courseData == null) {
    throw new functions.https.HttpsError("not-found", "course not found");
  }

  // if the context is unauthenticated, only return course that is public and
  // has a published status
  if (context.auth == null) {
    if (courseData.public === true && courseData.status === "published") {
      return {
        course: {
          id: courseDoc.id,
          ...courseData,
        },
      };
    } else {
      throw new functions.https.HttpsError("not-found", "course not found");
    }
  }

  // if the context is authenticated and they are admin, return course
  if (context.auth.token.admin === true) {
    return {
      course: {
        id: courseDoc.id,
        ...courseData,
      },
    };
  }

  // if the context is authenticated and they are not admin, return all courses
  // where they are the owner or where they belong to a cohort for the course as
  // a teacher or as a student
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacherCohorts: Record<string, any>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentCohorts: Record<string, any>[] = [];

  const studentQuerySnapShot = await db
    .collection("cohorts")
    .where("students", "array-contains", context.auth.uid)
    .get();
  const teacherQuerySnapShot = await db
    .collection("cohorts")
    .where("teachers", "array-contains", context.auth.uid)
    .get();

  for (const cohort of studentQuerySnapShot.docs) {
    studentCohorts.push({
      id: cohort.id,
      student: true,
      ...cohort.data(),
    });
  }
  for (const cohort of teacherQuerySnapShot.docs) {
    teacherCohorts.push({
      id: cohort.id,
      teacher: true,
      ...cohort.data(),
    });
  }

  const courseIds = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...studentCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...teacherCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
  ];

  if (!courseIds.includes(courseDoc.id)) {
    throw new functions.https.HttpsError("not-found", "course not found");
  }

  return {
    course: {
      id: courseDoc.id,
      ...courseData,
    },
  };
});

// Get a list of courses
export const getCoursesHttpsEndpoint = functions.https.onCall(async (_data, context) => {
  // if the context is unauthenticated, only return courses that are public and
  // have a published status
  if (context.auth == null) {
    const querySnapshot = await db
      .collection("courses")
      .where("public", "==", true)
      .where("status", "==", "published")
      .get();

    const courses = [];
    for (const doc of querySnapshot.docs) {
      const course = doc.data();
      courses.push({
        id: doc.id,
        ...course,
      });
    }
    return { courses };
  }

  // if the context is authenticated and they are admin, return all courses
  if (context.auth.token.admin === true) {
    const querySnapshot = await db.collection("courses").get();

    const courses = [];
    for (const doc of querySnapshot.docs) {
      const course = doc.data();
      courses.push({
        id: doc.id,
        ...course,
      });
    }
    return { courses };
  }

  // if the context is authenticated and they are not admin, return all courses
  // where they are the owner or where they belong to a cohort for the course as
  // a teacher or as a student
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacherCohorts: Record<string, any>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentCohorts: Record<string, any>[] = [];

  const studentQuerySnapShot = await db
    .collection("cohorts")
    .where("students", "array-contains", context.auth.uid)
    .get();
  const teacherQuerySnapShot = await db
    .collection("cohorts")
    .where("teachers", "array-contains", context.auth.uid)
    .get();

  for (const cohort of studentQuerySnapShot.docs) {
    studentCohorts.push({
      id: cohort.id,
      student: true,
      ...cohort.data(),
    });
  }
  for (const cohort of teacherQuerySnapShot.docs) {
    teacherCohorts.push({
      id: cohort.id,
      teacher: true,
      ...cohort.data(),
    });
  }

  const courseIds = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...studentCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...teacherCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
  ];

  const courseDocumentSnapshots = await Promise.all(
    courseIds.map((x) => db.collection("courses").doc(x).get()),
  );

  const querySnapshot = await db
    .collection("courses")
    .where("owner", "==", db.collection("people").doc(context.auth.uid))
    .get();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courses: Record<string, any>[] = [];

  for (const doc of courseDocumentSnapshots) {
    const course = doc.data();
    courses.push({
      id: doc.id,
      ...course,
    });
  }

  for (const doc of querySnapshot.docs) {
    const course = doc.data();
    courses.push({
      id: doc.id,
      ...course,
    });
  }
  return { courses };
});

// ====== ASSIGN PERSON TO COHORT ==================
export const addMeToCohortHttpsEndpoint = functions.https.onCall(
  async (data: { cohortId: string }, context) => {
    const cohortId = data.cohortId as string | null;
    if (cohortId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing cohortId");
    }

    if (context.auth == null) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to access this endpoint",
      );
    }

    const personId = context.auth.uid;

    const result = await addStudentToCohort(cohortId, personId);

    return result;
  },
);

export const addStudentToCohortHttpsEndpoint = functions.https.onCall(async (data, context) => {
  const personId = data.personId as string | null;
  const cohortId = data.cohortId as string | null;
  if (personId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing personId");
  }
  if (cohortId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing cohortId");
  }

  if (context.auth == null) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to access this endpoint",
    );
  }
  // TODO: add permissions checks to see if current authenticated user has permission to
  // add the specified personId to the specified cohortId

  const result = await addStudentToCohort(cohortId, personId);

  return result;
});

/**
 * Add person to cohort
 */
async function addStudentToCohort(cohortId: string, personId: string) {
  // Load person and course from their IDs
  const [cohortDoc, personDoc] = await Promise.all([
    db.collection("cohorts").doc(cohortId).get(),
    db.collection("people").doc(personId).get(),
  ]);
  const cohort = cohortDoc.data();
  const person = personDoc.data();

  if (cohort == null) {
    throw new functions.https.HttpsError("not-found", `Cohort not found: ${cohortId}`);
  }
  if (person == null) {
    throw new functions.https.HttpsError("not-found", `Person not found: ${personId}`);
  }

  await cohortDoc.ref.update({
    students: adminFirestore.FieldValue.arrayUnion(personId),
  });

  const updatedCohortDoc = await cohortDoc.ref.get();

  return {
    cohort: {
      id: updatedCohortDoc.id,
      ...updatedCohortDoc.data(),
    },
  };
}

// ====== ASSIGN PERSON TO COURSE ==================
export const assignCourseToMeHttpsEndpoint = functions.https.onCall(
  async (data: { courseId: string }, context) => {
    const courseId = data.courseId as string | null;
    if (courseId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing courseId");
    }

    if (context.auth == null) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to access this endpoint",
      );
    }

    const personId = context.auth.uid;

    const result = await assignCourseToStudent(courseId, personId);

    return result;
  },
);

export const assignCourseToStudentHttpsEndpoint = functions.https.onCall(async (data, context) => {
  const personId = data.personId as string | null;
  const courseId = data.courseId as string | null;
  if (personId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing personId");
  }
  if (courseId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing courseId");
  }

  if (context.auth == null) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to access this endpoint",
    );
  }
  // TODO: add permissions checks to see if current authenticated user has permission to
  // add the specified personId to the specified courseId

  const result = await assignCourseToStudent(courseId, personId);

  return result;
});

/**
 * Add person to course
 */
async function assignCourseToStudent(courseId: string, personId: string) {
  // Load person and course from their IDs
  const [personDoc, courseDoc] = await Promise.all([
    db.collection("people").doc(personId).get(),
    db.collection("courses").doc(courseId).get(),
  ]);
  const person = personDoc.data();
  const course = courseDoc.data();

  if (person == null) {
    throw new functions.https.HttpsError("not-found", `Person not found: ${personId}`);
  }
  if (course == null) {
    throw new functions.https.HttpsError("not-found", `Course not found: ${courseId}`);
  }

  // Add the topics and tasks to the student

  // 1) get topics in this course
  const querySnapshot = await db
    .collection("courses")
    .doc(course.id)
    .collection("topics")
    .orderBy("topicCreatedTimestamp")
    .get();

  // 2) add them to person (this will store their TOPIC progression data for this course )
  for (const [_, doc] of querySnapshot.docs.entries()) {
    const topic = doc.data();

    // calculate topic status
    let topicStatus: string;
    if (topic.group === "introduction") {
      // is the topic part of the introduction group? if so make it unlocked
      topicStatus = "unlocked";
    } else if ((topic.prerequisites?.length ?? 0) === 0) {
      // does this topic have prereqs? if not make it unlocked
      topicStatus = "unlocked";
    } else {
      // default to locked
      topicStatus = "locked";
    }

    await db
      .collection("people")
      .doc(person.id)
      .collection(course.id)
      .doc(topic.id)
      .set({
        ...topic,
        topicStatus,
      });

    // 3) check if this topic has tasks
    const subquerySnapshot = await db
      .collection("courses")
      .doc(course.id)
      .collection("topics")
      .doc(topic.id)
      .collection("tasks")
      // order by timestamp is important otherwise index == 0 (in the next step)
      // wont necessarily be the first mission
      .orderBy("taskCreatedTimestamp")
      .get();

    // 4) if tasks exist. add them to person
    for (const [index, subDoc] of subquerySnapshot.docs.entries()) {
      const task = subDoc.data();

      if (subDoc.exists) {
        await db
          .collection("people")
          .doc(person.id)
          .collection(course.id)
          .doc(topic.id)
          .collection("tasks")
          .doc(task.id)
          .set({
            ...task,
            // set the status of topics to locked unless they are the first mission (index == 0)
            taskStatus: index == 0 ? "unlocked" : "locked",
          });
      }
    }
  }

  await personDoc.ref.update({
    assignedCourses: adminFirestore.FieldValue.arrayUnion(courseId),
  });

  // Send Galaxy Started statment to LRS
  startGalaxyXAPIStatement(
    {
      id: personDoc.id,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
    },
    {
      galaxy: {
        id: courseDoc.id,
        title: course.title,
      },
    },
  );

  const updatedPersonDoc = await personDoc.ref.get();

  return {
    cohort: {
      id: updatedPersonDoc.id,
      ...updatedPersonDoc.data(),
    },
  };
}
