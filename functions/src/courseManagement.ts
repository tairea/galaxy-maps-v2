import { DocumentReference, FieldValue, Filter } from "firebase-admin/firestore";
import { runWith } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { db, requireAuthenticated } from "./_shared.js";
import {
  VERACITY_LRS_SECRET,
  startGalaxyXAPIStatement,
  stopGalaxyXAPIStatement,
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
  const courseOwner =
    courseData.owner instanceof DocumentReference ? courseData.owner.path : courseData.owner;

  // if the course is public and published then always return it
  // if not and the context is unauthenticated then throw not found
  if (courseData.public === true && courseData.status === "published") {
    return {
      course: {
        ...courseData,
        owner: courseOwner,
        id: courseDoc.id,
      },
    };
  } else if (context.auth == null) {
    throw new HttpsError("not-found", `Course not found: ${courseId}`);
  }

  // if the context is authenticated and they are admin, return course
  if (context.auth.token.admin === true) {
    return {
      course: {
        ...courseData,
        owner: courseOwner,
        id: courseDoc.id,
      },
    };
  }

  // if the context is authenticated, they are not admin, and they are
  // the course owner, return course
  if (courseOwner === db.collection("people").doc(context.auth.uid).path) {
    return {
      course: {
        ...courseData,
        owner: courseOwner,
        id: courseDoc.id,
      },
    };
  }

  // if the context is authenticated and they are not admin, check that they
  // belong to a cohort for the course as a teacher or student

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
      owner: courseOwner,
      id: courseDoc.id,
    },
  };
});

// Get course map-edges and map-nodes by courseId
export const getCourseMapEdgesAndNodesByCourseIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    const courseId = data.courseId as string | null;
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }

    const courseDoc = await db.collection("courses").doc(courseId).get();
    const courseData = courseDoc.data();

    if (courseData == null) {
      throw new HttpsError("not-found", `Course not found: ${courseId}`);
    }
    const courseOwner =
      courseData.owner instanceof DocumentReference ? courseData.owner.path : courseData.owner;

    // if the course is public and published then return the map-edges and map-nodes
    // if not and the context is unauthenticated then throw not found
    if (courseData.public === true && courseData.status === "published") {
      const mapEdgeCollection = await db
        .collection("courses")
        .doc(courseId)
        .collection("map-edges")
        .get();

      const mapNodeCollection = await db
        .collection("courses")
        .doc(courseId)
        .collection("map-nodes")
        .get();

      const mapEdges = [];
      for (const doc of mapEdgeCollection.docs) {
        mapEdges.push({
          ...doc.data(),
          id: doc.id,
        });
      }

      const mapNodes = [];
      for (const doc of mapNodeCollection.docs) {
        mapNodes.push({
          ...doc.data(),
          id: doc.id,
        });
      }

      return {
        mapEdges,
        mapNodes,
      };
    } else if (context.auth == null) {
      throw new HttpsError("not-found", `Course not found: ${courseId}`);
    }

    // if the context is authenticated, and they are admin or they are
    // the course owner, return the map-edges and map-nodes
    if (
      context.auth.token.admin === true ||
      courseOwner === db.collection("people").doc(context.auth.uid).path
    ) {
      const mapEdgeCollection = await db
        .collection("courses")
        .doc(courseId)
        .collection("map-edges")
        .get();

      const mapNodeCollection = await db
        .collection("courses")
        .doc(courseId)
        .collection("map-nodes")
        .get();

      const mapEdges = [];
      for (const doc of mapEdgeCollection.docs) {
        mapEdges.push({
          ...doc.data(),
          id: doc.id,
        });
      }

      const mapNodes = [];
      for (const doc of mapNodeCollection.docs) {
        mapNodes.push({
          ...doc.data(),
          id: doc.id,
        });
      }

      return {
        mapEdges,
        mapNodes,
      };
    }

    // if the context is authenticated and they are not admin, check that they
    // belong to a cohort for the course as a teacher or student

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

    const mapEdgeCollection = await db
      .collection("courses")
      .doc(courseId)
      .collection("map-edges")
      .get();

    const mapNodeCollection = await db
      .collection("courses")
      .doc(courseId)
      .collection("map-nodes")
      .get();

    const mapEdges = [];
    for (const doc of mapEdgeCollection.docs) {
      mapEdges.push({
        ...doc.data(),
        id: doc.id,
      });
    }

    const mapNodes = [];
    for (const doc of mapNodeCollection.docs) {
      mapNodes.push({
        ...doc.data(),
        id: doc.id,
      });
    }

    return {
      mapEdges,
      mapNodes,
    };
  },
);

