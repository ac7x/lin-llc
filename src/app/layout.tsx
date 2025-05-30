import type { Metadata } from "next";
import "../styles/globals.css";
import { FirebaseProvider } from "../modules/shared/infrastructure/persistence/firebase/FirebaseContext";

export const metadata: Metadata = {
  title: "Lin.LLC",
  description: "Lin.LLC - 提供專業的軟體開發與 AI 解決方案",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}