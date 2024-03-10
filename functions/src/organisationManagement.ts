import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { runWith } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { STORAGE_BUCKET } from "./_constants.js";
import { db, requireAuthenticated, storage } from "./_shared.js";

// Get organisation by organisationId
export const getOrganisationByOrganisationIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const organisationId = data.organisationId as string | null;
    if (organisationId == null) {
      throw new HttpsError("invalid-argument", "missing organisationId");
    }

    const organisationDoc = await db.collection("organisations").doc(organisationId).get();
    const organisationData = organisationDoc.data();

    if (organisationData == null) {
      throw new HttpsError("not-found", `Organisation not found: ${organisationId}`);
    }

    // TODO: permissions checks

    return {
      organisation: {
        ...organisationData,
        id: organisationDoc.id,
      },
    };
  },
);

// Get people by organisationId
export const getPeopleByOrganisationIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const organisationId = data.organisationId as string | null;
    if (organisationId == null) {
      throw new HttpsError("invalid-argument", "missing organisationId");
    }

    const organisationDoc = await db.collection("organisations").doc(organisationId).get();
    const organisationData = organisationDoc.data();

    if (organisationData == null) {
      throw new HttpsError("not-found", `Organisation not found: ${organisationId}`);
    }

    // TODO: permissions checks

    const peopleRefs = organisationData.people as DocumentReference[];
    const peopleDocs = await Promise.all(peopleRefs.map((ref) => ref.get()));

    const people = peopleDocs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return {
      people,
    };
  },
);

// Get organisations
export const getOrganisationsHttpsEndpoint = runWith({}).https.onCall(async (_data, context) => {
  requireAuthenticated(context);

  // TODO: permissions checks

  const organisationCollection = await db.collection("organisations").get();

  const organisationMap = new Map();
  for (const doc of organisationCollection.docs) {
    const organisation = doc.data();
    organisationMap.set(doc.id, {
      ...organisation,
      id: doc.id,
    });
  }
  return { organisations: Array.from(organisationMap.values()) };
});

// Create organisation
export const createOrganisationHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const organisation = data.organisation as ({ name: string } & Record<string, unknown>) | null;
  if (organisation == null) {
    throw new HttpsError("invalid-argument", "missing organisation");
  }

  // TODO: permissions checks

  if (organisation.people != null) {
    if (!Array.isArray(organisation.people)) {
      throw new HttpsError("invalid-argument", "people must be an array");
    }

    organisation.people = organisation.people.map((personRefOrId: string) =>
      personRefOrId.startsWith("/people/") || personRefOrId.startsWith("people/")
        ? db.doc(personRefOrId)
        : db.collection("people").doc(personRefOrId),
    );
  } else {
    organisation.people = [];
  }

  const organisationDoc = await db.collection("organisations").add(organisation);

  return {
    organisation: {
      ...organisation,
      id: organisationDoc.id,
    },
  };
});

// Update organisation by organisationId
export const updateOrganisationByOrganisationIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const organisationId = data.organisationId as string | null;
    const organisation = data.organisation as { name: string } | null;
    if (organisationId == null) {
      throw new HttpsError("invalid-argument", "missing organisationId");
    }
    if (organisation == null) {
      throw new HttpsError("invalid-argument", "missing organisation");
    }

    const organisationDoc = await db.collection("organisations").doc(organisationId).get();
    const organisationData = organisationDoc.data();

    if (organisationData == null) {
      throw new HttpsError("not-found", `Organisation not found: ${organisationId}`);
    }

    // TODO: permissions checks

    await organisationDoc.ref.update(organisation);

    const updatedOrganisationDoc = await organisationDoc.ref.get();
    const updatedOrganisationData = updatedOrganisationDoc.data();

    return {
      organisation: {
        ...updatedOrganisationData,
        people: updatedOrganisationData!.people.map((personRef: DocumentReference) => personRef.id),
        id: updatedOrganisationDoc.id,
      },
    };
  },
);

