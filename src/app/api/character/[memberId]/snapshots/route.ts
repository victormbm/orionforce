import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const sql = getSql();
  const rows = await sql`
    SELECT id, attributes, created_at AS "createdAt"
    FROM snapshots WHERE member_id = ${memberId}
    ORDER BY created_at DESC LIMIT 20
  `;
  return NextResponse.json(rows);
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
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
