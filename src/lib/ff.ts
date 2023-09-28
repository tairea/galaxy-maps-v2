// Use this script for any firebase functions (ff) that are completely independant of components
import { db, functions } from "@/store/firestoreConfig";

export const fetchCourseById = async (id: string) => {
  const course = await db.collection("courses").doc(id).get();

  if (!course.exists) {
    return null;
  }

  return {
    ...course.data(),
    id: course.id,
  };
};

export const fetchStudentByEmail = async (email: string) => {
  const people = await db.collection("people").where("email", "==", email).limit(1).get();
  const person = people.docs[0];

  if (person == null) {
    return null;
  }

  if (!person.exists) {
    return null;
  }

  return {
    ...person.data(),
    id: person.id,
  };
};

export const fetchStudentTasksByTopicId = async (payload: {
  studentId: string;
  courseId: string;
  topicId: string;
}) => {
  const studentTasks = await db
    .collection("people")
    .doc(payload.studentId)
    .collection(payload.courseId)
    .doc(payload.topicId)
    .collection("tasks")
    .get();

  const tasks = studentTasks.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  return tasks;
};

export const fetchStudentCohortsById = async (studentId: string) => {
  const querySnapShot = await db
    .collection("cohorts")
    .where("students", "array-contains", studentId)
    .get();

  const cohorts = querySnapShot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  return cohorts;
};

export const fetchCohortById = async (cohortId: string) => {
  const doc = await db.collection("cohorts").doc(cohortId).get();

  return {
    id: doc.id,
    ...doc.data(),
  };
};

export const fetchAllPeopleInCourse = async (courseId: string) => {
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
    });
};

export const fetchAllCohortsInCourse = async (courseId: string, teacherId: string) => {
  return await db
    .collection("cohorts")
    .where("courses", "array-contains", courseId)
    .get()
    .then((querySnapShot) => {
      const cohort = querySnapShot.docs.map((doc) => {
        const teacher = doc.data().teachers.some((teacher: string) => teacher == teacherId);
        return {
          id: doc.id,
          ...doc.data(),
          teacher,
        };
      });
      return cohort;
    });
};

export const fetchPersonsTopicById = async (
  personId: string,
  courseId: string,
  topicId: string,
) => {
  return await db
    .collection("people")
    .doc(personId)
    .collection(courseId)
    .doc(topicId)
    .get()
    .then((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
};

// add this galaxy metadata (eg. topics) to my course database
export const assignTopicsAndTasksToMe = async (course: { id: string }) => {
  const data = {
    courseId: course.id,
  };
  const assignTopicsAndTasksToMe = functions.httpsCallable("assignTopicsAndTasksToMe");
  return assignTopicsAndTasksToMe(data).catch((error) => {
    console.error(error);
  });
};

// add this galaxy metadata (eg. topics) to this persons course database
export const assignTopicsAndTasksToStudent = async (
  person: { id: string },
  course: { id: string },
) => {
  const data = {
    person: person.id,
    courseId: course.id,
  };
  const assignTopicsAndTasksToStudent = functions.httpsCallable("assignTopicsAndTasksToStudent");
  return assignTopicsAndTasksToStudent(data).catch((error) => {
    console.error(error);
  });
};
