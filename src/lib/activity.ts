import { apiFetch } from "@/lib/http";

/** Seções que têm alerta de novidade no menu. */
export type Section = "eventos" | "avisos" | "leilao";

export type Activity = Record<Section, string | null>;

export function fetchActivity(): Promise<Activity> {
  return apiFetch<Activity>("/api/activity");
}

/** Mapeia a rota do menu para a seção, ou null se não tiver alerta. */
export function pathToSection(pathname: string): Section | null {
  if (pathname.startsWith("/painel/eventos")) return "eventos";
  if (pathname.startsWith("/painel/avisos")) return "avisos";
  if (pathname.startsWith("/painel/leilao")) return "leilao";
  return null;
}

function key(memberId: string, section: Section): string {
  return `orionforce.seen.${memberId}.${section}`;
}

export function getLastSeen(memberId: string, section: Section): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(key(memberId, section));
  return v ? Number(v) : 0;
}

export function markSeen(memberId: string, section: Section): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(memberId, section), String(Date.now()));
}

/** Há item mais novo do que a última visita do membro àquela seção? */
export function hasNew(
  activity: Activity | null,
  memberId: string,
  section: Section
): boolean {
  if (!activity) return false;
  const ts = activity[section];
  if (!ts) return false;
  return new Date(ts).getTime() > getLastSeen(memberId, section);
}