// Get a list of courses
export const getCoursesHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  const slug = data.slug as string | null;
  let ownerRef: DocumentReference | null = null;
  if (slug != null) {
    const slugDoc = await db.collection("slugs").doc(slug).get();
    const slugData = slugDoc.data();
    if (slugData == null) {
      throw new HttpsError("invalid-argument", `Unknown slug: ${slug}`);
    }
    ownerRef = slugData.owner;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseMap = new Map();

  // always fetch the public courses that are published
  const courseCollection = await db
    .collection("courses")
    .where(
      Filter.and(
        Filter.where("public", "==", true),
        Filter.where("status", "==", "published"),
        ...(ownerRef != null ? [Filter.where("owner", "==", ownerRef)] : []),
      ),
    )
    .get();

  for (const doc of courseCollection.docs) {
    const course = doc.data();
    courseMap.set(doc.id, {
      ...course,
      owner: course.owner instanceof DocumentReference ? course.owner.path : course.owner,
      id: doc.id,
    });
  }

  // if the context is unauthenticated, only return courses that are public and
  // have a published status
  if (context.auth == null) {
    return { courses: Array.from(courseMap.values()) };
  }

  // if the context is authenticated and they are admin, return all courses
  if (context.auth.token.admin === true) {
    const courseCollection =
      ownerRef != null
        ? await db.collection("courses").where("owner", "==", ownerRef).get()
        : await db.collection("courses").get();

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

  const courseIds = Array.from(
    new Set([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...studentCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...teacherCohorts.flatMap((x: Record<string, any>): string[] => x.courses),
    ]),
  );

  const courseDocs = await Promise.all(courseIds.map((x) => db.collection("courses").doc(x).get()));

  for (const doc of courseDocs) {
    const course = doc.data();
    if (course == null) {
      continue;
    }

    // If ownerRef is not null, filter by owner
    if (ownerRef != null && course.owner.path !== ownerRef.path) {
      continue;
    }

    courseMap.set(doc.id, {
      ...course,
      owner: course.owner instanceof DocumentReference ? course.owner.path : course.owner,
      id: doc.id,
    });
  }

  const ownedCourseCollection = await db
    .collection("courses")
    .where(
      Filter.and(
        Filter.where("owner", "==", db.collection("people").doc(context.auth.uid)),
        ...(ownerRef != null ? [Filter.where("owner", "==", ownerRef)] : []),
      ),
    )
    .where("owner", "==", db.collection("people").doc(context.auth.uid))
    .get();

  for (const doc of ownedCourseCollection.docs) {
    const course = doc.data();
    courseMap.set(doc.id, {
      ...course,
      owner: course.owner instanceof DocumentReference ? course.owner.path : course.owner,
      id: doc.id,
    });
  }

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

// get student submissions by personId
export const getStudentSubmissionsByPersonIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const personId = data.personId as string | null;
    if (personId == null) {
      throw new HttpsError("invalid-argument", "missing personId");
    }

    const courseIdsSet = new Set<string>();

    if (context.auth.uid === personId) {
      // get assigned courses
      const personDoc = await db.collection("people").doc(personId).get();
      const person = personDoc.data();
      if (person == null) {
        throw new HttpsError("not-found", `Person not found: ${personId}`);
      }

      for (const courseId of person.assignedCourses) {
        courseIdsSet.add(courseId);
      }
    } else {
      // get courses for teacher
      const teacherCohortCollection = await db
        .collection("cohorts")
        .where("teachers", "array-contains", personId)
        .get();

      for (const cohortDoc of teacherCohortCollection.docs) {
        const cohort = cohortDoc.data();
        for (const courseId of cohort.courses) {
          courseIdsSet.add(courseId);
        }
      }
    }

    // get course submissions for review
    const submissions = [];

    for (const courseId of Array.from(courseIdsSet)) {
      const submissionsForReviewCollection = await db
        .collection("courses")
        .doc(courseId)
        .collection("submissionsForReview")
        .where("studentId", "==", personId)
        .get();

      for (const submissionForReviewDoc of submissionsForReviewCollection.docs) {
        const submissionForReview = submissionForReviewDoc.data();
        submissions.push({
          ...submissionForReview,
          courseId,
          id: submissionForReviewDoc.id,
        });
      }
    }

    return { submissions };
  },
);

export const getStudentRequestsByPersonIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const personId = data.personId as string | null;
    if (personId == null) {
      throw new HttpsError("invalid-argument", "missing personId");
    }

    const courseIdsSet = new Set<string>();

    if (context.auth.uid === personId) {
      // get assigned courses
      const personDoc = await db.collection("people").doc(personId).get();
      const person = personDoc.data();
      if (person == null) {
        throw new HttpsError("not-found", `Person not found: ${personId}`);
      }

      for (const courseId of person.assignedCourses) {
        courseIdsSet.add(courseId);
      }
    } else {
      // get courses for teacher
      const teacherCohortCollection = await db
        .collection("cohorts")
        .where("teachers", "array-contains", personId)
        .get();

      for (const cohortDoc of teacherCohortCollection.docs) {
        const cohort = cohortDoc.data();
        for (const courseId of cohort.courses) {
          courseIdsSet.add(courseId);
        }
      }
    }

    // get course submissions for review
    const requests = [];

    for (const courseId of Array.from(courseIdsSet)) {
      const requestsForHelpCollection = await db
        .collection("courses")
        .doc(courseId)
        .collection("requestsForHelp")
        .where("personId", "==", personId)
        .get();

      for (const requestForHelpDoc of requestsForHelpCollection.docs) {
        const requestForHelp = requestForHelpDoc.data();
        requests.push({
          ...requestForHelp,
          courseId,
          id: requestForHelpDoc.id,
        });
      }
    }

    return { requests };
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

// Get tasks by courseId and topicId
export const getTasksByCourseIdTopicIdHttpsEndpoint = runWith({}).https.onCall(
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

    // TODO: permissions checks

    const taskCollection = await db
      .collection("courses")
      .doc(courseId)
      .collection("topics")
      .doc(topicId)
      .collection("tasks")
      .get();

    const tasks = [];
    for (const doc of taskCollection.docs) {
      const task = doc.data();
      tasks.push({
        ...task,
        id: doc.id,
      });
    }

    return { tasks };
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

// Get person topics by personId and courseId
export const getPersonTopicsByPersonIdCourseIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const personId = data.personId as string | null;
    const courseId = data.courseId as string | null;
    if (personId == null) {
      throw new HttpsError("invalid-argument", "missing personId");
    }
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }

    // TODO: permissions checks

    const personTopicCollection = await db
      .collection("people")
      .doc(personId)
      .collection(courseId)
      .get();

    const personTopics = [];
    for (const doc of personTopicCollection.docs) {
      const personTopic = doc.data();
      personTopics.push({
        ...personTopic,
        id: doc.id,
      });
    }

    return { personTopics };
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

// Create task with courseId and topicId
export const createTaskWithCourseIdTopicIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    const task = data.task as Record<string, unknown> | null;
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new HttpsError("invalid-argument", "missing topicId");
    }
    if (task == null) {
      throw new HttpsError("invalid-argument", "missing task");
    }

    // TODO: permissions checks

    const result = await createTask(courseId, topicId, task);

    return result;
  },
);

/**
 * Create a task
 */
