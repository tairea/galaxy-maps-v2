const admin = require('firebase-admin');
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

admin.initializeApp();

const firestore = admin.firestore();

// upgrade someones account to admin
exports.addAdminRole = functions.https.onCall((uid, context) => {
  // check request is made by an admin
  if ( context.auth.token.admin !== true ) {
    return {error: "Only admins can add other admins"};
  }
  // get user and add admin custom claim
  return admin.auth().getUser(uid).then((user) => {

    return admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    });
  }).then((data) => {
    return {
      message: `Success! ${data} has been made an admin.`,
    };
  }).catch((err) => {
    return {
      error: `something went wrong ${err}`,
    }
  });
});

// Create new user
exports.createUser = functions.https.onCall((data, context) => {
  // check request is made by an admin

  return admin.auth().createUser(data)
    .then((data) => {
      return data
    })
  .catch((err) => {
    return err
  });
});

// Generate a magic email link
exports.generateEmailLink = functions.https.onCall((data, context) => {

  // set magic link parameters
  const actionCodeSettings = {
    url: data.host + "/email_signin",
    handleCodeInApp: true,
  };

  return admin.auth().generateSignInWithEmailLink(data.email, actionCodeSettings)
  .then((link) => {
    functions.logger.log('link successfully created:', link);
    return link;
  }).catch((error) => {
    functions.logger.log('error creating link:', error);
    return error
  })
})

// CUSTOM INVITE EMAIL
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/

// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
// Set the gmail.email and gmail.password Google Cloud environment variables to match the email and password of the Gmail account used to send emails (or the app password if your account has 2-step verification enabled). 
// For this use: `firebase functions:config:set gmail.email="myusername@gmail.com" gmail.password="secretpassword"`

const APP_NAME = 'Galaxy Maps';
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});
 
//======GM APP INVITE EMAIL================== 
exports.sendInviteEmail = functions.https.onCall((data, context) => {
  const { email, displayName, link, inviter, accountType } = data

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
  mailOptions.text = `Hi ${displayName || ''}

Your teacher account has been created for ${APP_NAME}. 
Please click this link to sign into your account and setup your profile

${link}
  
If you have any issues please contact support@galaxymaps.io
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log('New teacher invite email sent to:', email);
  return null;
};
 
// Sends an invite email to a new student.
async function sendStudentInviteEmail(email, displayName, link, inviter) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Account created for ${APP_NAME}!`;
  mailOptions.text = `Hi ${displayName || ''}

Your teacher ${inviter}, has created you an account for ${APP_NAME}. 
Please click this link to sign into your account and setup your profile

${link}

If you have any issues please contact support@galaxymaps.io
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log('New student invite email sent to:', email);
  return null;
};


//======COHORT REGISTRATION NOTIFICATION==================
exports.sendNewCohortEmail = functions.https.onCall((data, context) => {
  const { email, displayName, firstName, inviter, accountType, cohort } = data
  return sendNewCohortEmail(email, displayName, firstName, inviter, accountType, cohort);
});

// Sends an invite email to a new teacher.
async function sendNewCohortEmail(email, displayName, firstName, inviter, accountType, cohort) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `New cohort registration`;
  mailOptions.text = `Hi ${displayName || firstName || ''}

You have been added as a ${accountType} to ${cohort} cohort by ${inviter} 
Sign into your Galaxy Maps account to view your new cohort.

https://galaxymaps.io
  
If you have any issues please contact support@galaxymaps.io
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log('New cohort invite email sent to:', email);
  return null;
};

//======COURSE REGISTRATION NOTIFICATION==================
exports.sendNewCourseEmail = functions.https.onCall((data, context) => {
  const { email, name, course } = data
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
  mailOptions.text = `Hi ${name || ''}

You have been assigned to ${course} Galaxy Map. 
Sign into your Galaxy Maps account to view your new course.

https://galaxymaps.io
  
If you have any issues please contact support@galaxymaps.io
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log('New assignment email sent to:', email);
  return null;
};

//  ============ Presence system sync ============
// Watch realtime DB for changes and trigger function on change
exports.onUserStatusChanged = functions.database.ref('/status/{uid}').onUpdate(
  async (change, context) => {
    // Get the data written to Realtime Database
    const eventStatus = change.after.val();

    // get the doc from the firestore DB
    const userStatusFirestoreRef = firestore.doc(`status/${context.params.uid}`);

    // It is likely that the Realtime Database change that triggered
    // this event has already been overwritten by a fast change in
    // online / offline status, so we'll re-read the current data
    // and compare the timestamps.
    const statusSnapshot = await change.after.ref.once('value');
    const status = statusSnapshot.val();
    functions.logger.log(status, eventStatus);
    // If the current timestamp for this data is newer than
    // the data that triggered this event, we exit this function.
    if (status.last_changed > eventStatus.last_changed) {
      return null;
    }

    // Otherwise, we convert the last_changed field to a Date
    eventStatus.last_changed = new Date(eventStatus.last_changed);

    // ... and write it to Firestore.
    return userStatusFirestoreRef.set(eventStatus);
});