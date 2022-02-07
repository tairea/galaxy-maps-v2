const admin = require('firebase-admin');
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

admin.initializeApp();

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
  if ( context.auth.token.admin !== true ) {
    return {error: "Only admins can add other accounts"};
  }

  return admin.auth().createUser(data)
    .then((data) => {
      return data
    })
  .catch(console.error);
});

// Generate a magic email link
exports.generateEmailLink = functions.https.onCall((data, context) => {
  if ( context.auth.token.admin !== true ) {
    return {error: "Only admins can add other accounts"};
  }

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
 
 
exports.sendInviteEmail = functions.https.onCall((data, context) => {
  const email = data.email;
  const displayName = data.displayName;
  const link = data.link;

  return sendWelcomeEmail(email, displayName, link);
});

// Sends a welcome email to the given user.
async function sendWelcomeEmail(email, displayName, link) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.com>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Account created for ${APP_NAME}!`;
  mailOptions.text = `Hi ${displayName || ''}

Your teacher account has been created for ${APP_NAME}. 
Please click this link to sign into your account and setup your profile

${link}
  
If you have any issues please contact support@galaxymaps.com
  
Galaxy Maps Robot`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log('New invite email sent to:', email);
  return null;
}
 