// Comprehensive test script for Firestore rules
// Run this with: npm run test:rules:with-data (imports test data first)
// Or: firebase emulators:exec --only firestore,auth "node test-rules.js"

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  connectFirestoreEmulator,
} = require("firebase/firestore");
const {
  getAuth,
  signInAnonymously,
  connectAuthEmulator,
  signOut,
  signInWithCustomToken,
  signInWithEmailAndPassword,
} = require("firebase/auth");
const {
  getAuth: getAdminAuth,
  connectAuthEmulator: connectAdminAuthEmulator,
} = require("firebase-admin/auth");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Firebase config for emulator
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "galaxy-maps-ac367.firebaseapp.com",
  projectId: "galaxy-maps-ac367",
  storageBucket: "galaxy-maps-ac367.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id",
};

// Initialize Firebase with emulator
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Firebase Admin for custom claims
const adminApp = admin.initializeApp(
  {
    projectId: "galaxy-maps-ac367",
  },
  "admin-app",
);
const adminAuth = adminApp.auth();

// Connect to both emulators
connectFirestoreEmulator(db, "127.0.0.1", 8080);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

// Set admin emulator host
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

function logTest(name, passed, details = "") {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   Details: ${details}`);
    console.log("--------------------------------");
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   Details: ${details}`);
  }
}

async function setupTestUsers() {
  console.log("👑 Setting up test users...");

  try {
    // Create admin1 user in Auth emulator
    const adminUser = await adminAuth.createUser({
      uid: "admin1",
      email: "admin@example.com",
      displayName: "Admin User",
      password: "admin123",
    });

    // Create student1 user in Auth emulator
    const studentUser = await adminAuth.createUser({
      uid: "student1",
      email: "student1@example.com",
      displayName: "Student One",
      password: "student123",
    });

    // Create teacher1 user in Auth emulator
    const teacherUser = await adminAuth.createUser({
      uid: "teacher1",
      email: "teacher1@example.com",
      displayName: "Teacher One",
      password: "teacher123",
    });

    // Set custom claims only for admin (as the app uses this)
    await adminAuth.setCustomUserClaims("admin1", { admin: true });

    // Create custom token only for admin
    const adminToken = await adminAuth.createCustomToken("admin1", { admin: true });

    console.log("✅ Test users created");
    return {
      adminUser,
      adminToken,
      studentUser,
      teacherUser,
    };
  } catch (error) {
    console.error("❌ Failed to setup test users:", error.message);
    throw error;
  }
}

async function importTestData() {
  console.log("📥 Importing test data...");

  try {
    // First, set up all test users
    const { adminUser, adminToken, studentUser, teacherUser } = await setupTestUsers();

    // Sign in as admin1 using the custom token
    const adminCredential = await signInWithCustomToken(auth, adminToken);
    const signedInAdmin = adminCredential.user;

    if (!signedInAdmin) {
      throw new Error("Failed to authenticate as admin for data import");
    }

    console.log(`✅ Authenticated as admin: ${signedInAdmin.uid}`);

    // Load test data
    const testDataPath = path.join(__dirname, "test-data.json");
    const testData = JSON.parse(fs.readFileSync(testDataPath, "utf8"));

    // IMPORTANT: Create admin user document for admin1 FIRST
    // This ensures the isAdmin() function in Firestore rules works correctly
    await setDoc(doc(db, "people", "admin1"), testData.people.admin1);
    console.log("  ✅ Admin user document created for admin1");

    // Import all people from test data (excluding admin1 which was already created)
    for (const [docId, docData] of Object.entries(testData.people)) {
      if (docId !== "admin1") {
        // Skip admin1 as it was already created
        await setDoc(doc(db, "people", docId), docData);
      }
    }
    console.log(`  ✅ People: ${Object.keys(testData.people).length} users`);

    for (const [docId, docData] of Object.entries(testData.cohorts)) {
      await setDoc(doc(db, "cohorts", docId), docData);
    }
    console.log(`  ✅ Cohorts: ${Object.keys(testData.cohorts).length} cohorts`);

    for (const [docId, docData] of Object.entries(testData.courses)) {
      await setDoc(doc(db, "courses", docId), docData);
    }
    console.log(`  ✅ Courses: ${Object.keys(testData.courses).length} courses`);

    for (const [docId, docData] of Object.entries(testData.slugs)) {
      await setDoc(doc(db, "slugs", docId), docData);
    }
    console.log(`  ✅ Slugs: ${Object.keys(testData.slugs).length} slugs`);

    // Import subcollections
    for (const [courseId, topics] of Object.entries(testData.topics)) {
      for (const [topicId, topicData] of Object.entries(topics)) {
        await setDoc(doc(db, "courses", courseId, "topics", topicId), topicData);
      }
    }
    console.log(`  ✅ Topics: ${Object.keys(testData.topics).length} courses with topics`);

    for (const [courseId, requests] of Object.entries(testData.requestsForHelp)) {
      for (const [requestId, requestData] of Object.entries(requests)) {
        await setDoc(doc(db, "courses", courseId, "requestsForHelp", requestId), requestData);
      }
    }
    console.log(
      `  ✅ Help Requests: ${Object.keys(testData.requestsForHelp).length} courses with requests`,
    );

    for (const [courseId, submissions] of Object.entries(testData.submissionsForReview)) {
      for (const [submissionId, submissionData] of Object.entries(submissions)) {
        await setDoc(
          doc(db, "courses", courseId, "submissionsForReview", submissionId),
          submissionData,
        );
      }
    }
    console.log(
      `  ✅ Submissions: ${
        Object.keys(testData.submissionsForReview).length
      } courses with submissions`,
    );

    for (const [courseId, courseTasks] of Object.entries(testData.tasks)) {
      for (const [topicId, topicTasks] of Object.entries(courseTasks)) {
        for (const [taskId, taskData] of Object.entries(topicTasks)) {
          await setDoc(doc(db, "courses", courseId, "topics", topicId, "tasks", taskId), taskData);
        }
      }
    }
    console.log(`  ✅ Tasks: ${Object.keys(testData.tasks).length} courses with tasks`);

    // Import map-nodes subcollections
    for (const [courseId, nodes] of Object.entries(testData["map-nodes"])) {
      for (const [nodeId, nodeData] of Object.entries(nodes)) {
        await setDoc(doc(db, "courses", courseId, "map-nodes", nodeId), nodeData);
      }
    }
    console.log(`  ✅ Map Nodes: ${Object.keys(testData["map-nodes"]).length} courses with nodes`);

    // Import map-edges subcollections
    for (const [courseId, edges] of Object.entries(testData["map-edges"])) {
      for (const [edgeId, edgeData] of Object.entries(edges)) {
        await setDoc(doc(db, "courses", courseId, "map-edges", edgeId), edgeData);
      }
    }
    console.log(`  ✅ Map Edges: ${Object.keys(testData["map-edges"]).length} courses with edges`);

    console.log("🎉 Test data import completed successfully!\n");

    // Store test credentials globally for reuse in tests
    global.testCredentials = {
      admin: { user: adminUser, token: adminToken },
    };

    // Sign out admin after import
    await signOut(auth);
  } catch (error) {
    console.error("❌ Test data import failed:", error.message);
    throw error;
  }
}

