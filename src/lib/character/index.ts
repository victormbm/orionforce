import { trackRepository } from "@/lib/loading";
import { apiCharacterRepo } from "./api";
import { localCharacterRepo } from "./local";
import type { CharacterRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND === "local" ? "local" : "api";

export const characterRepo: CharacterRepository =
  trackRepository(backend === "api" ? apiCharacterRepo : localCharacterRepo);

export * from "./types";
