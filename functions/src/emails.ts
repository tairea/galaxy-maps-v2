import { log } from "firebase-functions/logger";
import { config, runWith } from "firebase-functions/v1";
import { createTransport } from "nodemailer";
import { APP_NAME, DOMAIN } from "./_constants.js";

// CUSTOM INVITE EMAIL
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/

// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
// Set the gmail.email and gmail.password Google Cloud environment variables to match the email and
// password of the Gmail account used to send emails (or the app password if your account has
// 2-step verification enabled).
// For this use:
// firebase functions:config:set gmail.email="myusername@gmail.com" gmail.password="secretpassword"

const gmailEmail = config().gmail.email;
const gmailPassword = config().gmail.password;
const mailTransport = createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

/**
 * Sends an invite email to a new teacher.
 */
export async function sendTeacherInviteEmail(email: string, displayName: string, link: string) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  mailOptions.subject = `Account created for ${APP_NAME}!`;
  mailOptions.text = `Greetings ${displayName || ""}

Your Captain account has been created for ${APP_NAME}. 
Please click this link to sign into your account and setup your profile

${link}

If you have any issues please contact base@${DOMAIN}

Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  log("New teacher invite email sent to: ", email);
}

/**
 * Sends an invite email to a new student.
 */
export async function sendStudentInviteEmail(
  email: string,
  displayName: string,
  link: string,
  inviter: string,
) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  mailOptions.subject = `Account created for ${APP_NAME}!`;
  mailOptions.text = `Greetings, ${displayName || ""}.

Captain ${inviter}, has created you an account for ${APP_NAME}. 

Please click this link to sign into your account and setup your profile

${link}

If you have any issues please contact base@${DOMAIN}

Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  log("New student invite email sent to: ", email);
}

// ======COHORT REGISTRATION NOTIFICATION==================
export const sendNewCohortEmailHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, displayName, firstName, lastName, inviter, cohort } = data;
  return sendNewCohortEmail(email, displayName, firstName, lastName, inviter, cohort);
});

/**
 * Sends a new cohort registration notification.
 */
export async function sendNewCohortEmail(
  email: string,
  displayName: string,
  firstName: string,
  lastName: string,
  inviter: string,
  cohort: string,
) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  mailOptions.subject = "You've been add to a Squad";
  mailOptions.text = `Greetings, Navigator ${displayName || lastName || ""}

Captain ${inviter || ""} has assigned you to Squad: ${cohort}.

Sign into your Galaxy Maps account to view your missions.

https://${DOMAIN}/login
  
If you have any issues please contact base@${DOMAIN}
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  log("New cohort invite email sent to: ", email);
}

// ======COURSE REGISTRATION NOTIFICATION==================
export const sendNewGalaxyEmailHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, inviter, course } = data;
  return sendNewGalaxyEmail(email, inviter, course);
});
/**
 * Sends a new course registration notification email.
 */
export async function sendNewGalaxyEmail(email: string, inviter: string, course: string) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  mailOptions.subject = "New Galaxy Assignment";
  mailOptions.text = `Greetings Navigator

Captain ${inviter || ""} has assigned you to Galaxy Map: ${course}.

Sign into your Galaxy Maps account to start exploring this new galaxy.

https://${DOMAIN}
  
If you have any issues please contact base@${DOMAIN}
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  log("New assignment email sent to: ", email);
}

// ======COURSE SUBMISSION NOTIFICATION==================
export const sendNewSubmissionEmailHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { author, title, id } = data;
  sendNewSubmissionEmail(author, title, id);
});

/**
 * Sends a new submission notification email.
 */
export async function sendNewSubmissionEmail(author: string, title: string, id: string) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: "ian@tairea.io", // TODO: this should be dynamic
  };

  mailOptions.subject = "New Galaxy Submission";
  mailOptions.text = `Greetings Admin, 

${author} has submitted a new Galaxy Map called ${title} to be reviewed for PUBLIC / all users to access

Navigate to https://${DOMAIN}/galaxy/${id} from your ADMIN account to approve this map to be made public.
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  log("New course submission email sent to admin");
}

// ======COURSE PUBLISHED NOTIFICATION==================
export const sendCourseCreatedEmailHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, name, course, courseId } = data;
  sendCourseCreatedEmail(email, name, course, courseId);
});
/**
 * Sends a course published notification.
 */
export async function sendCourseCreatedEmail(
  email: string,
  name: string,
  course: string,
  courseId: string,
) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: "base@galaxymaps.io",
  };

  mailOptions.subject = "New Galaxy Created";
  mailOptions.text = `Greetings admin, 

  ${name} from ${email} has created a new galaxy called ${course}.

  Navigate to https://${DOMAIN}/galaxy/${courseId} to take a look.
  
