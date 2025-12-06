import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import eslintConfigPrettier from "eslint-config-prettier"
import simpleImportSort from "eslint-plugin-simple-import-sort"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.

  // Custom plugins and rules
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // Simple import sort rules
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // React and external packages
            ["^react", "^@?\\w"],
            // Internal packages
            ["^(@|components)(/.*|$)"],
            // Side effect imports
            ["^\\u0000"],
            // Parent imports
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Other relative imports
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports
            ["^.+\\.?(css)$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // TypeScript rule adjustments
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // React hooks rules adjustments
      "react-hooks/set-state-in-effect": "warn", // Downgrade from error to warning
    },
  },

  // Prettier config should be last to override conflicting rules
  eslintConfigPrettier,

  globalIgnores([
    // Default ignores of eslint-config-next:
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "components/ui/**",
    "components/animate-ui/**",
    "lib/api-client.examples.ts",
    "lib/api-usage-examples.ts"
  ]),
])

export default eslintConfig

