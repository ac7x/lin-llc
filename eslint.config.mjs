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
      "src/hooks/actions/index.ts",
      "src/lib/firebase/firebase-analytics.ts",
      "src/lib/firebase/firebase-appcheck.ts",
      "src/lib/firebase/firebase-auth.ts",
      "src/lib/firebase/firebase-client.ts",
      "src/lib/firebase/firebase-config.ts",
      "src/lib/firebase/firebase-context.tsx",
      "src/lib/firebase/firebase-firestore.ts",
      "src/lib/firebase/firebase-functions.ts",
      "src/lib/firebase/firebase-installations.ts",
      "src/lib/firebase/firebase-messaging.ts",
      "src/lib/firebase/firebase-notifications.ts",
      "src/lib/firebase/firebase-performance.ts",
      "src/lib/firebase/firebase-remote-config.ts",
      "src/lib/firebase/firebase-storage.ts"
    ],
  },
];

export default eslintConfig;
