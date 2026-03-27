import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnFlow — AI Python Tutor",
  description: "AI-powered Python tutoring platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0F172A", minHeight: "100vh" }}>{children}</body>
    </html>
  );
}
