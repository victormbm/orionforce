# Migração: localStorage → Banco do Vercel (Postgres)

Hoje o cadastro/login funciona **localmente** (no navegador). A aplicação já
foi construída numa camada de dados (`src/lib/members/`) para que a troca seja
simples: **a tela não muda**, só o backend.

## Visão geral

```
UI (page.tsx)
   │  usa só a interface MembersRepository
   ▼
src/lib/members/index.ts   ← escolhe a implementação via NEXT_PUBLIC_DATA_BACKEND
   ├── local.ts  (localStorage)   ← atual
   └── api.ts    (fetch → /api)   ← para o Vercel
```

## Passo a passo (quando o banco estiver pronto)

### 1. Criar o banco no Vercel

1. No projeto do Vercel: **Storage → Create Database → Postgres**.
2. Isso cria as variáveis `POSTGRES_*` automaticamente no projeto.

### 2. Criar a tabela

Na aba **Query** do banco (ou via `psql`), rode o conteúdo de
[`db/schema.sql`](db/schema.sql).

### 3. Trazer as variáveis para o ambiente local

```bash
npm i -g vercel          # se ainda não tiver
vercel link              # vincula a pasta ao projeto do Vercel
vercel env pull .env.local
```

### 4. Instalar o driver do Postgres

```bash
npm install @vercel/postgres
```

### 5. Criar as rotas de API

Crie os três arquivos abaixo. A `api.ts` já aponta para eles.

**`src/app/api/members/register/route.ts`**

```ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { hashPin } from "@/lib/members/hash";

export async function POST(req: Request) {
  const { nickname, pin, classId } = await req.json();
  const nick = String(nickname ?? "").trim();
  if (!nick || String(pin).length !== 4 || !classId) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Preencha nickname, classe e PIN." },
      { status: 400 }
    );
  }

  const dup = await sql`SELECT 1 FROM members WHERE lower(nickname) = lower(${nick})`;
  if (dup.rowCount) {
    return NextResponse.json(
      { code: "NICK_TAKEN", message: `O nickname "${nick}" já está cadastrado.` },
      { status: 409 }
    );
  }

  const pinHash = await hashPin(String(pin));
  const { rows } = await sql`
    INSERT INTO members (nickname, pin_hash, class_id)
    VALUES (${nick}, ${pinHash}, ${classId})
    RETURNING id, nickname, class_id AS "classId", guild_role AS "guildRole", created_at AS "createdAt"
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
```

**`src/app/api/members/login/route.ts`**

```ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { hashPin } from "@/lib/members/hash";

export async function POST(req: Request) {
  const { nickname, pin } = await req.json();
  const nick = String(nickname ?? "").trim();

  const { rows } = await sql`
    SELECT id, nickname, pin_hash, class_id AS "classId",
           guild_role AS "guildRole", created_at AS "createdAt"
    FROM members WHERE lower(nickname) = lower(${nick})
  `;
  const member = rows[0];
  if (!member) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Nickname não encontrado. Faça seu cadastro primeiro." },
      { status: 404 }
    );
  }
  if (member.pin_hash !== (await hashPin(String(pin)))) {
    return NextResponse.json(
      { code: "WRONG_PIN", message: "PIN incorreto. Tente novamente." },
      { status: 401 }
    );
  }

  delete member.pin_hash;
  return NextResponse.json(member);
}
```

**`src/app/api/members/route.ts`** (listagem para o futuro roster)

```ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  const { rows } = await sql`
    SELECT id, nickname, class_id AS "classId",
           guild_role AS "guildRole", created_at AS "createdAt"
    FROM members ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}
```

### 6. Ativar o backend de API

No `.env.local` (e nas Environment Variables do Vercel):

```
NEXT_PUBLIC_DATA_BACKEND=api
```

Pronto. Reinicie o `npm run dev` e o cadastro/login passam a usar o banco.
Nenhuma mudança é necessária na tela.

> Dica de segurança para produção: trocar o hash SHA-256 por **bcrypt/argon2**
> no servidor e adicionar **rate limiting** nas rotas de login.
