import type { GuildRole } from "@/lib/members";

/** Nome exibido e cor de cada cargo dentro da guild. */
export const GUILD_ROLE_INFO: Record<
  GuildRole,
  { label: string; color: string }
> = {
  recruta: { label: "Recruta", color: "#8fa0bd" },
  membro: { label: "Membro", color: "#2f6bff" },
  oficial: { label: "Oficial", color: "#e0a73a" },
  lider: { label: "Líder", color: "#8e4ec6" },
};
