import {
  BidError,
  type AuctionLot,
  type AuctionsRepository,
  type Bid,
  type CreateLotInput,
} from "./types";

/** Implementação LOCAL (localStorage) do leilão interno. */
const LOTS_KEY = "orionforce.auctions";
const BIDS_KEY = "orionforce.bids";

type BidsMap = Record<string, Bid[]>;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const localAuctionsRepo: AuctionsRepository = {
  async list() {
    return read<AuctionLot[]>(LOTS_KEY, []).sort(
      (a, b) => +new Date(a.endsAt) - +new Date(b.endsAt)
    );
  },

  async create(input: CreateLotInput) {
    const lot: AuctionLot = {
      id: uid(),
      item: input.item.trim(),
      description: input.description?.trim() || undefined,
      minBid: input.minBid,
      endsAt: input.endsAt,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      closed: false,
    };
    write(LOTS_KEY, [...read<AuctionLot[]>(LOTS_KEY, []), lot]);
    return lot;
  },

  async remove(id) {
    write(
      LOTS_KEY,
      read<AuctionLot[]>(LOTS_KEY, []).filter((l) => l.id !== id)
    );
    const bids = read<BidsMap>(BIDS_KEY, {});
    delete bids[id];
    write(BIDS_KEY, bids);
  },

  async close(id) {
    const lots = read<AuctionLot[]>(LOTS_KEY, []);
    const lot = lots.find((l) => l.id === id);
    if (lot) lot.closed = true;
    write(LOTS_KEY, lots);
  },

  async getBids(lotId) {
    return read<BidsMap>(BIDS_KEY, {})[lotId] ?? [];
  },

  async placeBid(lotId, memberId, amount) {
    const lot = read<AuctionLot[]>(LOTS_KEY, []).find((l) => l.id === lotId);
    if (!lot) throw new BidError("Lote não encontrado.");
    if (lot.closed || new Date(lot.endsAt).getTime() < Date.now()) {
      throw new BidError("Este leilão já encerrou.");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BidError("Informe um valor válido.");
    }
    const bids = read<BidsMap>(BIDS_KEY, {});
    const current = bids[lotId] ?? [];
    const highest = current.reduce((m, b) => Math.max(m, b.amount), 0);
    const floor = Math.max(lot.minBid, highest);
    if (amount <= floor) {
      throw new BidError(
        `O lance precisa ser maior que ${floor.toLocaleString("pt-BR")} z.`
      );
    }
    bids[lotId] = [...current, { memberId, amount, at: new Date().toISOString() }];
    write(BIDS_KEY, bids);
  },
};