async function createTask(courseId: string, topicId: string, task: Record<string, unknown>) {
  const taskRef = await db
    .collection("courses")
    .doc(courseId)
    .collection("topics")
    .doc(topicId)
    .collection("tasks")
    .add({ ...task, taskCreatedTimestamp: new Date() });

  // increment course taskTotals by 1
  await db.collection("courses").doc(courseId).update("taskTotal", FieldValue.increment(1));

  // increment topic taskTotals by 1
  await db
    .collection("courses")
    .doc(courseId)
    .collection("topics")
    .doc(topicId)
    .update("taskTotal", FieldValue.increment(1));

  const taskDoc = await taskRef.get();

  // update students with task

  // get all students in the course
  const studentCollection = await db
    .collection("people")
    .where("assignedCourses", "array-contains", courseId)
    .get();

  for (const doc of studentCollection.docs) {
    const studentId = doc.id;

    // set reference to this course
    const courseRef = db.collection("people").doc(studentId).collection(courseId);

    // check if the student has already started the course
    // if not they will be assigned this task when they start the course
    const studentHasStartedCourse = await courseRef.get().then((subQuery) => {
      return subQuery.docs.length;
    });

    if (studentHasStartedCourse) {
      // if they have started the course, get the tasks for this topic
      const query = await courseRef.doc(topicId).collection("tasks").get();

      // get the data from the task
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tasks: Record<string, any>[] = query.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        };
      });

      // check if all the tasks are all completed
      const uncompletedTasks = tasks.filter((task) => task.taskStatus !== "completed");

      // assign task to student
      await courseRef
        .doc(topicId)
        .collection("tasks")
        .doc(taskDoc.id)
        .set({
          ...taskDoc.data(),
          // if they arent all completed this task will be locked.
          // if they are completed then this task should be unlocked
          taskStatus: uncompletedTasks.length ? "locked" : "unlocked",
        });
    }
  }

  return {
    task: {
      ...taskDoc.data(),
      id: taskDoc.id,
    },
  };
}

// Update task by courseId and topicId and taskId
export const updateTaskByCourseIdTopicIdTaskIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const courseId = data.courseId as string | null;
    const topicId = data.topicId as string | null;
    const taskId = data.taskId as string | null;
    const task = data.task as Record<string, unknown> | null;
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }
    if (topicId == null) {
      throw new HttpsError("invalid-argument", "missing topicId");
    }
    if (taskId == null) {
      throw new HttpsError("invalid-argument", "missing taskId");
    }
    if (task == null) {
      throw new HttpsError("invalid-argument", "missing task");
    }

    // TODO: permissions checks

    const result = await updateTask(courseId, topicId, taskId, task);

    return result;
  },
);

/**
 * Update a task
 */
async function updateTask(
  courseId: string,
  topicId: string,
  taskId: string,
  task: Record<string, unknown>,
) {
  const taskRef = db
    .collection("courses")
    .doc(courseId)
    .collection("topics")
    .doc(topicId)
    .collection("tasks")
    .doc(taskId);

  await taskRef.update(task);

  const taskDoc = await taskRef.get();

  // update students with task

  // get all students in the course
  const studentCollection = await db
    .collection("people")
    .where("assignedCourses", "array-contains", courseId)
    .get();

  for (const doc of studentCollection.docs) {
    const studentId = doc.id;

    // set reference to this course
    const courseRef = db.collection("people").doc(studentId).collection(courseId);

    // check if the student has already started the course
    // if not they will be assigned this task when they start the course
    const studentHasStartedCourse = await courseRef.get().then((subQuery) => {
      return subQuery.docs.length;
    });

    if (studentHasStartedCourse) {
      // assign task to student
      await courseRef
        .doc(topicId)
        .collection("tasks")
        .doc(taskDoc.id)
        .set({
          ...taskDoc.data(),
        });
    }
  }

  return {
    task: {
      ...taskDoc.data(),
      id: taskDoc.id,
    },
  };
}

// Delete task by courseId and topicId and taskId
export const deleteTaskByCourseIdTopicIdTaskIdHttpsEndpoint = runWith({}).https.onCall(
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

    // TODO: permissions checks

    const result = await deleteTask(courseId, topicId, taskId);

    return result;
  },
);

/**
 * Delete a task
 */
