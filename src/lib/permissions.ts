import type { GuildRole } from "@/lib/members";

/** Oficiais e líderes podem gerenciar a guild (eventos, cargos, etc.). */
export function canManage(role: GuildRole | undefined): boolean {
  return role === "oficial" || role === "lider";
}
