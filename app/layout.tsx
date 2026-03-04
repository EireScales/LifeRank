import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeRank",
  description: "Discover where you actually stand in life."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