async function deleteTask(courseId: string, topicId: string, taskId: string) {
  const taskRef = db
    .collection("courses")
    .doc(courseId)
    .collection("topics")
    .doc(topicId)
    .collection("tasks")
    .doc(taskId);

  const taskDoc = await taskRef.get();

  // update students with task

  // get all students in the course
  const studentCollection = await db
    .collection("people")
    .where("assignedCourses", "array-contains", courseId)
    .get();

  for (const doc of studentCollection.docs) {
    const studentId = doc.id;

    // delete for student
    await db
      .collection("people")
      .doc(studentId)
      .collection(courseId)
      .doc(topicId)
      .collection("tasks")
      .doc(taskDoc.id)
      .delete();
  }

  // increment course taskTotals by -1
  await db.collection("courses").doc(courseId).update("taskTotal", FieldValue.increment(-1));

  // increment topic taskTotals by -1
  await db
    .collection("courses")
    .doc(courseId)
    .collection("topics")
    .doc(topicId)
    .update("taskTotal", FieldValue.increment(-1));

  await taskRef.delete();

  return {
    task: {
      ...taskDoc.data(),
      id: taskDoc.id,
    },
  };
}

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

  // check if student is assigned to course
  if (!person.assignedCourses.includes(courseId)) {
    console.log("course DOES NOT exist for student", person.firstName + " " + person.lastName);

    // Add the topics and tasks to the student

    // 1) get topics in this course
    const topicCollection = await db
      .collection("courses")
      .doc(courseDoc.id)
      .collection("topics")
      .orderBy("topicCreatedTimestamp")
      .get();

    // 2) add them to person (this will store their TOPIC progression data for this course )
    for (const topicDoc of topicCollection.docs) {
      const topic = topicDoc.data();

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
        .doc(personDoc.id)
        .collection(courseDoc.id)
        .doc(topicDoc.id)
        .set({
          ...topic,
          topicStatus,
        });

      // 3) check if this topic has tasks
      const taskCollection = await db
        .collection("courses")
        .doc(courseDoc.id)
        .collection("topics")
        .doc(topicDoc.id)
        .collection("tasks")
        // order by timestamp is important otherwise index == 0 (in the next step)
        // wont necessarily be the first mission
        .orderBy("taskCreatedTimestamp")
        .get();

      // 4) if tasks exist. add them to person
      for (const [index, taskDoc] of taskCollection.docs.entries()) {
        const task = taskDoc.data();

        await db
          .collection("people")
          .doc(personDoc.id)
          .collection(courseDoc.id)
          .doc(topicDoc.id)
          .collection("tasks")
          .doc(taskDoc.id)
          .set({
            ...task,
            // set the status of topics to locked unless they are the first mission (index == 0)
            taskStatus: index == 0 ? "unlocked" : "locked",
          });
      }
    }
  } else {
    throw new HttpsError("already-exists", person.firstName + " is already in " + course.title);
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

// ====== REMOVE PERSON FROM COURSE ==================
export const removeMeFromCourseHttpsEndpoint = runWith({}).https.onCall(
  async (data: { courseId: string }, context) => {
    requireAuthenticated(context);

    const courseId = data.courseId as string | null;
    if (courseId == null) {
      throw new HttpsError("invalid-argument", "missing courseId");
    }

    const personId = context.auth.uid;

    const result = await removeStudentFromCourse(courseId, personId);

    return result;
  },
);

export const removeStudentFromCourseHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
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
    // remove the specified personId from the specified courseId

    const result = await removeStudentFromCourse(courseId, personId);

    return result;
  },
);

/**
 * Remove person from course
 */
async function removeStudentFromCourse(courseId: string, personId: string) {
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

  // check if student is assigned to course
  if (person.assignedCourses.includes(courseId)) {
    console.log("course DOES exist for student", person.firstName + " " + person.lastName);

    // Get a list of topics in this course
    const personTopicCollection = await db
      .collection("people")
      .doc(personDoc.id)
      .collection(courseDoc.id)
      .get();

    // Loop over topics and delete the tasks and the topic
    for (const personTopicDoc of personTopicCollection.docs) {
      const personTaskCollection = await db
        .collection("people")
        .doc(personDoc.id)
        .collection(courseDoc.id)
        .doc(personTopicDoc.id)
        .collection("tasks")
        .get();

      await Promise.all(
        personTaskCollection.docs.map((personTaskDoc) => personTaskDoc.ref.delete()),
      );

      // Delete the topic
      await personTopicDoc.ref.delete();
    }

    await personDoc.ref.update({
      assignedCourses: FieldValue.arrayRemove(courseId),
    });
  } else {
    throw new HttpsError("not-found", person.firstName + " is not in " + course.title);
  }

  // Send Galaxy Stopped statment to LRS
  stopGalaxyXAPIStatement(
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
