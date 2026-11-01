import {
  AuthError,
  type AuthErrorCode,
  type MembersRepository,
  type PublicMember,
} from "./types";

/**
 * Implementação via API (para quando o banco do Vercel estiver conectado).
 * Não tem dependência externa: usa apenas `fetch` para as rotas em
 * `src/app/api/members/*` (ver MIGRATION-VERCEL.md para criar essas rotas).
 *
 * Para ativar: defina NEXT_PUBLIC_DATA_BACKEND=api no .env.
 */
async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new AuthError("NETWORK", "Falha de conexão. Tente novamente.");
  }

  const data = (await res.json().catch(() => ({}))) as {
    code?: AuthErrorCode;
    message?: string;
  } & T;

  if (!res.ok) {
    throw new AuthError(
      data.code ?? "INVALID_INPUT",
      data.message ?? "Erro inesperado."
    );
  }
  return data as T;
}

export const apiMembersRepo: MembersRepository = {
  register: (input) =>
    request<PublicMember>("/api/members/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input) =>
    request<PublicMember>("/api/members/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  list: () => request<PublicMember[]>("/api/members"),

  setGuildRole: (id, role) =>
    request<PublicMember>(`/api/members/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  remove: async (id) => {
    await request<unknown>(`/api/members/${id}`, { method: "DELETE" });
  },

  setDiscord: (id, discord) =>
    request<PublicMember>(`/api/members/${id}/discord`, {
      method: "PATCH",
      body: JSON.stringify({ discord }),
    }),
};
