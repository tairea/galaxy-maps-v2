// this must come fist
import "./_dotenv.js";
import "./_shared.js";

import {
  getCohortCoursesActivityByCohortIdHttpsEndpoint,
  getCohortStudentsActivityTimeByCohortIdHttpsEndpoint,
  getStudentActivityLogByPersonIdHttpsEndpoint,
  getStudentCoursesActivityByPersonIdHttpsEndpoint,
  getStudentCoursesTimeDataByPersonIdStartAtEndAtHttpsEndpoint,
} from "./activity.js";
import { checkInactivitySchedule } from "./checkInactivity.js";
import {
  addMeToCohortHttpsEndpoint,
  addStudentToCohortHttpsEndpoint,
  assignCourseToMeHttpsEndpoint,
  assignCourseToStudentHttpsEndpoint,
  createTaskWithCourseIdTopicIdHttpsEndpoint,
  deleteTaskByCourseIdTopicIdTaskIdHttpsEndpoint,
  deleteRequestByCourseIdRequestIdHttpsEndpoint,
  getCourseByCourseIdHttpsEndpoint,
  getCourseMapEdgesAndNodesByCourseIdHttpsEndpoint,
  getCoursesHttpsEndpoint,
  getCohortByCohortIdHttpsEndpoint,
  getCohortsHttpsEndpoint,
  getCohortsByCourseIdHttpsEndpoint,
  getStudentCohortsByPersonIdHttpsEndpoint,
  getPeopleByCourseIdHttpsEndpoint,
  getPersonTasksByPersonIdCourseIdTopicIdHttpsEndpoint,
  getPersonTopicByPersonIdCourseIdTopicIdHttpsEndpoint,
  getPersonTopicsByPersonIdCourseIdHttpsEndpoint,
  getTaskByCourseIdTopicIdTaskIdHttpsEndpoint,
  getTasksByCourseIdTopicIdHttpsEndpoint,
  getTopicByCourseIdTopicIdHttpsEndpoint,
  getStudentSubmissionsByPersonIdHttpsEndpoint,
  getStudentRequestsByPersonIdHttpsEndpoint,
  getGalaxyMapObjectFromCourseHttpsEndpoint,
  updateTaskByCourseIdTopicIdTaskIdHttpsEndpoint,
  updateTaskOrderIndexesByCourseIdTopicIdHttpsEndpoint,
  removeMeFromCourseHttpsEndpoint,
  removeStudentFromCourseHttpsEndpoint,
  saveGalaxyMapHttpsEndpoint,
} from "./courseManagement.js";
import {
  sendCourseDeletedHttpsEndpoint,
  sendCoursePublishedEmailHttpsEndpoint,
  sendCourseCreatedEmailHttpsEndpoint,
  sendNewCohortEmailHttpsEndpoint,
  sendNewGalaxyEmailHttpsEndpoint,
  sendNewSubmissionEmailHttpsEndpoint,
  sendRequestForHelpHttpsEndpoint,
  sendResponseToHelpHttpsEndpoint,
  sendResponseToSubmissionHttpsEndpoint,
  sendTaskSubmissionHttpsEndpoint,
} from "./emails.js";
import {
  getOrganisationByOrganisationIdHttpsEndpoint,
  getPeopleByOrganisationIdHttpsEndpoint,
  getOrganisationsHttpsEndpoint,
  createOrganisationHttpsEndpoint,
  updateOrganisationByOrganisationIdHttpsEndpoint,
  deleteOrganisationByOrganisationIdHttpsEndpoint,
} from "./organisationManagement.js";
import { onUserStatusChangedOnUpdateTrigger } from "./presence.js";
import {
  addAdminRoleHttpsEndpoint,
  createNewUserHttpsEndpoint,
  getPersonByEmailHttpsEndpoint,
  getPersonByPersonIdHttpsEndpoint,
  updatePersonByPersonIdHttpsEndpoint,
} from "./userManagement.js";
import {
  downloadAndUploadImageHttpsEndpoint,
  generateGalaxyMapHttpsEndpoint,
  generateGalaxyMapWithClarificationHttpsEndpoint,
  generateInstructionsForMissionHttpsEndpoint,
} from "./openAIActions.js";

export {
  getCohortCoursesActivityByCohortIdHttpsEndpoint as getCohortCoursesActivityByCohortId,
  getCohortStudentsActivityTimeByCohortIdHttpsEndpoint as getCohortStudentsActivityTimeByCohortId,
  getStudentActivityLogByPersonIdHttpsEndpoint as getStudentActivityLogByPersonId,
  getStudentCoursesActivityByPersonIdHttpsEndpoint as getStudentCoursesActivityByPersonId,
  // eslint-disable-next-line max-len
  getStudentCoursesTimeDataByPersonIdStartAtEndAtHttpsEndpoint as getStudentCoursesTimeDataByPersonIdStartAtEndAt,
};

export { checkInactivitySchedule as scheduledFunction };

