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
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { id } = await params;
  const { status } = await req.json();
  if (!["vou", "talvez", "nao"].includes(status)) {
    return NextResponse.json({ message: "Status inválido." }, { status: 400 });
  }
  const sql = getSql();
  // Cada membro registra apenas a própria presença (usa o id do token).
  await sql`
    INSERT INTO attendance (event_id, member_id, status)
    VALUES (${id}, ${me.id}, ${status})
    ON CONFLICT (event_id, member_id) DO UPDATE SET status = EXCLUDED.status
  `;
  return new NextResponse(null, { status: 204 });
}
