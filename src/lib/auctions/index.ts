import { localAuctionsRepo } from "./local";
import type { AuctionsRepository } from "./types";

/** Backend do leilão. Hoje local; migra ao Vercel no mesmo padrão. */
export const auctionsRepo: AuctionsRepository = localAuctionsRepo;

export * from "./types";
