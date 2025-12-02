/**
 * Test data constants and sample data for tests
 */

/**
 * Sample galaxy titles
 */
export const SAMPLE_GALAXY_TITLES = {
  webDevelopment: "Web Development Journey",
  datascience: "Data Science Learning Path",
  cloudEngineering: "Cloud Engineering Bootcamp",
  mobileApp: "Mobile App Development",
  aiMachineLearning: "AI & Machine Learning Course",
};

/**
 * Sample galaxy descriptions
 */
export const SAMPLE_GALAXY_DESCRIPTIONS = {
  webDevelopment: "Learn full-stack web development from HTML basics to advanced React",
  dataScience: "Master data analysis, visualization, and machine learning",
  cloudEngineering: "Build and deploy scalable cloud applications",
  mobileApp: "Create native mobile apps for iOS and Android",
  aiMachineLearning: "Explore AI concepts and implement ML models",
};

/**
 * Sample node titles
 */
export const SAMPLE_NODE_TITLES = {
  intro: "Introduction",
  basics: "Basics",
  intermediate: "Intermediate",
  advanced: "Advanced",
  project: "Final Project",
  assessment: "Assessment",
};

/**
 * Sample node colors (Vuetify default palette)
 */
export const SAMPLE_NODE_COLORS = {
  primary: "#5C6BC0",
  secondary: "#7E57C2",
  accent: "#FF4081",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
};

/**
 * Default node sizes
 */
export const NODE_SIZES = {
  small: 20,
  medium: 25,
  large: 35,
  xlarge: 50,
};

/**
 * Canvas positions for common layouts
 */
export const CANVAS_POSITIONS = {
  topLeft: { x: 450, y: 150 }, // Changed from 150 to 450 to avoid left-section overlay (~300px wide)
  topCenter: { x: 400, y: 150 },
  topRight: { x: 650, y: 150 },
  midLeft: { x: 450, y: 300 }, // Changed from 150 to 450 to avoid left-section overlay (~300px wide)
  center: { x: 400, y: 300 },
  midRight: { x: 650, y: 300 },
  bottomLeft: { x: 450, y: 450 }, // Changed from 150 to 450 to avoid left-section overlay (~300px wide)
  bottomCenter: { x: 400, y: 450 },
  bottomRight: { x: 650, y: 450 },
};

/**
 * Common test scenarios data
 */
export const TEST_SCENARIOS = {
  linearPath: {
    description: "Linear learning path: A -> B -> C -> D",
    nodes: [
      { id: "node-a", label: "A", ...CANVAS_POSITIONS.topLeft },
      { id: "node-b", label: "B", ...CANVAS_POSITIONS.topCenter },
      { id: "node-c", label: "C", ...CANVAS_POSITIONS.topRight },
      { id: "node-d", label: "D", ...CANVAS_POSITIONS.midRight },
    ],
    edges: [
      { from: "node-a", to: "node-b" },
      { from: "node-b", to: "node-c" },
      { from: "node-c", to: "node-d" },
    ],
  },

  branchingPath: {
    description: "Branching path: A splits into B, C, D",
    nodes: [
      { id: "node-a", label: "A", ...CANVAS_POSITIONS.topCenter },
      { id: "node-b", label: "B", ...CANVAS_POSITIONS.midLeft },
      { id: "node-c", label: "C", ...CANVAS_POSITIONS.center },
      { id: "node-d", label: "D", ...CANVAS_POSITIONS.midRight },
    ],
    edges: [
      { from: "node-a", to: "node-b" },
      { from: "node-a", to: "node-c" },
      { from: "node-a", to: "node-d" },
    ],
  },

  convergingPath: {
    description: "Converging path: A, B, C all lead to D",
    nodes: [
      { id: "node-a", label: "A", ...CANVAS_POSITIONS.topLeft },
      { id: "node-b", label: "B", ...CANVAS_POSITIONS.topCenter },
      { id: "node-c", label: "C", ...CANVAS_POSITIONS.topRight },
      { id: "node-d", label: "D", ...CANVAS_POSITIONS.bottomCenter },
    ],
    edges: [
      { from: "node-a", to: "node-d" },
      { from: "node-b", to: "node-d" },
      { from: "node-c", to: "node-d" },
    ],
  },

  complexPath: {
    description: "Complex path with branching and converging",
    nodes: [
      { id: "node-start", label: "Start", ...CANVAS_POSITIONS.topCenter },
      { id: "node-a", label: "A", ...CANVAS_POSITIONS.midLeft },
      { id: "node-b", label: "B", ...CANVAS_POSITIONS.center },
      { id: "node-c", label: "C", ...CANVAS_POSITIONS.midRight },
      { id: "node-merge", label: "Merge", ...CANVAS_POSITIONS.bottomCenter },
    ],
    edges: [
      { from: "node-start", to: "node-a" },
      { from: "node-start", to: "node-b" },
      { from: "node-start", to: "node-c" },
      { from: "node-a", to: "node-merge" },
      { from: "node-b", to: "node-merge" },
      { from: "node-c", to: "node-merge" },
    ],
  },
};

/**
 * User credentials for manual testing (not used in automated tests)
 */
export const MANUAL_TEST_CREDENTIALS = {
  teacher: {
    email: "teacher@example.test",
    password: "TeacherPass123!",
  },
  student: {
    email: "student@example.test",
    password: "StudentPass123!",
  },
  admin: {
    email: "admin@example.test",
    password: "AdminPass123!",
  },
};

/**
 * Test timeouts (in milliseconds)
 */
export const TEST_TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  aiGeneration: 180000, // 3 minutes for AI galaxy generation
};

/**
 * Firestore emulator settings
 */
export const EMULATOR_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID ?? "galaxy-maps-test",
  auth: {
    host: process.env.FIREBASE_AUTH_EMULATOR ?? "localhost:9099",
  },
  firestore: {
    host: process.env.FIREBASE_FIRESTORE_EMULATOR_HOST ?? "localhost:8080",
  },
  functions: {
    host: process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST ?? "localhost:5001",
  },
};

/**
 * Sample test images (relative paths from project root)
 */
export const TEST_ASSETS = {
  images: {
    small: "tests/e2e/fixtures/assets/test-image-small.png",
    medium: "tests/e2e/fixtures/assets/test-image-medium.png",
    large: "tests/e2e/fixtures/assets/test-image-large.png",
  },
  documents: {
    pdf: "tests/e2e/fixtures/assets/test-document.pdf",
    syllabus: "tests/e2e/fixtures/assets/test-syllabus.pdf",
  },
};

/**
 * Error messages to check for
 */
export const ERROR_MESSAGES = {
  titleRequired: /title.*required/i,
  emailInvalid: /invalid.*email/i,
  passwordWeak: /password.*weak/i,
  nodeNotFound: /node.*not.*found/i,
  prerequisiteSelf: /cannot.*prerequisite.*itself/i,
  circularDependency: /circular.*dependency/i,
};

/**
 * Success messages to check for
 */
export const SUCCESS_MESSAGES = {
  galaxyCreated: /galaxy.*created/i,
  nodeCreated: /node.*created/i,
  nodeSaved: /node.*saved/i,
  nodeDeleted: /node.*deleted/i,
  edgeDeleted: /edge.*deleted/i,
  positionsSaved: /positions.*saved/i,
  galaxyPublished: /galaxy.*published/i,
};
