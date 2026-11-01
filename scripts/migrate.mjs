import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ausente.");
  process.exit(1);
}

const sql = neon(url);
const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, "..", "db", "schema.sql"), "utf8");

const statements = raw
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
  console.log("OK:", stmt.split("\n")[0].slice(0, 60));
}

const res = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
);
const rows = Array.isArray(res) ? res : res.rows;
console.log("\nTabelas criadas:", rows.map((r) => r.table_name).join(", "));
