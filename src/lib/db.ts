import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Cliente Postgres (Neon). Criado sob demanda para não quebrar o build
 * quando DATABASE_URL ainda não está configurada.
 *
 * Uso em rotas de API (lado servidor):
 *   const sql = getSql();
 *   const rows = await sql`SELECT ...`;
 */
let client: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL não configurada. Crie o banco no Neon e preencha o .env.local."
      );
    }
    client = neon(url);
  }
  return client;
}
