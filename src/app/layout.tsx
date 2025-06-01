import type { Metadata } from "next";
import "../styles/globals.css";
import { FirebaseProvider } from "../modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { DevNav } from "../modules/shared/interfaces/navigation/dev/DevNav";

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
        {/* PRODUCTION_STANDARD: DevNav 通常僅用於開發環境。在生產打包時應考慮移除或條件渲染。 */}
        <DevNav />
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}