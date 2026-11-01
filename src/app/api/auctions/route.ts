import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const rows = await sql`
    SELECT id, item, description, min_bid::float8 AS "minBid",
           ends_at AS "endsAt", created_by AS "createdBy",
           created_at AS "createdAt", closed
    FROM auction_lots ORDER BY ends_at ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { item, description, minBid, endsAt, createdBy } = await req.json();
  if (!String(item ?? "").trim() || !endsAt) {
    return NextResponse.json(
      { message: "Preencha o item e o prazo." },
      { status: 400 }
    );
  }
  const sql = getSql();
  const rows = await sql`
    INSERT INTO auction_lots (item, description, min_bid, ends_at, created_by)
    VALUES (${String(item).trim()}, ${description || null}, ${Number(minBid) || 0}, ${endsAt}, ${createdBy})
    RETURNING id, item, description, min_bid::float8 AS "minBid",
              ends_at AS "endsAt", created_by AS "createdBy",
              created_at AS "createdAt", closed
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
