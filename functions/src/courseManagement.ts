import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { runWith } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { db, requireAuthenticated } from "./_shared.js";
import {
  VERACITY_LRS_SECRET,
  getCohortsCourseDataXAPIQuery,
  startGalaxyXAPIStatement,
} from "./veracityLRS.js";

// Get a course by courseId
export const getCourseByCourseIdHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new HttpsError("invalid-argument", "missing courseId");
  }

  const courseDoc = await db.collection("courses").doc(courseId).get();
  const courseData = courseDoc.data();

  if (courseData == null) {
    throw new HttpsError("not-found", `Course not found: ${courseId}`);
  }

  // if the context is unauthenticated, only return course that is public and
  // has a published status
  if (context.auth == null) {
    if (courseData.public === true && courseData.status === "published") {
      return {
        course: {
          ...courseData,
          owner:
            courseData.owner instanceof DocumentReference
              ? courseData.owner.path
              : courseData.owner,
          id: courseDoc.id,
        },
      };
    } else {
      throw new HttpsError("not-found", `Course not found: ${courseId}`);
    }
  }

  // if the context is authenticated and they are admin, return course
  if (context.auth.token.admin === true) {
    return {
      course: {
        ...courseData,
        owner:
          courseData.owner instanceof DocumentReference ? courseData.owner.path : courseData.owner,
        id: courseDoc.id,
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
      ...cohort.data(),
      id: cohort.id,
    });
  }
  for (const cohort of teacherQuerySnapShot.docs) {
    teacherCohorts.push({
      ...cohort.data(),
      id: cohort.id,
    });
  }

  const courseIds = Array.from(
    new Set([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...studentCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...teacherCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
    ]),
  );

  if (!courseIds.includes(courseDoc.id)) {
    throw new HttpsError("not-found", `Course not found: ${courseId}`);
  }

  return {
    course: {
      ...courseData,
      owner:
        courseData.owner instanceof DocumentReference ? courseData.owner.path : courseData.owner,
      id: courseDoc.id,
    },
  };
});

// Get a list of courses
export const getCoursesHttpsEndpoint = runWith({}).https.onCall(async (_data, context) => {
  // if the context is unauthenticated, only return courses that are public and
  // have a published status
  if (context.auth == null) {
    const courseCollection = await db
      .collection("courses")
      .where("public", "==", true)
      .where("status", "==", "published")
      .get();

    const courseMap = new Map();
    for (const doc of courseCollection.docs) {
      const course = doc.data();
      courseMap.set(doc.id, {
        ...course,
        owner: course.owner instanceof DocumentReference ? course.owner.path : course.owner,
        id: doc.id,
      });
    }
    return { courses: Array.from(courseMap.values()) };
  }

  // if the context is authenticated and they are admin, return all courses
  if (context.auth.token.admin === true) {
    const courseCollection = await db.collection("courses").get();

    const courseMap = new Map();
    for (const doc of courseCollection.docs) {
      const course = doc.data();
      courseMap.set(doc.id, {
        ...course,
        owner: course.owner instanceof DocumentReference ? course.owner.path : course.owner,
        id: doc.id,
      });
    }
    return { courses: Array.from(courseMap.values()) };
  }

  // if the context is authenticated and they are not admin, return all courses
  // where they are the owner or where they belong to a cohort for the course as
  // a teacher or as a student
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacherCohorts: Record<string, any>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentCohorts: Record<string, any>[] = [];

  const studentCohortCollection = await db
    .collection("cohorts")
    .where("students", "array-contains", context.auth.uid)
    .get();
  const teacherCohortCollection = await db
    .collection("cohorts")
    .where("teachers", "array-contains", context.auth.uid)
    .get();

  for (const cohort of studentCohortCollection.docs) {
    studentCohorts.push({
      ...cohort.data(),
      id: cohort.id,
    });
  }
  for (const cohort of teacherCohortCollection.docs) {
    teacherCohorts.push({
      ...cohort.data(),
      id: cohort.id,
    });
  }

  console.log("loaded cohorts");

  const courseIds = Array.from(
    new Set([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...studentCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...teacherCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
    ]),
  );

  const courseDocs = await Promise.all(courseIds.map((x) => db.collection("courses").doc(x).get()));

  console.log("loaded courses");

  const ownedCourseCollection = await db
    .collection("courses")
    .where("owner", "==", db.collection("people").doc(context.auth.uid))
    .get();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseMap = new Map();

  for (const doc of courseDocs) {
    const course = doc.data();
    if (course == null) {
      continue;
    }
    courseMap.set(doc.id, {
      ...course,
      owner: course.owner instanceof DocumentReference ? course.owner.path : course.owner,
      id: doc.id,
    });
  }

  for (const doc of ownedCourseCollection.docs) {
    const course = doc.data();
    courseMap.set(doc.id, {
      ...course,
      owner: course.owner instanceof DocumentReference ? course.owner.path : course.owner,
      id: doc.id,
    });
  }

  const arr = Array.from(courseMap.values());
  console.log("returning result");
  const slice = arr.slice(0, 3);
  console.log(slice);

  return { courses: Array.from(courseMap.values()) };
});

