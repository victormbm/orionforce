import type {
  Attendance,
  CreateEventInput,
  EventsRepository,
  GuildEvent,
} from "./types";

/** Implementação LOCAL (localStorage) de eventos e presenças. */
const EVENTS_KEY = "orionforce.events";
const ATTENDANCE_KEY = "orionforce.attendance";

type AttendanceMap = Record<string, Record<string, Attendance>>;

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

export const localEventsRepo: EventsRepository = {
  async list() {
    return read<GuildEvent[]>(EVENTS_KEY, []).sort(
      (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)
    );
  },

  async create(input: CreateEventInput) {
    const event: GuildEvent = {
      id: uid(),
      title: input.title.trim(),
      type: input.type,
      startsAt: input.startsAt,
      notes: input.notes?.trim() || undefined,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    write(EVENTS_KEY, [...read<GuildEvent[]>(EVENTS_KEY, []), event]);
    return event;
  },

  async remove(id) {
    write(
      EVENTS_KEY,
      read<GuildEvent[]>(EVENTS_KEY, []).filter((e) => e.id !== id)
    );
    const att = read<AttendanceMap>(ATTENDANCE_KEY, {});
    delete att[id];
    write(ATTENDANCE_KEY, att);
  },

  async getAttendance(eventId) {
    return read<AttendanceMap>(ATTENDANCE_KEY, {})[eventId] ?? {};
  },

  async setAttendance(eventId, memberId, status: Attendance) {
    const att = read<AttendanceMap>(ATTENDANCE_KEY, {});
    att[eventId] = { ...(att[eventId] ?? {}), [memberId]: status };
    write(ATTENDANCE_KEY, att);
  },
};
