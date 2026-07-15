// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Enforce the unified API-client approach: reach backend services only
    // through the shared @busmate/api-client-{core,ticketing,user} packages
    // (configured once in lib/api/setup.ts) — never a per-app generated copy.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/api-client/**", "**/generated/api-client/**"],
              message:
                "Import backend service clients from the shared @busmate/api-client-{core,ticketing,user} packages (wired in lib/api/setup.ts), not a local or generated copy.",
            },
          ],
        },
      ],
    },
  }
]);
