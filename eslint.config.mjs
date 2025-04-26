import { defineConfig } from "eslint/config";
import globals from "globals";
import babelParser from "@babel/eslint-parser";

export default defineConfig([{
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.jquery,
        },

        parser: babelParser,
    },

    rules: {},
}]);