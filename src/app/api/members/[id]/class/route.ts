import { NextResponse } from "next/server";
import { authenticate, forbidden, isManager, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { CLASSES } from "@/data/classes";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { id } = await params;
  // Cada um edita a própria classe; gestores podem editar a de qualquer um.
  if (me.id !== id && !isManager(me)) return forbidden();

  const { classId } = await req.json();
  if (!CLASSES.some((c) => c.id === classId)) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Classe inválida." },
      { status: 400 }
    );
  }

  const sql = getSql();
  const rows = await sql`
    UPDATE members SET class_id = ${classId} WHERE id = ${id}
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
