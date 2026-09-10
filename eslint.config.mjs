import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // src/db/index.ts is the raw Drizzle client — only src/db/queries/ may
  // import it. Everything else goes through a query function. See
  // CLAUDE.md's "Non-negotiable conventions" #1.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/db/queries/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*/db/index", "*/db", "@/db", "@/db/index"],
              message:
                "Only src/db/queries/ may import the raw db client. Add or use a query function instead.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
