// Use this script for any firebase functions (ff) that are completely independant of components
import { db, functions } from "../store/firestoreConfig";
import { startGalaxyXAPIStatement } from "@/lib/veracityLRS";

export const getCourseById = async (id) => {
  const course = await db
    .collection("courses")
    .doc(id)
    .get();
  return {
    id,
    ...course.data(),
  };
};
export const getStudentByEmail = async (email) => {
  const people = await db
    .collection("people")
    .where("email", "==", email)
    .limit(1)
    .get();

  return people.docs[0]?.data();
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
  const querySnapShot = await db
    .collection("cohorts")
    .where("students", "array-contains", studentId)
    .get();

  const cohorts = querySnapShot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

  return cohorts;
}

export const getCohortById = async (cohortId) => {
  const doc = await db
    .collection("cohorts")
    .doc(cohortId)
    .get();

  return {
    id: doc.id,
    ...doc.data()
  }
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

// add this galaxy metadata (eg. topics) to my course database
export const assignTopicsAndTasksToMe = async (course) => {
  const data = {
    courseId: course.id
  };
  const assignTopicsAndTasksToMe = functions.httpsCallable("assignTopicsAndTasksToMe");
  return assignTopicsAndTasksToMe(data).catch((error) => {
    console.error(error);
  });
}

// add this galaxy metadata (eg. topics) to this persons course database
export const assignTopicsAndTasksToStudent = async (person, course) => {
  const data = {
    person: person.id,
    courseId: course.id
  };
  const assignTopicsAndTasksToStudent = functions.httpsCallable("assignTopicsAndTasksToStudent");
  return assignTopicsAndTasksToStudent(data).catch((error) => {
    console.error(error);
  });
}
