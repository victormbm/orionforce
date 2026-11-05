import { NextResponse } from "next/server";
import { authenticate, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

/** Timestamp do item mais recente de cada seção (para o alerta de novidade). */
export async function GET(req: Request) {
  if (!(await authenticate(req))) return unauthorized();
  const sql = getSql();
  const rows = await sql`
    SELECT
      (SELECT max(created_at) FROM events) AS eventos,
      (SELECT max(created_at) FROM announcements) AS avisos,
      (SELECT max(created_at) FROM auction_lots) AS leilao
  `;
  return NextResponse.json(rows[0]);
}
