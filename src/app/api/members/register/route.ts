import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashPin } from "@/lib/members/hash";
import { CLASSES } from "@/data/classes";

export async function POST(req: Request) {
  const sql = getSql();
  const { nickname, pin, classId } = await req.json();
  const nick = String(nickname ?? "").trim();

  if (nick.length < 2 || nick.length > 24) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Nickname deve ter de 2 a 24 caracteres." },
      { status: 400 }
    );
  }
  if (!/^\d{4}$/.test(String(pin ?? ""))) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "O PIN deve ter 4 dígitos." },
      { status: 400 }
    );
  }
  if (!CLASSES.some((c) => c.id === classId)) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Classe inválida." },
      { status: 400 }
    );
  }

  const dup = await sql`SELECT 1 FROM members WHERE lower(nickname) = lower(${nick})`;
  if (dup.length) {
    return NextResponse.json(
      { code: "NICK_TAKEN", message: `O nickname "${nick}" já está cadastrado.` },
      { status: 409 }
    );
  }

  // Bootstrap: primeiro cadastro vira líder já aprovado; os demais entram
  // pendentes (precisam de aprovação da liderança).
  const count = await sql`SELECT count(*)::int AS n FROM members`;
  const first = count[0].n === 0;
  const role = first ? "lider" : "recruta";
  const status = first ? "aprovado" : "pendente";
  const pinHash = await hashPin(String(pin));

  const rows = await sql`
    INSERT INTO members (nickname, pin_hash, class_id, guild_role, status)
    VALUES (${nick}, ${pinHash}, ${classId}, ${role}, ${status})
    RETURNING id, nickname, class_id AS "classId", guild_role AS "guildRole",
              status, discord, created_at AS "createdAt"
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