async function testUnauthenticatedAccess() {
  console.log("\n🔒 Testing unauthenticated access...");

  // Test reading people (should fail for unauthenticated users)
  try {
    await getDoc(doc(db, "people", "student1"));
    logTest("Unauthenticated read people", false, "Should be denied");
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Unauthenticated read people", true, "Correctly denied");
    } else {
      logTest("Unauthenticated read people", false, `Unexpected error: ${error.message}`);
    }
  }

  // Test creating user profile (should fail)
  try {
    await setDoc(doc(db, "people", "anonymousUser"), {
      firstName: "Anonymous",
      lastName: "User",
      displayName: "anonymous.user",
      email: "anonymous@example.com",
      status: "active",
      role: "student",
      admin: false,
      registered: true,
    });
    logTest("Unauthenticated create user profile", false, "Should be denied");
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Unauthenticated create user profile", true, "Correctly denied");
    } else {
      logTest("Unauthenticated create user profile", false, `Unexpected error: ${error.message}`);
    }
  }

  // Test reading public courses (should pass - course1 is public)
  try {
    await getDoc(doc(db, "courses", "course1"));
    logTest("Unauthenticated read public courses", true);
  } catch (error) {
    logTest("Unauthenticated read public courses", false, error.message);
  }

  // Test reading topics (should pass - course1 is public)
  try {
    await getDoc(doc(db, "courses", "course1", "topics", "topic1"));
    logTest("Unauthenticated read public topics", true);
  } catch (error) {
    logTest("Unauthenticated read public topics", false, error.message);
  }

  // Test reading tasks (should fail - must be assigned to course)
  try {
    await getDoc(doc(db, "courses", "course1", "topics", "topic1", "tasks", "task1"));
    logTest("Unauthenticated read public tasks", true);
  } catch (error) {
    logTest("Unauthenticated read public tasks", false, `Unexpected error: ${error.message}`);
  }

  // Test reading private courses (should fail - course2 is private)
  try {
    await getDoc(doc(db, "courses", "course2"));
    logTest("Unauthenticated read private courses", false, "Should be denied");
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Unauthenticated read private courses", true, "Correctly denied");
    } else {
      logTest("Unauthenticated read private courses", false, `Unexpected error: ${error.message}`);
    }
  }

  // Test reading map nodes from public course (should pass - course1 is public)
  try {
    await getDoc(doc(db, "courses", "course1", "map-nodes", "node1"));
    logTest("Unauthenticated read public course map nodes", true);
  } catch (error) {
    logTest("Unauthenticated read public course map nodes", false, error.message);
  }

  // Test reading map edges from public course (should pass - course1 is public)
  try {
    await getDoc(doc(db, "courses", "course1", "map-edges", "edge1"));
    logTest("Unauthenticated read public course map edges", true);
  } catch (error) {
    logTest("Unauthenticated read public course map edges", false, error.message);
  }

  // Test reading map nodes from private course (should fail - course2 is private)
  try {
    await getDoc(doc(db, "courses", "course2", "map-nodes", "node1"));
    logTest("Unauthenticated read private course map nodes", false, "Should be denied");
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Unauthenticated read private course map nodes", true, "Correctly denied");
    } else {
      logTest(
        "Unauthenticated read private course map nodes",
        false,
        `Unexpected error: ${error.message}`,
      );
    }
  }

  // Test reading map edges from private course (should fail - course2 is private)
  try {
    await getDoc(doc(db, "courses", "course2", "map-edges", "edge1"));
    logTest("Unauthenticated read private course map edges", false, "Should be denied");
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Unauthenticated read private course map edges", true, "Correctly denied");
    } else {
      logTest(
        "Unauthenticated read private course map edges",
        false,
        `Unexpected error: ${error.message}`,
      );
    }
  }

  // Test reading cohorts (should fail)
  try {
    await getDoc(doc(db, "cohorts", "cohort1"));
    logTest("Unauthenticated read cohorts", false, "Should be denied");
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Unauthenticated read cohorts", true, "Correctly denied");
    } else {
      logTest("Unauthenticated read cohorts", false, `Unexpected error: ${error.message}`);
    }
  }

  // Test reading slugs (should succeed - public)
  try {
    await getDoc(doc(db, "slugs", "intro-navigation"));
    logTest("Unauthenticated read slugs", true);
  } catch (error) {
    logTest("Unauthenticated read slugs", false, error.message);
  }
}

