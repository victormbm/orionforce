import { NextResponse } from "next/server";
import { authenticate, canLead, forbidden, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function GET(req: Request) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!canLead(me)) return forbidden();
  const sql = getSql();
  const rows = await sql`SELECT member_id, grp FROM gvg_assignments`;
  const out: Record<string, string> = {};
  for (const r of rows) out[r.member_id] = r.grp;
  return NextResponse.json(out);
}

export async function PUT(req: Request) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!canLead(me)) return forbidden();
  const { memberId, group } = await req.json();
  const sql = getSql();
  if (group === null) {
    await sql`DELETE FROM gvg_assignments WHERE member_id = ${memberId}`;
  } else if (group === "elite" || group === "secundaria") {
    await sql`
      INSERT INTO gvg_assignments (member_id, grp) VALUES (${memberId}, ${group})
      ON CONFLICT (member_id) DO UPDATE SET grp = EXCLUDED.grp
    `;
  } else {
    return NextResponse.json({ message: "Grupo inválido." }, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(req: Request) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!canLead(me)) return forbidden();
  const sql = getSql();
  await sql`DELETE FROM gvg_assignments`;
  return new NextResponse(null, { status: 204 });
}
