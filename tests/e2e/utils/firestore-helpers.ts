import { initializeApp as initializeAdminApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore, Timestamp } from 'firebase-admin/firestore';

let db: AdminFirestore | null = null;
let app: App | null = null;

/**
 * Initialize Firestore connection for tests using Admin SDK
 * This bypasses security rules, which is appropriate for test data setup
 */
export function initializeTestFirestore(): AdminFirestore {
  if (db) return db;

  const projectId = process.env.FIREBASE_PROJECT_ID ?? 'galaxy-maps-test';

  // Set emulator host BEFORE initializing the admin SDK
  const emulatorHost = process.env.FIREBASE_FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;

  // Check if admin app already exists
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    // Initialize with minimal config for emulator
    app = initializeAdminApp({
      projectId,
    });
  }

  db = getAdminFirestore(app);

  return db;
}

/**
 * Clean up all test data for a specific user
 */
export async function cleanupTestData(userId: string): Promise<void> {
  const db = initializeTestFirestore();

  // Delete user's galaxies
  const coursesQuery = db.collection('courses').where('creator', '==', userId);
  const coursesSnapshot = await coursesQuery.get();

  for (const courseDoc of coursesSnapshot.docs) {
    // Delete subcollections
    const nodesDocs = await db.collection(`courses/${courseDoc.id}/map-nodes`).get();
    for (const nodeDoc of nodesDocs.docs) {
      await nodeDoc.ref.delete();
    }

    const edgesDocs = await db.collection(`courses/${courseDoc.id}/map-edges`).get();
    for (const edgeDoc of edgesDocs.docs) {
      await edgeDoc.ref.delete();
    }

    const topicsDocs = await db.collection(`courses/${courseDoc.id}/topics`).get();
    for (const topicDoc of topicsDocs.docs) {
      await topicDoc.ref.delete();
    }

    // Delete course
    await courseDoc.ref.delete();
  }

  // Delete user profile
  const userDocRef = db.collection('people').doc(userId);
  const userDoc = await userDocRef.get();
  if (userDoc.exists) {
    await userDocRef.delete();
  }
}

/**
 * Create a test galaxy
 */
