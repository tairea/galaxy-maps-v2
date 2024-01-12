import * as adminFirestore from "firebase-admin/firestore";
import * as functions from "firebase-functions";
import { db, requireAuthenticated } from "./_shared.js";
import { startGalaxyXAPIStatement } from "./veracityLRS.js";

// Get a course by courseId
export const getCourseByCourseIdHttpsEndpoint = functions.https.onCall(async (data, context) => {
  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing courseId");
  }

  const courseDoc = await db.collection("courses").doc(courseId).get();
  const courseData = courseDoc.data();

  if (courseData == null) {
    throw new functions.https.HttpsError("not-found", `Course not found: ${courseId}`);
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
      throw new functions.https.HttpsError("not-found", `Course not found: ${courseId}`);
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
    throw new functions.https.HttpsError("not-found", `Course not found: ${courseId}`);
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

// Get cohort by cohortId
export const getCohortByCohortIdHttpsEndpoint = functions.https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const cohortId = data.cohortId as string | null;
  if (cohortId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing cohortId");
  }

  const cohortDoc = await db.collection("cohorts").doc(cohortId).get();
  const cohortData = cohortDoc.data();

  if (cohortData == null) {
    throw new functions.https.HttpsError("not-found", `Cohort not found: ${cohortId}`);
  }

  // TODO: permissions checks

  return {
    cohort: {
      id: cohortDoc.id,
      ...cohortData,
    },
  };
});

// Get cohorts by personId
export const getCohortsByPersonIdHttpsEndpoint = functions.https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  if (personId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing personId");
  }

  // TODO: permissions checks

  const cohortCollection = await db
    .collection("cohorts")
    .where("students", "array-contains", personId)
    .get();

  const cohorts = [];
  for (const doc of cohortCollection.docs) {
    const cohort = doc.data();
    cohorts.push({
      id: doc.id,
      ...cohort,
    });
  }

  return { cohorts };
});

// Get all cohorts in course by courseId
export const getCohortsByCourseIdHttpsEndpoint = functions.https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing courseId");
  }

  // TODO: permissions checks

  const cohortCollection = await db
    .collection("cohorts")
    .where("courses", "array-contains", courseId)
    .get();

  const cohorts = [];
  for (const doc of cohortCollection.docs) {
    const cohort = doc.data();
    cohorts.push({
      id: doc.id,
      ...cohort,
    });
  }

  return { cohorts };
});

// Get topic by courseId and topicId
export const getTopicByCourseIdTopicIdHttpsEndpoint = functions.https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    if (courseId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing topicId");
    }

    const topicDoc = await db
      .collection("courses")
      .doc(courseId)
      .collection("topics")
      .doc(topicId)
      .get();
    const topicData = topicDoc.data();

    if (topicData == null) {
      throw new functions.https.HttpsError("not-found", `Topic not found: ${topicId}`);
    }

    // TODO: permissions checks

    return {
      topic: {
        id: topicDoc.id,
        ...topicData,
      },
    };
  },
);

// Get task by courseId and topicId and taskId
export const getTaskByCourseIdTopicIdTaskIdHttpsEndpoint = functions.https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    const taskId = data.taskId as string | null;
    if (courseId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing topicId");
    }
    if (taskId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing taskId");
    }

    const taskDoc = await db
      .collection("courses")
      .doc(courseId)
      .collection("topics")
      .doc(topicId)
      .collection("tasks")
      .doc(taskId)
      .get();
    const taskData = taskDoc.data();

    if (taskData == null) {
      throw new functions.https.HttpsError("not-found", `Task not found: ${taskId}`);
    }

    // TODO: permissions checks

    return {
      task: {
        id: taskDoc.id,
        ...taskData,
      },
    };
  },
);

// Get person topic by personId and courseId and topicId
export const getPersonTopicByPersonIdCourseIdTopicIdHttpsEndpoint = functions.https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const personId = data.personId as string | null;
    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    if (personId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing personId");
    }
    if (courseId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing topicId");
    }

    // TODO: permissions checks

    const personTopicDoc = await db
      .collection("people")
      .doc(personId)
      .collection(courseId)
      .doc(topicId)
      .get();

    const personTopic = personTopicDoc.data();

    return {
      personTopic: {
        id: personTopicDoc.id,
        ...personTopic,
      },
    };
  },
);

// Get person tasks by personId and courseId and topicId
export const getPersonTasksByPersonIdCourseIdTopicIdHttpsEndpoint = functions.https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const personId = data.personId as string | null;
    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    if (personId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing personId");
    }
    if (courseId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing topicId");
    }

    // TODO: permissions checks

    const personTaskCollection = await db
      .collection("people")
      .doc(personId)
      .collection(courseId)
      .doc(topicId)
      .collection("tasks")
      .get();

    const personTasks = [];
    for (const doc of personTaskCollection.docs) {
      const personTask = doc.data();
      personTasks.push({
        id: doc.id,
        ...personTask,
      });
    }

    return { personTasks };
  },
);

// Get all people in course by courseId
export const getPeopleByCourseIdHttpsEndpoint = functions.https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing courseId");
  }

  // TODO: permissions checks

  const querySnapshot = await db
    .collection("people")
    .where("assignedCourses", "array-contains", courseId)
    .get();

  const people = [];
  for (const doc of querySnapshot.docs) {
    const person = doc.data();
    people.push({
      id: doc.id,
      ...person,
    });
  }

  return { people };
});

// ====== ASSIGN PERSON TO COHORT ==================
export const addMeToCohortHttpsEndpoint = functions.https.onCall(
  async (data: { cohortId: string }, context) => {
    requireAuthenticated(context);

    const cohortId = data.cohortId as string | null;
    if (cohortId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing cohortId");
    }

    const personId = context.auth.uid;

    const result = await addStudentToCohort(cohortId, personId);

    return result;
  },
);

export const addStudentToCohortHttpsEndpoint = functions.https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  const cohortId = data.cohortId as string | null;
  if (personId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing personId");
  }
  if (cohortId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing cohortId");
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
    requireAuthenticated(context);

    const courseId = data.courseId as string | null;
    if (courseId == null) {
      throw new functions.https.HttpsError("invalid-argument", "missing courseId");
    }

    const personId = context.auth.uid;

    const result = await assignCourseToStudent(courseId, personId);

    return result;
  },
);

export const assignCourseToStudentHttpsEndpoint = functions.https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  const courseId = data.courseId as string | null;
  if (personId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing personId");
  }
  if (courseId == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing courseId");
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
    person: {
      id: updatedPersonDoc.id,
      ...updatedPersonDoc.data(),
    },
  };
}
