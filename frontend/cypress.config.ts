import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: "http://localhost:5173", //frontend dev server
    specPattern: "cypress/e2e/**/*.spec.ts",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
