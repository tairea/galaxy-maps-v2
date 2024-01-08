import admin from "firebase-admin";
import * as functions from "firebase-functions";
import { DOMAIN } from "./_constants.js";
import { db } from "./_shared.js";
import { sendStudentInviteEmail, sendTeacherInviteEmail } from "./emails.js";

// upgrade someones account to admin
export const addAdminRoleHttpsEndpoint = functions.https.onCall(async (uid: string, context) => {
  // check request is made by an admin
  if (context.auth == null) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to access this endpoint",
    );
  }
  if (context.auth.token.admin !== true) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can add other admins");
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
    functions.logger.error(err);
    throw new functions.https.HttpsError("internal", `something went wrong ${err}`);
  }
});

export const createNewUserHttpsEndpoint = functions.https.onCall(async (data, context) => {
  // TODO: this should be split and permissions checks ensured but that requires a major refactor
  // of how adding students to cohorts works
  if (context.auth == null) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to access this endpoint",
    );
  }

  const profile = data.profile as Record<string, unknown> | null;
  if (profile == null) {
    throw new functions.https.HttpsError("invalid-argument", "missing profile");
  }

  try {
    const createdUser = await admin.auth().createUser(profile);

    const person: { id: string } & Record<string, unknown> = {
      ...profile,
      id: createdUser.uid,
    };
    if (person.accountType === "teacher") {
      delete person.nsn;
      delete person.parentEmail;
    }
    delete person.inviter;
    await db.collection("people").doc(person.id).set(person);

    // Generate a magic email link
    // set magic link parameters
    const actionCodeSettings = {
      url: `https://${DOMAIN}/email_signin`,
      handleCodeInApp: true,
    };
    const link = await admin.auth().generateSignInWithEmailLink(data.email, actionCodeSettings);

    if (person.accountType == "teacher") {
      await sendTeacherInviteEmail(person.email as string, person.displayName as string, link);
    } else {
      await sendStudentInviteEmail(
        person.email as string,
        person.displayName as string,
        link,
        person.inviter as string,
      );
    }

    const personDoc = await db.collection("people").doc(person.id).get();

    return {
      person: {
        ...personDoc.data(),
        id: personDoc.id,
      },
    };
  } catch (err) {
    functions.logger.error(err);
    throw new functions.https.HttpsError("internal", `something went wrong ${err}`);
  }
});