// Get cohort by cohortId
export const getCohortByCohortIdHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const cohortId = data.cohortId as string | null;
  if (cohortId == null) {
    throw new HttpsError("invalid-argument", "missing cohortId");
  }

  const cohortDoc = await db.collection("cohorts").doc(cohortId).get();
  const cohortData = cohortDoc.data();

  if (cohortData == null) {
    throw new HttpsError("not-found", `Cohort not found: ${cohortId}`);
  }

  // TODO: permissions checks

  return {
    cohort: {
      ...cohortData,
      id: cohortDoc.id,
    },
  };
});

// Get cohorts
export const getCohortsHttpsEndpoint = runWith({}).https.onCall(async (_data, context) => {
  requireAuthenticated(context);

  // if they are admin, return all cohorts
  if (context.auth.token.admin === true) {
    const cohortCollection = await db.collection("cohorts").get();

    const cohortMap = new Map();
    for (const doc of cohortCollection.docs) {
      const cohort = doc.data();
      cohortMap.set(doc.id, {
        ...cohort,
        id: doc.id,
      });
    }
    return { cohorts: Array.from(cohortMap.values()) };
  }

  // if they are not admin, return all cohorts where they are a student or teacher
  const cohortMap = new Map();

  const studentCohortCollection = await db
    .collection("cohorts")
    .where("students", "array-contains", context.auth.uid)
    .get();
  const teacherCohortCollection = await db
    .collection("cohorts")
    .where("teachers", "array-contains", context.auth.uid)
    .get();

  for (const cohort of studentCohortCollection.docs) {
    cohortMap.set(cohort.id, {
      ...cohort.data(),
      id: cohort.id,
    });
  }
  for (const cohort of teacherCohortCollection.docs) {
    cohortMap.set(cohort.id, {
      ...cohort.data(),
      id: cohort.id,
    });
  }

  return { cohorts: Array.from(cohortMap.values()) };
});

// Get student cohorts by personId
export const getStudentCohortsByPersonIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const personId = data.personId as string | null;
    if (personId == null) {
      throw new HttpsError("invalid-argument", "missing personId");
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
        ...cohort,
        id: doc.id,
      });
    }

    return { cohorts };
  },
);

// Get all cohorts in course by courseId
export const getCohortsByCourseIdHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new HttpsError("invalid-argument", "missing courseId");
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
      ...cohort,
      id: doc.id,
    });
  }

  return { cohorts };
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

  const activityData = await getCohortsCourseDataXAPIQuery(cohortId);

  return { activityData };
});

// Get topic by courseId and topicId
export const getTopicByCourseIdTopicIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new HttpsError("invalid-argument", "missing topicId");
    }

    const topicDoc = await db
      .collection("courses")
      .doc(courseId)
      .collection("topics")
      .doc(topicId)
      .get();
    const topicData = topicDoc.data();

    if (topicData == null) {
      throw new HttpsError("not-found", `Topic not found: ${topicId}`);
    }

    // TODO: permissions checks

    return {
      topic: {
        ...topicData,
        id: topicDoc.id,
      },
    };
  },
);

