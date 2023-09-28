import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// upgrade someones account to admin
export const addAdminRoleHttpsEndpoint = functions.https.onCall(async (uid: string, context) => {
  // check request is made by an admin
  if (context.auth == null || context.auth.token.admin !== true) {
    return { error: "Only admins can add other admins" };
  }

  // get user and add admin custom claim
  try {
    const user = await admin.auth().getUser(uid);

    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    });

    return {
      message: `Success! ${user.uid} has been made an admin.`,
    };
  } catch (err) {
    return {
      error: `something went wrong ${err}`,
    };
  }
});

// Create new user
export const createUserHttpsEndpoint = functions.https.onCall(async (data, _context) => {
  // check request is made by an admin

  try {
    const createdUser = await admin.auth().createUser(data);
    return createdUser;
  } catch (err) {
    return err;
  }
});

// Generate a magic email link
export const generateEmailLinkHttpsEndpoint = functions.https.onCall(async (data, _context) => {
  // set magic link parameters
  const actionCodeSettings = {
    url: data.host + "/email_signin",
    handleCodeInApp: true,
  };

  try {
    const link = await admin.auth().generateSignInWithEmailLink(data.email, actionCodeSettings);
    functions.logger.log("link successfully created:", link);
    return link;
  } catch (error) {
    functions.logger.log("error creating link:", error);
    return error;
  }
});
