import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Enforce the unified API-client approach: reach backend services only
      // through the shared @busmate/api-client-{core,ticketing,user} packages
      // (configured once in lib/api/setup.ts) — never a per-app generated copy.
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
  },
);
