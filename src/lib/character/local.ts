import type {
  Attributes,
  CharacterRepository,
  CharacterSheet,
  CharacterSummary,
  Snapshot,
} from "./types";

/** Implementação LOCAL (localStorage) da ficha de personagem. */
const SHEETS_KEY = "orionforce.characters";
const SNAPSHOTS_KEY = "orionforce.snapshots";

type SheetMap = Record<string, CharacterSheet>;
type SnapshotMap = Record<string, Snapshot[]>;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const localCharacterRepo: CharacterRepository = {
  async get(memberId) {
    return read<SheetMap>(SHEETS_KEY, {})[memberId] ?? null;
  },

  async save(memberId, attributes: Attributes) {
    const sheets = read<SheetMap>(SHEETS_KEY, {});
    const sheet: CharacterSheet = {
      memberId,
      attributes,
      updatedAt: new Date().toISOString(),
    };
    sheets[memberId] = sheet;
    write(SHEETS_KEY, sheets);
    return sheet;
  },

  async listSnapshots(memberId) {
    return read<SnapshotMap>(SNAPSHOTS_KEY, {})[memberId] ?? [];
  },

  async addSnapshot(memberId) {
    const sheet = read<SheetMap>(SHEETS_KEY, {})[memberId];
    const snapshot: Snapshot = {
      id: uid(),
      createdAt: new Date().toISOString(),
      attributes: sheet?.attributes ?? {},
    };
    const map = read<SnapshotMap>(SNAPSHOTS_KEY, {});
    map[memberId] = [snapshot, ...(map[memberId] ?? [])].slice(0, 20);
    write(SNAPSHOTS_KEY, map);
    return snapshot;
  },

  async deleteSnapshot(memberId, snapshotId) {
    const map = read<SnapshotMap>(SNAPSHOTS_KEY, {});
    map[memberId] = (map[memberId] ?? []).filter((s) => s.id !== snapshotId);
    write(SNAPSHOTS_KEY, map);
  },

  async summaries() {
    const sheets = read<SheetMap>(SHEETS_KEY, {});
    const out: Record<string, CharacterSummary> = {};
    for (const [memberId, sheet] of Object.entries(sheets)) {
      out[memberId] = {
        poder: sheet.attributes.poderGeral ?? 0,
        hp: sheet.attributes.hpMax ?? 0,
      };
    }
    return out;
  },
};
