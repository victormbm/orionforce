import { localAnnouncementsRepo } from "./local";
import type { AnnouncementsRepository } from "./types";

/** Backend do mural. Hoje local; migra ao Vercel no mesmo padrão. */
export const announcementsRepo: AnnouncementsRepository =
  localAnnouncementsRepo;

export * from "./types";
