import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

/**
 * Autenticação de servidor por token assinado (HMAC-SHA256).
 * O login emite o token; as rotas o verificam e carregam o membro do banco.
 * Sem sessão em tabela — stateless.
 */
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b);
  const arr = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurada.");
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signToken(id: string): Promise<string> {
  const payload = bytesToB64url(
    enc.encode(JSON.stringify({ id, exp: Date.now() + TOKEN_TTL_MS }))
  );
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(payload));
  return `${payload}.${bytesToB64url(new Uint8Array(sig))}`;
}

async function verifyToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      b64urlToBytes(sig),
      enc.encode(payload)
    );
    if (!ok) return null;
    const { id, exp } = JSON.parse(dec.decode(b64urlToBytes(payload)));
    if (!id || typeof exp !== "number" || exp < Date.now()) return null;
    return id as string;
  } catch {
    return null;
  }
}

export interface AuthMember {
  id: string;
  guildRole: string;
  status: string;
}

/** Verifica o token e carrega o membro (aprovado) do banco. */
export async function authenticate(req: Request): Promise<AuthMember | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const id = await verifyToken(token);
  if (!id) return null;
  const sql = getSql();
  const rows = await sql`
    SELECT id, guild_role AS "guildRole", status FROM members WHERE id = ${id}
  `;
  const m = rows[0];
  if (!m || m.status !== "aprovado") return null;
  return m as AuthMember;
}

export function isManager(m: AuthMember): boolean {
  return m.guildRole === "oficial" || m.guildRole === "lider";
}

export const unauthorized = () =>
  NextResponse.json(
    { code: "UNAUTHORIZED", message: "Sessão inválida. Faça login novamente." },
    { status: 401 }
  );

export const forbidden = () =>
  NextResponse.json(
    { code: "FORBIDDEN", message: "Sem permissão para esta ação." },
    { status: 403 }
  );
