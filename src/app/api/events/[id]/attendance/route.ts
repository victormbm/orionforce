import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getSql();
  const rows = await sql`
    SELECT member_id, status FROM attendance WHERE event_id = ${id}
  `;
  const out: Record<string, string> = {};
  for (const r of rows) out[r.member_id] = r.status;
  return NextResponse.json(out);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { memberId, status } = await req.json();
  if (!["vou", "talvez", "nao"].includes(status)) {
    return NextResponse.json({ message: "Status inválido." }, { status: 400 });
  }
  const sql = getSql();
  await sql`
    INSERT INTO attendance (event_id, member_id, status)
    VALUES (${id}, ${memberId}, ${status})
    ON CONFLICT (event_id, member_id) DO UPDATE SET status = EXCLUDED.status
  `;
  return new NextResponse(null, { status: 204 });
}
