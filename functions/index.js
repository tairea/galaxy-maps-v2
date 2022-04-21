const admin = require("firebase-admin");
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
require("dotenv").config();

const {
  studentOnlineXAPIStatement,
  studentOfflineXAPIStatement,
} = require("./veracityLRS");

admin.initializeApp();

const firestore = admin.firestore();

// upgrade someones account to admin
exports.addAdminRole = functions.https.onCall((uid, context) => {
  // check request is made by an admin
  if (context.auth.token.admin !== true) {
    return { error: "Only admins can add other admins" };
  }
  // get user and add admin custom claim
  return admin
    .auth()
    .getUser(uid)
    .then((user) => {
      return admin.auth().setCustomUserClaims(user.uid, {
        admin: true,
      });
    })
    .then((data) => {
      return {
        message: `Success! ${data} has been made an admin.`,
      };
    })
    .catch((err) => {
      return {
        error: `something went wrong ${err}`,
      };
    });
});

// Create new user
exports.createUser = functions.https.onCall((data, context) => {
  // check request is made by an admin

  return admin
    .auth()
    .createUser(data)
    .then((data) => {
      return data;
    })
    .catch((err) => {
      return err;
    });
});

// Generate a magic email link
exports.generateEmailLink = functions.https.onCall((data, context) => {
  // set magic link parameters
  const actionCodeSettings = {
    url: data.host + "/email_signin",
    handleCodeInApp: true,
  };

  return admin
    .auth()
    .generateSignInWithEmailLink(data.email, actionCodeSettings)
    .then((link) => {
      functions.logger.log("link successfully created:", link);
      return link;
    })
    .catch((error) => {
      functions.logger.log("error creating link:", error);
      return error;
    });
});

// CUSTOM INVITE EMAIL
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/

// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
// Set the gmail.email and gmail.password Google Cloud environment variables to match the email and password of the Gmail account used to send emails (or the app password if your account has 2-step verification enabled).
// For this use: `firebase functions:config:set gmail.email="myusername@gmail.com" gmail.password="secretpassword"`

const APP_NAME = "Galaxy Maps";
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

//====== GM APP INVITE EMAIL ==================
exports.sendInviteEmail = functions.https.onCall((data, context) => {
  const { email, displayName, link, inviter, accountType } = data;

  if (accountType == "teacher") {
    return sendTeacherInviteEmail(email, displayName, link);
  } else return sendStudentInviteEmail(email, displayName, link, inviter);
});

// Sends an invite email to a new teacher.
async function sendTeacherInviteEmail(email, displayName, link) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Account created for ${APP_NAME}!`;
  mailOptions.text = `Hi ${displayName || ""}

Your teacher account has been created for ${APP_NAME}. 
Please click this link to sign into your account and setup your profile

${link}
  
If you have any issues please contact support@galaxymaps.io
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New teacher invite email sent to:", email);
  return null;
}

// ========== NEW STUDENT ACCOUNT CREATED EMAIL ===========
async function sendStudentInviteEmail(email, displayName, link, inviter) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Account created for ${APP_NAME}!`;
  mailOptions.text = `Hi ${displayName || ""}

Your teacher ${inviter}, has created you an account for ${APP_NAME}. 
Please click this link to sign into your account and setup your profile

${link}

If you have any issues please contact support@galaxymaps.io
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New student invite email sent to:", email);
  return null;
}

//======COHORT REGISTRATION NOTIFICATION==================
exports.sendNewCohortEmail = functions.https.onCall((data, context) => {
  const { email, displayName, firstName, inviter, accountType, cohort } = data;
  return sendNewCohortEmail(
    email,
    displayName,
    firstName,
    inviter,
    accountType,
    cohort
  );
});

// Sends an invite email to a new teacher.
async function sendNewCohortEmail(
  email,
  displayName,
  firstName,
  inviter,
  accountType,
  cohort
) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `New cohort registration`;
  mailOptions.text = `Hi ${displayName || firstName || ""}

You have been added as a ${accountType} to ${cohort} cohort by ${inviter} 
Sign into your Galaxy Maps account to view your new cohort.

https://galaxymaps.io
  
If you have any issues please contact support@galaxymaps.io
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New cohort invite email sent to:", email);
  return null;
}

//======COURSE REGISTRATION NOTIFICATION==================
exports.sendNewCourseEmail = functions.https.onCall((data, context) => {
  const { email, name, course } = data;
  sendNewCourseEmail(email, name, course);
});

// Sends a invite email to a new student.
async function sendNewCourseEmail(email, name, course) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `New Galaxy Assignment`;
  mailOptions.text = `Hi ${name || ""}

You have been assigned to ${course} Galaxy Map. 
Sign into your Galaxy Maps account to view your new course.

https://galaxymaps.io
  
If you have any issues please contact support@galaxymaps.io
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New assignment email sent to:", email);
  return null;
}

