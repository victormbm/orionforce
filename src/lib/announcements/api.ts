import { apiFetch } from "@/lib/http";
import type {
  Announcement,
  AnnouncementsRepository,
  CreateAnnouncementInput,
} from "./types";

/** Implementação via API (Neon) do mural de avisos. */
export const apiAnnouncementsRepo: AnnouncementsRepository = {
  list: () => apiFetch<Announcement[]>("/api/announcements"),

  create: (input: CreateAnnouncementInput) =>
    apiFetch<Announcement>("/api/announcements", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  remove: async (id) => {
    await apiFetch(`/api/announcements/${id}`, { method: "DELETE" });
  },
};
