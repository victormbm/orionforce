/**
 * Hash do PIN com SHA-256 (Web Crypto) — funciona no navegador, no Edge
 * e no Node 18+, então o mesmo código serve para a versão local e para a
 * futura API no Vercel.
 *
 * Observação de segurança: para produção com banco de dados, o ideal é
 * fazer o hash no SERVIDOR usando bcrypt/argon2 + rate limiting. Como aqui
 * é um PIN de 4 dígitos de guild e por enquanto roda local, o SHA-256 com
 * "sal" fixo é suficiente para não guardar o PIN em texto puro.
 */
const SALT = "orionforce.v1";

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
