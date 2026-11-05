import type { GvgAssignments, GvgRepository } from "./types";
import { clearParty, moveMember, normalizeAssignments } from "./lineup";

const KEY = "orionforce.gvg";
function readAll(): GvgAssignments {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? normalizeAssignments(raw) : {};
  } catch { return {}; }
}
export const localGvgRepo: GvgRepository = {
  async getAssignments() { return readAll(); },
  async assign(memberId, target) {
    localStorage.setItem(KEY, JSON.stringify(moveMember(readAll(), memberId, target)));
  },
  async clear(target) { localStorage.setItem(KEY, JSON.stringify(clearParty(readAll(), target))); },
};
