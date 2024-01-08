// Use this script for any firebase functions (ff) that are completely independant of components
import { db, functions } from "@/store/firestoreConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export const _getDocumentHelper = async (
  path: string,
  ...pathSegments: string[]
): Promise<{ id: string } & Record<string, any>> => {
  const document = await getDoc(doc(db, path, ...pathSegments));

  if (!document.exists) {
    throw new Error(`document ${document.ref.path} not found`);
  }

  return {
    ...document.data(),
    id: document.id,
  };
};

export const _getDocumentsHelper = async (
  path: string,
  ...pathSegments: string[]
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const querySnapshot = await getDocs(collection(db, path, ...pathSegments));

  return querySnapshot.docs.map((x) => ({
    ...x.data(),
    id: x.id,
  }));
};

export const fetchCohortByCohortId = async (cohortId: string) => {
  return _getDocumentHelper("cohorts", cohortId);
};

export const fetchCourseByCourseId = async (courseId: string) => {
  return _getDocumentHelper("courses", courseId);
};

export const fetchTopicByCourseIdTopicId = async (courseId: string, topicId: string) => {
  return _getDocumentHelper("courses", courseId, "topics", topicId);
};

export const fetchTaskByCourseIdTopicIdTaskId = async (
  courseId: string,
  topicId: string,
  taskId: string,
) => {
  return _getDocumentHelper("courses", courseId, "topics", topicId, "tasks", taskId);
};

export const fetchPersonByPersonId = async (id: string) => {
  return _getDocumentHelper("people", id);
};

export const fetchPersonByEmail = async (
  email: string,
): Promise<({ id: string } & Record<string, any>) | null> => {
  const querySnapshot = await getDocs(
    query(collection(db, "people"), where("email", "==", email), limit(1)),
  );
  const document = querySnapshot.docs[0];

  if (document == null) {
    return null;
  }

  return {
    id: document.id,
    ...document.data(),
  };
};

export const createPerson = async (
  profile: Record<string, any>,
): Promise<{ id: string } & Record<string, any>> => {
  // create user
  const createNewUser = functions.httpsCallable("createNewUser");
  const result = await createNewUser({ profile });
  return result.data.person;
};

export const updatePersonByPersonId = async (personId: string, person: object): Promise<void> => {
  await updateDoc(doc(db, "people", personId), person);
};

export const fetchPersonsTasksByPersonIdCourseIdTopicId = async (
  personId: string,
  courseId: string,
  topicId: string,
) => {
  return _getDocumentsHelper("people", personId, courseId, topicId, "tasks");
};

export const fetchPersonsCohortsByPersonId = async (
  personId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const querySnapshot = await getDocs(
    query(collection(db, "cohorts"), where("students", "array-contains", personId)),
  );

  return querySnapshot.docs.map((x) => ({
    ...x.data(),
    id: x.id,
  }));
};

export const fetchAllPeopleInCourseByCourseId = async (
  courseId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const querySnapshot = await getDocs(
    query(collection(db, "people"), where("assignedCourses", "array-contains", courseId)),
  );

  return querySnapshot.docs.map((x) => ({
    ...x.data(),
    id: x.id,
  }));
};

export const fetchAllCohortsInCourseByCourseId = async (
  courseId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const querySnapshot = await getDocs(
    query(collection(db, "cohorts"), where("courses", "array-contains", courseId)),
  );

  return querySnapshot.docs.map((x) => ({
    ...x.data(),
    id: x.id,
  }));
};

export const fetchPersonsTopicByPersonIdCourseIdTopicId = async (
  personId: string,
  courseId: string,
  topicId: string,
) => {
  return _getDocumentHelper("people", personId, courseId, topicId);
};

// add person to cohort
export const addMeToCohort = async (cohortId: string) => {
  const data = {
    cohortId,
  };
  const addMeToCohort = functions.httpsCallable("addMeToCohort");
  return addMeToCohort(data);
};

export const addPersonToCohort = async (personId: string, cohortId: string) => {
  const data = {
    personId,
    cohortId,
  };
  const addStudentToCohort = functions.httpsCallable("addStudentToCohort");
  return addStudentToCohort(data);
};

// add course to person
export const assignCourseToMe = async (courseId: string) => {
  const data = {
    courseId,
  };
  const assignCourseToMe = functions.httpsCallable("assignCourseToMe");
  return assignCourseToMe(data);
};

export const assignCourseToPerson = async (personId: string, courseId: string) => {
  const data = {
    personId,
    courseId,
  };
  const assignCourseToStudent = functions.httpsCallable("assignCourseToStudent");
  return assignCourseToStudent(data);
};
