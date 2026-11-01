import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashPin } from "@/lib/members/hash";

export async function POST(req: Request) {
  const sql = getSql();
  const { nickname, pin } = await req.json();
  const nick = String(nickname ?? "").trim();

  const rows = await sql`
    SELECT id, nickname, pin_hash, class_id AS "classId",
           guild_role AS "guildRole", discord, created_at AS "createdAt"
    FROM members
    WHERE lower(nickname) = lower(${nick})
  `;
  const member = rows[0];
  if (!member) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Nickname não encontrado. Faça seu cadastro primeiro." },
      { status: 404 }
    );
  }
  if (member.pin_hash !== (await hashPin(String(pin)))) {
    return NextResponse.json(
      { code: "WRONG_PIN", message: "PIN incorreto. Tente novamente." },
      { status: 401 }
    );
  }

  delete member.pin_hash;
  return NextResponse.json(member);
}
