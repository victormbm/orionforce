import { NextResponse } from "next/server";
import { authenticate, canLead, forbidden, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { isAssignment, normalizeAssignments, PARTY_FULL, PARTY_SIZE } from "@/lib/gvg/lineup";

export async function GET(req: Request) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!canLead(me)) return forbidden();
  const sql = getSql();
  const rows = await sql`SELECT member_id, grp, to_jsonb(gvg_assignments)->>'party' AS party FROM gvg_assignments`;
  const raw: Record<string, unknown> = {};
  for (const row of rows) raw[row.member_id] = row.party ? { group: row.grp, party: Number(row.party) } : row.grp;
  return NextResponse.json(normalizeAssignments(raw));
}

export async function PUT(req: Request) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!canLead(me)) return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.memberId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.memberId)) {
    return NextResponse.json({ message: "Membro não encontrado." }, { status: 400 });
  }
  const { memberId, group, party } = body;
  const sql = getSql();
  if (group === null) {
    await sql`DELETE FROM gvg_assignments WHERE member_id = ${memberId}`;
  } else if (isAssignment({ group, party })) {
    const [schema] = await sql`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'gvg_assignments' AND column_name = 'party') AS ready`;
    if (!schema.ready) return NextResponse.json({ message: "A organização por grupos está sendo atualizada. Tente novamente em instantes." }, { status: 503 });
    // Serialize competing moves before checking capacity; the sixth member must never fit.
    const [, updated] = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(68674005)`,
      sql`
        INSERT INTO gvg_assignments (member_id, grp, party)
        SELECT id, ${group}, ${party} FROM members
        WHERE id = ${memberId} AND status = 'aprovado'
          AND (SELECT count(*) FROM gvg_assignments
               WHERE grp = ${group} AND party = ${party} AND member_id <> ${memberId}) < ${PARTY_SIZE}
        ON CONFLICT (member_id) DO UPDATE SET grp = EXCLUDED.grp, party = EXCLUDED.party
        RETURNING member_id
      `,
    ]);
    if (!updated.length) {
      return NextResponse.json({ message: PARTY_FULL }, { status: 409 });
    }
  } else {
    return NextResponse.json({ message: "Grupo inválido." }, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(req: Request) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!canLead(me)) return forbidden();
  const target = await req.json().catch(() => null);
  if (!isAssignment(target)) return NextResponse.json({ message: "Grupo inválido." }, { status: 400 });
  const sql = getSql();
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(68674005)`,
    sql`DELETE FROM gvg_assignments WHERE grp = ${target.group} AND party = ${target.party}`,
  ]);
  return new NextResponse(null, { status: 204 });
}
