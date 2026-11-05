import type { GuildRole } from "@/lib/members";

/**
 * Hierarquia de permissões:
 * - Oficial: aprovar cadastros e resetar PIN (acessa o painel de Liderança).
 * - Vice-Líder e Líder: liderança plena — eventos, avisos, leilão, GvG,
 *   mudar cargos e remover membros.
 */
export function canManage(role: GuildRole | undefined): boolean {
  return role === "oficial" || role === "vice" || role === "lider";
}

export function canLead(role: GuildRole | undefined): boolean {
  return role === "vice" || role === "lider";
}
