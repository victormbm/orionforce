import { NextResponse } from "next/server";
import { authenticate, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await authenticate(req))) return unauthorized();
  const { id } = await params;
  const sql = getSql();
  const rows = await sql`
    SELECT member_id AS "memberId", amount::float8 AS amount, at
    FROM bids WHERE lot_id = ${id} ORDER BY amount DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { id } = await params;
  const { amount } = await req.json();
  const memberId = me.id; // o lance é sempre do próprio membro logado
  const value = Number(amount);
  const sql = getSql();

  const lots = await sql`
    SELECT min_bid::float8 AS "minBid", ends_at AS "endsAt", closed
    FROM auction_lots WHERE id = ${id}
  `;
  const lot = lots[0];
  if (!lot) {
    return NextResponse.json({ message: "Lote não encontrado." }, { status: 404 });
  }
  if (lot.closed || new Date(lot.endsAt).getTime() < Date.now()) {
    return NextResponse.json(
      { message: "Este leilão já encerrou." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ message: "Informe um valor válido." }, { status: 400 });
  }

  const top = await sql`
    SELECT COALESCE(MAX(amount)::float8, 0) AS highest FROM bids WHERE lot_id = ${id}
  `;
  const floor = Math.max(lot.minBid, top[0].highest);
  if (value <= floor) {
    return NextResponse.json(
      { message: `O lance precisa ser maior que ${floor.toLocaleString("pt-BR")} z.` },
      { status: 400 }
    );
  }

  await sql`
    INSERT INTO bids (lot_id, member_id, amount) VALUES (${id}, ${memberId}, ${value})
  `;
  return new NextResponse(null, { status: 201 });
}
