// Use this script for any firebase functions (ff) that are completely independant of components
import type {
  ICohort,
  ICourse,
  IPerson,
  IOrganisation,
  ITopic,
  ITask,
  IPersonTask,
  IPersonTopic,
  IMapNode,
  IMapEdge,
} from "@/store/_types";
import { functions } from "@/store/firestoreConfig";
import { FirebaseError } from "firebase/app";

export const fetchCohorts = async (): Promise<ICohort[]> => {
  const data = {};
  const getCohorts = functions.httpsCallable("getCohorts");
  const result = await getCohorts(data);
  return result.data.cohorts;
};

export const fetchCohortByCohortId = async (cohortId: string): Promise<ICohort> => {
  const data = {
    cohortId,
  };
  const getCohortByCohortId = functions.httpsCallable("getCohortByCohortId");
  const result = await getCohortByCohortId(data);
  return result.data.cohort;
};

export const fetchStudentCohortsByPersonId = async (personId: string): Promise<IPerson[]> => {
  const data = {
    personId,
  };
  const getStudentCohortsByPersonId = functions.httpsCallable("getStudentCohortsByPersonId");
  const result = await getStudentCohortsByPersonId(data);
  return result.data.cohorts;
};

export const fetchAllCohortsInCourseByCourseId = async (courseId: string): Promise<ICohort[]> => {
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

export const fetchCourses = async (slug?: string | null): Promise<ICourse[]> => {
  const data = {
    slug: slug ?? null,
  };
  const getCourses = functions.httpsCallable("getCourses");
  const result = await getCourses(data);
  return result.data.courses;
};

export const fetchCourseByCourseId = async (courseId: string): Promise<ICourse> => {
  const data = {
    courseId,
  };
  const getCourseByCourseId = functions.httpsCallable("getCourseByCourseId");
  const result = await getCourseByCourseId(data);
  return result.data.course;
};

export const fetchCourseMapEdgesAndNodesByCourseId = async (
  courseId: string,
): Promise<{ nodes: IMapNode[]; edges: IMapEdge[] }> => {
  const data = {
    courseId,
  };
  const getCourseMapEdgesAndNodesByCourseId = functions.httpsCallable(
    "getCourseMapEdgesAndNodesByCourseId",
  );
  const result = await getCourseMapEdgesAndNodesByCourseId(data);
  return { nodes: result.data.mapNodes, edges: result.data.mapEdges };
};

export const fetchTopicByCourseIdTopicId = async (
  courseId: string,
  topicId: string,
): Promise<ITopic> => {
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
): Promise<ITask> => {
  const data = {
    courseId,
    topicId,
    taskId,
  };
  const getTaskByCourseIdTopicIdTaskId = functions.httpsCallable("getTaskByCourseIdTopicIdTaskId");
  const result = await getTaskByCourseIdTopicIdTaskId(data);
  return result.data.task;
};

// organisation
export const fetchOrganisations = async (): Promise<IOrganisation[]> => {
  const data = {};
  const getOrganisations = functions.httpsCallable("getOrganisations");
  const result = await getOrganisations(data);
  return result.data.organisations;
};

export const fetchOrganisationByOrganisationId = async (
  organisationId: string,
): Promise<IOrganisation> => {
  const data = {
    organisationId,
  };
  const getOrganisationByOrganisationId = functions.httpsCallable(
    "getOrganisationByOrganisationId",
  );
  const result = await getOrganisationByOrganisationId(data);
  return result.data.organisation;
};

export const fetchPeopleByOrganisationId = async (organisationId: string): Promise<IPerson[]> => {
  const data = {
    organisationId,
  };
  const getPeopleByOrganisationId = functions.httpsCallable("getPeopleByOrganisationId");
  const result = await getPeopleByOrganisationId(data);
  return result.data.people;
};

export const createOrganisation = async (organisation: object): Promise<IOrganisation> => {
  const data = {
    organisation,
  };
  const createOrganisation = functions.httpsCallable("createOrganisation");
  const result = await createOrganisation(data);
  return result.data.organisation;
};

export const updateOrganisationByOrganisationId = async (
  organisationId: string,
  organisation: object,
): Promise<IOrganisation> => {
  const data = {
    organisationId,
    organisation,
  };
  const updateOrganisationByOrganisationId = functions.httpsCallable(
    "updateOrganisationByOrganisationId",
  );
  const result = await updateOrganisationByOrganisationId(data);
  return result.data.organisation;
};

export const addPersonToOrganisationByOrganisationIdAndPersonId = async (
  organisationId: string,
  personId: string,
): Promise<IOrganisation> => {
  const data = {
    organisationId,
    personId,
  };
  const addPersonToOrganisationByOrganisationIdAndPersonId = functions.httpsCallable(
    "addPersonToOrganisationByOrganisationIdAndPersonId",
  );
  const result = await addPersonToOrganisationByOrganisationIdAndPersonId(data);
  return result.data.organisation;
};

export const removePersonFromOrganisationByOrganisationIdAndPersonId = async (
  organisationId: string,
  personId: string,
): Promise<IOrganisation> => {
  const data = {
    organisationId,
    personId,
  };
  const removePersonFromOrganisationByOrganisationIdAndPersonId = functions.httpsCallable(
    "removePersonFromOrganisationByOrganisationIdAndPersonId",
  );
  const result = await removePersonFromOrganisationByOrganisationIdAndPersonId(data);
  return result.data.organisation;
};

export const deleteOrganisationByOrganisationId = async (
  organisationId: string,
): Promise<IOrganisation> => {
  const data = {
    organisationId,
  };
  const deleteOrganisationByOrganisationId = functions.httpsCallable(
    "deleteOrganisationByOrganisationId",
  );
  const result = await deleteOrganisationByOrganisationId(data);
  return result.data.organisation;
};

export const fetchPersonByPersonId = async (id: string): Promise<IPerson> => {
  const data = {
    personId: id,
  };
  const getPersonByPersonId = functions.httpsCallable("getPersonByPersonId");
  const result = await getPersonByPersonId(data);
  return result.data.person;
};

export const fetchPersonByEmail = async (email: string): Promise<IPerson | null> => {
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

export const createPerson = async (profile: Record<string, any>): Promise<IPerson> => {
  const data = {
    profile,
  };
  const createNewUser = functions.httpsCallable("createNewUser");
  const result = await createNewUser(data);
  return result.data.person;
};

export const updatePerson = async (personId: string, person: object): Promise<IPerson> => {
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
  courseId: string,
  topicId: string,
): Promise<IPersonTask[]> => {
  const data = {
    personId,
    courseId,
    topicId,
  };
  const getPersonTasksByPersonIdCourseIdTopicId = functions.httpsCallable(
    "getPersonTasksByPersonIdCourseIdTopicId",
  );
  const result = await getPersonTasksByPersonIdCourseIdTopicId(data);
  return result.data.personTasks;
};

export const fetchAllPeopleInCourseByCourseId = async (courseId: string): Promise<IPerson[]> => {
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
): Promise<IPersonTopic> => {
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

// add person to cohort
export const addMeToCohort = async (cohortId: string): Promise<ICohort> => {
  const data = {
    cohortId,
  };
  const addMeToCohort = functions.httpsCallable("addMeToCohort");
  const result = await addMeToCohort(data);
  return result.data.cohort;
};

export const addPersonToCohort = async (personId: string, cohortId: string): Promise<ICohort> => {
  const data = {
    personId,
    cohortId,
  };
  const addStudentToCohort = functions.httpsCallable("addStudentToCohort");
  const result = await addStudentToCohort(data);
  return result.data.cohort;
};

// add course to person
export const assignCourseToMe = async (courseId: string): Promise<ICourse> => {
  const data = {
    courseId,
  };
  const assignCourseToMe = functions.httpsCallable("assignCourseToMe");
  const result = await assignCourseToMe(data);
  return result.data.person;
};

export const assignCourseToPerson = async (
  personId: string,
  courseId: string,
): Promise<IPerson> => {
  const data = {
    personId,
    courseId,
  };
  const assignCourseToStudent = functions.httpsCallable("assignCourseToStudent");
  const result = await assignCourseToStudent(data);
  return result.data.person;
};
