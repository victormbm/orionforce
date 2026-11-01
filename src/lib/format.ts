/** Formatação e parsing de números no padrão pt-BR. */

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Formata um número com separador de milhar pt-BR + sufixo opcional (ex: "%"). */
export function formatValue(n: number, suffix?: string): string {
  return nf.format(n) + (suffix ?? "");
}

/**
 * Converte o texto digitado em número. Aceita vírgula ou ponto como decimal.
 * Retorna null quando o campo está vazio/inválido.
 */
export function parseNumber(raw: string): number | null {
  const t = raw.trim();
  if (t === "" || t === "-") return null;
  const n = Number(t.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
