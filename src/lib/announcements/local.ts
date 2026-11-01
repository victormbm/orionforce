import type {
  Announcement,
  AnnouncementsRepository,
  CreateAnnouncementInput,
} from "./types";

/** Implementação LOCAL (localStorage) do mural de avisos. */
const KEY = "orionforce.announcements";

function readAll(): Announcement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Announcement[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: Announcement[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const localAnnouncementsRepo: AnnouncementsRepository = {
  async list() {
    return readAll().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },

  async create(input: CreateAnnouncementInput) {
    const item: Announcement = {
      id: uid(),
      title: input.title.trim(),
      body: input.body.trim(),
      authorId: input.authorId,
      createdAt: new Date().toISOString(),
    };
    writeAll([...readAll(), item]);
    return item;
  },

  async remove(id) {
    writeAll(readAll().filter((a) => a.id !== id));
  },
};
