import { localGvgRepo } from "./local";
import type { GvgRepository } from "./types";

/** Backend da escalação de GvG. Hoje local; migra ao Vercel no mesmo padrão. */
export const gvgRepo: GvgRepository = localGvgRepo;

export * from "./types";
