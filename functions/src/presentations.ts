import functions, { runWith } from "firebase-functions/v1";
// import admin from "firebase-admin";
import { log } from "firebase-functions/logger";
import { v4 as makeUUID } from "uuid";
import { db, requireAuthenticated } from "./_shared.js";
// import fetch, { Headers } from 'node-fetch';
import dotenv from "dotenv";
dotenv.config();


const VERIFIER_URL = process.env.API_URL;
const VERIFIER_APIKEY = process.env.API_KEY;

export const createConnectionInvitation = runWith({}).https.onCall(
  async (_data, context) => {
    requireAuthenticated(context);
    log("create connection request hit");

    const headers: HeadersInit = {
      accept: "application/json",
      "Content-Type": "application/json",
      apiKey: VERIFIER_APIKEY!,
    };

    return fetch(`${VERIFIER_URL}/connections`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        label: "Connect Verifier and Member",
        goalCode: "beta-galaxy-maps-vc",
        goal: "prototype process for presenting VCs to Galaxy Maps from Āhau",
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        return res.data.result;
      })
      .catch(console.error);
  });

export const updateStudentVerified = functions.https.onRequest(async (req, res) => {
  log("1. webhooks hit");
  log(req.body);

  const { state, goalCode, connectionId, status, presentationId } = req?.body?.data || {};
  const { type } = req.body;

  const connRef = db.collection("connection").doc(connectionId);
  const connection = (await connRef.get()).data();

  const headers: HeadersInit = {
    accept: "application/json",
    "Content-Type": "application/json",
    apiKey: VERIFIER_APIKEY!,
  };

  if (
    connection
    && type === "ConnectionUpdated"
    && state === "ConnectionResponseSent"
    && goalCode === "beta-galaxy-maps-vc"
  ) {
    log("2. Connection successful");

    fetch(`${VERIFIER_URL}/present-proof/presentations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        connectionId,
        options: {
          challenge: makeUUID(), // random seed prover has to sign to prevent replay attacks
          domain: "www.galaxymaps.io",
        },
        proofs: [
          // TODO figure out how to manage proof Schemas
          // https://docs.atalaprism.io/agent-api/#tag/Present-Proof/operation/requestPresentation
          //
          // TODO figure out how / whether to use trustedIssuerDID
        ],
      }),
    })
      .then((response) => response.json())
      .then(async (result) => {
        log("3. Presentation req sent", result);
        // add presentationId to connection record
        await connRef.update({
          presentationId: result.presentationId,
          state: result.status,
        });
        console.log("4. Updated connection with presId");
        res.sendStatus(200);
      })
      .catch(console.error);
  }

  if (
    connection
    && type === "PresentationUpdated"
    && status === "PresentationVerified"
  ) {
    log("5. Presentation verified");
    fetch(`${VERIFIER_URL}/present-proof/presentations/${presentationId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        action: "presentation-accept",
      }),
    })
      .then((response) => response.json())
      .then(async (result) => {
        log("6. Presentation accepted", result);
        if (result.status === "PresentationAccepted") {
          const personRef = await db.collection("people").doc(connection.person);
          await personRef.update({ verified: true });
          log("7. Student profile updated");
        }
        res.sendStatus(200);
      })
      .catch(console.error);
  }
});
