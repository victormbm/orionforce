import { trackRepository } from "@/lib/loading";
import { apiAuctionsRepo } from "./api";
import { localAuctionsRepo } from "./local";
import type { AuctionsRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND === "local" ? "local" : "api";

export const auctionsRepo: AuctionsRepository =
  trackRepository(backend === "api" ? apiAuctionsRepo : localAuctionsRepo);

export * from "./types";
