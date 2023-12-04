import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// upgrade someones account to admin
export const addAdminRoleHttpsEndpoint = functions.https.onCall((uid: string, context) => {
  // check request is made by an admin
  if (context.auth == null || context.auth.token.admin !== true) {
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
export const createUserHttpsEndpoint = functions.https.onCall((data, _context) => {
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
export const generateEmailLinkHttpsEndpoint = functions.https.onCall((data, _context) => {
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
