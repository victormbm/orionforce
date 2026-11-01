import { getSql } from "@/lib/db";

/** Bloqueio por IP contra força-bruta no login. */
const THRESHOLD = 5; // tentativas erradas
const LOCK_MS = 15 * 60 * 1000; // bloqueio de 15 min
const WINDOW_MS = 15 * 60 * 1000; // janela para zerar o contador

export function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Retorna segundos restantes de bloqueio, ou 0 se liberado. */
export async function secondsBlocked(ip: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    SELECT blocked_until FROM login_throttle WHERE ip = ${ip}
  `;
  const until = rows[0]?.blocked_until;
  if (!until) return 0;
  const ms = new Date(until).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

/** Registra uma tentativa falha; bloqueia o IP ao atingir o limite. */
export async function registerFailure(ip: string): Promise<void> {
  const sql = getSql();
  const rows = await sql`
    SELECT fails, updated_at FROM login_throttle WHERE ip = ${ip}
  `;
  const prev = rows[0];
  const recent =
    prev && Date.now() - new Date(prev.updated_at).getTime() < WINDOW_MS;
  const fails = (recent ? prev.fails : 0) + 1;
  const blockedUntil =
    fails >= THRESHOLD ? new Date(Date.now() + LOCK_MS).toISOString() : null;

  await sql`
    INSERT INTO login_throttle (ip, fails, blocked_until, updated_at)
    VALUES (${ip}, ${fails}, ${blockedUntil}, now())
    ON CONFLICT (ip) DO UPDATE
      SET fails = ${fails}, blocked_until = ${blockedUntil}, updated_at = now()
  `;
}

/** Zera o contador do IP (login bem-sucedido). */
export async function clearFailures(ip: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM login_throttle WHERE ip = ${ip}`;
}
