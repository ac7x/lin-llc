import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Lin.LLC",
  description: "Lin.LLC app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
