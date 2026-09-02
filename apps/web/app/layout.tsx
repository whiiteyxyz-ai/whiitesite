import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhiiteSite – KI Multi-Tool",
  description: "Bildgenerierung, Produktbeschreibungen, Whiity KI-Assistent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>W</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
