import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orion Force — Gestão & Roster",
  description:
    "Painel de gestão e roster do clã Orion Force — Ragnarok Origin Classic.",
  icons: { icon: "/orion-badge.png", apple: "/orion-badge.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="of-stars" aria-hidden />
        <div className="of-watermark" aria-hidden />
        {children}
      </body>
    </html>
  );
}
