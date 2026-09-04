import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RLAP — Book a Test",
  description: "Patient-facing booking widget for radiology and lab diagnostics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
