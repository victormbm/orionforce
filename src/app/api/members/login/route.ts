import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { hashPin } from "@/lib/members/hash";
import {
  clearFailures,
  getIp,
  registerFailure,
  secondsBlocked,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getIp(req);

  // Bloqueio por força-bruta
  const blocked = await secondsBlocked(ip);
  if (blocked > 0) {
    const min = Math.ceil(blocked / 60);
    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        message: `Muitas tentativas. Tente novamente em ${min} min.`,
      },
      { status: 429 }
    );
  }

  const sql = getSql();
  const { nickname, pin } = await req.json();
  const nick = String(nickname ?? "").trim();

  const rows = await sql`
    SELECT id, nickname, pin_hash, class_id AS "classId",
           guild_role AS "guildRole", status, discord, created_at AS "createdAt"
    FROM members
    WHERE lower(nickname) = lower(${nick})
  `;
  const member = rows[0];

  if (!member || member.pin_hash !== (await hashPin(String(pin)))) {
    await registerFailure(ip);
    const code = !member ? "NOT_FOUND" : "WRONG_PIN";
    const message = !member
      ? "Nickname não encontrado. Faça seu cadastro primeiro."
      : "PIN incorreto. Tente novamente.";
    return NextResponse.json({ code, message }, { status: member ? 401 : 404 });
  }

  if (member.status === "pendente") {
    return NextResponse.json(
      {
        code: "PENDING",
        message: "Seu cadastro está aguardando aprovação da liderança.",
      },
      { status: 403 }
    );
  }

  await clearFailures(ip);
  delete member.pin_hash;
  const token = await signToken(member.id);
  return NextResponse.json({ member, token });
}
