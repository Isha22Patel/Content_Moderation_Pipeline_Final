import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Moderation Pipeline",
  description: "AI-powered · Multi-stage · Explainable content moderation pipeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
