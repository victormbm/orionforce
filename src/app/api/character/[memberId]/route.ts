import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const sql = getSql();
  const rows = await sql`
    SELECT member_id AS "memberId", attributes, updated_at AS "updatedAt"
    FROM character_sheets WHERE member_id = ${memberId}
  `;
  return NextResponse.json(rows[0] ?? null);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const { attributes } = await req.json();
  const json = JSON.stringify(attributes ?? {});
  const sql = getSql();
  const rows = await sql`
    INSERT INTO character_sheets (member_id, attributes, updated_at)
    VALUES (${memberId}, ${json}::jsonb, now())
    ON CONFLICT (member_id)
      DO UPDATE SET attributes = EXCLUDED.attributes, updated_at = now()
    RETURNING member_id AS "memberId", attributes, updated_at AS "updatedAt"
  `;
  return NextResponse.json(rows[0]);
}
