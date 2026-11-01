import { apiAnnouncementsRepo } from "./api";
import { localAnnouncementsRepo } from "./local";
import type { AnnouncementsRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND ?? "local";

export const announcementsRepo: AnnouncementsRepository =
  backend === "api" ? apiAnnouncementsRepo : localAnnouncementsRepo;

export * from "./types";
