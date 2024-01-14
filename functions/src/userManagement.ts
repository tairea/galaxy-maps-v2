import { error } from "firebase-functions/logger";
import { onCall, HttpsError } from "firebase-functions/v1/https";
import { DOMAIN } from "./_constants.js";
import { auth, db, requireAuthenticated } from "./_shared.js";
import { sendStudentInviteEmail, sendTeacherInviteEmail } from "./emails.js";

// Get a person by personId
export const getPersonByPersonIdHttpsEndpoint = onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }

  const personDoc = await db.collection("people").doc(personId).get();
  const personData = personDoc.data();

  if (personData == null) {
    throw new HttpsError("not-found", `Person not found: ${personId}`);
  }

  // TODO: permissions checks

  return {
    person: {
      ...personData,
      id: personDoc.id,
    },
  };
});

// Get a person by email
export const getPersonByEmailHttpsEndpoint = onCall(async (data, context) => {
  requireAuthenticated(context);

  const email = data.email as string | null;
  if (email == null) {
    throw new HttpsError("invalid-argument", "missing email");
  }

  const queryResult = await db.collection("people").where("email", "==", email).limit(1).get();
  const personDoc = queryResult.docs[0];

  if (personDoc == null) {
    throw new HttpsError("not-found", `Person not found: ${email}`);
  }

  const personData = personDoc.data();

  if (personData == null) {
    throw new HttpsError("not-found", `Person not found: ${email}`);
  }

  // TODO: permissions checks

  return {
    person: {
      ...personData,
      id: personDoc.id,
    },
  };
});

// upgrade someones account to admin
export const addAdminRoleHttpsEndpoint = onCall(async (uid: string, context) => {
  requireAuthenticated(context);

  // check request is made by an admin
  if (context.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Only admins can add other admins");
  }

  // get user and add admin custom claim
  try {
    const user = await auth.getUser(uid);

    await auth.setCustomUserClaims(user.uid, {
      admin: true,
    });

    return {
      message: `Success! ${user.uid} has been made an admin.`,
    };
  } catch (err) {
    error(err);
    throw new HttpsError("internal", `something went wrong ${err}`);
  }
});

export const createNewUserHttpsEndpoint = onCall(async (data, context) => {
  requireAuthenticated(context);

  // TODO: this should be split and permissions checks ensured but that requires a major refactor
  // of how adding students to cohorts works

  const profile = data.profile as Record<string, unknown> | null;
  if (profile == null) {
    throw new HttpsError("invalid-argument", "missing profile");
  }

  try {
    const createdUser = await auth.createUser(profile);

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
    const link = await auth.generateSignInWithEmailLink(data.email, actionCodeSettings);

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
    error(err);
    throw new HttpsError("internal", `something went wrong ${err}`);
  }
});

// Update a person by personId
export const updatePersonByPersonIdHttpsEndpoint = onCall(async (data, context) => {
  requireAuthenticated(context);

  const personId = data.personId as string | null;
  const person = data.person as Record<string, unknown> | null;
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }
  if (person == null) {
    throw new HttpsError("invalid-argument", "missing person");
  }

  const personDoc = await db.collection("people").doc(personId).get();
  const personData = personDoc.data();

  if (personData == null) {
    throw new HttpsError("not-found", `Person not found: ${personId}`);
  }

  // TODO: permissions checks

  await personDoc.ref.update(personData);

  const updatedPersonDoc = await personDoc.ref.get();
  const updatedPersonData = personDoc.data();

  return {
    person: {
      ...updatedPersonData,
      id: updatedPersonDoc.id,
    },
  };
});
