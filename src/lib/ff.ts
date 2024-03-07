// Use this script for any firebase functions (ff) that are completely independant of components
import { functions } from "@/store/firestoreConfig";
import { FirebaseError } from "firebase/app";

export const fetchCohorts = async () => {
  const data = {};
  const getCohorts = functions.httpsCallable("getCohorts");
  const result = await getCohorts(data);
  return result.data.cohorts;
};

export const fetchCohortByCohortId = async (cohortId: string) => {
  const data = {
    cohortId,
  };
  const getCohortByCohortId = functions.httpsCallable("getCohortByCohortId");
  const result = await getCohortByCohortId(data);
  return result.data.cohort;
};

export const fetchStudentCohortsByPersonId = async (
  personId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const data = {
    personId,
  };
  const getStudentCohortsByPersonId = functions.httpsCallable("getStudentCohortsByPersonId");
  const result = await getStudentCohortsByPersonId(data);
  return result.data.cohorts;
};

export const fetchStudentSubmissionsByPersonId = async (
  personId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const data = {
    personId,
  };
  const getStudentSubmissionsByPersonId = functions.httpsCallable(
    "getStudentSubmissionsByPersonId",
  );
  const result = await getStudentSubmissionsByPersonId(data);
  return result.data.submissions;
};

export const fetchStudentRequestsByPersonId = async (
  personId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const data = {
    personId,
  };
  const getStudentRequestsByPersonId = functions.httpsCallable("getStudentRequestsByPersonId");
  const result = await getStudentRequestsByPersonId(data);
  return result.data.requests;
};

export const fetchRequestsForTeacherByTeacherId = async (
  teacherId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const data = {
    teacherId,
  };
  const getRequestsForTeacherByTeacherId = functions.httpsCallable(
    "getRequestsForTeacherByTeacherId",
  );
  const result = await getRequestsForTeacherByTeacherId(data);
  return result.data.requests;
};

export const fetchSubmissionsForTeacherByTeacherId = async (
  teacherId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const data = {
    teacherId,
  };
  const getSubmissionsForTeacherByTeacherId = functions.httpsCallable(
    "getSubmissionsForTeacherByTeacherId",
  );
  const result = await getSubmissionsForTeacherByTeacherId(data);
  return result.data.submissions;
};

export const fetchAllCohortsInCourseByCourseId = async (
  courseId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const data = {
    courseId,
  };
  const getCohortsByCourseId = functions.httpsCallable("getCohortsByCourseId");
  const result = await getCohortsByCourseId(data);
  return result.data.cohorts;
};

export const fetchCohortCoursesActivityByCohortId = async (
  cohortId: string,
): Promise<Record<string, any>[]> => {
  const data = {
    cohortId,
  };
  const getCohortCoursesActivityByCohortId = functions.httpsCallable(
    "getCohortCoursesActivityByCohortId",
  );
  const result = await getCohortCoursesActivityByCohortId(data);
  return result.data.activityData;
};

export const fetchCohortStudentsActivityTimeByCohortId = async (
  cohortId: string,
): Promise<Record<string, any>[]> => {
  const data = {
    cohortId,
  };
  const getCohortStudentsActivityTimeByCohortId = functions.httpsCallable(
    "getCohortStudentsActivityTimeByCohortId",
  );
  const result = await getCohortStudentsActivityTimeByCohortId(data);
  return result.data.activityData;
};

export const fetchCourses = async () => {
  const data = {};
  const getCourses = functions.httpsCallable("getCourses");
  const result = await getCourses(data);
  return result.data.courses;
};

export const fetchCourseByCourseId = async (courseId: string) => {
  const data = {
    courseId,
  };
  const getCourseByCourseId = functions.httpsCallable("getCourseByCourseId");
  const result = await getCourseByCourseId(data);
  return result.data.course;
};

export const fetchTopicByCourseIdTopicId = async (courseId: string, topicId: string) => {
  const data = {
    courseId,
    topicId,
  };
  const getTopicByCourseIdTopicId = functions.httpsCallable("getTopicByCourseIdTopicId");
  const result = await getTopicByCourseIdTopicId(data);
  return result.data.topic;
};

export const fetchTaskByCourseIdTopicIdTaskId = async (
  courseId: string,
  topicId: string,
  taskId: string,
) => {
  const data = {
    courseId,
    topicId,
    taskId,
  };
  const getTaskByCourseIdTopicIdTaskId = functions.httpsCallable("getTaskByCourseIdTopicIdTaskId");
  const result = await getTaskByCourseIdTopicIdTaskId(data);
  return result.data.task;
};

export const fetchPersonByPersonId = async (id: string) => {
  const data = {
    personId: id,
  };
  const getPersonByPersonId = functions.httpsCallable("getPersonByPersonId");
  const result = await getPersonByPersonId(data);
  return result.data.person;
};

