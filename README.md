# Orion Force — Painel da Guild

Painel de **gestão e roster** do clã **Orion Force** (Ragnarok Origin Classic).
Feito em **Next.js + React + TypeScript**, com identidade visual clara (tema
espacial azul/ciano/prata).

Hoje roda **100% local** (dados no navegador). Toda a estrutura já foi montada
para ser **fácil de migrar para o Vercel** (deploy + banco Postgres) depois,
**sem precisar mexer na interface**.

---

## 🚀 Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

> Se o servidor travar com erro estranho (`Cannot find module './xxx.js'`),
> é cache corrompido: pare o servidor, apague a pasta `.next` e rode
> `npm run dev` de novo. **Não rode `npm run build` com o `dev` ligado** —
> os dois usam a pasta `.next` e isso corrompe o cache.

---

## 🧭 O que já funciona

- **Login / Cadastro** com nickname + PIN de 4 dígitos (teclado próprio)
- **Cadastro** com seleção de classe (ícone + função: DPS / SUP / MDPS / TANK)
- **PIN guardado com hash** (não fica em texto puro)
- **Painel interno** (`/painel`) protegido por sessão, com:
  - Estatísticas do clã (total e por função)
  - Composição do clã (barras de proporção)
  - **Roster** com busca, filtros por função e cargo na guild
- **Responsivo** (mobile e desktop)

---

## 🗂️ Estrutura do projeto

```
src/
├─ app/
│  ├─ page.tsx            # Tela de login / cadastro
│  ├─ painel/page.tsx     # Painel interno (dashboard + roster)
│  ├─ layout.tsx          # Layout + fundo estelar + marca-d'água
│  └─ globals.css         # Identidade visual (variáveis de cor, componentes)
├─ components/
│  ├─ ClassIcon.tsx       # Ícone da classe (emoji ou arte oficial)
│  └─ OrionLogo.tsx       # Logo em SVG (constelação)
├─ data/
│  ├─ classes.ts          # Lista de classes do RO (editar aqui)
│  └─ roles.ts            # Cargos da guild (Recruta/Membro/Oficial/Líder)
└─ lib/
   ├─ session.ts          # Sessão do membro logado
   ├─ format.ts           # Formatação/parse de números (pt-BR)
   ├─ members/            # 🔌 CAMADA DE DADOS — autenticação
   │  ├─ types.ts         # Modelo + interface MembersRepository + AuthError
   │  ├─ hash.ts          # Hash do PIN (serve local e servidor)
   │  ├─ local.ts         # Implementação localStorage (ATUAL)
   │  ├─ api.ts           # Implementação via API (para o Vercel)
   │  └─ index.ts         # Escolhe a implementação via variável de ambiente
   └─ character/          # 🔌 CAMADA DE DADOS — ficha de personagem
      ├─ types.ts         # Ficha (atributos) + snapshots + interface
      ├─ local.ts         # Implementação localStorage (ATUAL)
      └─ index.ts         # Ponto de troca para a API (mesmo padrão)
```

Páginas internas:

```
/painel               # Dashboard + roster do clã
/painel/personagem    # Meu Personagem: ficha de atributos + snapshots
```

### 🔌 Por que é fácil migrar

A interface **só conhece** `membersRepo` (a interface `MembersRepository`).
Existem duas implementações intercambiáveis:

| Backend | Arquivo | Quando |
|---|---|---|
| `local` | `lib/members/local.ts` | Agora (localStorage) |
| `api` | `lib/members/api.ts` | Com o banco do Vercel |

A escolha é feita por **uma variável de ambiente** em `lib/members/index.ts`:

```
NEXT_PUBLIC_DATA_BACKEND = local   # padrão
NEXT_PUBLIC_DATA_BACKEND = api     # usa o banco
```

Ou seja: para ligar o banco, **nenhuma tela muda** — só a variável e a criação
das rotas de API (código pronto no guia).

---

## ☁️ Levando para o Vercel

### Parte 1 — Deploy (colocar no ar, grátis)

1. Suba o projeto no **GitHub** (crie um repositório e dê `git push`).
2. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repo.
3. O Vercel detecta Next.js sozinho → **Deploy**. Pronto, fica no ar em
   `seu-projeto.vercel.app` (HTTPS automático).
4. (Opcional) **Domínio próprio**: Settings → Domains → adicione
   `orionforce.com.br` e siga as instruções de DNS.

> Nesta parte o painel já funciona no ar, ainda com dados locais
> (cada navegador tem os seus). Para dados compartilhados entre todos,
> faça a Parte 2.

### Parte 2 — Banco de dados (dados compartilhados)

Passo a passo completo, **com o código das rotas de API pronto para copiar**,
está em **[MIGRATION-VERCEL.md](MIGRATION-VERCEL.md)**. Resumo:

1. Vercel → **Storage → Create Database → Postgres**
2. Rodar o [`db/schema.sql`](db/schema.sql) no banco
3. `vercel env pull .env.local` para trazer as variáveis
4. `npm install @vercel/postgres`
5. Criar as rotas em `src/app/api/members/` (código no guia)
6. Definir `NEXT_PUBLIC_DATA_BACKEND=api`

Feito isso, o cadastro/login e o roster passam a usar o banco — **sem mudar a
interface**.

---

## 📎 Arquivos de apoio

- **[MIGRATION-VERCEL.md](MIGRATION-VERCEL.md)** — guia detalhado do banco
- **[.env.example](.env.example)** — variáveis de ambiente (copie para `.env.local`)
- **[db/schema.sql](db/schema.sql)** — tabela `members` do Postgres

---

## 🧭 Roadmap (features inspiradas em painéis similares)

Já implementado:

- Login/cadastro com PIN, sessão e **bootstrap** (1º cadastro vira líder)
- Dashboard, composição e **roster** (ordenado por Poder)
- **Meu Personagem**: atributos (General/Quasi/Special), diff "Salvo vs Em
  edição", obrigatórios por classe, "Mostrar todos", snapshots e comparativo
- **Eventos (WoE/GvG/MVP)**: agenda + confirmação de presença (Vou/Talvez/Não)
- **Área da Liderança**: aprovar recrutas, gerenciar cargos, remover membros
- **Mensagens da Liderança**: mural de avisos (publicar/excluir por gestores)
- **Leilão interno**: lotes, lances em zeny, maior lance, encerrar/excluir
- **Discord (manual)**: vínculo da tag no "Meu Personagem" + exibição no roster
- **Escalação de GvG**: arrastar-e-soltar (Disponíveis/Elite/Secundária) com
  poder total e composição por função de cada grupo (admin)
- Controle de acesso por cargo (oficial/líder) nas rotas de gestão

Próximas fases (dependem de backend/serviços — ficam para depois do Vercel):

- **Discord OAuth** — vínculo automático da conta e liberação de cargos via bot
- **Aviso de evento no Discord** — webhook antes do WoE/GvG
- **Prazo de atualização semanal** — cobrança automática de atributos
- **Calculadoras** — RAW DEF e simulador de dano PvP
- **Perfis por classe** — múltiplas builds por membro (ex: PvP x PvE)

## 🔒 Nota de segurança (para produção)

Hoje o PIN usa hash SHA-256 no cliente — suficiente para a fase local. Ao usar
o banco em produção, o ideal é:

- Fazer o hash no **servidor** com **bcrypt/argon2**
- Adicionar **rate limiting** nas rotas de login
- Usar sessão por **cookie httpOnly / token** no lugar do localStorage
