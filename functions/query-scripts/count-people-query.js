/*--------------------------
sometimes this script wont work because of node versions. needs to be run with node v20.
use something like nvm or mise.
eg. mise exec -- node query-scripts/count-people-query.js
--------------------------*/

// Quick script to count people in Firestore
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

// Load service account key
const serviceAccountPath = resolve(homedir(), "Downloads/galaxy-maps-ac367-781e01bee645.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin with service account
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function countPeople() {
  try {
    console.log("Querying people collection...");
    const snapshot = await db.collection("people").count().get();
    const count = snapshot.data().count;

    console.log(`\nTotal people in collection: ${count}`);

    // Get all users to show breakdown
    console.log("\nAnalyzing all users...");
    const allSnapshot = await db.collection("people").get();
    let verified = 0;
    let unverified = 0;
    let teachers = 0;
    let students = 0;

    allSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.emailVerified) verified++;
      if (!data.emailVerified) unverified++;
      if (data.isTeacher) teachers++;
      if (data.isStudent) students++;
    });

    console.log(`\nComplete analysis (all ${allSnapshot.size} records):`);
    console.log(`  - Email verified: ${verified}`);
    console.log(`  - Email not verified: ${unverified}`);
    console.log(`  - Teachers: ${teachers}`);
    console.log(`  - Students: ${students}`);

    process.exit(0);
  } catch (error) {
    console.error("Error counting people:", error.message);
    console.error("\nMake sure you are authenticated with Firebase.");
    console.error("Try running: gcloud auth application-default login");
    process.exit(1);
  }
}

countPeople();
