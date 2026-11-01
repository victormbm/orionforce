import { apiEventsRepo } from "./api";
import { localEventsRepo } from "./local";
import type { EventsRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND ?? "local";

export const eventsRepo: EventsRepository =
  backend === "api" ? apiEventsRepo : localEventsRepo;

export * from "./types";
