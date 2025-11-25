# Feature: Configurable Firebase Project Settings

## Feature Description
Enable new developers to configure their own Firebase project by setting Firebase configuration values in a root `.env` file. This allows developers to clone the repository and immediately connect to their own Firebase project for testing, development, and deployment without modifying hardcoded configuration values in source files. The feature will move all Firebase configuration (API key, auth domain, project ID, storage bucket, etc.) from hardcoded values in `src/store/firestoreConfig.ts` to environment variables that are read at build time.

## User Story
As a new developer cloning the Galaxy Maps repository
I want to configure my own Firebase project settings via environment variables
So that I can save galaxies and users to my own Firebase project without modifying source code

## Problem Statement
Currently, Firebase project configuration is hardcoded in `src/store/firestoreConfig.ts` (lines 15-24). This means:
1. New developers cannot easily connect to their own Firebase project
2. Configuration values are committed to the repository (security concern for API keys)
3. Switching between different Firebase projects (dev, staging, production) requires code changes
4. The `.env.example` file mentioned in README_PROJECT.md doesn't exist, making setup confusing
5. The current `.env` file only contains `VITE_VERACITY_LRS_SECRET` and `VITE_OPENAI_API_KEY`, missing all Firebase settings

The `.firebaserc` file contains the project ID but this is separate from the web app configuration that the frontend needs.

## Solution Statement
Move all Firebase configuration from hardcoded values to environment variables prefixed with `VITE_` so they can be accessed via `import.meta.env` in the frontend. Create a comprehensive `.env.example` template file that documents all required environment variables. Update `firestoreConfig.ts` to read from environment variables with clear error messages when required values are missing. Update all documentation to guide new developers through the setup process. Ensure the `.gitignore` file properly excludes `.env` to protect sensitive credentials.

## Relevant Files
Use these files to implement the feature:

- **src/store/firestoreConfig.ts** (lines 15-24) - Currently contains hardcoded Firebase config that needs to be replaced with environment variables. This is the primary file that initializes the Firebase app and exports db, storage, functions, and database instances.

- **.env** - Currently exists but only contains LRS and OpenAI secrets. Will be updated to include all Firebase configuration variables as the working example.

- **.gitignore** (line 15) - Already contains `.env` to exclude it from git, which is correct for protecting secrets.

- **README_PROJECT.md** (lines 40-56) - Documents the environment variable setup process but references a non-existent `.env.example` file. Needs to be updated with complete Firebase configuration instructions.

- **vite.config.ts** - Vite configuration that handles environment variable injection. No changes needed here, but relevant to understand how `import.meta.env` works.

- **.firebaserc** - Contains the Firebase project ID (`galaxy-maps-ac367`) for Firebase CLI operations. This is separate from the web app config but can inform developers about the project structure.

- **firebase.json** - Firebase hosting and emulator configuration. No changes needed but relevant for understanding the full Firebase setup.

- **src/main.ts** - Application entry point that doesn't directly use Firebase config but imports from firestoreConfig.ts.

- **src/plugins/openai.ts** - Example of proper environment variable usage (`import.meta.env.VITE_OPENAI_API_KEY`) that we should follow for Firebase config.

- **src/lib/veracityLRS.js** - Another example of environment variable usage (`import.meta.env.VITE_VERACITY_LRS_SECRET`).

### New Files

- **.env.example** - Template file with all required environment variables documented with placeholder values and comments explaining each variable's purpose. This will be committed to the repository as a reference for new developers.

- **.env.local.example** (optional) - Example for local development overrides if needed for different environments.

## Implementation Plan

### Phase 1: Foundation
1. Audit all Firebase configuration requirements from the current hardcoded config
2. Define the complete set of environment variables needed with the `VITE_` prefix
3. Create validation logic to ensure all required Firebase config variables are present
4. Plan backward compatibility considerations (if any developers are using the current setup)

### Phase 2: Core Implementation
1. Create `.env.example` template file with all Firebase configuration variables documented
2. Update `src/store/firestoreConfig.ts` to read Firebase config from environment variables
3. Add robust error handling and validation for missing or invalid environment variables
4. Test Firebase initialization with environment variables in both development and production builds

### Phase 3: Integration
1. Update `.env` file to include all Firebase variables with working values
2. Update README_PROJECT.md with comprehensive setup instructions
3. Update CLAUDE.md if needed to reflect the new configuration approach
4. Verify `.gitignore` properly excludes `.env` but allows `.env.example`
5. Test the complete developer onboarding flow from clone to running app

## Step by Step Tasks

