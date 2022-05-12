// Use this script for any firebase functions (ff) that are completely independant of components
import { db } from "../store/firestoreConfig";

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
