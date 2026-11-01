import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
