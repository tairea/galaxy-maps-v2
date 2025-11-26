import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  Firestore,
  Timestamp
} from 'firebase/firestore';

let db: Firestore | null = null;
let app: FirebaseApp | null = null;

/**
 * Initialize Firestore connection for tests
 */
export function initializeTestFirestore(): Firestore {
  if (db) return db;

  const projectId = process.env.FIREBASE_PROJECT_ID ?? 'galaxy-maps-test';

  app = initializeApp({
    projectId,
    apiKey: 'test-api-key',
    authDomain: `${projectId}.firebaseapp.com`,
  });

  db = getFirestore(app);

  // Connect to emulator
  const emulatorHost = process.env.FIREBASE_FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';
  const [host, portStr] = emulatorHost.split(':');
  const port = parseInt(portStr, 10);

  connectFirestoreEmulator(db, host, port);

  return db;
}

/**
 * Clean up all test data for a specific user
 */
export async function cleanupTestData(userId: string): Promise<void> {
  const db = initializeTestFirestore();

  // Delete user's galaxies
  const coursesQuery = query(
    collection(db, 'courses'),
    where('creator', '==', userId)
  );

  const coursesSnapshot = await getDocs(coursesQuery);

  for (const courseDoc of coursesSnapshot.docs) {
    // Delete subcollections
    const nodesDocs = await getDocs(collection(db, `courses/${courseDoc.id}/map-nodes`));
    for (const nodeDoc of nodesDocs.docs) {
      await deleteDoc(nodeDoc.ref);
    }

    const edgesDocs = await getDocs(collection(db, `courses/${courseDoc.id}/map-edges`));
    for (const edgeDoc of edgesDocs.docs) {
      await deleteDoc(edgeDoc.ref);
    }

    const topicsDocs = await getDocs(collection(db, `courses/${courseDoc.id}/topics`));
    for (const topicDoc of topicsDocs.docs) {
      await deleteDoc(topicDoc.ref);
    }

    // Delete course
    await deleteDoc(courseDoc.ref);
  }

  // Delete user profile
  const userDocRef = doc(db, 'people', userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    await deleteDoc(userDocRef);
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
    status: options.status ?? 'drafting',
    topics: 0,
    dateCreated: Timestamp.now(),
    dateModified: Timestamp.now(),
    published: options.status === 'published',
    public: false,
  };

  await setDoc(doc(db, 'courses', galaxyId), galaxyData);

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

  await setDoc(
    doc(db, `courses/${options.galaxyId}/map-nodes`, options.nodeId),
    nodeData
  );

  // Also create in topics collection
  await setDoc(
    doc(db, `courses/${options.galaxyId}/topics`, options.nodeId),
    {
      ...nodeData,
      topicId: options.nodeId,
    }
  );

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

  await setDoc(
    doc(db, `courses/${options.galaxyId}/map-edges`, edgeId),
    edgeData
  );

  return edgeData;
}

/**
 * Get node prerequisites from Firestore
 */
export async function getNodePrerequisites(galaxyId: string, nodeId: string): Promise<string[]> {
  const db = initializeTestFirestore();
  const nodeDoc = await getDoc(doc(db, `courses/${galaxyId}/map-nodes`, nodeId));

  if (!nodeDoc.exists()) {
    throw new Error(`Node ${nodeId} not found in galaxy ${galaxyId}`);
  }

  return nodeDoc.data()?.prerequisites ?? [];
}

/**
 * Check if node exists in Firestore
 */
export async function nodeExists(galaxyId: string, nodeId: string): Promise<boolean> {
  const db = initializeTestFirestore();
  const nodeDoc = await getDoc(doc(db, `courses/${galaxyId}/map-nodes`, nodeId));
  return nodeDoc.exists();
}

/**
 * Check if edge exists in Firestore
 */
export async function edgeExists(galaxyId: string, edgeId: string): Promise<boolean> {
  const db = initializeTestFirestore();
  const edgeDoc = await getDoc(doc(db, `courses/${galaxyId}/map-edges`, edgeId));
  return edgeDoc.exists();
}

/**
 * Get galaxy data from Firestore
 */
export async function getGalaxy(galaxyId: string): Promise<any> {
  const db = initializeTestFirestore();
  const galaxyDoc = await getDoc(doc(db, 'courses', galaxyId));

  if (!galaxyDoc.exists()) {
    throw new Error(`Galaxy ${galaxyId} not found`);
  }

  return galaxyDoc.data();
}

/**
 * Get all nodes in a galaxy
 */
export async function getAllNodes(galaxyId: string): Promise<any[]> {
  const db = initializeTestFirestore();
  const nodesSnapshot = await getDocs(collection(db, `courses/${galaxyId}/map-nodes`));

  return nodesSnapshot.docs.map(doc => doc.data());
}

/**
 * Get all edges in a galaxy
 */
export async function getAllEdges(galaxyId: string): Promise<any[]> {
  const db = initializeTestFirestore();
  const edgesSnapshot = await getDocs(collection(db, `courses/${galaxyId}/map-edges`));

  return edgesSnapshot.docs.map(doc => doc.data());
}

/**
 * Update galaxy status
 */
export async function updateGalaxyStatus(galaxyId: string, status: 'drafting' | 'published'): Promise<void> {
  const db = initializeTestFirestore();
  await setDoc(
    doc(db, 'courses', galaxyId),
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
  const nodesDocs = await getDocs(collection(db, `courses/${galaxyId}/map-nodes`));
  for (const nodeDoc of nodesDocs.docs) {
    await deleteDoc(nodeDoc.ref);
  }

  const edgesDocs = await getDocs(collection(db, `courses/${galaxyId}/map-edges`));
  for (const edgeDoc of edgesDocs.docs) {
    await deleteDoc(edgeDoc.ref);
  }

  const topicsDocs = await getDocs(collection(db, `courses/${galaxyId}/topics`));
  for (const topicDoc of topicsDocs.docs) {
    await deleteDoc(topicDoc.ref);
  }

  // Delete course
  await deleteDoc(doc(db, 'courses', galaxyId));
}
