"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PanelTopbar } from "@/components/PanelTopbar";
import {
  auctionsRepo,
  BidError,
  type AuctionLot,
  type Bid,
} from "@/lib/auctions";
import { membersRepo, type PublicMember } from "@/lib/members";
import { canLead } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { formatValue, parseNumber } from "@/lib/format";

export default function AuctionPage() {
  const router = useRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [loading, setLoading] = useState(true);
  const [bidInput, setBidInput] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // formulário de criação
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [minBid, setMinBid] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const reload = async () => {
    const list = await auctionsRepo.list();
    setLots(list);
    const b: Record<string, Bid[]> = {};
    for (const l of list) b[l.id] = await auctionsRepo.getBids(l.id);
    setBids(b);
  };

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setMe(session);
    Promise.all([membersRepo.list(), reload()])
      .then(([list]) => setMembers(list))
      .finally(() => setLoading(false));
  }, [router]);

  const nameOf = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) map[m.id] = m.nickname;
    return map;
  }, [members]);

  if (!me) return null;
  const manager = canLead(me.guildRole);

  const highestOf = (lotId: string): Bid | null => {
    const arr = bids[lotId] ?? [];
    return arr.reduce<Bid | null>(
      (top, b) => (!top || b.amount > top.amount ? b : top),
      null
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseNumber(minBid) ?? 0;
    if (!item.trim() || !endsAt) return;
    await auctionsRepo.create({
      item,
      description,
      minBid: min,
      endsAt: new Date(endsAt).toISOString(),
      createdBy: me.id,
    });
    setItem("");
    setDescription("");
    setMinBid("");
    setEndsAt("");
    await reload();
  };

  const handleBid = async (lotId: string) => {
    setError(null);
    const amount = parseNumber(bidInput[lotId] ?? "");
    if (amount === null) {
      setError("Informe um valor para o lance.");
      return;
    }
    try {
      await auctionsRepo.placeBid(lotId, me.id, amount);
      setBidInput((prev) => ({ ...prev, [lotId]: "" }));
      await reload();
    } catch (err) {
      setError(err instanceof BidError ? err.message : "Erro ao dar lance.");
    }
  };

  const handleClose = async (id: string) => {
    await auctionsRepo.close(id);
    await reload();
  };
  const handleDelete = async (id: string) => {
    await auctionsRepo.remove(id);
    await reload();
  };

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />

      <main className="of-container pt-7">
        <h1
          className="text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{ color: "var(--of-text)" }}
        >
          Leilão Interno
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--of-text-soft)" }}>
          Dispute itens da guild em zeny. Maior lance leva.
        </p>

        {manager && (
          <form onSubmit={handleCreate} className="of-section mt-6 p-5">
            <h2 className="of-label mb-4" style={{ color: "var(--of-primary)" }}>
              Abrir lote
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="of-label mb-2 block">Item</label>
                <input
                  className="of-input"
                  placeholder="Ex: Card Doppelganger"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                />
              </div>
              <div>
                <label className="of-label mb-2 block">Lance mínimo (z)</label>
                <input
                  className="of-input"
                  inputMode="numeric"
                  placeholder="0"
                  value={minBid}
                  onChange={(e) => setMinBid(e.target.value)}
                />
              </div>
              <div>
                <label className="of-label mb-2 block">Encerra em</label>
                <input
                  type="datetime-local"
                  className="of-input"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
              <div>
                <label className="of-label mb-2 block">Descrição</label>
                <input
                  className="of-input"
                  placeholder="Detalhes do item..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="of-cta mt-4"
              style={{ width: "auto" }}
              disabled={!item.trim() || !endsAt}
            >
              Abrir leilão
            </button>
          </form>
        )}

        {error && (
          <p
            className="mt-4 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: "#fde8e8", color: "#b42318" }}
          >
            {error}
          </p>
        )}

        <section className="mt-6 flex flex-col gap-4">
          {loading ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>
              Carregando...
            </p>
          ) : lots.length === 0 ? (
            <div className="of-section p-6 text-center">
              <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>
                Nenhum leilão aberto.
                {manager ? " Abra um lote acima! 👆" : ""}
              </p>
            </div>
          ) : (
            lots.map((lot) => {
              const top = highestOf(lot.id);
              const ended =
                lot.closed || new Date(lot.endsAt).getTime() < Date.now();
              const floor = Math.max(lot.minBid, top?.amount ?? 0);
              return (
                <div key={lot.id} className="of-section p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-lg font-bold"
                          style={{ color: "var(--of-text)" }}
                        >
                          {lot.item}
                        </h3>
                        <span
                          className="of-role-pill"
                          style={{
                            background: ended ? "#8fa0bd" : "#30a46c",
                          }}
                        >
                          {ended ? "Encerrado" : "Aberto"}
                        </span>
                      </div>
                      {lot.description && (
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--of-text-muted)" }}
                        >
                          {lot.description}
                        </p>
                      )}
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--of-text-soft)" }}
                      >
                        🕒 encerra{" "}
                        {new Date(lot.endsAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        · mínimo {formatValue(lot.minBid)} z
                      </p>
                    </div>
                    {manager && (
                      <div className="flex gap-2">
                        {!ended && (
                          <button
                            className="of-btn-ghost"
                            onClick={() => handleClose(lot.id)}
                          >
                            Encerrar
                          </button>
                        )}
                        <button
                          className="of-btn-ghost"
                          style={{ borderColor: "#e5484d", color: "#e5484d" }}
                          onClick={() => handleDelete(lot.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Maior lance */}
                  <div
                    className="mt-4 rounded-xl px-4 py-3"
                    style={{ background: "var(--of-surface-soft)" }}
                  >
                    {top ? (
                      <p className="text-sm" style={{ color: "var(--of-text)" }}>
                        🏆 Maior lance:{" "}
                        <b style={{ color: "var(--of-gold)" }}>
                          {formatValue(top.amount)} z
                        </b>{" "}
                        <span style={{ color: "var(--of-text-soft)" }}>
                          por {nameOf[top.memberId] ?? "?"}
                        </span>
                      </p>
                    ) : (
                      <p
                        className="text-sm"
                        style={{ color: "var(--of-text-muted)" }}
                      >
                        Nenhum lance ainda.
                      </p>
                    )}
                  </div>

                  {/* Dar lance */}
                  {!ended && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        className="of-input"
                        style={{ maxWidth: 200 }}
                        inputMode="numeric"
                        placeholder={`> ${formatValue(floor)} z`}
                        value={bidInput[lot.id] ?? ""}
                        onChange={(e) =>
                          setBidInput((prev) => ({
                            ...prev,
                            [lot.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="of-cta"
                        style={{ width: "auto", marginTop: 0 }}
                        onClick={() => handleBid(lot.id)}
                      >
                        Dar lance
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