export {
  addMeToCohortHttpsEndpoint as addMeToCohort,
  addStudentToCohortHttpsEndpoint as addStudentToCohort,
  assignCourseToMeHttpsEndpoint as assignCourseToMe,
  assignCourseToStudentHttpsEndpoint as assignCourseToStudent,
  createTaskWithCourseIdTopicIdHttpsEndpoint as createTaskWithCourseIdTopicId,
  deleteTaskByCourseIdTopicIdTaskIdHttpsEndpoint as deleteTaskByCourseIdTopicIdTaskId,
  deleteRequestByCourseIdRequestIdHttpsEndpoint as deleteRequestByCourseIdRequestId,
  getCourseByCourseIdHttpsEndpoint as getCourseByCourseId,
  getCourseMapEdgesAndNodesByCourseIdHttpsEndpoint as getCourseMapEdgesAndNodesByCourseId,
  getCoursesHttpsEndpoint as getCourses,
  getCohortByCohortIdHttpsEndpoint as getCohortByCohortId,
  getCohortsHttpsEndpoint as getCohorts,
  getCohortsByCourseIdHttpsEndpoint as getCohortsByCourseId,
  getStudentCohortsByPersonIdHttpsEndpoint as getStudentCohortsByPersonId,
  getStudentSubmissionsByPersonIdHttpsEndpoint as getStudentSubmissionsByPersonId,
  getStudentRequestsByPersonIdHttpsEndpoint as getStudentRequestsByPersonId,
  getGalaxyMapObjectFromCourseHttpsEndpoint as getGalaxyMapObjectFromCourse,
  getPeopleByCourseIdHttpsEndpoint as getPeopleByCourseId,
  getPersonTasksByPersonIdCourseIdTopicIdHttpsEndpoint as getPersonTasksByPersonIdCourseIdTopicId,
  getPersonTopicByPersonIdCourseIdTopicIdHttpsEndpoint as getPersonTopicByPersonIdCourseIdTopicId,
  getPersonTopicsByPersonIdCourseIdHttpsEndpoint as getPersonTopicsByPersonIdCourseId,
  getTaskByCourseIdTopicIdTaskIdHttpsEndpoint as getTaskByCourseIdTopicIdTaskId,
  getTasksByCourseIdTopicIdHttpsEndpoint as getTasksByCourseIdTopicId,
  getTopicByCourseIdTopicIdHttpsEndpoint as getTopicByCourseIdTopicId,
  updateTaskByCourseIdTopicIdTaskIdHttpsEndpoint as updateTaskByCourseIdTopicIdTaskId,
  updateTaskOrderIndexesByCourseIdTopicIdHttpsEndpoint as updateTaskOrderIndexesByCourseIdTopicId,
  removeMeFromCourseHttpsEndpoint as removeMeFromCourse,
  removeStudentFromCourseHttpsEndpoint as removeStudentFromCourse,
  saveGalaxyMapHttpsEndpoint as saveGalaxyMap,
};

export {
  sendCourseDeletedHttpsEndpoint as sendCourseDeleted,
  sendCoursePublishedEmailHttpsEndpoint as sendCoursePublishedEmail,
  sendCourseCreatedEmailHttpsEndpoint as sendCourseCreatedEmail,
  sendNewCohortEmailHttpsEndpoint as sendNewCohortEmail,
  sendNewGalaxyEmailHttpsEndpoint as sendNewGalaxyEmail,
  sendNewSubmissionEmailHttpsEndpoint as sendNewSubmissionEmail,
  sendRequestForHelpHttpsEndpoint as sendRequestForHelp,
  sendResponseToHelpHttpsEndpoint as sendResponseToHelp,
  sendResponseToSubmissionHttpsEndpoint as sendResponseToSubmission,
  sendTaskSubmissionHttpsEndpoint as sendTaskSubmission,
};

export {
  getOrganisationByOrganisationIdHttpsEndpoint as getOrganisationByOrganisationId,
  getPeopleByOrganisationIdHttpsEndpoint as getPeopleByOrganisationId,
  getOrganisationsHttpsEndpoint as getOrganisations,
  createOrganisationHttpsEndpoint as createOrganisation,
  updateOrganisationByOrganisationIdHttpsEndpoint as updateOrganisationByOrganisationId,
  deleteOrganisationByOrganisationIdHttpsEndpoint as deleteOrganisationByOrganisationId,
};

export { onUserStatusChangedOnUpdateTrigger as onUserStatusChanged };

export {
  addAdminRoleHttpsEndpoint as addAdminRole,
  createNewUserHttpsEndpoint as createNewUser,
  getPersonByEmailHttpsEndpoint as getPersonByEmail,
  getPersonByPersonIdHttpsEndpoint as getPersonByPersonId,
  updatePersonByPersonIdHttpsEndpoint as updatePersonByPersonId,
};

export {
  downloadAndUploadImageHttpsEndpoint as downloadAndUploadImage,
  generateGalaxyMapHttpsEndpoint as generateGalaxyMap,
  generateGalaxyMapWithClarificationHttpsEndpoint as generateGalaxyMapWithClarification,
  generateInstructionsForMissionHttpsEndpoint as generateInstructionsForMission,
};