async function testStudentAccess() {
  console.log("\n👨‍🎓 Testing student access...");

  try {
    // Sign in as student1 using email/password (like the real app)
    const studentCredential = await signInWithEmailAndPassword(
      auth,
      "student1@example.com",
      "student123",
    );
    const studentUser = studentCredential.user;

    console.log(`✅ Student authenticated as: ${studentUser.uid}`);

    // Student1 already exists in test data, so we don't need to create it
    logTest("Student profile exists", true);

    // Test reading own profile (should succeed - full access)
    try {
      await getDoc(doc(db, "people", studentUser.uid));
      logTest("Student read own profile", true);
    } catch (error) {
      logTest("Student read own profile", false, error.message);
    }

    // Test reading info of other users (should succeed)
    try {
      const otherUserDoc = await getDoc(doc(db, "people", "student2"));
      if (otherUserDoc.exists()) {
        const data = otherUserDoc.data();
        console.log("Student read basic info of others: ", data);
        // Check that we can access firstName but not email
        if (data.firstName && data.email && data.lastName) {
          logTest(
            "Student read profile info of others",
            true,
            "Can access firstName, email and lastName",
          );
        } else {
          logTest("Student read profile info of others", false, "Cannot access profile info");
        }
      } else {
        logTest("Student read profile info of others", false, "Document does not exist");
      }
    } catch (error) {
      logTest("Student read profile info of others", false, error.message);
    }

    // Test that users can create a profiles (should succeed)
    try {
      await setDoc(doc(db, "people", "student5"), {
        firstName: "Self",
        lastName: "Created",
        displayName: "self.created",
        email: "selfcreated@example.com",
        status: "active",
        role: "student",
        registered: true,
        createdAt: new Date(),
      });
      logTest("User can create new profile", true);
    } catch (error) {
      logTest("User can create new profile", false, error.message);
    }

    // Test that users can update their own profile (should succeed)
    try {
      await updateDoc(doc(db, "people", "student1"), {
        firstName: "Updated",
        email: "updated@example.com",
      });
      logTest("User update own profile", true);
    } catch (error) {
      logTest("User update own profile", false, error.message);
    }

    // Test that users cannot update other users' profiles (should fail)
    try {
      await updateDoc(doc(db, "people", "student2"), {
        firstName: "Modified",
        updatedBy: "student1",
      });
      logTest("Student update other user profile", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Student update other user profile", true, "Correctly denied");
      } else {
        logTest("Student update other user profile", false, `Unexpected error: ${error.message}`);
      }
    }

    // Test reading assigned course tasks (should succeed)
    try {
      await getDoc(doc(db, "courses", "course1", "topics", "topic1", "tasks", "task1"));
      logTest("Student read assigned course tasks", true);
    } catch (error) {
      logTest("Student read assigned course tasks", false, error.message);
    }

    // Test reading private courses - not assigned to student (should fail)
    try {
      await getDoc(doc(db, "courses", "course3"));
      logTest("Student read unassigned private courses", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Student read unassigned private courses", true, "Correctly denied");
      } else {
        logTest(
          "Student read unassigned private courses",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test reading private courses - assigned to student (should succeed)
    try {
      await getDoc(doc(db, "courses", "course2"));
      logTest("Student read assigned private course", true);
    } catch (error) {
      logTest("Student read assigned private course", false, error.message);
    }

    // Test reading assigned private course topics (should succeed)
    try {
      await getDoc(doc(db, "courses", "course2", "topics", "topic1"));
      logTest("Student read assigned private course topics", true);
    } catch (error) {
      logTest("Student read assigned private course topics", false, error.message);
    }

    // Test reading assigned private course tasks (should succeed)
    try {
      await getDoc(doc(db, "courses", "course2", "topics", "topic1", "tasks", "task1"));
      logTest("Student read assigned private course tasks", true);
    } catch (error) {
      logTest("Student read assigned private course tasks", false, error.message);
    }

    // Test reading assigned private course map nodes (should succeed)
    try {
      await getDoc(doc(db, "courses", "course2", "map-nodes", "node1"));
      logTest("Student read assigned private course map nodes", true);
    } catch (error) {
      logTest("Student read assigned private course map nodes", false, error.message);
    }

    // Test reading assigned private course map edges (should succeed)
    try {
      await getDoc(doc(db, "courses", "course2", "map-edges", "edge1"));
      logTest("Student read assigned private course map edges", true);
    } catch (error) {
      logTest("Student read assigned private course map edges", false, error.message);
    }

    // Test that student1 (not assigned to course3) cannot read course3 (should fail)
    try {
      await getDoc(doc(db, "courses", "course3"));
      logTest("Unassigned student read private course", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Unassigned student read private course", true, "Correctly denied");
      } else {
        logTest(
          "Unassigned student read private course",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test reading public courses (should pass - course4 is public)
    try {
      await getDoc(doc(db, "courses", "course4"));
      logTest("Student read public courses", true);
    } catch (error) {
      logTest("Student read public courses", false, error.message);
    }

    // Test reading public course tasks (should fail - course4 is public)
    try {
      await getDoc(doc(db, "courses", "course4", "topics", "topic1", "tasks", "task1"));
      logTest("Unassigned student can read public course tasks", true);
    } catch (error) {
      logTest(
        "Unassigned student can read public course tasks",
        false,
        `Unexpected error: ${error.message}`,
      );
    }

    // Test reading public course topics (should succeed)
    try {
      await getDoc(doc(db, "courses", "course4", "topics", "topic1"));
      logTest("Student read public course topics", true);
    } catch (error) {
      logTest("Student read public course topics", false, error.message);
    }

    // Test reading map nodes from assigned course (should succeed)
    try {
      await getDoc(doc(db, "courses", "course1", "map-nodes", "node1"));
      logTest("Student read assigned course map nodes", true);
    } catch (error) {
      logTest("Student read assigned course map nodes", false, error.message);
    }

    // Test reading map edges from assigned course (should succeed)
    try {
      await getDoc(doc(db, "courses", "course1", "map-edges", "edge1"));
      logTest("Student read assigned course map edges", true);
    } catch (error) {
      logTest("Student read assigned course map edges", false, error.message);
    }

    // Test reading map nodes from public course (should succeed - course4 is public)
    try {
      await getDoc(doc(db, "courses", "course4", "map-nodes", "node1"));
      logTest("Student read public course map nodes", true);
    } catch (error) {
      logTest("Student read public course map nodes", false, error.message);
    }

    // Test reading map edges from public course (should succeed - course4 is public)
    try {
      await getDoc(doc(db, "courses", "course4", "map-edges", "edge1"));
      logTest("Student read public course map edges", true);
    } catch (error) {
      logTest("Student read public course map edges", false, error.message);
    }

    // Test reading map nodes from private course not assigned (should fail)
    try {
      await getDoc(doc(db, "courses", "course3", "map-nodes", "node1"));
      logTest("Student read unassigned private course map nodes", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Student read unassigned private course map nodes", true, "Correctly denied");
      } else {
        logTest(
          "Student read unassigned private course map nodes",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test reading map edges from private course not assigned (should fail)
    try {
      await getDoc(doc(db, "courses", "course3", "map-edges", "edge1"));
      logTest("Student read unassigned private course map edges", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Student read unassigned private course map edges", true, "Correctly denied");
      } else {
        logTest(
          "Student read unassigned private course map edges",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test creating map nodes (should fail - students cannot edit courses)
    try {
      await addDoc(collection(db, "courses", "course1", "map-nodes"), {
        title: "Student Created Node",
        description: "A node created by a student",
        type: "content",
        position: { x: 600, y: 100 },
        createdBy: "student1",
        createdAt: new Date(),
        status: "active",
      });
      logTest("Student create map nodes", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Student create map nodes", true, "Correctly denied");
      } else {
        logTest("Student create map nodes", false, `Unexpected error: ${error.message}`);
      }
    }

    // Test creating map edges (should fail - students cannot edit courses)
    try {
      await addDoc(collection(db, "courses", "course1", "map-edges"), {
        from: "node3",
        to: "node1",
        label: "Student Edge",
        type: "progression",
        createdBy: "student1",
        createdAt: new Date(),
        status: "active",
      });
      logTest("Student create map edges", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Student create map edges", true, "Correctly denied");
      } else {
        logTest("Student create map edges", false, `Unexpected error: ${error.message}`);
      }
    }

    // Test reading cohort (should succeed if signed in)
    try {
      await getDoc(doc(db, "cohorts", "cohort1"));
      logTest("Student read cohort", true);
    } catch (error) {
      logTest("Student read cohort", false, error.message);
    }

    // Test that students can update a cohort by adding their ID to cohort.students
    try {
      // First, get the current cohort data to see if student1 is already in it
      const cohortDoc = await getDoc(doc(db, "cohorts", "cohort2"));
      if (cohortDoc.exists()) {
        const cohortData = cohortDoc.data();
        const currentStudents = cohortData.students || [];
        // Add student1 to the students array
        await updateDoc(doc(db, "cohorts", "cohort2"), {
          students: [...currentStudents, "student1"],
        });
        logTest(
          "Student update cohort by adding self to students array",
          true,
          "Successfully added student1 to cohort2.students",
        );
      } else {
        logTest(
          "Student update cohort by adding self to students array",
          false,
          "Cohort2 document does not exist",
        );
      }
    } catch (error) {
      logTest("Student update cohort by adding self to students array", false, error.message);
    }

    // Test reading help requests (should succeed for any authenticated user)
    try {
      await getDoc(doc(db, "courses", "course1", "requestsForHelp", "request1"));
      logTest("Student read help requests", true);
    } catch (error) {
      logTest("Student read help requests", false, error.message);
    }

    // Test reading submissions (should succeed for any authenticated user)
    try {
      await getDoc(doc(db, "courses", "course1", "submissionsForReview", "submission1"));
      logTest("Student read submissions", true);
    } catch (error) {
      logTest("Student read submissions", false, error.message);
    }

    // Test creating help requests (should succeed for any authenticated user)
    try {
      await addDoc(collection(db, "courses", "course1", "requestsForHelp"), {
        title: "Student Help Request",
        description: "This is a help request from a student",
        personId: "student1",
        status: "open",
        createdAt: new Date(),
      });
      logTest("Student create help requests", true);
    } catch (error) {
      logTest("Student create help requests", false, error.message);
    }

    // Test creating submissions (should succeed for any authenticated user)
    try {
      await addDoc(collection(db, "courses", "course1", "submissionsForReview"), {
        title: "Student Submission",
        description: "This is a submission from a student",
        personId: "student1",
        status: "pending",
        createdAt: new Date(),
      });
      logTest("Student create submissions", true);
    } catch (error) {
      logTest("Student create submissions", false, error.message);
    }

    await signOut(auth);
  } catch (error) {
    console.log("❌ Student access test failed:", error.message);
    logTest("Student authentication setup", false, error.message);
  }
}

async function testTeacherAccess() {
  console.log("\n👨‍🏫 Testing teacher access...");

  try {
    // Sign in as teacher1 using email/password (like the real app)
    const teacherCredential = await signInWithEmailAndPassword(
      auth,
      "teacher1@example.com",
      "teacher123",
    );
    const teacherUser = teacherCredential.user;

    console.log(`✅ Teacher authenticated as: ${teacherUser.uid}`);

    // Teacher1 already exists in test data, so we don't need to create it
    logTest("Teacher profile exists", true);

    // Test reading profile info of other users
    try {
      const otherUserDoc = await getDoc(doc(db, "people", "student2"));
      if (otherUserDoc.exists()) {
        const data = otherUserDoc.data();
        // Check that we can access firstName but not email
        if (data.firstName && data.email) {
          logTest("Teacher read basic profile info of others", true, "Can access all profile info");
        } else {
          logTest("Teacher read basic profile info of others", false, "Cannot access profile info");
        }
      } else {
        logTest("Teacher read  profile info of others", false, "Document does not exist");
      }
    } catch (error) {
      logTest("Teacher read basic profile info of others", false, error.message);
    }

    // Test creating a new user profile (should succeed for any authenticated user)
    try {
      await setDoc(doc(db, "people", "teacherCreatedStudent"), {
        firstName: "Teacher",
        lastName: "Created",
        displayName: "teacher.created",
        email: "teachercreated@example.com",
        status: "active",
        role: "student",
        admin: false,
        registered: true,
      });
      logTest("Teacher create new user profile", true);
    } catch (error) {
      logTest("Teacher create new user profile", false, error.message);
    }

    // Test updating student profile (should denie access)
    try {
      await updateDoc(doc(db, "people", "student1"), {
        updatedBy: "teacher1",
        lastUpdated: new Date(),
      });
      logTest("Teacher update student profile", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Teacher update student profile they teach", true, "Correctly denied");
      } else {
        logTest(
          "Teacher update student profile they teach",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test that users can create a new course
    try {
      await setDoc(doc(db, "courses", "teacherNewCourse"), {
        name: "Teacher New Course",
        status: "draft",
        public: false,
        presentationOnly: false,
        owner: "teacher1",
        contentBy: {
          name: "Moana Tawhiri",
          personId: "teacher1",
        },
        mappedBy: {
          name: "Moana Tawhiri",
          personId: "teacher1",
        },
      });
      logTest("Teacher1 create new course", true);
    } catch (error) {
      logTest("Teacher1 create new course", false, error.message);
    }

    // Test reading own courses (should succeed)
    try {
      await getDoc(doc(db, "courses", "course1"));
      logTest("Teacher read own courses", true);
    } catch (error) {
      logTest("Teacher read own courses", false, error.message);
    }

    // Test that users can update their own course
    try {
      await updateDoc(doc(db, "courses", "teacherNewCourse"), { updatedBy: "teacher1" });
      logTest("Teacher1 update own course", true);
    } catch (error) {
      logTest("Teacher1 update own course", false, error.message);
    }

    // Test reading other teacher's private course (should fail)
    try {
      await getDoc(doc(db, "courses", "course2"));
      logTest("Teacher1 read other teacher private course", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Teacher1 read other teacher private course", true, "Correctly denied");
      } else {
        logTest(
          "Teacher1 read other teacher private course",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test that users can read other teacher's public course and topics (should pass)
    try {
      await getDoc(doc(db, "courses", "course4", "topics", "topic1"));
      logTest("Teacher1 read other teacher public course and topics", true);
    } catch (error) {
      logTest("Teacher1 read other teacher public course and topics", false, error.message);
    }

    // Test updating other teacher's public course (should fail)
    try {
      await updateDoc(doc(db, "courses", "course4"), { updatedBy: "teacher1" });
      logTest(
        "Teacher1 update other teacher public course",
        false,
        "Should be denied - not owner/contentBy",
      );
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Teacher1 update other teacher public course", true, "Correctly denied");
      } else {
        logTest(
          "Teacher1 update other teacher public course",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test deleting other teacher's course (should fail)
    try {
      await deleteDoc(doc(db, "courses", "course2"));
      logTest(
        "Teacher1 delete other teacher course",
        false,
        "Should be denied - not owner/contentBy",
      );
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Teacher1 delete other teacher course", true, "Correctly denied");
      } else {
        logTest(
          "Teacher1 delete other teacher course",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test deleting own course (should succeed)
    try {
      await deleteDoc(doc(db, "courses", "teacherNewCourse"));
      logTest("Teacher1 delete own course", true, "Successfully deleted own course");
    } catch (error) {
      logTest("Teacher1 delete own course", false, error.message);
    }

    // Test reading course subcollections
    try {
      await getDoc(doc(db, "courses", "course1", "topics", "topic1"));
      logTest("Teacher read own course topics", true);
    } catch (error) {
      logTest("Teacher read own course topics", false, error.message);
    }

    // Test reading own course map nodes (should succeed)
    try {
      await getDoc(doc(db, "courses", "course1", "map-nodes", "node1"));
      logTest("Teacher read own course map nodes", true);
    } catch (error) {
      logTest("Teacher read own course map nodes", false, error.message);
    }

    // Test reading own course map edges (should succeed)
    try {
      await getDoc(doc(db, "courses", "course1", "map-edges", "edge1"));
      logTest("Teacher read own course map edges", true);
    } catch (error) {
      logTest("Teacher read own course map edges", false, error.message);
    }

    // Test reading other teacher's public course map nodes (should succeed)
    try {
      await getDoc(doc(db, "courses", "course4", "map-nodes", "node1"));
      logTest("Teacher read other teacher public course map nodes", true);
    } catch (error) {
      logTest("Teacher read other teacher public course map nodes", false, error.message);
    }

    // Test reading other teacher's public course map edges (should succeed)
    try {
      await getDoc(doc(db, "courses", "course4", "map-edges", "edge1"));
      logTest("Teacher read other teacher public course map edges", true);
    } catch (error) {
      logTest("Teacher read other teacher public course map edges", false, error.message);
    }

    // Test reading other teacher's private course map nodes (should fail)
    try {
      await getDoc(doc(db, "courses", "course2", "map-nodes", "node1"));
      logTest("Teacher read other teacher private course map nodes", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Teacher read other teacher private course map nodes", true, "Correctly denied");
      } else {
        logTest(
          "Teacher read other teacher private course map nodes",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test reading other teacher's private course map edges (should fail)
    try {
      await getDoc(doc(db, "courses", "course2", "map-edges", "edge1"));
      logTest("Teacher read other teacher private course map edges", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Teacher read other teacher private course map edges", true, "Correctly denied");
      } else {
        logTest(
          "Teacher read other teacher private course map edges",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test creating map nodes in own course (should succeed)
    try {
      await addDoc(collection(db, "courses", "course1", "map-nodes"), {
        title: "Teacher Created Node",
        description: "A node created by teacher1",
        type: "content",
        position: { x: 700, y: 100 },
        createdBy: "teacher1",
        createdAt: new Date(),
        status: "active",
      });
      logTest("Teacher create map nodes in own course", true);
    } catch (error) {
      logTest("Teacher create map nodes in own course", false, error.message);
    }

    // Test creating map edges in own course (should succeed)
    try {
      await addDoc(collection(db, "courses", "course1", "map-edges"), {
        from: "node3",
        to: "node1",
        label: "Teacher Edge",
        type: "progression",
        createdBy: "teacher1",
        createdAt: new Date(),
        status: "active",
      });
      logTest("Teacher create map edges in own course", true);
    } catch (error) {
      logTest("Teacher create map edges in own course", false, error.message);
    }

    // Test updating map nodes in own course (should succeed)
    try {
      await updateDoc(doc(db, "courses", "course1", "map-nodes", "node1"), {
        updatedBy: "teacher1",
        lastUpdated: new Date(),
      });
      logTest("Teacher update map nodes in own course", true);
    } catch (error) {
      logTest("Teacher update map nodes in own course", false, error.message);
    }

    // Test updating map edges in own course (should succeed)
    try {
      await updateDoc(doc(db, "courses", "course1", "map-edges", "edge1"), {
        updatedBy: "teacher1",
        lastUpdated: new Date(),
      });
      logTest("Teacher update map edges in own course", true);
    } catch (error) {
      logTest("Teacher update map edges in own course", false, error.message);
    }

    // Test creating map nodes in other teacher's course (should fail)
    try {
      await addDoc(collection(db, "courses", "course4", "map-nodes"), {
        title: "Unauthorized Node",
        description: "A node created by teacher1 in course4",
        type: "content",
        position: { x: 800, y: 100 },
        createdBy: "teacher1",
        createdAt: new Date(),
        status: "active",
      });
      logTest("Teacher create map nodes in other teacher course", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Teacher create map nodes in other teacher course", true, "Correctly denied");
      } else {
        logTest(
          "Teacher create map nodes in other teacher course",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test creating map edges in other teacher's course (should fail)
    try {
      await addDoc(collection(db, "courses", "course4", "map-edges"), {
        from: "node1",
        to: "node1",
        label: "Unauthorized Edge",
        type: "progression",
        createdBy: "teacher1",
        createdAt: new Date(),
        status: "active",
      });
      logTest("Teacher create map edges in other teacher course", false, "Should be denied");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest("Teacher create map edges in other teacher course", true, "Correctly denied");
      } else {
        logTest(
          "Teacher create map edges in other teacher course",
          false,
          `Unexpected error: ${error.message}`,
        );
      }
    }

    // Test reading own cohort (should succeed)
    try {
      await getDoc(doc(db, "cohorts", "cohort1"));
      logTest("Teacher read own cohort", true);
    } catch (error) {
      logTest("Teacher read own cohort", false, error.message);
    }

    //Test that users can create a cohort
    try {
      await setDoc(doc(db, "cohorts", "cohort6"), {
        name: "Teacher New Cohort",
        description: "This is a test cohort",
        teachers: ["teacher1"],
      });
      logTest("Teacher1 create new cohort", true);
    } catch (error) {
      logTest("Teacher1 create new cohort", false, error.message);
    }

    //Test that users can update their own cohort
    try {
      await updateDoc(doc(db, "cohorts", "cohort6"), { updatedBy: "teacher1" });
      logTest("Teacher1 update own cohort", true);
    } catch (error) {
      logTest("Teacher1 update own cohort", false, error.message);
    }

    // Test that users can delete their own cohort (should succeed)
    try {
      await deleteDoc(doc(db, "cohorts", "cohort6"));
      logTest("Teacher1 delete own cohort", true, "Successfully deleted own cohort");
    } catch (error) {
      logTest("Teacher1 delete own cohort", false, error.message);
    }

    // Test reading other cohort (should succeed)
    try {
      await getDoc(doc(db, "cohorts", "cohort2"));
      logTest("Teacher1 read other cohort", true);
    } catch (error) {
      logTest("Teacher1 read other cohort", false, error.message);
    }

    // Test reading help requests from own course (should succeed for any authenticated user)
    try {
      await getDoc(doc(db, "courses", "course1", "requestsForHelp", "request1"));
      logTest("Teacher read help requests from own course", true);
    } catch (error) {
      logTest("Teacher read help requests from own course", false, error.message);
    }

    // Test reading submissions from own course (should succeed for any authenticated user)
    try {
      await getDoc(doc(db, "courses", "course1", "submissionsForReview", "submission1"));
      logTest("Teacher read submissions from own course", true);
    } catch (error) {
      logTest("Teacher read submissions from own course", false, error.message);
    }

    // Test creating help requests (should succeed for any authenticated user)
    try {
      await addDoc(collection(db, "courses", "course1", "requestsForHelp"), {
        title: "Test Help Request",
        description: "This is a test help request",
        personId: "teacher1",
        status: "open",
        createdAt: new Date(),
      });
      logTest("Teacher create help requests", true);
    } catch (error) {
      logTest("Teacher create help requests", false, error.message);
    }

    // Test creating submissions (should succeed for any authenticated user)
    try {
      await addDoc(collection(db, "courses", "course1", "submissionsForReview"), {
        title: "Test Submission",
        description: "This is a test submission",
        personId: "teacher1",
        status: "pending",
        createdAt: new Date(),
      });
      logTest("Teacher create submissions", true);
    } catch (error) {
      logTest("Teacher create submissions", false, error.message);
    }

    await signOut(auth);
  } catch (error) {
    console.log("❌ Teacher access test failed:", error.message);
    logTest("Teacher authentication setup", false, error.message);
  }
}

async function testAdminAccess() {
  console.log("\n👑 Testing admin access with custom claims...");

  try {
    // Use admin1 credentials from test data
    if (!global.testCredentials) {
      console.log("⚠️  Test credentials not available, skipping admin tests");
      return;
    }

    const { token: adminToken } = global.testCredentials.admin;

    // Sign in as admin1 using the custom token
    const adminCredential = await signInWithCustomToken(auth, adminToken);
    const adminUser = adminCredential.user;

    if (!adminUser) {
      console.log("⚠️  Admin authentication failed, skipping admin tests");
      return;
    }

    console.log(`✅ Admin authenticated as: ${adminUser.uid}`);

    // Test reading profile info of all users (should succeed)
    try {
      const otherUserDoc = await getDoc(doc(db, "people", "student2"));
      if (otherUserDoc.exists()) {
        const data = otherUserDoc.data();
        // Check that we can access firstName and email
        if (data.firstName && data.email) {
          logTest("Admin read profile info of users", true, "Can access all profiles");
        } else {
          logTest("Admin read profile info of users", false, "Cannot access profile info");
        }
      } else {
        logTest("Admin read profile info of users", false, "Document does not exist");
      }
    } catch (error) {
      logTest("Admin read basic profile info of users", false, error.message);
    }

    // Test creating a new user profile (should succeed for any authenticated user)
    try {
      await setDoc(doc(db, "people", "adminCreatedStudent"), {
        firstName: "Admin",
        lastName: "Created",
        displayName: "admin.created",
        email: "admincreated@example.com",
        status: "active",
        role: "student",
        admin: false,
        registered: true,
      });
      logTest("Admin create new user profile", true);
    } catch (error) {
      logTest("Admin create new user profile", false, error.message);
    }

    // Test that admins can update any user profile
    try {
      await updateDoc(doc(db, "people", "student1"), {
        updatedBy: "admin1",
        lastUpdated: new Date(),
      });
      logTest("Admin update any user profile", true);
    } catch (error) {
      logTest("Admin update any user profile", false, error.message);
    }

    // Test reading all cohorts (should succeed for admins)
    try {
      await getDoc(doc(db, "cohorts", "cohort1"));
      logTest("Admin read all cohorts", true);
    } catch (error) {
      logTest("Admin read all cohorts", false, error.message);
    }

    // Test reading all courses (should succeed for admins)
    try {
      await getDoc(doc(db, "courses", "course1"));
      logTest("Admin read all courses", true);
    } catch (error) {
      logTest("Admin read all courses", false, error.message);
    }

    // Test reading course subcollections (should succeed for admins)
    try {
      await getDoc(doc(db, "courses", "course1", "topics", "topic1"));
      logTest("Admin read course subcollections", true);
    } catch (error) {
      logTest("Admin read course subcollections", false, error.message);
    }

    // Test reading all course map nodes (should succeed for admins)
    try {
      await getDoc(doc(db, "courses", "course1", "map-nodes", "node1"));
      await getDoc(doc(db, "courses", "course2", "map-nodes", "node1"));
      await getDoc(doc(db, "courses", "course3", "map-nodes", "node1"));
      await getDoc(doc(db, "courses", "course4", "map-nodes", "node1"));
      logTest("Admin read all course map nodes", true);
    } catch (error) {
      logTest("Admin read all course map nodes", false, error.message);
    }

    // Test reading all course map edges (should succeed for admins)
    try {
      await getDoc(doc(db, "courses", "course1", "map-edges", "edge1"));
      await getDoc(doc(db, "courses", "course2", "map-edges", "edge1"));
      await getDoc(doc(db, "courses", "course3", "map-edges", "edge1"));
      await getDoc(doc(db, "courses", "course4", "map-edges", "edge1"));
      logTest("Admin read all course map edges", true);
    } catch (error) {
      logTest("Admin read all course map edges", false, error.message);
    }

    // Test creating map nodes in any course (should succeed for admins)
    try {
      await addDoc(collection(db, "courses", "course1", "map-nodes"), {
        title: "Admin Created Node",
        description: "A node created by admin",
        type: "content",
        position: { x: 900, y: 100 },
        createdBy: "admin1",
        createdAt: new Date(),
        status: "active",
      });
      logTest("Admin create map nodes in any course", true);
    } catch (error) {
      logTest("Admin create map nodes in any course", false, error.message);
    }

    // Test creating map edges in any course (should succeed for admins)
    try {
      await addDoc(collection(db, "courses", "course1", "map-edges"), {
        from: "node3",
        to: "node1",
        label: "Admin Edge",
        type: "progression",
        createdBy: "admin1",
        createdAt: new Date(),
        status: "active",
      });
      logTest("Admin create map edges in any course", true);
    } catch (error) {
      logTest("Admin create map edges in any course", false, error.message);
    }

    // Test updating map nodes in any course (should succeed for admins)
    try {
      await updateDoc(doc(db, "courses", "course2", "map-nodes", "node1"), {
        updatedBy: "admin1",
        lastUpdated: new Date(),
      });
      logTest("Admin update map nodes in any course", true);
    } catch (error) {
      logTest("Admin update map nodes in any course", false, error.message);
    }

    // Test updating map edges in any course (should succeed for admins)
    try {
      await updateDoc(doc(db, "courses", "course2", "map-edges", "edge1"), {
        updatedBy: "admin1",
        lastUpdated: new Date(),
      });
      logTest("Admin update map edges in any course", true);
    } catch (error) {
      logTest("Admin update map edges in any course", false, error.message);
    }

    // Test deleting map nodes in any course (should succeed for admins)
    try {
      await deleteDoc(doc(db, "courses", "course1", "map-nodes", "node3"));
      logTest("Admin delete map nodes in any course", true);
    } catch (error) {
      logTest("Admin delete map nodes in any course", false, error.message);
    }

    // Test deleting map edges in any course (should succeed for admins)
    try {
      await deleteDoc(doc(db, "courses", "course1", "map-edges", "edge2"));
      logTest("Admin delete map edges in any course", true);
    } catch (error) {
      logTest("Admin delete map edges in any course", false, error.message);
    }

    // Test reading help requests (should succeed for admins)
    try {
      await getDoc(doc(db, "courses", "course1", "requestsForHelp", "request1"));
      logTest("Admin read help requests", true);
    } catch (error) {
      logTest("Admin read help requests", false, error.message);
    }

    // Test reading submissions (should succeed for admins)
    try {
      await getDoc(doc(db, "courses", "course1", "submissionsForReview", "submission1"));
      logTest("Admin read submissions", true);
    } catch (error) {
      logTest("Admin read submissions", false, error.message);
    }

    // Test creating new cohorts (should succeed for admins)
    try {
      await setDoc(doc(db, "cohorts", "adminCreatedCohort"), {
        name: "Admin Created Cohort",
        description: "A cohort created by admin for testing.",
        students: [],
        teachers: [],
        courses: [],
      });
      logTest("Admin create new cohorts", true);
    } catch (error) {
      logTest("Admin create new cohorts", false, error.message);
    }

    // Test creating new courses (should succeed for admins)
    try {
      await setDoc(doc(db, "courses", "adminCreatedCourse"), {
        name: "Admin Created Course",
        description: "A course created by admin for testing.",
        status: "draft",
        public: false,
        presentationOnly: false,
        owner: "admin1",
        contentBy: "admin1",
        mappedBy: "admin1",
      });
      logTest("Admin create new courses", true);
    } catch (error) {
      logTest("Admin create new courses", false, error.message);
    }

    // Test deleting any document (should succeed for admins)
    try {
      await deleteDoc(doc(db, "cohorts", "adminCreatedCohort"));
      await deleteDoc(doc(db, "courses", "adminCreatedCourse"));
      logTest("Admin delete any document", true);
    } catch (error) {
      logTest("Admin delete any document", false, error.message);
    }

    // Test admin access to slugs (should succeed for admins)
    try {
      await setDoc(doc(db, "slugs", "admin-created-slug"), {
        name: "admin-created-slug",
        courseId: "course1",
        owner: "admin1",
        active: true,
      });
      await updateDoc(doc(db, "slugs", "admin-created-slug"), { updatedBy: "admin1" });
      await deleteDoc(doc(db, "slugs", "admin-created-slug"));
      logTest("Admin full access to slugs", true);
    } catch (error) {
      logTest("Admin full access to slugs", false, error.message);
    }

    await signOut(auth);
  } catch (error) {
    console.log("❌ Admin access test failed:", error.message);
    logTest("Admin authentication setup", false, error.message);
  }
}

async function testRulesSyntax() {
  console.log("\n📝 Testing rules syntax...");

  try {
    // Test basic read operation
    const docRef = doc(db, "test", "syntax");
    await getDoc(docRef);
    logTest("Rules syntax validation", true);
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Rules syntax validation", true, "Rules are working (correctly denying access)");
    } else {
      logTest("Rules syntax validation", false, `Rules syntax error: ${error.message}`);
    }
  }
}

async function testCollectionAccess() {
  console.log("\n📚 Testing collection access patterns...");

  // Test all collections to ensure rules are properly applied
  const collections = ["people", "courses", "cohorts", "slugs"];

  for (const collectionName of collections) {
    try {
      await getDoc(doc(db, collectionName, "test1"));
      if (collectionName === "slugs") {
        logTest(`Read ${collectionName}`, true, "Public collection");
      } else {
        logTest(`Read ${collectionName}`, false, "Should be denied for unauthenticated users");
      }
    } catch (error) {
      if (error.code === "permission-denied") {
        if (collectionName === "slugs") {
          logTest(`Read ${collectionName}`, false, "Should be allowed for public collection");
        } else {
          logTest(`Read ${collectionName}`, true, "Correctly denied");
        }
      } else {
        logTest(`Read ${collectionName}`, false, `Unexpected error: ${error.message}`);
      }
    }
  }
}

async function testWriteOperations() {
  console.log("\n✏️ Testing write operations...");

  // Test writing to different collections
  const writeTests = [
    { collection: "people", data: { firstName: "Test", lastName: "User" } },
    { collection: "courses", data: { name: "Test Course" } },
    { collection: "cohorts", data: { name: "Test Cohort" } },
    { collection: "slugs", data: { name: "test-slug" } },
  ];

  for (const test of writeTests) {
    try {
      await setDoc(doc(db, test.collection, "testWrite"), test.data);
      logTest(`Write to ${test.collection}`, false, "Should be denied for unauthenticated users");
    } catch (error) {
      if (error.code === "permission-denied") {
        logTest(`Write to ${test.collection}`, true, "Correctly denied");
      } else {
        logTest(`Write to ${test.collection}`, false, `Unexpected error: ${error.message}`);
      }
    }
  }

  // Test writing to map-nodes subcollections (should fail for unauthenticated users)
  try {
    await setDoc(doc(db, "courses", "course1", "map-nodes", "testNode"), {
      title: "Test Node",
      description: "A test node",
      type: "content",
      position: { x: 1000, y: 100 },
    });
    logTest(
      "Write to map-nodes subcollection",
      false,
      "Should be denied for unauthenticated users",
    );
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Write to map-nodes subcollection", true, "Correctly denied");
    } else {
      logTest("Write to map-nodes subcollection", false, `Unexpected error: ${error.message}`);
    }
  }

  // Test writing to map-edges subcollections (should fail for unauthenticated users)
  try {
    await setDoc(doc(db, "courses", "course1", "map-edges", "testEdge"), {
      from: "node1",
      to: "node2",
      label: "Test Edge",
      type: "progression",
    });
    logTest(
      "Write to map-edges subcollection",
      false,
      "Should be denied for unauthenticated users",
    );
  } catch (error) {
    if (error.code === "permission-denied") {
      logTest("Write to map-edges subcollection", true, "Correctly denied");
    } else {
      logTest("Write to map-edges subcollection", false, `Unexpected error: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log("🧪 Starting comprehensive Firestore Rules testing...\n");

  try {
    // Import test data first
    await importTestData();

    // Run all tests
    await testRulesSyntax();
    await testUnauthenticatedAccess();
    await testCollectionAccess();
    await testWriteOperations();
    await testStudentAccess();
    await testTeacherAccess();
    await testAdminAccess();

    console.log("\n📊 Test Results Summary:");
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log("\n🎉 All tests passed! Your Firestore rules are working correctly.");
    } else {
      console.log("\n⚠️  Some tests failed. Please review your rules and test data.");
    }

    console.log(
      "\n💡 Note: These tests verify both unauthenticated and authenticated access patterns.",
    );
    console.log("   Make sure both Firestore and Auth emulators are running.");
    console.log("   The test data was automatically imported before running tests.");
  } catch (error) {
    console.error("❌ Test execution failed:", error);
  }
}

// Run the tests
runAllTests();
