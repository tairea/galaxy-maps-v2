#!/usr/bin/env node

const { spawn, execSync } = require("child_process");
const { resolve } = require("path");

const projectId = process.env.FIREBASE_PROJECT_ID || "galaxy-maps-ac367";
const services = ["auth", "firestore", "functions", "storage", "database"];

// Build functions before starting emulators to ensure they're available
console.log("🔨 Building Firebase Functions...");
try {
  execSync("npm run build", {
    cwd: resolve(__dirname, "../../functions"),
    stdio: "inherit",
  });
  console.log("✅ Functions built successfully");
} catch (error) {
  console.error("❌ Failed to build functions:", error.message);
  process.exit(1);
}

// Set environment variables for emulator detection
const env = {
  ...process.env,
  FIREBASE_EMULATOR_HUB: "true",
  FUNCTIONS_EMULATOR: "true",
};

const firebaseProcess = spawn(
  "firebase",
  ["emulators:start", "--project", projectId, "--only", services.join(",")],
  {
    stdio: "inherit",
    env,
  },
);

firebaseProcess.on("close", (code) => {
  process.exitCode = code ?? 0;
});
