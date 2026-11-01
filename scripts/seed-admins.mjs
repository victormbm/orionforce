import { neon } from "@neondatabase/serverless";
import { webcrypto } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ausente.");
  process.exit(1);
}
const sql = neon(url);

// Mesmo hash usado pela aplicação (src/lib/members/hash.ts).
const SALT = "orionforce.v1";
async function hashPin(pin) {
  const data = new TextEncoder().encode(`${SALT}:${pin}`);
  const digest = await webcrypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Garante a coluna de status (idempotente).
await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente'`;
// (o CHECK já existe em instalações novas; em bancos antigos a coluna fica livre)

const admins = [
  { nickname: "Korutan", pin: process.env.ADMIN_PIN ?? "1234", classId: "lord-knight" },
  { nickname: "Marcelao", pin: process.env.ADMIN_PIN ?? "1234", classId: "high-priest" },
];

for (const a of admins) {
  const exists = await sql`SELECT id FROM members WHERE lower(nickname) = lower(${a.nickname})`;
  const pinHash = await hashPin(a.pin);
  if (exists.length) {
    await sql`
      UPDATE members
      SET guild_role = 'lider', status = 'aprovado', pin_hash = ${pinHash}
      WHERE id = ${exists[0].id}
    `;
    console.log(`Atualizado ADM: ${a.nickname}`);
  } else {
    await sql`
      INSERT INTO members (nickname, pin_hash, class_id, guild_role, status)
      VALUES (${a.nickname}, ${pinHash}, ${a.classId}, 'lider', 'aprovado')
    `;
    console.log(`Criado ADM: ${a.nickname}`);
  }
}

const rows = await sql`SELECT nickname, guild_role, status FROM members ORDER BY created_at`;
console.log("\nMembros no banco:");
for (const r of rows) console.log(` - ${r.nickname} [${r.guild_role}/${r.status}]`);
