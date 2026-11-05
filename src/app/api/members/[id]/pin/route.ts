import { NextResponse } from "next/server";
import { authenticate, forbidden, isManager, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { hashPin } from "@/lib/members/hash";
import { clearFailures, registerFailure, secondsBlocked } from "@/lib/rate-limit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { id } = await params;
  const { currentPin, newPin } = await req.json();
  const sql = getSql();

  // Troca do próprio PIN: exige o PIN atual.
  if (me.id === id) {
    // Rate limit por conta contra brute-force do PIN atual.
    const throttleKey = `pin:${id}`;
    const blocked = await secondsBlocked(throttleKey);
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

    if (!/^\d{4}$/.test(String(newPin ?? ""))) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "O novo PIN deve ter 4 dígitos." },
        { status: 400 }
      );
    }
    const rows = await sql`SELECT pin_hash FROM members WHERE id = ${id}`;
    if (!rows.length) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Membro não encontrado." },
        { status: 404 }
      );
    }
    if (rows[0].pin_hash !== (await hashPin(String(currentPin)))) {
      await registerFailure(throttleKey);
      return NextResponse.json(
        { code: "WRONG_PIN", message: "PIN atual incorreto." },
        { status: 401 }
      );
    }
    await clearFailures(throttleKey);
    await sql`UPDATE members SET pin_hash = ${await hashPin(
      String(newPin)
    )} WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }

  // Reset pela liderança: gera um PIN temporário e o devolve.
  if (isManager(me)) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const res = await sql`
      UPDATE members SET pin_hash = ${await hashPin(pin)} WHERE id = ${id}
      RETURNING id
    `;
    if (!res.length) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Membro não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json({ pin });
  }

  return forbidden();
}