// Add person to organisation by organisationId and personId
export const addPersonToOrganisationByOrganisationIdAndPersonIdHttpsEndpoint = runWith(
  {},
).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const organisationId = data.organisationId as string | null;
  const personId = data.personId as string | null;
  if (organisationId == null) {
    throw new HttpsError("invalid-argument", "missing organisationId");
  }
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }

  const organisationDoc = await db.collection("organisations").doc(organisationId).get();
  const organisationData = organisationDoc.data();

  if (organisationData == null) {
    throw new HttpsError("not-found", `Organisation not found: ${organisationId}`);
  }

  const personDoc = await db.collection("people").doc(personId).get();
  const personData = personDoc.data();

  if (personData == null) {
    throw new HttpsError("not-found", `Person not found: ${personId}`);
  }

  // TODO: permissions checks

  await organisationDoc.ref.update({
    people: FieldValue.arrayUnion(personDoc.ref),
  });

  const updatedOrganisationDoc = await organisationDoc.ref.get();
  const updatedOrganisationData = updatedOrganisationDoc.data();

  return {
    organisation: {
      ...updatedOrganisationData,
      people: updatedOrganisationData!.people.map((personRef: DocumentReference) => personRef.id),
      id: updatedOrganisationDoc.id,
    },
  };
});

// Remove person from organisation by organisationId and personId
export const removePersonFromOrganisationByOrganisationIdAndPersonIdHttpsEndpoint = runWith(
  {},
).https.onCall(async (data, context) => {
  requireAuthenticated(context);

  const organisationId = data.organisationId as string | null;
  const personId = data.personId as string | null;
  if (organisationId == null) {
    throw new HttpsError("invalid-argument", "missing organisationId");
  }
  if (personId == null) {
    throw new HttpsError("invalid-argument", "missing personId");
  }

  const organisationDoc = await db.collection("organisations").doc(organisationId).get();
  const organisationData = organisationDoc.data();

  if (organisationData == null) {
    throw new HttpsError("not-found", `Organisation not found: ${organisationId}`);
  }

  const personDoc = await db.collection("people").doc(personId).get();
  const personData = personDoc.data();

  if (personData == null) {
    throw new HttpsError("not-found", `Person not found: ${personId}`);
  }

  // TODO: permissions checks

  await organisationDoc.ref.update({
    people: FieldValue.arrayRemove(personDoc.ref),
  });

  const updatedOrganisationDoc = await organisationDoc.ref.get();
  const updatedOrganisationData = updatedOrganisationDoc.data();

  return {
    organisation: {
      ...updatedOrganisationData,
      people: updatedOrganisationData!.people.map((personRef: DocumentReference) => personRef.id),
      id: updatedOrganisationDoc.id,
    },
  };
});

// Delete organisation by organisationId
export const deleteOrganisationByOrganisationIdHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    requireAuthenticated(context);

    const organisationId = data.organisationId as string | null;
    if (organisationId == null) {
      throw new HttpsError("invalid-argument", "missing organisationId");
    }

    const organisationDoc = await db.collection("organisations").doc(organisationId).get();
    const organisationData = organisationDoc.data();

    if (organisationData == null) {
      throw new HttpsError("not-found", `Organisation not found: ${organisationId}`);
    }

    // TODO: permissions checks

    await organisationDoc.ref.delete();

    const cohortCollection = await db
      .collection("cohorts")
      .where("organisation", "==", organisationDoc.id)
      .get();

    await Promise.all(cohortCollection.docs.map((doc) => doc.ref.update({ organisation: "" })));

    if (organisationData.image?.name != null && organisationData.image.name !== "") {
      console.log("deleting image...");

      // Create a reference to the file to delete
      const storageRef = storage
        .bucket(STORAGE_BUCKET)
        .file("organisation-images/" + organisationData.image.name);

      // Delete the file
      try {
        await storageRef.delete();
        console.log("Image successfully deleted!");
      } catch (error) {
        console.log("Uh-oh, an error occurred!", error);
      }
    }

    return {
      organisation: {
        ...organisationData,
        id: organisationDoc.id,
      },
    };
  },
);
