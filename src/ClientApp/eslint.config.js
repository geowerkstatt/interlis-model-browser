import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
  {
    files: ["cypress/e2e/**/*.js"],
    rules: {
      "no-undef": "off",
    },
  },
];
