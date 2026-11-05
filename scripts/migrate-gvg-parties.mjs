import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente.");
const sql = neon(process.env.DATABASE_URL);
await sql.transaction([
  sql`ALTER TABLE gvg_assignments ADD COLUMN IF NOT EXISTS party SMALLINT CHECK (party BETWEEN 1 AND 8)`,
  sql`WITH numbered AS (
    SELECT member_id, LEAST(8, ((ROW_NUMBER() OVER (PARTITION BY grp ORDER BY member_id) - 1) / 5) + 1)::smallint AS party
    FROM gvg_assignments
  ) UPDATE gvg_assignments AS target SET party = numbered.party FROM numbered
    WHERE target.member_id = numbered.member_id AND target.party IS NULL`,
  sql`ALTER TABLE gvg_assignments ALTER COLUMN party SET DEFAULT 1`,
  sql`ALTER TABLE gvg_assignments ALTER COLUMN party SET NOT NULL`,
]);
console.log("GvG atualizado: 8 grupos de 5 por equipe; escalações existentes preservadas.");
