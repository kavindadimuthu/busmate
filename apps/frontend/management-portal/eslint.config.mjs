import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*"],
              message:
                "Import UI primitives from '@busmate/ui' instead of local copies.",
            },
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
];
