import type { PublicMember } from "./members";

/**
 * Sessão simples no navegador. Guarda o membro logado para o painel interno.
 * (Quando houver backend, isto pode virar um cookie/token — a API da tela
 * continua a mesma.)
 */
const SESSION_KEY = "orionforce.session";

export function setSession(member: PublicMember): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(member));
}

export function getSession(): PublicMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PublicMember) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
