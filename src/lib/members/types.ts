/**
 * Modelo de dados e contrato do repositório de membros.
 *
 * A UI depende APENAS desta interface (`MembersRepository`). Hoje a
 * implementação é local (localStorage). Para plugar no banco do Vercel,
 * basta criar uma implementação que fale com a API e trocar em
 * `src/lib/members/index.ts` — nada na tela muda.
 */

export type GuildRole = "recruta" | "membro" | "oficial" | "lider";

/** Registro completo do membro (inclui o hash do PIN — nunca exposto na UI). */
export interface Member {
  id: string;
  nickname: string;
  pinHash: string;
  classId: string;
  guildRole: GuildRole;
  createdAt: string;
}

/** Versão segura do membro (sem o hash do PIN) — é o que a UI recebe. */
export type PublicMember = Omit<Member, "pinHash">;

export interface RegisterInput {
  nickname: string;
  pin: string;
  classId: string;
}

export interface LoginInput {
  nickname: string;
  pin: string;
}

export type AuthErrorCode =
  | "NICK_TAKEN"
  | "NOT_FOUND"
  | "WRONG_PIN"
  | "INVALID_INPUT"
  | "NETWORK";

/** Erro de negócio com código estável — a UI mostra `message` ao usuário. */
export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
}

export interface MembersRepository {
  register(input: RegisterInput): Promise<PublicMember>;
  login(input: LoginInput): Promise<PublicMember>;
  list(): Promise<PublicMember[]>;
}
