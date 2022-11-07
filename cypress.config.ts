import admin from 'firebase-admin';
import { defineConfig } from 'cypress';
import { plugin as cypressFirebasePlugin } from 'cypress-firebase';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      cypressFirebasePlugin(on, config, admin);
      // implement node event listeners here
    },
  },
});