export const fetchPersonByEmail = async (
  email: string,
): Promise<({ id: string } & Record<string, any>) | null> => {
  const data = {
    email,
  };
  const getPersonByEmail = functions.httpsCallable("getPersonByEmail");
  try {
    const result = await getPersonByEmail(data);
    return result.data.person;
  } catch (e) {
    if (e instanceof FirebaseError && e.code === "not-found") {
      return null;
    }
    throw e;
  }
};

export const createPerson = async (
  profile: Record<string, any>,
): Promise<{ id: string } & Record<string, any>> => {
  const data = {
    profile,
  };
  const createNewUser = functions.httpsCallable("createNewUser");
  const result = await createNewUser(data);
  return result.data.person;
};

export const updatePerson = async (personId: string, person: object): Promise<void> => {
  const data = {
    personId,
    person,
  };
  const updatePersonByPersonId = functions.httpsCallable("updatePersonByPersonId");
  const result = await updatePersonByPersonId(data);
  return result.data.person;
};

export const fetchPersonsTasksByPersonIdCourseIdTopicId = async (
  personId: string,
  topicId: string,
  courseId: string,
) => {
  const data = {
    personId,
    topicId,
    courseId,
  };
  const getPersonTasksByPersonIdCourseIdTopicId = functions.httpsCallable(
    "getPersonTasksByPersonIdCourseIdTopicId",
  );
  const result = await getPersonTasksByPersonIdCourseIdTopicId(data);
  return result.data.tasks;
};

export const fetchAllPeopleInCourseByCourseId = async (
  courseId: string,
): Promise<Array<{ id: string } & Record<string, any>>> => {
  const data = {
    courseId,
  };
  const getPeopleByCourseId = functions.httpsCallable("getPeopleByCourseId");
  const result = await getPeopleByCourseId(data);
  return result.data.people;
};

export const fetchPersonsTopicByPersonIdCourseIdTopicId = async (
  personId: string,
  courseId: string,
  topicId: string,
) => {
  const data = {
    personId,
    courseId,
    topicId,
  };
  const getPersonTopicByPersonIdCourseIdTopicId = functions.httpsCallable(
    "getPersonTopicByPersonIdCourseIdTopicId",
  );
  const result = await getPersonTopicByPersonIdCourseIdTopicId(data);
  return result.data.personTopic;
};

export const fetchStudentActivityLogByPersonId = async (
  personId: string,
): Promise<Record<string, any>[]> => {
  const data = {
    personId,
  };
  const getStudentActivityLogByPersonId = functions.httpsCallable(
    "getStudentActivityLogByPersonId",
  );
  const result = await getStudentActivityLogByPersonId(data);
  return result.data.activityData;
};

export const fetchStudentCoursesActivityByPersonId = async (
  personId: string,
): Promise<Record<string, any>[]> => {
  const data = {
    personId,
  };
  const getStudentCoursesActivityByPersonId = functions.httpsCallable(
    "getStudentCoursesActivityByPersonId",
  );
  const result = await getStudentCoursesActivityByPersonId(data);
  return result.data.activityData;
};

export const fetchStudentCoursesTimeDataByPersonIdStartAtEndAt = async (
  personId: string,
  startAt: string,
  endAt: string,
): Promise<Record<string, any>[]> => {
  const data = {
    personId,
    startAt,
    endAt,
  };
  const getStudentCoursesTimeDataByPersonIdStartAtEndAt = functions.httpsCallable(
    "getStudentCoursesTimeDataByPersonIdStartAtEndAt",
  );
  const result = await getStudentCoursesTimeDataByPersonIdStartAtEndAt(data);
  return result.data.activityData;
};

export const fetchStudentCoursesTimeDataByPersonId = async (
  personId: string,
): Promise<Record<string, any>[]> => {
  const data = {
    personId,
  };
  const getStudentCoursesTimeDataByPersonId = functions.httpsCallable(
    "getStudentCoursesTimeDataByPersonId",
  );
  const result = await getStudentCoursesTimeDataByPersonId(data);
  return result.data.activityData;
};

// add person to cohort
export const addMeToCohort = async (cohortId: string) => {
  const data = {
    cohortId,
  };
  const addMeToCohort = functions.httpsCallable("addMeToCohort");
  const result = await addMeToCohort(data);
  return result.data.cohort;
};

export const addPersonToCohort = async (personId: string, cohortId: string) => {
  const data = {
    personId,
    cohortId,
  };
  const addStudentToCohort = functions.httpsCallable("addStudentToCohort");
  const result = await addStudentToCohort(data);
  return result.data.cohort;
};

// add course to person
export const assignCourseToMe = async (courseId: string) => {
  const data = {
    courseId,
  };
  const assignCourseToMe = functions.httpsCallable("assignCourseToMe");
  const result = await assignCourseToMe(data);
  return result.data.person;
};

export const assignCourseToPerson = async (personId: string, courseId: string) => {
  const data = {
    personId,
    courseId,
  };
  const assignCourseToStudent = functions.httpsCallable("assignCourseToStudent");
  const result = await assignCourseToStudent(data);
  return result.data.person;
};
