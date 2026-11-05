import type { GvgAssignment, GvgAssignments } from "./types";

export const PARTY_SIZE = 5;
export const PARTY_COUNT = 8;
export const TEAM_SIZE = PARTY_SIZE * PARTY_COUNT;
export const PARTIES = Array.from({ length: PARTY_COUNT }, (_, index) => index + 1);
export const PARTY_FULL = "Este grupo já tem 5 jogadores. Escolha outro grupo.";

export function isAssignment(value: unknown): value is GvgAssignment {
  if (!value || typeof value !== "object") return false;
  const target = value as GvgAssignment;
  return (target.group === "elite" || target.group === "secundaria") &&
    Number.isInteger(target.party) && target.party >= 1 && target.party <= PARTY_COUNT;
}

/** Preserve legacy team assignments, distributing them across parties in a stable order. */
export function normalizeAssignments(raw: Record<string, unknown>): GvgAssignments {
  const result: GvgAssignments = {};
  const legacy: [string, "elite" | "secundaria"][] = [];
  for (const [id, value] of Object.entries(raw)) {
    if (isAssignment(value)) result[id] = value;
    else if (value === "elite" || value === "secundaria") legacy.push([id, value]);
  }
  for (const [id, group] of legacy.sort(([a], [b]) => a.localeCompare(b))) {
    const party = PARTIES.find(party => Object.values(result).filter(a => a.group === group && a.party === party).length < PARTY_SIZE) ?? PARTY_COUNT;
    result[id] = { group, party };
  }
  return result;
}

export function moveMember(assignments: GvgAssignments, memberId: string, target: GvgAssignment | null): GvgAssignments {
  if (target !== null && !isAssignment(target)) throw new Error("Grupo inválido.");
  if (target && Object.entries(assignments).filter(([id, a]) => id !== memberId && a.group === target.group && a.party === target.party).length >= PARTY_SIZE) {
    throw new Error(PARTY_FULL);
  }
  const next = { ...assignments };
  if (target) next[memberId] = target;
  else delete next[memberId];
  return next;
}

/** Release only this party; all other team/party assignments remain untouched. */
export function clearParty(assignments: GvgAssignments, target: GvgAssignment): GvgAssignments {
  if (!isAssignment(target)) throw new Error("Grupo inválido.");
  return Object.fromEntries(Object.entries(assignments).filter(([, placement]) => placement.group !== target.group || placement.party !== target.party));
}
