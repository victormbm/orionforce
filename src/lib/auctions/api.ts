import { apiFetch } from "@/lib/http";
import {
  BidError,
  type AuctionLot,
  type AuctionsRepository,
  type Bid,
  type CreateLotInput,
} from "./types";

/** Implementação via API (Neon) do leilão interno. */
export const apiAuctionsRepo: AuctionsRepository = {
  list: () => apiFetch<AuctionLot[]>("/api/auctions"),

  create: (input: CreateLotInput) =>
    apiFetch<AuctionLot>("/api/auctions", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  remove: async (id) => {
    await apiFetch(`/api/auctions/${id}`, { method: "DELETE" });
  },

  close: async (id) => {
    await apiFetch(`/api/auctions/${id}/close`, { method: "POST" });
  },

  getBids: (lotId) => apiFetch<Bid[]>(`/api/auctions/${lotId}/bids`),

  placeBid: async (lotId, memberId, amount) => {
    try {
      await apiFetch(`/api/auctions/${lotId}/bids`, {
        method: "POST",
        body: JSON.stringify({ memberId, amount }),
      });
    } catch (err) {
      throw new BidError(
        err instanceof Error ? err.message : "Erro ao dar lance."
      );
    }
  },
};
