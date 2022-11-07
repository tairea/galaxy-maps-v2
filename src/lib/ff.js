// Use this script for any firebase functions (ff) that are completely independant of components
import { db } from "../store/firestoreConfig";
import { startGalaxyXAPIStatement } from "@/lib/veracityLRS";

export const getCourseById = async (id) => {
  const course = await db
    .collection("courses")
    .doc(id)
    .get()
    .then((doc) => {
      return {
        id,
        ...doc.data(),
      };
    });
  return course;
};
export const getStudentByEmail = async (email) => {
  const people = await db
    .collection("people")
    .where("email", "==", email)
    .get();

  for (const person of people.docs) {
    return person.data();
  }
};

export const getStudentTasksByTopicId = async (payload) => {
  const tasks = []

  const studentTasks = await db
    .collection("people")
    .doc(payload.studentId)
    .collection(payload.courseId)
    .doc(payload.topicId)
    .collection("tasks")
    .get()

  for (const task of studentTasks.docs) {
    tasks.push(task.data())
  }
  return tasks
}

export const getStudentCohortsById = async (studentId) => {
  return await db
    .collection("cohorts")
    .where("students", "array-contains", studentId)
    .get()
    .then((querySnapShot) => {
      const cohorts = querySnapShot.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data(),
        };
      });
      return cohorts;
    });
}

export const getCohortById = async (cohortId) => {
  return await db
    .collection("cohorts")
    .doc(cohortId)
    .get()
    .then(doc => {
      return {
        id: doc.id,
        ...doc.data()
      }
    })
}

export const getAllPeopleInCourse = async (courseId) => {
  return await db
    .collection("people")
    .where("assignedCourses", "array-contains", courseId)
    .get()
    .then((querySnapShot) => {
      const people = querySnapShot.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data(),
        };
      });
      return people;
    })
}

export const getAllCohortsInCourse = async (courseId, teacherId) => {
  return await db
    .collection('cohorts')
    .where("courses", "array-contains", courseId)
    .get()
    .then((querySnapShot) => {
      const cohort = querySnapShot.docs.map((doc) => {
        let teacher = doc.data().teachers.some(teacher => teacher == teacherId)
        return {
          id: doc.id,
          ...doc.data(),
          teacher
        }
      })
      return cohort
    })
}

export const getPersonsTopicById = async (personId, courseId, topicId) => {
  return await db
    .collection('people')
    .doc(personId)
    .collection(courseId)
    .doc(topicId)
    .get()
    .then((doc) => {
      return {
        id: doc.id,
        ...doc.data()
      }
    })
}

// add this galaxy metadata (eg. topics) to this persons course database
export const assignTopicsAndTasksToStudent = async (person, course) => {
  console.log("person: ", person);
  console.log("course: ", course);

  // 1) get topics in this course
  const querySnapshot = await db
    .collection("courses")
    .doc(course.id)
    .collection("topics")
    .orderBy("topicCreatedTimestamp")
    .get();

  // 2) add them to person (this will store their TOPIC progression data for this course )
  for (const [index, doc] of querySnapshot.docs.entries()) {
    await db
      .collection("people")
      .doc(person.id)
      .collection(course.id)
      .doc(doc.data().id)
      .set({
        ...doc.data(),
        topicStatus:
          doc.data().group == "introduction" ? "introduction" : "locked", // set the status of topics to locked unless they are introduction nodes
      });

    // 3) check if this topic has tasks
    const subquerySnapshot = await db
      .collection("courses")
      .doc(course.id)
      .collection("topics")
      .doc(doc.data().id)
      .collection("tasks")
      // order by timestamp is important otherwise index == 0 (in the next step) wont necessarily be the first mission
      .orderBy("taskCreatedTimestamp")
      .get();

    // 4) if tasks exist. add them to person
    for (const [index, subDoc] of subquerySnapshot.docs.entries()) {
      // cool lil status to show whats happening during loading
      // this.startingGalaxyStatus = "...adding " + subDoc.data().title;

      if (subDoc.exists) {
        await db
          .collection("people")
          .doc(person.id)
          .collection(course.id)
          .doc(doc.data().id)
          .collection("tasks")
          .doc(subDoc.id)
          .set({
            ...subDoc.data(),
            // set the status of topics to locked unless they are the first mission (index == 0)
            taskStatus: index == 0 ? "unlocked" : "locked",
          });
      }
    }
  }
  // Send Galaxy Started statment to LRS
  startGalaxyXAPIStatement(person, { galaxy: course });
}
