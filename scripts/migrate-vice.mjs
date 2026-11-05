import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ausente.");
  process.exit(1);
}
const sql = neon(url);

// Atualiza o CHECK de guild_role para incluir 'vice' (idempotente).
await sql`ALTER TABLE members DROP CONSTRAINT IF EXISTS members_guild_role_check`;
await sql`ALTER TABLE members ADD CONSTRAINT members_guild_role_check CHECK (guild_role IN ('recruta','membro','oficial','vice','lider'))`;
console.log("OK: guild_role agora aceita 'vice'.");
