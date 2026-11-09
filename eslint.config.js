import js from "@eslint/js";
import globals from "globals";
import imports from "eslint-plugin-import-x";

export default [
  { ignores: ["**/node_modules/**", ".nx/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.mocha },
    },
    plugins: { "import-x": imports },
    rules: {
      "import-x/no-unresolved": "error",
      "no-useless-assignment": "warn",
      "no-unused-vars": [
        "warn",
        { args: "none", caughtErrors: "none", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // These paths are completed by the CLI when it writes a service.
    files: [
      "**/template/**/*.js",
      "**/base_test/**/*.js",
      "**/deploy/src/**/*.js",
      "**/template_*/**/*.js",
    ],
    rules: { "import-x/no-unresolved": "off" },
  },
];
