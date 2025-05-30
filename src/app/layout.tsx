import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "App",
  description: "next app",
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
