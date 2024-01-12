// this must come fist
import "./_dotenv.js";
import "./_shared.js";

import { checkInactivitySchedule } from "./checkInactivity.js";
import {
  addMeToCohortHttpsEndpoint,
  addStudentToCohortHttpsEndpoint,
  assignCourseToMeHttpsEndpoint,
  assignCourseToStudentHttpsEndpoint,
  getCourseByCourseIdHttpsEndpoint,
  getCoursesHttpsEndpoint,
  getCohortByCohortIdHttpsEndpoint,
  getCohortsByCourseIdHttpsEndpoint,
  getCohortsByPersonIdHttpsEndpoint,
  getPeopleByCourseIdHttpsEndpoint,
  getPersonTasksByPersonIdCourseIdTopicIdHttpsEndpoint,
  getPersonTopicByPersonIdCourseIdTopicIdHttpsEndpoint,
  getTaskByCourseIdTopicIdTaskIdHttpsEndpoint,
  getTopicByCourseIdTopicIdHttpsEndpoint,
} from "./courseManagement.js";
import {
  sendCourseDeletedHttpsEndpoint,
  sendCoursePublishedEmailHttpsEndpoint,
  sendNewCohortEmailHttpsEndpoint,
  sendNewSubmissionEmailHttpsEndpoint,
  sendRequestForHelpHttpsEndpoint,
  sendResponseToHelpHttpsEndpoint,
  sendResponseToSubmissionHttpsEndpoint,
  sendTaskSubmissionHttpsEndpoint,
} from "./emails.js";
import { onUserStatusChangedOnUpdateTrigger } from "./presence.js";
import {
  addAdminRoleHttpsEndpoint,
  createNewUserHttpsEndpoint,
  getPersonByEmailHttpsEndpoint,
  getPersonByPersonIdHttpsEndpoint,
  updatePersonByPersonIdHttpsEndpoint,
} from "./userManagement.js";

export { checkInactivitySchedule as scheduledFunction };

export {
  addMeToCohortHttpsEndpoint as addMeToCohort,
  addStudentToCohortHttpsEndpoint as addStudentToCohort,
  assignCourseToMeHttpsEndpoint as assignCourseToMe,
  assignCourseToStudentHttpsEndpoint as assignCourseToStudent,
  getCourseByCourseIdHttpsEndpoint as getCourseByCourseId,
  getCoursesHttpsEndpoint as getCourses,
  getCohortByCohortIdHttpsEndpoint as getCohortByCohortId,
  getCohortsByCourseIdHttpsEndpoint as getCohortsByCourseId,
  getCohortsByPersonIdHttpsEndpoint as getCohortsByPersonId,
  getPeopleByCourseIdHttpsEndpoint as getPeopleByCourseId,
  getPersonTasksByPersonIdCourseIdTopicIdHttpsEndpoint as getPersonTasksByPersonIdCourseIdTopicId,
  getPersonTopicByPersonIdCourseIdTopicIdHttpsEndpoint as getPersonTopicByPersonIdCourseIdTopicId,
  getTaskByCourseIdTopicIdTaskIdHttpsEndpoint as getTaskByCourseIdTopicIdTaskId,
  getTopicByCourseIdTopicIdHttpsEndpoint as getTopicByCourseIdTopicId,
};

export {
  sendCourseDeletedHttpsEndpoint as sendCourseDeleted,
  sendCoursePublishedEmailHttpsEndpoint as sendCoursePublishedEmail,
  sendNewCohortEmailHttpsEndpoint as sendNewCohortEmail,
  sendNewSubmissionEmailHttpsEndpoint as sendNewSubmissionEmail,
  sendRequestForHelpHttpsEndpoint as sendRequestForHelp,
  sendResponseToHelpHttpsEndpoint as sendResponseToHelp,
  sendResponseToSubmissionHttpsEndpoint as sendResponseToSubmission,
  sendTaskSubmissionHttpsEndpoint as sendTaskSubmission,
};

export { onUserStatusChangedOnUpdateTrigger as onUserStatusChanged };

export {
  addAdminRoleHttpsEndpoint as addAdminRole,
  createNewUserHttpsEndpoint as createNewUser,
  getPersonByEmailHttpsEndpoint as getPersonByEmail,
  getPersonByPersonIdHttpsEndpoint as getPersonByPersonId,
  updatePersonByPersonIdHttpsEndpoint as updatePersonByPersonId,
};