// Get task by courseId and topicId and taskId
export const getTaskByCourseIdTopicIdTaskIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    const taskId = data.taskId as string | null;
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new HttpsError("invalid-argument", "missing topicId");
    }
    if (taskId == null) {
      throw new HttpsError("invalid-argument", "missing taskId");
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
      throw new HttpsError("not-found", `Task not found: ${taskId}`);
    }

    // TODO: permissions checks

    return {
      task: {
        ...taskData,
        id: taskDoc.id,
      },
    };
  },
);

// Get person topic by personId and courseId and topicId
export const getPersonTopicByPersonIdCourseIdTopicIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const personId = data.personId as string | null;
    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    if (personId == null) {
      throw new HttpsError("invalid-argument", "missing personId");
    }
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new HttpsError("invalid-argument", "missing topicId");
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
        ...personTopic,
        id: personTopicDoc.id,
      },
    };
  },
);

// Get person tasks by personId and courseId and topicId
export const getPersonTasksByPersonIdCourseIdTopicIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const personId = data.personId as string | null;
    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    if (personId == null) {
      throw new HttpsError("invalid-argument", "missing personId");
    }
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new HttpsError("invalid-argument", "missing topicId");
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
        ...personTask,
        id: doc.id,
      });
    }

    return { personTasks };
  },
);

// Get all people in course by courseId
export const getPeopleByCourseIdHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new HttpsError("invalid-argument", "missing courseId");
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
      ...person,
      id: doc.id,
    });
  }

  return { people };
});

// ====== ASSIGN PERSON TO COHORT ==================
export const addMeToCohortHttpsEndpoint = runWith({}).https.onCall(
  async (data: { cohortId: string }, context) => {
    requireAuthenticated(context);

    const cohortId = data.cohortId as string | null;
    if (cohortId == null) {
      throw new HttpsError("invalid-argument", "missing cohortId");
    }

    const personId = context.auth.uid;

    const result = await addStudentToCohort(cohortId, personId);

    return result;
  },
);

export const addStudentToCohortHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  const cohortId = data.cohortId as string | null;
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }
  if (cohortId == null) {
    throw new HttpsError("invalid-argument", "missing cohortId");
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
    throw new HttpsError("not-found", `Cohort not found: ${cohortId}`);
  }
  if (person == null) {
    throw new HttpsError("not-found", `Person not found: ${personId}`);
  }

  await cohortDoc.ref.update({
    students: FieldValue.arrayUnion(personId),
  });

  const updatedCohortDoc = await cohortDoc.ref.get();

  return {
    cohort: {
      ...updatedCohortDoc.data(),
      id: updatedCohortDoc.id,
    },
  };
}

// ====== ASSIGN PERSON TO COURSE ==================
export const assignCourseToMeHttpsEndpoint = runWith({
  secrets: [VERACITY_LRS_SECRET],
}).https.onCall(async (data: { courseId: string }, context) => {
  requireAuthenticated(context);

  const courseId = data.courseId as string | null;
  if (courseId == null) {
    throw new HttpsError("invalid-argument", "missing courseId");
  }

  const personId = context.auth.uid;

  const result = await assignCourseToStudent(courseId, personId);

  return result;
});

export const assignCourseToStudentHttpsEndpoint = runWith({
  secrets: [VERACITY_LRS_SECRET],
}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  const courseId = data.courseId as string | null;
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }
  if (courseId == null) {
    throw new HttpsError("invalid-argument", "missing courseId");
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
    throw new HttpsError("not-found", `Person not found: ${personId}`);
  }
  if (course == null) {
    throw new HttpsError("not-found", `Course not found: ${courseId}`);
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
    assignedCourses: FieldValue.arrayUnion(courseId),
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
      ...updatedPersonDoc.data(),
      id: updatedPersonDoc.id,
    },
  };
}
