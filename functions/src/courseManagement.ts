import * as functions from "firebase-functions";
import { firestore } from "./_shared.js";
import { startGalaxyXAPIStatement } from "./veracityLRS.js";

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

    // *** set topic status
    let status = null;
    console.log("topic status check", topic);
    if (topic?.group == "introduction") {
      // if has a status, set that status
      status = "unlocked";
    } else if (topic?.prerequisites?.length > 0) {
      // does this topic have prereqs? if so make locked
      status = "locked";
    } else {
      // else unlock
      status = "unlocked";
    }

    await firestore
      .collection("people")
      .doc(person.id)
      .collection(course.id)
      .doc(topic.id)
      .set({
        ...topic,
        topicStatus: status,
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
