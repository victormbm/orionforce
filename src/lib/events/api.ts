import { apiFetch } from "@/lib/http";
import type {
  Attendance,
  CreateEventInput,
  EventsRepository,
  GuildEvent,
} from "./types";

/** Implementação via API (Neon) de eventos e presenças. */
export const apiEventsRepo: EventsRepository = {
  list: () => apiFetch<GuildEvent[]>("/api/events"),

  create: (input: CreateEventInput) =>
    apiFetch<GuildEvent>("/api/events", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  remove: async (id) => {
    await apiFetch(`/api/events/${id}`, { method: "DELETE" });
  },

  getAttendance: (eventId) =>
    apiFetch<Record<string, Attendance>>(`/api/events/${eventId}/attendance`),

  setAttendance: async (eventId, memberId, status) => {
    await apiFetch(`/api/events/${eventId}/attendance`, {
      method: "PUT",
      body: JSON.stringify({ memberId, status }),
    });
  },
};
