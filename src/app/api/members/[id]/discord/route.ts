import { NextResponse } from "next/server";
import { authenticate, forbidden, isManager, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { id } = await params;
  // Cada um edita o próprio Discord; gestores podem editar de qualquer um.
  if (me.id !== id && !isManager(me)) return forbidden();
  const { discord } = await req.json();
  const value = String(discord ?? "").trim() || null;
  const sql = getSql();
  const rows = await sql`
    UPDATE members SET discord = ${value} WHERE id = ${id}
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
