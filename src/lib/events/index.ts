import { localEventsRepo } from "./local";
import type { EventsRepository } from "./types";

/**
 * Backend de eventos. Hoje: local (localStorage). Para migrar ao Vercel,
 * criar `api.ts` (fetch → /api/events/*) + tabelas `events` e `attendance`.
 * Mesmo padrão de src/lib/members e src/lib/character.
 */
export const eventsRepo: EventsRepository = localEventsRepo;

export * from "./types";
