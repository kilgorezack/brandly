import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brandly — Extract Brand Assets from Any Website",
  description: "Paste a URL to extract colors, fonts, and logo from any website.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
