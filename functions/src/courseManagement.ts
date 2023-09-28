import * as functions from "firebase-functions";
import { firestore } from "./_shared.js";
import { startGalaxyXAPIStatement } from "./veracityLRS.js";

// Get a course by id
export const getCourseByIdHttpsEndpoint = functions.https.onCall(async (data, context) => {
  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing courseId");
  }

  const courseDoc = await firestore.collection("courses").doc(data.courseId).get();
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

  const studentQuerySnapShot = await firestore
    .collection("cohorts")
    .where("students", "array-contains", context.auth.uid)
    .get();
  const teacherQuerySnapShot = await firestore
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
    const querySnapshot = await firestore
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
    return courses;
  }

  // if the context is authenticated and they are admin, return all courses
  if (context.auth.token.admin === true) {
    const querySnapshot = await firestore.collection("courses").get();

    const courses = [];
    for (const doc of querySnapshot.docs) {
      const course = doc.data();
      courses.push({
        id: doc.id,
        ...course,
      });
    }
    return courses;
  }

  // if the context is authenticated and they are not admin, return all courses
  // where they are the owner or where they belong to a cohort for the course as
  // a teacher or as a student
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacherCohorts: Record<string, any>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentCohorts: Record<string, any>[] = [];

  const studentQuerySnapShot = await firestore
    .collection("cohorts")
    .where("students", "array-contains", context.auth.uid)
    .get();
  const teacherQuerySnapShot = await firestore
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
    courseIds.map((x) => firestore.collection("courses").doc(x).get()),
  );

  const querySnapshot = await firestore
    .collection("courses")
    .where("owner", "==", firestore.collection("people").doc(context.auth.uid))
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
  return courses;
});

// ====== ASSIGN TOPICS AND TASKS ==================
export const assignTopicsAndTasksToMeHttpsEndpoint = functions.https.onCall(
  (data: { courseId: string }, context) => {
    if (context.auth == null) {
      return { error: "Must be authenticated to access this endpoint" };
    }
    const { courseId } = data;
    const personId = context.auth.uid;
    return assignTopicsAndTasksToStudent(personId, courseId);
  },
);

export const assignTopicsAndTasksToStudentHttpsEndpoint = functions.https.onCall(
  (data: { personId: string; courseId: string }, context) => {
    if (context.auth == null) {
      return { error: "Must be authenticated to access this endpoint" };
    }
    // TODO: add permissions checks to see if current authenticated user has permission to
    // add topics and tasks to the specified personId
    const { personId, courseId } = data;
    return assignTopicsAndTasksToStudent(personId, courseId);
  },
);

/**
 * Add this galaxy metadata (eg. topics) to this persons course database
 */
async function assignTopicsAndTasksToStudent(personId: string, courseId: string) {
  // Load person and course from their IDs
  const [personSnapshot, courseSnapshot] = await Promise.all([
    firestore.collection("people").doc(personId).get(),
    firestore.collection("courses").doc(courseId).get(),
  ]);
  const person = personSnapshot.data();
  const course = courseSnapshot.data();

  if (person == null) {
    return { error: `Person not found: ${personId}` };
  }

  if (course == null) {
    return { error: `Course not found: ${courseId}` };
  }

  // 1) get topics in this course
  const querySnapshot = await firestore
    .collection("courses")
    .doc(course.id)
    .collection("topics")
    .orderBy("topicCreatedTimestamp")
    .get();

  // 2) add them to person (this will store their TOPIC progression data for this course )
  for (const [_, doc] of querySnapshot.docs.entries()) {
    const topic = doc.data();
    await firestore
      .collection("people")
      .doc(person.id)
      .collection(course.id)
      .doc(topic.id)
      .set({
        ...topic,
        // set the status of topics to locked unless they are introduction nodes
        topicStatus: topic.group == "introduction" ? "introduction" : "locked",
      });

    // 3) check if this topic has tasks
    const subquerySnapshot = await firestore
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
        await firestore
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
  // Send Galaxy Started statment to LRS
  startGalaxyXAPIStatement(person, { galaxy: course });

  return { message: "Completed" };
}
