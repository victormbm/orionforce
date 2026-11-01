/** Leilão interno da guild (distribuição de itens em zeny). */

export interface Bid {
  memberId: string;
  amount: number;
  at: string;
}

export interface AuctionLot {
  id: string;
  item: string;
  description?: string;
  minBid: number;
  endsAt: string;
  createdBy: string;
  createdAt: string;
  closed: boolean;
}

export interface CreateLotInput {
  item: string;
  description?: string;
  minBid: number;
  endsAt: string;
  createdBy: string;
}

export class BidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BidError";
  }
}

export interface AuctionsRepository {
  list(): Promise<AuctionLot[]>;
  create(input: CreateLotInput): Promise<AuctionLot>;
  remove(id: string): Promise<void>;
  close(id: string): Promise<void>;
  getBids(lotId: string): Promise<Bid[]>;
  /** Registra um lance. Lança BidError se inválido. */
  placeBid(lotId: string, memberId: string, amount: number): Promise<void>;
}
