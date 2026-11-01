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

const INVALID = {
  code: "INVALID_CREDENTIALS",
  message: "Nickname ou PIN inválido.",
};

export async function POST(req: Request) {
  const ipKey = getIp(req);
  const { nickname, pin } = await req.json();
  const nick = String(nickname ?? "").trim();
  const acctKey = `acct:${nick.toLowerCase()}`;

  // Bloqueio por força-bruta: por IP e por conta (nickname). O bloqueio por
  // conta protege mesmo que o atacante troque o IP (x-forwarded-for spoof).
  const blocked = Math.max(
    await secondsBlocked(ipKey),
    nick ? await secondsBlocked(acctKey) : 0
  );
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

  // Validação de formato (PIN de 4 dígitos).
  if (!/^\d{4}$/.test(String(pin ?? "")) || nick.length < 2) {
    await registerFailure(ipKey);
    if (nick) await registerFailure(acctKey);
    return NextResponse.json(INVALID, { status: 401 });
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, nickname, pin_hash, class_id AS "classId",
           guild_role AS "guildRole", status, discord, created_at AS "createdAt"
    FROM members
    WHERE lower(nickname) = lower(${nick})
  `;
  const member = rows[0];

  // Resposta idêntica para "não existe" e "PIN errado" (anti-enumeração).
  if (!member || member.pin_hash !== (await hashPin(String(pin)))) {
    await registerFailure(ipKey);
    await registerFailure(acctKey);
    return NextResponse.json(INVALID, { status: 401 });
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

  await clearFailures(ipKey);
  await clearFailures(acctKey);
  delete member.pin_hash;
  const token = await signToken(member.id);
  return NextResponse.json({ member, token });
}
