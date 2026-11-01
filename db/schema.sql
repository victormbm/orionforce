-- ===== Orion Force — schema do banco (Postgres / Vercel) =====
-- Rode este script no banco do Vercel (aba "Query" do Storage, ou psql)
-- quando for migrar do localStorage para o banco de verdade.

CREATE TABLE IF NOT EXISTS members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname    TEXT NOT NULL,
  pin_hash    TEXT NOT NULL,
  class_id    TEXT NOT NULL,
  guild_role  TEXT NOT NULL DEFAULT 'recruta'
              CHECK (guild_role IN ('recruta', 'membro', 'oficial', 'lider')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nickname único (case-insensitive) para impedir cadastro duplicado.
CREATE UNIQUE INDEX IF NOT EXISTS members_nickname_unique
  ON members (lower(nickname));
