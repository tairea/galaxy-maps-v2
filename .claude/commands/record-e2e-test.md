# Record E2E Test

Launch all e2e test emulators and servers, then start Playwright codegen to record a new test.

## Instructions

1. Start the Firebase emulators in the background (auth, firestore, functions, storage, database)
2. Start the Vite dev server with emulator configuration in the background
3. Wait for both services to be ready:
   - Frontend server on port 5173
   - Auth emulator on port 9099
4. Once ready, launch Playwright codegen to record interactions
5. Save the recording to `tests/e2e/$ARGUMENTS.spec.ts`

## Implementation Steps

Execute the following commands in order:

1. Start emulators in background:
   ```bash
   npm run emulators:start
   ```
   Run this in the background and capture the shell ID.

2. Start dev server in background:
   ```bash
   cross-env VITE_USE_EMULATOR=true npm run dev:emulator
   ```
   Run this in the background and capture the shell ID.

3. Wait for services to be ready:
   ```bash
   npx wait-on tcp:5173 tcp:9099
   ```

4. Launch Playwright codegen:
   ```bash
   npx playwright codegen http://127.0.0.1:5173 --output tests/e2e/$ARGUMENTS.spec.ts
   ```

5. After codegen completes, remind the user to stop the background processes.

## Notes

- The test file will be created at `tests/e2e/$ARGUMENTS.spec.ts`
- The emulators and dev server will continue running in the background
- You can stop them using the KillShell tool with their respective shell IDs
- The frontend will be accessible at http://127.0.0.1:5173
- All Firebase services will use the emulators (auth, firestore, functions, storage, database)
