// this must come fist
import "./_dotenv.js";
import "./_shared.js";

import { checkInactivitySchedule } from "./checkInactivity.js";
import {
  assignTopicsAndTasksToMeHttpsEndpoint,
  assignTopicsAndTasksToStudentHttpsEndpoint,
  getCourseByIdHttpsEndpoint,
  getCoursesHttpsEndpoint,
} from "./courseManagement.js";
import {
  sendCourseDeletedHttpsEndpoint,
  sendCoursePublishedEmailHttpsEndpoint,
  sendInviteEmailHttpsEndpoint,
  sendNewCohortEmailHttpsEndpoint,
  sendNewCourseEmailHttpsEndpoint,
  sendNewSubmissionEmailHttpsEndpoint,
  sendRequestForHelpHttpsEndpoint,
  sendResponseToHelpHttpsEndpoint,
  sendResponseToSubmissionHttpsEndpoint,
  sendTaskSubmissionHttpsEndpoint,
} from "./emails.js";
import { onUserStatusChangedOnUpdateTrigger } from "./presence.js";
import {
  addAdminRoleHttpsEndpoint,
  createUserHttpsEndpoint,
  generateEmailLinkHttpsEndpoint,
} from "./userManagement.js";

export { checkInactivitySchedule as scheduledFunction };

export {
  assignTopicsAndTasksToMeHttpsEndpoint as assignTopicsAndTasksToMe,
  assignTopicsAndTasksToStudentHttpsEndpoint as assignTopicsAndTasksToStudent,
  getCourseByIdHttpsEndpoint as getCourseById,
  getCoursesHttpsEndpoint as getCourses,
};

export {
  sendCourseDeletedHttpsEndpoint as sendCourseDeleted,
  sendCoursePublishedEmailHttpsEndpoint as sendCoursePublishedEmail,
  sendInviteEmailHttpsEndpoint as sendInviteEmail,
  sendNewCohortEmailHttpsEndpoint as sendNewCohortEmail,
  sendNewCourseEmailHttpsEndpoint as sendNewCourseEmail,
  sendNewSubmissionEmailHttpsEndpoint as sendNewSubmissionEmail,
  sendRequestForHelpHttpsEndpoint as sendRequestForHelp,
  sendResponseToHelpHttpsEndpoint as sendResponseToHelp,
  sendResponseToSubmissionHttpsEndpoint as sendResponseToSubmission,
  sendTaskSubmissionHttpsEndpoint as sendTaskSubmission,
};

export { onUserStatusChangedOnUpdateTrigger as onUserStatusChanged };

export {
  addAdminRoleHttpsEndpoint as addAdminRole,
  createUserHttpsEndpoint as createUser,
  generateEmailLinkHttpsEndpoint as generateEmailLink,
};
