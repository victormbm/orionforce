import { trackRepository } from "@/lib/loading";
import { apiAnnouncementsRepo } from "./api";
import { localAnnouncementsRepo } from "./local";
import type { AnnouncementsRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND === "local" ? "local" : "api";

export const announcementsRepo: AnnouncementsRepository =
  trackRepository(backend === "api" ? apiAnnouncementsRepo : localAnnouncementsRepo);

export * from "./types";
