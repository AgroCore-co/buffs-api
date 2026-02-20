import globals from "globals";
import js from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default [
  // Configuração global e para arquivos JavaScript
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Configuração principal para arquivos TypeScript
  ...typescriptEslint.config({
    files: ["**/*.ts"],
    extends: [
      ...typescriptEslint.configs.recommendedTypeChecked,
      ...typescriptEslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  }),

  // Desativa regras de estilo que entram em conflito com o Prettier
  prettierConfig,
];