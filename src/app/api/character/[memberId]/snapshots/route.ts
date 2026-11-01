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
    SELECT id, attributes, created_at AS "createdAt"
    FROM snapshots WHERE member_id = ${memberId}
    ORDER BY created_at DESC LIMIT 20
  `;
  return NextResponse.json(rows);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { memberId } = await params;
  if (me.id !== memberId && !isManager(me)) return forbidden();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO snapshots (member_id, attributes)
    VALUES (
      ${memberId},
      COALESCE((SELECT attributes FROM character_sheets WHERE member_id = ${memberId}), '{}'::jsonb)
    )
    RETURNING id, attributes, created_at AS "createdAt"
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
