import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "**/*bundle*",
      "**/.bang.html.snapshot/**",
      "old/",
      "plugins/demo/",
      "plugins/appminifier/",
      "src/handlers/demo.js",
      "**/simplepeer.min.js"
    ]
  },
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
]);
