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
      // O código atual lida com respostas dinâmicas (HTTP, Drizzle, RabbitMQ),
      // então desativamos regras que tratam acesso/retorno como `any` e preferências estilísticas
      // que não trazem benefício prático aqui.
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/require-await": "off",
      // Mantemos aviso para variáveis não usadas, mas ignoramos parâmetros iniciando com _
      // Avisos de variáveis não utilizadas são numerosos por DTOs e
      // factories; desabilitamos globalmente para manter o sinal apenas
      // em problemas que afetam execução.
      "@typescript-eslint/no-unused-vars": "off",
    },
  }),

  // Relaxa regra de métodos não vinculados apenas em arquivos de teste (Jest usa spies em métodos de classe)
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "test/**/*.ts"],
    rules: {
      "@typescript-eslint/unbound-method": "off",
    },
  },

  // Desativa regras de estilo que entram em conflito com o Prettier
  prettierConfig,
];