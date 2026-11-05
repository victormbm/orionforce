/**
 * Modelo de dados e contrato do repositório de membros.
 *
 * A UI depende APENAS desta interface (`MembersRepository`). Hoje a
 * implementação é local (localStorage). Para plugar no banco do Vercel,
 * basta criar uma implementação que fale com a API e trocar em
 * `src/lib/members/index.ts` — nada na tela muda.
 */

export type GuildRole = "recruta" | "membro" | "oficial" | "vice" | "lider";

/** Situação do cadastro: aguardando aprovação ou liberado. */
export type MemberStatus = "pendente" | "aprovado";

/** Registro completo do membro (inclui o hash do PIN — nunca exposto na UI). */
export interface Member {
  id: string;
  nickname: string;
  pinHash: string;
  classId: string;
  guildRole: GuildRole;
  status: MemberStatus;
  /** Tag do Discord (ex: "nick#0001" ou @usuario). Opcional. */
  discord?: string;
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
  | "PENDING"
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

/** Resultado do login: o membro + o token de sessão assinado. */
export interface AuthResult {
  member: PublicMember;
  token: string;
}

export interface MembersRepository {
  register(input: RegisterInput): Promise<PublicMember>;
  login(input: LoginInput): Promise<AuthResult>;
  list(): Promise<PublicMember[]>;
  /** Altera o cargo de um membro (usado pela liderança). */
  setGuildRole(id: string, role: GuildRole): Promise<PublicMember>;
  /** Aprova ou volta para pendente um cadastro. */
  setStatus(id: string, status: MemberStatus): Promise<PublicMember>;
  /** Remove um membro da guild. */
  remove(id: string): Promise<void>;
  /** Vincula/atualiza a tag do Discord do membro. */
  setDiscord(id: string, discord: string): Promise<PublicMember>;
  /** Altera a classe do personagem. */
  setClass(id: string, classId: string): Promise<PublicMember>;
  /** Troca o próprio PIN (exige o PIN atual). */
  changePin(id: string, currentPin: string, newPin: string): Promise<void>;
  /** Reset de PIN pela liderança: gera um PIN temporário e o retorna. */
  resetPin(id: string): Promise<string>;
}
