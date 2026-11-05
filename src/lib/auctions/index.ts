import { apiAuctionsRepo } from "./api";
import { localAuctionsRepo } from "./local";
import type { AuctionsRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND === "local" ? "local" : "api";

export const auctionsRepo: AuctionsRepository =
  backend === "api" ? apiAuctionsRepo : localAuctionsRepo;

export * from "./types";