export async function createTestGalaxy(options: {
  userId: string;
  title: string;
  description?: string;
  status?: 'drafting' | 'published';
  galaxyId?: string;
}): Promise<string> {
  const db = initializeTestFirestore();

  const galaxyId = options.galaxyId ?? `test-galaxy-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const galaxyData = {
    id: galaxyId,
    title: options.title,
    description: options.description ?? '',
    creator: options.userId,
    owner: options.userId, // String UID for security rules (matches production)
    mappedBy: {
      personId: options.userId,
      name: 'Test User',
    },
    status: options.status ?? 'drafting',
    topics: 0,
    dateCreated: Timestamp.now(),
    dateModified: Timestamp.now(),
    published: options.status === 'published',
    public: false,
  };

  await db.collection('courses').doc(galaxyId).set(galaxyData);

  // Create intro node automatically (matches production behavior)
  const introNodeId = `intro-${Date.now()}`;
  const introLabel = options.title ? `${options.title} Intro` : 'Map intro';

  // Create map-node
  await db.collection(`courses/${galaxyId}/map-nodes`).doc(introNodeId).set({
    id: introNodeId,
    label: introLabel,
    group: 'introduction',
    color: '#00E676',
    topicCreatedTimestamp: Timestamp.now(),
    x: 0,
    y: 0,
    topicTotal: 1,
    taskTotal: 0,
  });

  // Create corresponding topic
  await db.collection(`courses/${galaxyId}/topics`).doc(introNodeId).set({
    id: introNodeId,
    label: introLabel,
    group: 'introduction',
    color: '#00E676',
    topicCreatedTimestamp: Timestamp.now(),
    taskTotal: 0,
    x: 0,
    y: 0,
  });

  return galaxyId;
}

/**
 * Create a test node in a galaxy
 */
export async function createTestNode(options: {
  galaxyId: string;
  nodeId: string;
  label: string;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  prerequisites?: string[];
  image?: string;
}): Promise<any> {
  const db = initializeTestFirestore();

  const nodeData = {
    id: options.nodeId,
    label: options.label,
    x: options.x ?? Math.random() * 800,
    y: options.y ?? Math.random() * 600,
    color: options.color ?? '#5C6BC0',
    size: options.size ?? 25,
    shape: options.image ? 'image' : 'dot',
    image: options.image,
    prerequisites: options.prerequisites ?? [],
    topicCreatedTimestamp: Timestamp.now(),
    borderWidth: 2,
  };

  await db.collection(`courses/${options.galaxyId}/map-nodes`).doc(options.nodeId).set(nodeData);

  // Also create in topics collection
  await db.collection(`courses/${options.galaxyId}/topics`).doc(options.nodeId).set({
    ...nodeData,
    topicId: options.nodeId,
  });

  return nodeData;
}

/**
 * Create a test edge between two nodes
 */
export async function createTestEdge(options: {
  galaxyId: string;
  from: string;
  to: string;
}): Promise<any> {
  const db = initializeTestFirestore();

  const edgeId = `${options.from}-${options.to}`;
  const edgeData = {
    id: edgeId,
    from: options.from,
    to: options.to,
  };

  await db.collection(`courses/${options.galaxyId}/map-edges`).doc(edgeId).set(edgeData);

  return edgeData;
}

/**
 * Get node prerequisites from Firestore
 */
export async function getNodePrerequisites(galaxyId: string, nodeId: string): Promise<string[]> {
  const db = initializeTestFirestore();
  const nodeDoc = await db.collection(`courses/${galaxyId}/map-nodes`).doc(nodeId).get();

  if (!nodeDoc.exists) {
    throw new Error(`Node ${nodeId} not found in galaxy ${galaxyId}`);
  }

  return nodeDoc.data()?.prerequisites ?? [];
}

/**
 * Check if node exists in Firestore
 */
export async function nodeExists(galaxyId: string, nodeId: string): Promise<boolean> {
  const db = initializeTestFirestore();
  const nodeDoc = await db.collection(`courses/${galaxyId}/map-nodes`).doc(nodeId).get();
  return nodeDoc.exists;
}

/**
 * Check if edge exists in Firestore
 */
export async function edgeExists(galaxyId: string, edgeId: string): Promise<boolean> {
  const db = initializeTestFirestore();
  const edgeDoc = await db.collection(`courses/${galaxyId}/map-edges`).doc(edgeId).get();
  return edgeDoc.exists;
}

/**
 * Get galaxy data from Firestore
 */
export async function getGalaxy(galaxyId: string): Promise<any> {
  const db = initializeTestFirestore();
  const galaxyDoc = await db.collection('courses').doc(galaxyId).get();

  if (!galaxyDoc.exists) {
    throw new Error(`Galaxy ${galaxyId} not found`);
  }

  return galaxyDoc.data();
}

/**
 * Get all nodes in a galaxy
 */
export async function getAllNodes(galaxyId: string): Promise<any[]> {
  const db = initializeTestFirestore();
  const nodesSnapshot = await db.collection(`courses/${galaxyId}/map-nodes`).get();

  return nodesSnapshot.docs.map(doc => doc.data());
}

/**
 * Get all edges in a galaxy
 */
export async function getAllEdges(galaxyId: string): Promise<any[]> {
  const db = initializeTestFirestore();
  const edgesSnapshot = await db.collection(`courses/${galaxyId}/map-edges`).get();

  return edgesSnapshot.docs.map(doc => doc.data());
}

/**
 * Update galaxy status
 */
export async function updateGalaxyStatus(galaxyId: string, status: 'drafting' | 'published'): Promise<void> {
  const db = initializeTestFirestore();
  await db.collection('courses').doc(galaxyId).set(
    { status, published: status === 'published' },
    { merge: true }
  );
}

/**
 * Delete galaxy and all its data
 */
export async function deleteGalaxy(galaxyId: string): Promise<void> {
  const db = initializeTestFirestore();

  // Delete subcollections
  const nodesDocs = await db.collection(`courses/${galaxyId}/map-nodes`).get();
  for (const nodeDoc of nodesDocs.docs) {
    await nodeDoc.ref.delete();
  }

  const edgesDocs = await db.collection(`courses/${galaxyId}/map-edges`).get();
  for (const edgeDoc of edgesDocs.docs) {
    await edgeDoc.ref.delete();
  }

  const topicsDocs = await db.collection(`courses/${galaxyId}/topics`).get();
  for (const topicDoc of topicsDocs.docs) {
    await topicDoc.ref.delete();
  }

  // Delete course
  await db.collection('courses').doc(galaxyId).delete();
}