### Step 1: Create .env.example Template File
- Create `.env.example` in the repository root
- Document all required Firebase configuration variables:
  - `VITE_FIREBASE_API_KEY` - Firebase Web API Key
  - `VITE_FIREBASE_AUTH_DOMAIN` - Firebase Auth domain (e.g., project-id.firebaseapp.com)
  - `VITE_FIREBASE_DATABASE_URL` - Firebase Realtime Database URL
  - `VITE_FIREBASE_PROJECT_ID` - Firebase Project ID
  - `VITE_FIREBASE_STORAGE_BUCKET` - Firebase Storage bucket (e.g., project-id.appspot.com)
  - `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase Cloud Messaging sender ID
  - `VITE_FIREBASE_APP_ID` - Firebase App ID
  - `VITE_FIREBASE_MEASUREMENT_ID` - Firebase Analytics measurement ID
  - `VITE_VERACITY_LRS_SECRET` - Veracity LRS authentication secret
  - `VITE_OPENAI_API_KEY` - OpenAI API key for AI features
- Add comments explaining how to obtain each value from Firebase Console
- Use placeholder values (e.g., "your-api-key-here") instead of real values

### Step 2: Update firestoreConfig.ts to Use Environment Variables
- Replace the hardcoded `firebaseConfig` object in `src/store/firestoreConfig.ts` (lines 15-24)
- Read each configuration value from `import.meta.env.VITE_FIREBASE_*`
- Add validation to check that all required environment variables are defined
- Add helpful error messages that guide developers to check their `.env` file and reference `.env.example`
- Ensure TypeScript types are properly defined for environment variables
- Test that the emulator configuration still works correctly with the new setup

### Step 3: Create Type Definitions for Environment Variables
- Create or update `src/env.d.ts` (or similar) to define TypeScript interfaces for `ImportMetaEnv`
- Include all `VITE_FIREBASE_*`, `VITE_OPENAI_API_KEY`, `VITE_VERACITY_LRS_SECRET`, and emulator-related environment variables
- This provides autocomplete and type safety when accessing `import.meta.env`

### Step 4: Update the Working .env File
- Update the existing `.env` file to include all Firebase configuration variables with working values
- Preserve existing `VITE_VERACITY_LRS_SECRET` and `VITE_OPENAI_API_KEY` values
- Add all Firebase configuration from the current hardcoded values in `firestoreConfig.ts`
- Verify the file is ignored by git (already configured in `.gitignore`)

### Step 5: Validate .gitignore Configuration
- Verify that `.env` is in `.gitignore` (already present on line 15)
- Ensure `.env.example` is NOT in `.gitignore` so it gets committed
- Verify `.env.production` and `.env.local` are also excluded if they exist

### Step 6: Update README_PROJECT.md Documentation
- Update the "Configure Environment Variables" section (lines 40-56) to reference the new `.env.example` file
- Provide step-by-step instructions for obtaining Firebase configuration from Firebase Console:
  1. Go to Firebase Console → Project Settings → General
  2. Scroll to "Your apps" section
  3. Find the web app or create one if needed
  4. Copy the Firebase configuration object
  5. Map each value to the corresponding `VITE_FIREBASE_*` variable
- Update the example `.env` snippet to include all Firebase variables
- Add troubleshooting section for common Firebase configuration issues

### Step 7: Update CLAUDE.md (if needed)
- Review CLAUDE.md to see if Firebase configuration approach should be documented
- Add note about environment-based configuration for Firebase
- Document the pattern for future environment-specific configurations

### Step 8: Create Validation Utility (optional but recommended)
- Create `src/utils/validateEnv.ts` helper function
- Validate all required environment variables are present on app startup
- Provide clear, actionable error messages for missing variables
- Call this validation early in `src/main.ts` before Firebase initialization

### Step 9: Test Development Workflow
- Clear the build cache and `dist` folder
- Run `npm run dev` and verify Firebase connects with environment variables
- Test creating a new galaxy and saving it to Firebase
- Test user authentication and data persistence
- Verify all Firebase services (Auth, Firestore, Storage, Functions, Database) work correctly

### Step 10: Test Emulator Workflow
- Run `npm run dev:emulator` with emulator environment variables
- Verify the emulator connection logic still works with the new configuration
- Test that `VITE_USE_EMULATOR=true` properly triggers emulator mode
- Verify emulator host configuration environment variables work as expected

### Step 11: Test Production Build
- Run `npm run build` to create production build
- Verify environment variables are properly embedded in the build
- Check that no sensitive values are exposed in the built JavaScript
- Test the production build locally with `npm run preview`

### Step 12: Test New Developer Onboarding Flow
- Simulate the new developer experience:
  1. Clone repository (or create fresh checkout)
  2. Copy `.env.example` to `.env`
  3. Fill in Firebase configuration from a test Firebase project
  4. Run `npm install`
  5. Run `npm run dev`
  6. Verify app starts without errors
  7. Test basic functionality (auth, data persistence)
- Document any friction points or unclear instructions

### Step 13: Run Validation Commands
- Execute all validation commands listed below
- Fix any errors or regressions discovered
- Ensure 100% backward compatibility for existing development setup

## Testing Strategy

### Unit Tests
- Test environment variable validation function with missing/invalid values
- Test Firebase config object construction from environment variables
- Mock `import.meta.env` to test different configuration scenarios
- Test error messages provide helpful guidance

### Integration Tests
- Test Firebase initialization with real environment variables
- Test that all Firebase services (Auth, Firestore, Storage, Functions, Database) initialize correctly
- Test emulator mode activation with `VITE_USE_EMULATOR=true`
- Test switching between production and emulator modes

### Edge Cases
- Missing required environment variables (should fail with clear error)
- Empty string values for environment variables (should fail validation)
- Malformed Firebase configuration values (should fail with descriptive error)
- Mixing production and emulator configuration (should work correctly based on `VITE_USE_EMULATOR` flag)
- Building without `.env` file (should fail with helpful message)
- Using `.env.example` directly without customization (should fail validation due to placeholder values)

## Acceptance Criteria
- [ ] `.env.example` file exists with all required Firebase configuration variables documented
- [ ] `.env.example` includes helpful comments explaining how to obtain each value
- [ ] `src/store/firestoreConfig.ts` reads all Firebase config from environment variables
- [ ] Clear validation errors are shown when required environment variables are missing
- [ ] TypeScript types are defined for all environment variables in `env.d.ts`
- [ ] Existing `.env` file is updated with all Firebase configuration
- [ ] `.gitignore` properly excludes `.env` but allows `.env.example` to be committed
- [ ] README_PROJECT.md includes comprehensive Firebase configuration setup instructions
- [ ] Development server (`npm run dev`) works with environment-based configuration
- [ ] Emulator mode (`npm run dev:emulator`) works with environment-based configuration
- [ ] Production build (`npm run build`) works with environment-based configuration
- [ ] New developer can clone repo, copy `.env.example` to `.env`, configure their Firebase project, and run the app successfully
- [ ] All Firebase services (Auth, Firestore, Storage, Functions, Realtime Database) work correctly
- [ ] No hardcoded Firebase configuration remains in source code
- [ ] No sensitive credentials are committed to the repository

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `npm run build` - Build the project to validate no compilation errors and environment variables are properly embedded
- `npm run lint` - Run linting to validate code quality and style compliance
- `npm run type-check` - Run TypeScript type checking to ensure no type errors with new env types
- `npm run dev` - Start dev server and manually test Firebase connection, user auth, and galaxy creation
- `npm run dev:emulator` - Start dev server with emulators and verify emulator mode works correctly
- `git status` - Verify `.env` is not staged but `.env.example` is ready to commit
- Manual test: Copy `.env.example` to `.env.test`, configure with test Firebase project, verify app works

## Notes

### Security Considerations
- The `.env` file must NEVER be committed to the repository as it contains sensitive API keys
- The `.env.example` file should only contain placeholder values, never real credentials
- Firebase API keys for web apps are safe to expose in client-side code as they are protected by Firebase Security Rules and Authentication
- However, it's still best practice to use environment variables for easy configuration management
- Developers should create separate Firebase projects for development/testing rather than sharing production credentials

### Firebase Configuration Values
The current hardcoded configuration in `firestoreConfig.ts` that needs to be moved to environment variables:
```javascript
{
  apiKey: "AIzaSyBSOVegvIYfI49DykugprcD-yJFLf-WgNs",
  authDomain: "galaxy-maps-ac367.firebaseapp.com",
  databaseURL: "https://galaxy-maps-ac367-default-rtdb.firebaseio.com",
  projectId: "galaxy-maps-ac367",
  storageBucket: "galaxy-maps-ac367.appspot.com",
  messagingSenderId: "527578025987",
  appId: "1:527578025987:web:3fa9411ad04559cf223e36",
  measurementId: "G-EHZLKWQG14",
}
```

### Emulator Configuration
The emulator configuration already uses environment variables:
- `VITE_USE_EMULATOR` - Enable/disable emulator mode
- `VITE_FIRESTORE_EMULATOR_HOST` - Firestore emulator host:port
- `VITE_FIREBASE_AUTH_EMULATOR` - Auth emulator URL
- `VITE_FUNCTIONS_EMULATOR_HOST` - Functions emulator host:port
- `VITE_STORAGE_EMULATOR_HOST` - Storage emulator host:port
- `VITE_DATABASE_EMULATOR_HOST` - Realtime Database emulator host:port

These should be documented in `.env.example` as optional variables for emulator usage.

### Obtaining Firebase Configuration
New developers should be guided to:
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password provider)
3. Create a Firestore Database
4. Create a Realtime Database
5. Enable Storage
6. Go to Project Settings → General → Your apps
7. Register a web app or select existing web app
8. Copy the Firebase configuration object
9. Map each field to the corresponding `VITE_FIREBASE_*` environment variable in `.env`

### Future Enhancements
- Consider using different `.env` files for different environments (`.env.development`, `.env.production`)
- Add a setup script that guides developers through Firebase project configuration
- Create a validation script that checks Firebase configuration before build
- Add environment variable validation to pre-commit hooks
- Consider documenting how to set up Firebase Cloud Functions with their own environment configuration
