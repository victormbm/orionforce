import { localCharacterRepo } from "./local";
import type { CharacterRepository } from "./types";

/**
 * Backend da ficha de personagem. Hoje: local (localStorage).
 * Para migrar ao Vercel, criar uma implementação `api.ts` (fetch →
 * /api/character/*) e tabelas `character_sheets` e `snapshots`, depois
 * trocar aqui. A tela não muda. (Mesmo padrão de src/lib/members.)
 */
export const characterRepo: CharacterRepository = localCharacterRepo;

export * from "./types";
