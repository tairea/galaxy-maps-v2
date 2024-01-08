// this must come fist
import "./_dotenv.js";
import "./_shared.js";

import { checkInactivitySchedule } from "./checkInactivity.js";
import {
  addMeToCohortHttpsEndpoint,
  addStudentToCohortHttpsEndpoint,
  assignCourseToMeHttpsEndpoint,
  assignCourseToStudentHttpsEndpoint,
  getCourseByIdHttpsEndpoint,
  getCoursesHttpsEndpoint,
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
import { addAdminRoleHttpsEndpoint, createNewUserHttpsEndpoint } from "./userManagement.js";

export { checkInactivitySchedule as scheduledFunction };

export {
  addMeToCohortHttpsEndpoint as addMeToCohort,
  addStudentToCohortHttpsEndpoint as addStudentToCohort,
  assignCourseToMeHttpsEndpoint as assignCourseToMe,
  assignCourseToStudentHttpsEndpoint as assignCourseToStudent,
  getCourseByIdHttpsEndpoint as getCourseById,
  getCoursesHttpsEndpoint as getCourses,
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

export { addAdminRoleHttpsEndpoint as addAdminRole, createNewUserHttpsEndpoint as createNewUser };
