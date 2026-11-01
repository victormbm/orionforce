-- ===== Orion Force — schema do banco (Postgres / Neon) =====
-- Rode este script UMA vez no SQL Editor do Neon.
-- Cobre todas as features (migração completa é feita módulo a módulo).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Membros (autenticação) ----------
CREATE TABLE IF NOT EXISTS members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname    TEXT NOT NULL,
  pin_hash    TEXT NOT NULL,
  class_id    TEXT NOT NULL,
  guild_role  TEXT NOT NULL DEFAULT 'recruta'
              CHECK (guild_role IN ('recruta', 'membro', 'oficial', 'lider')),
  discord     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS members_nickname_unique
  ON members (lower(nickname));

-- ---------- Ficha de personagem ----------
CREATE TABLE IF NOT EXISTS character_sheets (
  member_id   UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  attributes  JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attributes  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS snapshots_member ON snapshots (member_id, created_at DESC);

-- ---------- Eventos (WoE/GvG) ----------
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL,
  notes       TEXT,
  created_by  UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('vou', 'talvez', 'nao')),
  PRIMARY KEY (event_id, member_id)
);

-- ---------- Mural de avisos ----------
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  author_id   UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Leilão interno ----------
CREATE TABLE IF NOT EXISTS auction_lots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item        TEXT NOT NULL,
  description TEXT,
  min_bid     BIGINT NOT NULL DEFAULT 0,
  ends_at     TIMESTAMPTZ NOT NULL,
  created_by  UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed      BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS bids (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id      UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount      BIGINT NOT NULL,
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bids_lot ON bids (lot_id, amount DESC);

-- ---------- Escalação de GvG ----------
CREATE TABLE IF NOT EXISTS gvg_assignments (
  member_id   UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  grp         TEXT NOT NULL CHECK (grp IN ('elite', 'secundaria'))
);
