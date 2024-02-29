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

  const organisation = data.organisation as { name: string } | null;
  if (organisation == null) {
    throw new HttpsError("invalid-argument", "missing organisation");
  }

  // TODO: permissions checks

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
    const updatedOrganisation = updatedOrganisationDoc.data();

    return {
      organisation: {
        ...updatedOrganisation,
        id: updatedOrganisationDoc.id,
      },
    };
  },
);

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
