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
  getPublicCoursesHttpsEndpoint,
  getMyCoursesHttpsEndpoint,
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
  saveTopicToStudentsHttpsEndpoint,
  deleteTopicForStudentsHttpsEndpoint,
  saveNodeHttpsEndpoint,
  removePrerequisitesFromTopicsHttpsEndpoint,
  updateStudentTopicPrerequisitesHttpsEndpoint,
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
  sendCollaboratorAddedEmailHttpsEndpoint,
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
  bulkImportStudentsHttpsEndpoint,
  createNewUserHttpsEndpoint,
  getPersonByEmailHttpsEndpoint,
  getPersonByPersonIdHttpsEndpoint,
  updatePersonByPersonIdHttpsEndpoint,
  updateUserPasswordHttpsEndpoint,
  resendInitialSetupLinkHttpsEndpoint,
} from "./userManagement.js";
import {
  downloadAndUploadImageHttpsEndpoint,
  generateGalaxyMapHttpsEndpoint,
  generateGalaxyMapWithClarificationHttpsEndpoint,
  generateGalaxyMapAgainHttpsEndpoint,
  generateInstructionsForMissionHttpsEndpoint,
  generateUnifiedGalaxyMapHttpsEndpoint,
  refineGalaxyMapHttpsEndpoint,
} from "./openAIActions.js";

// activity
export {
  getCohortCoursesActivityByCohortIdHttpsEndpoint as getCohortCoursesActivityByCohortId,
  getCohortStudentsActivityTimeByCohortIdHttpsEndpoint as getCohortStudentsActivityTimeByCohortId,
  getStudentActivityLogByPersonIdHttpsEndpoint as getStudentActivityLogByPersonId,
  getStudentCoursesActivityByPersonIdHttpsEndpoint as getStudentCoursesActivityByPersonId,
  // eslint-disable-next-line max-len
  getStudentCoursesTimeDataByPersonIdStartAtEndAtHttpsEndpoint as getStudentCoursesTimeDataByPersonIdStartAtEndAt,
};

// scheduled functions
export { checkInactivitySchedule as scheduledFunction };

// course management
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
  getPublicCoursesHttpsEndpoint as getPublicCourses,
  getMyCoursesHttpsEndpoint as getMyCourses,
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
  saveTopicToStudentsHttpsEndpoint as saveTopicToStudents,
  deleteTopicForStudentsHttpsEndpoint as deleteTopicForStudents,
  saveNodeHttpsEndpoint as saveNode,
  removePrerequisitesFromTopicsHttpsEndpoint as removePrerequisitesFromTopics,
  updateStudentTopicPrerequisitesHttpsEndpoint as updateStudentTopicPrerequisites,
};

// emails
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
  sendCollaboratorAddedEmailHttpsEndpoint as sendCollaboratorAddedEmail,
};

// organisation
export {
  getOrganisationByOrganisationIdHttpsEndpoint as getOrganisationByOrganisationId,
  getPeopleByOrganisationIdHttpsEndpoint as getPeopleByOrganisationId,
  getOrganisationsHttpsEndpoint as getOrganisations,
  createOrganisationHttpsEndpoint as createOrganisation,
  updateOrganisationByOrganisationIdHttpsEndpoint as updateOrganisationByOrganisationId,
  deleteOrganisationByOrganisationIdHttpsEndpoint as deleteOrganisationByOrganisationId,
};

// presence
export { onUserStatusChangedOnUpdateTrigger as onUserStatusChanged };

// user
export {
  addAdminRoleHttpsEndpoint as addAdminRole,
  bulkImportStudentsHttpsEndpoint as bulkImportStudents,
  createNewUserHttpsEndpoint as createNewUser,
  getPersonByEmailHttpsEndpoint as getPersonByEmail,
  getPersonByPersonIdHttpsEndpoint as getPersonByPersonId,
  updatePersonByPersonIdHttpsEndpoint as updatePersonByPersonId,
  updateUserPasswordHttpsEndpoint as updateUserPassword,
  resendInitialSetupLinkHttpsEndpoint as resendInitialSetupLink,
};

// openai
export {
  downloadAndUploadImageHttpsEndpoint as downloadAndUploadImage,
  generateGalaxyMapHttpsEndpoint as generateGalaxyMap,
  generateGalaxyMapWithClarificationHttpsEndpoint as generateGalaxyMapWithClarification,
  generateGalaxyMapAgainHttpsEndpoint as generateGalaxyMapAgain,
  generateInstructionsForMissionHttpsEndpoint as generateInstructionsForMission,
  generateUnifiedGalaxyMapHttpsEndpoint as generateUnifiedGalaxyMap,
  refineGalaxyMapHttpsEndpoint as refineGalaxyMap,
};
