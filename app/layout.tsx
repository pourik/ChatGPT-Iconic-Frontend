import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iconic ChatGPT Frontend",
  description: "A ChatGPT-inspired frontend built from a Medium tutorial and modernized for a clean streaming chat experience."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
