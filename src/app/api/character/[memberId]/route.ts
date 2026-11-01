import { NextResponse } from "next/server";
import { authenticate, forbidden, isManager, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { memberId } = await params;
  if (me.id !== memberId && !isManager(me)) return forbidden();
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
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { memberId } = await params;
  if (me.id !== memberId && !isManager(me)) return forbidden();
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
