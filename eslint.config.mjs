import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "src/lib/firebase/firebase-client.ts",
      "src/lib/firebase/firebase-config.ts",
      "src/lib/firebase/firebase-context.tsx",
      "src/lib/firebase/firebase-notifications.ts",
    ],
  },
];

export default eslintConfig;
