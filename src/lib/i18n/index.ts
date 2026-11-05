import { messages } from "./messages";

export type Language = "pt" | "en" | "es";
export type MessageValues = Record<string, string | number>;
export const locales: Record<Language, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };
export const LANGUAGE_STORAGE_KEY = "orionforce.language";
export function isLanguage(value: unknown): value is Language {
  return value === "pt" || value === "en" || value === "es";
}

// The API keeps its original messages; interpolate known error patterns at the UI boundary.
const errorPatterns = [
  { pattern: /^O nickname "(.+)" já está cadastrado\.$/, key: 'O nickname "{nickname}" já está cadastrado.', parameter: "nickname" },
  { pattern: /^Muitas tentativas\. Tente novamente em (\d+) min\.$/, key: "Muitas tentativas. Tente novamente em {minutes} min.", parameter: "minutes" },
  { pattern: /^O lance precisa ser maior que (.+) z\.$/, key: "O lance precisa ser maior que {amount} z.", parameter: "amount" },
];

export function translate(language: Language, text: string, values?: MessageValues): string {
  let key = text;
  let parameters = values;
  if (!Object.prototype.hasOwnProperty.call(messages, key)) {
    for (const { pattern, key: template, parameter } of errorPatterns) {
      const match = pattern.exec(text);
      if (match) {
        key = template;
        parameters = { [parameter]: match[1] };
        break;
      }
    }
  }
  const variants = Object.prototype.hasOwnProperty.call(messages, key) ? messages[key] : undefined;
  const translated = language === "pt" ? key : variants?.[language === "en" ? 0 : 1] ?? key;
  return parameters ? translated.replace(/\{(\w+)\}/g, (match, name: string) => String(parameters[name] ?? match)) : translated;
}
