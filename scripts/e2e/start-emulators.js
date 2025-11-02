#!/usr/bin/env node

const { spawn } = require("child_process");

const projectId = process.env.FIREBASE_PROJECT_ID || "galaxy-maps-ac367";
const services = ["auth", "firestore", "functions", "storage", "database"];

const firebaseProcess = spawn(
  "firebase",
  ["emulators:start", "--project", projectId, "--only", services.join(",")],
  {
    stdio: "inherit",
  },
);

firebaseProcess.on("close", (code) => {
  process.exitCode = code ?? 0;
});
