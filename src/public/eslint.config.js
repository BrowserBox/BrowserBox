import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "**/*bundle*",
      "voodoo/.bang.html.snapshot**",
      "old/",
      "plugins/demo/",
      "plugins/appminifier/",
      "voodoo/**",
      "simplepeer.min.js"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.browser },
  }
]);
