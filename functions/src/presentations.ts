import functions, { runWith } from "firebase-functions/v1";
// import admin from "firebase-admin";
import { log } from "firebase-functions/logger";
import { v4 as makeUUID } from "uuid";
import { requireAuthenticated } from "./_shared.js";
// import fetch, { Headers } from 'node-fetch';
import dotenv from "dotenv";
dotenv.config();


const VERIFIER_URL = process.env.API_URL;
const VERIFIER_APIKEY = process.env.API_KEY;
const PRESENTATION_URL = process.env.PRES_URL;
let newPresentationId: string;

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

export const updateStudentVerified = functions.https.onRequest((req, res) => {
  log("webhooks hit");
  log(req.body.data);

  const { state, goalCode, connectionId, status, presentationId } = req?.body?.data || {};
  const { type } = req.body;

  log({ newPresentationId });
  log(req.body);

  const headers: HeadersInit = {
    accept: "application/json",
    "Content-Type": "application/json",
    apiKey: VERIFIER_APIKEY!,
  };

  if (
    connectionId
    && type === "ConnectionUpdated"
    && state === "ConnectionResponseSent"
    && goalCode === "beta-galaxy-maps-vc"
  ) {
    log("===Connection successful!!!===!");

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
      .then((result) => {
        console.log("Presentation req sent", result);
        newPresentationId = result.presentationId;
        res.sendStatus(200);
      })
      .catch(console.error);
  }

  if (
    presentationId === newPresentationId
    && type === "PresentationUpdated"
    && status === "PresentationVerified"
  ) {
    log("===Presentation verified===");
    fetch(`${VERIFIER_URL}/present-proof/presentations/${presentationId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        action: "presentation-accept",
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log("Presentation accepted", result);
        res.sendStatus(200);
      })
      .catch(console.error);
  }


  if (
    newPresentationId === presentationId
    && type === "PresentationUpdated"
    && status === "PresentationAccepted"
  ) {
    log("===Presentation Accepted send something to GM===");
    fetch(`${PRESENTATION_URL}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          studentId: presentationId,
        },
      }),
    });
  }
});