Galaxy Maps Bot`;
  await mailTransport.sendMail(mailOptions);
  log("Course created email sent to admin");
}
// ======COURSE PUBLISHED NOTIFICATION==================
export const sendCoursePublishedEmailHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, name, course } = data;
  sendCoursePublishedEmail(email, name, course);
});

/**
 * Sends a course published notification.
 */
export async function sendCoursePublishedEmail(email: string, name: string, course: string) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  mailOptions.subject = "Galaxy Published";
  mailOptions.text = `Greetings Captain ${name}, 

Your galaxy map ${course} has been successfully published and a default Squad has been created so you can monitor the progress of Navigators that explore this Galaxy.

Go to https://${DOMAIN} to manage your Galaxy and the ${course} Squad.
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  log("Course published email sent to ", email);
}

// ======REQUEST FOR HELP SENT ==================
export const sendRequestForHelpHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, teacher, course, task, student, request, topic } = data;
  sendRequestForHelp(email, teacher, course, task, student, request, topic);
});

/**
 * Sends a request for help.
 */
export async function sendRequestForHelp(
  email: string,
  teacher: string,
  course: string,
  task: string,
  student: string,
  request: string,
  topic: string,
) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  /* eslint-disable max-len */
  mailOptions.subject = `${course} Request for help`;
  mailOptions.text = `Greetings Captain ${teacher}, 

Navigator ${student} has sent a REQUEST FOR HELP.

Galaxy Map: ${course}
System: ${topic}
Mission: ${task}

Their request for help: "${request}"

To respond to ${student}, please login to https://${DOMAIN}/dasboard to view your Requests for Help.
  
Galaxy Maps Team`;

  mailOptions.html = `<p>Greetings ${teacher},</p>
  </br> 
<p>Your student ${student} has sent a request for help.</p>
</br> 
<ul>
  <li>Course: ${course}</li>
  <li>Topic: ${topic}</li>
  <li>Task: ${task}</li>
</ul>
</br> 
<p>Request: <strong>${request}</strong> </p>
</br>
<p>To respond to ${student}, please login to <a href="https://${DOMAIN}" target="_blank">https://${DOMAIN}/login</a> to view your course</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  /* eslint-enable max-len */

  await mailTransport.sendMail(mailOptions);
  log("Request notification email sent to ", email);
}

// ====== RESPONSE TO REQUEST ==================
export const sendResponseToHelpHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, teacher, course, task, student, response, topic, request } = data;
  sendResponseToHelp(email, teacher, course, task, student, response, topic, request);
});

/**
 * Sends a response for help.
 */
export async function sendResponseToHelp(
  email: string,
  teacher: string,
  course: string,
  task: string,
  student: string,
  response: string,
  topic: string,
  request: string,
) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  /* eslint-disable max-len */
  mailOptions.subject = `${course} Response to your request`;
  mailOptions.text = `Greetings Navigator ${student}, 

Captain ${teacher} has replied to your request for help.

Galaxy Map: ${course}
System: ${topic}
Mission: ${task}

Your request: "${request}"

Captain's response: "${response}"

Login to https://${DOMAIN} to continue your missions.
  
Galaxy Maps Team`;

  mailOptions.html = `<p>Greetings Navigator ${student},</p>
  </br> 
<p>Captain ${teacher} has replied to your request for help.</p>
</br> 
<ul>
  <li>Galaxy: ${course}</li>
  <li>System: ${topic}</li>
  <li>Mission: ${task}</li>
</ul>
</br> 
<p>Your request: "${request}" </p>
</br> 
<p>Captain's response: <strong>"${response}"</strong></p>
</br> 
<p>Login to <a href="https://${DOMAIN}" target="_blank"
  >https://${DOMAIN}/login</a> to continue your missions.</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  /* eslint-enable max-len */

  await mailTransport.sendMail(mailOptions);
  log("Instructor response sent to ", email);
}

// ======SUBMISSION FOR TASK SENT ==================
export const sendTaskSubmissionHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, teacher, course, task, student, submission, topic, submissionInstructions } = data;
  sendTaskSubmission(
    email,
    teacher,
    course,
    task,
    student,
    submission,
    topic,
    submissionInstructions,
  );
});

/**
 * Sends a work submission notification.
 */
