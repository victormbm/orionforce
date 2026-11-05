import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
        <LanguageProvider>
          <div className="of-language-bar"><LanguageSwitcher /></div>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