//======COURSE SUBMISSION NOTIFICATION==================
exports.sendNewSubmissionEmail = functions.https.onCall((data, context) => {
  const { author, title } = data;
  sendNewSubmissionEmail(author, title);
});

// Sends a invite email to a new student.
async function sendNewSubmissionEmail(author, title) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: `jamin.tairea@gmail.com`,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `New Galaxy Submission`;
  mailOptions.text = `Hi Team, 

${author} has submitted an new course called ${title}

Navigate to https://galaxymaps.io to approve the submission
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New course submission email sent to admin");
  return null;
}

//======COURSE PUBLISHED NOTIFICATION==================
exports.sendCoursePublishedEmail = functions.https.onCall((data, context) => {
  const { email, name, course } = data;
  sendCoursePublishedEmail(email, name, course);
});

// Sends a invite email to a new student.
async function sendCoursePublishedEmail(email, name, course) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Galaxy Approved`;
  mailOptions.text = `Hi ${name}, 

Your course ${course} has been approved and is now available on Galaxy Maps

Navigate to https://galaxymaps.io to view your course
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Course published email sent to", email);
  return null;
}

//  ============ PRESENCE SYSTEM SYNC ============
// Watch realtime DB for changes and trigger function on change
exports.onUserStatusChanged = functions.database
  .ref("/status/{uid}")
  .onUpdate(async (change, context) => {

    // Get the data written to Realtime Database
    const eventStatus = change.after.val();
    functions.logger.log("=====eventStatus=====: ", eventStatus)

    // get the doc from the firestore DB
    const userStatusFirestoreRef = firestore.doc(
      `status/${context.params.uid}`
    );

    // It is likely that the Realtime Database change that triggered
    // this event has already been overwritten by a fast change in
    // online / offline status, so we'll re-read the current data
    // and compare the timestamps.
    const statusSnapshot = await change.after.ref.once("value");
    const status = statusSnapshot.val();
    // If the current timestamp for this data is newer than
    // the data that triggered this event, we exit this function.
    if (status.last_changed > eventStatus.last_changed) {
      return null;
    }

    // Otherwise, we convert the last_changed field to a Date
    eventStatus.last_changed = new Date(eventStatus.last_changed);
    let person = await firestore
      .collection("people")
      .doc(context.params.uid)
      .get();
    person = {
      id: person.id,
      ...person.data(),
    };

    if (eventStatus.state === "online") studentOnlineXAPIStatement(person);
    if (eventStatus.state === "offline") studentOfflineXAPIStatement(person);

    // push XAPI statement here
    // ... and write it to Firestore.
    return userStatusFirestoreRef.set(eventStatus);
  });

//======REQUEST FOR HELP SENT ==================
exports.sendRequestForHelp = functions.https.onCall((data, context) => {
  const { email, teacher, course, task, student, request, topic } = data;
  sendRequestForHelp(email, teacher, course, task, student, request, topic);
});

// Sends a invite email to a new student.
async function sendRequestForHelp(email, teacher, course, task, student, request, topic) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `${course} Request for help`;
  mailOptions.text = `Hi ${teacher}, 

Your student, ${student} has sent a request for help.

Course: ${course}
Topic: ${topic}
Task: ${task}
Request: ${request}

To respond to ${student}, please login to https://galaxymaps.io to view your course
  
Galaxy Maps Robot`;
  
  mailOptions.html = `<strong>Hi ${teacher},</strong>
  </br> 
<p>Your student ${student} has sent a request for help.</p>
</br> 
<p>Course: ${course}</p>
<p>Topic: ${topic}</p>
<p>Task: ${task}</p>
<p>Request: ${request} </p>
</br> 
<p>To respond to ${student}, please login to <a href="https://galaxymaps.io" target="_blank">https://galaxymaps.io/login</a> to view your course</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Robot</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Request notification email sent to", email);
  return null;
}

//====== RESPONSE TO REQUEST ==================
exports.sendResponseToHelp = functions.https.onCall((data, context) => {
  const { email, teacher, course, task, student, response } = data;
  sendResponseToHelp(email, teacher, course, task, student, response);
});

// Sends a invite email to a new student.
async function sendResponseToHelp(email, teacher, course, task, student, response) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `${course} Response to your request`;
  mailOptions.text = `Hi ${student}, 

Your teacher ${teacher} has sent a response to your request for help.

Course: ${course}
Task: ${task}
Response: ${response} 

Login to https://galaxymaps.io to continue your course.
  
Galaxy Maps Robot`;
  
  mailOptions.html = `<p>Hi ${student},</p>
  </br> 
<p>Your teacher ${teacher} has sent a response to your request for help.</p>
</br> 
<p>Course: ${course}</p>
<p>Task: ${task}</p>
<p>Response: ${response} </p>
</br> 
<p>Login to <a href="https://galaxymaps.io" target="_blank">https://galaxymaps.io/login</a> to continue your course.</p>
</br> 
<p style="style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Robot</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Course published email sent to", email);
  return null;
}
