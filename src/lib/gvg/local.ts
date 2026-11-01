import type { GvgGroup, GvgRepository } from "./types";

/** Implementação LOCAL (localStorage) da escalação de GvG. */
const KEY = "orionforce.gvg";

type AssignMap = Record<string, GvgGroup>;

function readAll(): AssignMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AssignMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: AssignMap): void {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export const localGvgRepo: GvgRepository = {
  async getAssignments() {
    return readAll();
  },

  async assign(memberId, group) {
    const map = readAll();
    if (group === null) delete map[memberId];
    else map[memberId] = group;
    writeAll(map);
  },

  async clear() {
    writeAll({});
  },
};
