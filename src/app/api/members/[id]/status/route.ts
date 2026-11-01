import { NextResponse } from "next/server";
import { authenticate, forbidden, isManager, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

const VALID = ["pendente", "aprovado"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!isManager(me)) return forbidden();
  const { id } = await params;
  const { status } = await req.json();
  if (!VALID.includes(status)) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Status inválido." },
      { status: 400 }
    );
  }
  const sql = getSql();
  const rows = await sql`
    UPDATE members SET status = ${status} WHERE id = ${id}
    RETURNING id, nickname, class_id AS "classId", guild_role AS "guildRole",
              status, discord, created_at AS "createdAt"
  `;
  if (!rows.length) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Membro não encontrado." },
      { status: 404 }
    );
  }
  return NextResponse.json(rows[0]);
}