export async function sendTaskSubmission(
  email: string,
  teacher: string,
  course: string,
  task: string,
  student: string,
  submission: string,
  topic: string,
  submissionInstructions: string,
) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  /* eslint-disable max-len */
  mailOptions.subject = `${task} work submission`;
  mailOptions.text = `Greetings Captain ${teacher}, 

Navigator, ${student} has submitted work for your review.

Galaxy: ${course}
System: ${topic}
Mission: ${task}

Your Instructions:</span>
${submissionInstructions}

Navigator's Submission Response: ${submission}

To respond to ${student}'s submission and UNLOCK the next mission from them,
please login to https://${DOMAIN}/dashboard to respond to their submission
  
Galaxy Maps Team`;

  mailOptions.html = `<p>Greetings, Captain ${teacher}</p>
  </br> 
<p>Navigator ${student}, has submitted work for you to review.</p>
</br> 
<p><span style="text-decoration: underline;">Please note:</span> Navigators <strong>cannot</strong> progress until submissions are approved!!</p>
</br>
<hr>
</br>
<p style="text-decoration: underline;">Context:</p>
<ul>
  <li>Galaxy: ${course}</li>
  <li>System: ${topic}</li>
  <li>Mission: ${task}</li>
</ul>
</br> 
</br> 
<p style="text-decoration: underline;">Your Instructions:</p> 
<div style="border: 3px solid #E269CF; border-radius: 10px; padding:10px;">
<p>${submissionInstructions}</p>
</div>
</br>
</br>
<p style="text-decoration: underline;">Their Submission:</p> 
<div style="border: 3px solid #69A1E2; border-radius: 10px; padding:10px;">
<p>${submission}</p>
</div>
</br> 
</br>
<p>To respond to ${student}'s Submission and unlock their next mission,
please login to <a href="https://${DOMAIN}/dashboard" target="_blank"
  >https://${DOMAIN}/dashboard</a> to approve or decline their submission</p>
</br> 
<p style="font-size: 0.75rem !important;font-weight: 500;letter-spacing: 0.1666666667em !important;line-height: 2rem;text-transform: uppercase;font-family: "Roboto", sans-serif !important;">Galaxy Maps Team</p>`;
  /* eslint-enable max-len */

  await mailTransport.sendMail(mailOptions);
  log("Task submission notification email sent to ", email);
}

// ====== RESPONSE TO REQUEST ==================
export const sendResponseToSubmissionHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, teacher, course, task, firstName, lastName, outcome, topic, message, submission } =
    data;
  sendResponseToSubmission(
    email,
    teacher,
    course,
    topic,
    task,
    firstName,
    lastName,
    submission,
    outcome,
    message,
  );
});

/**
 * Sends a submission response notification.
 */
export async function sendResponseToSubmission(
  email: string,
  teacher: string,
  course: string,
  topic: string,
  task: string,
  firstName: string,
  lastName: string,
  submission: string,
  outcome: string,
  message: string,
) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  /* eslint-disable max-len */
  mailOptions.subject = `Mission ${task} ${outcome}`;

  // annoying auto format on save that indents to 6 when expected 8
  // indent then save without formatting
  mailOptions.text = `Greetings, Navigator ${
    lastName
      ? lastName.charAt(0).toUpperCase() + lastName.slice(1)
      : firstName
        ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
        : ""
  }

Captain ${teacher} has reviewed your submission for ${task}.

Galaxy: ${course}
System: ${topic}
Mission: ${task}

Your submission: ${submission} 

Submission outcome: ${outcome.toUpperCase()} 

Captain's message: ${message}

Login to https://${DOMAIN} to continue your mission.
  
Galaxy Maps Team`;

  mailOptions.html = `<p>Greetings, Navigator ${
    lastName
      ? lastName.charAt(0).toUpperCase() + lastName.slice(1)
      : firstName
        ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
        : ""
  }</p>
  </br> 
<p>Captain ${teacher} has reviewed your submission for ${task}.</p>
</br> 
<p><span style="text-decoration: underline;">Please note:</span> This is the outcome of your submission.</p>
</br>
<hr>
</br>
<p style="text-decoration: underline;">Context:</p>
<ul>
  <li>Galaxy: ${course}</li>
  <li>System: ${topic}</li>
  <li>Mission: ${task}</li>
</ul>
</br> 
</br> 
<p style="text-decoration: underline;">Your Submission:</p> 
<div style="border: 3px solid #69A1E2; border-radius: 10px; padding:10px;">
<p>${submission}</p>
</div>
</br>
</br>
<p style="text-decoration: underline;">Submission Outcome:</p> 
<div style="border: 3px solid #E269CF; border-radius: 10px; padding:10px;">
<p><strong>${outcome.toUpperCase()}</strong></p>
</div>
</br>
</br>
<p style="text-decoration: underline;">Captain's Message:</p> 
<div style="border: 3px solid #69A1E2; border-radius: 10px; padding:10px;">
<p>${message}</p>
</div>
</br> 
</br>
<p>Login to <a href="https://${DOMAIN}/dashboard" target="_blank"
  >https://${DOMAIN}/dashboard</a> to continue your mission.</p>
</br> 
<p style="font-size: 0.75rem !important;font-weight: 500;letter-spacing: 0.1666666667em !important;line-height: 2rem;text-transform: uppercase;font-family: "Roboto", sans-serif !important;">Galaxy Maps Team</p>`;
  /* eslint-enable max-len */

  await mailTransport.sendMail(mailOptions);
  log("Submission outcome sent to ", email);
}

