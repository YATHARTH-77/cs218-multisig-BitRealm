import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BitRealm · MultiSig",
  description: "CS218 MultiSig Wallet — BitRealm",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}