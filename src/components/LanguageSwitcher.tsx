"use client";

import { useLanguage, type Language } from "@/components/LanguageProvider";

const languages: { code: Language; label: string; name: string }[] = [
  { code: "pt", label: "PT", name: "Português" },
  { code: "en", label: "EN", name: "English" },
  { code: "es", label: "ES", name: "Español" },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="of-language-switcher" role="group" aria-label={t("Selecionar idioma")}>
      <span aria-hidden="true">🌐</span>
      {languages.map(({ code, label, name }) => (
        <button key={code} type="button" lang={code} title={name} aria-label={name}
          aria-pressed={language === code} onClick={() => setLanguage(code)}>
          {label}
        </button>
      ))}
    </div>
  );
}
