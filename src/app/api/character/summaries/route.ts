import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const rows = await sql`
    SELECT member_id AS id,
           COALESCE((attributes->>'poderGeral')::float8, 0) AS poder,
           COALESCE((attributes->>'hpMax')::float8, 0) AS hp
    FROM character_sheets
  `;
  const out: Record<string, { poder: number; hp: number }> = {};
  for (const r of rows) out[r.id] = { poder: r.poder, hp: r.hp };
  return NextResponse.json(out);
}