/**
 * Sends an inactvity notification to student.
 */
export async function sendStudentInActive(student: string, studentEmail: string, duration: string) {
  // send email to student
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: studentEmail,
  };

  // The user subscribed to the newsletter.
  /* eslint-disable max-len */
  mailOptions.subject = "Student Activity Alert";
  mailOptions.text = `Greetings Navigator ${student}, 

It has been ${duration} since you last signed into Galaxy Maps. 

Sign in to https://${DOMAIN} now to continue your learning journey.
  
Galaxy Maps Team`;

  mailOptions.html = `<p><strong>Greetings Navigator ${student},</strong></p>
</br>
<p>It has been <strong>${duration}</strong> since you last signed into Galaxy Maps.</p>
</br> 
<p>Sign in to <a href="https://${DOMAIN}" target="_blank"
  >https://${DOMAIN}/dashboard</a> now to continue your learning journey.</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  /* eslint-enable max-len */

  await mailTransport.sendMail(mailOptions);
  log("student low activity alert sent", studentEmail);
}

/**
 * Sends a student inactivity notification to teacher.
 */
export async function sendTeacherStudentInActive(
  student: string,
  studentEmail: string,
  duration: string,
  email: string,
  cohort: string,
  teacher: string,
) {
  // send email to student
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  /* eslint-disable max-len */
  mailOptions.subject = "Student Activity Alert";
  mailOptions.text = `Greetings Captain ${teacher}, 
  
It has been ${duration} since Navigator: ${student} from Squad: ${cohort} last signed into Galaxy Maps. 

We recommend checking in on them via email ${studentEmail} to encourage and support them on their learning journey.
  
Galaxy Maps Team`;

  mailOptions.html = `<p><strong>Greetings Captain ${teacher},</strong></p>
  </br>
  <p>It has been <strong>${duration}</strong> since Navigator: <strong>${student}</strong> from Squad: <strong>${cohort}</strong> last signed into Galaxy Maps.</p>
  </br> 
  <p>  We recommend checking in on them via email <a href="mailto:${studentEmail}">${studentEmail}</a> to encourage and support them on their learning journey.</p>
  </br> 
  <p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  /* eslint-enable max-len */

  await mailTransport.sendMail(mailOptions);
  log("student low activity alert sent to teacher", email);
}

// ====== ACTIVE COURSE DELETED ==================
export const sendCourseDeletedHttpsEndpoint = runWith({}).https.onCall((data, _context) => {
  const { email, teacher, course, student, teacherEmail } = data;
  sendCourseDeleted(email, teacher, course, student, teacherEmail);
});

/**
 * Sends a course deleted notification.
 */
export async function sendCourseDeleted(
  email: string,
  teacher: string,
  course: string,
  student: string,
  teacherEmail: string,
) {
  const mailOptions: Record<string, string> = {
    from: `${APP_NAME} <noreply@${DOMAIN}>`,
    to: email,
  };

  // The user subscribed to the newsletter.

  /* eslint-disable max-len */
  mailOptions.subject = "Galaxy Deleted";
  mailOptions.text = `Greetings Navigator ${student || ""}, 

Captain ${teacher} has deleted the Galaxy ${course}.

If you have any questions or concerns about this please contact the Captain by email at ${teacherEmail}

Galaxy Maps Team`;

  mailOptions.html = `<p><strong>Greetings ${student},</strong></p>
  </br>
<p>Captain ${teacher} has deleted the Galaxy ${course}.</p>
</br> 
<p>If you have any questions or concerns about this please contact the Captain by email at <a href="mailto:${teacherEmail}">${teacherEmail}</a></p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  /* eslint-enable max-len */

  await mailTransport.sendMail(mailOptions);
  log("Galaxy deleted email sent to ", email);
}
