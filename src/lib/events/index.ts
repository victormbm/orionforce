import { trackRepository } from "@/lib/loading";
import { apiEventsRepo } from "./api";
import { localEventsRepo } from "./local";
import type { EventsRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND === "local" ? "local" : "api";

export const eventsRepo: EventsRepository =
  trackRepository(backend === "api" ? apiEventsRepo : localEventsRepo);

export * from "./types";
