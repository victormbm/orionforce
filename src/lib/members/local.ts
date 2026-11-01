import { hashPin } from "./hash";
import {
  AuthError,
  type Member,
  type MembersRepository,
  type PublicMember,
} from "./types";

/**
 * Implementação LOCAL do repositório (localStorage).
 * Usada enquanto o banco do Vercel não está conectado.
 */
const STORAGE_KEY = "orionforce.members";

function readAll(): Member[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Member[]) : [];
  } catch {
    return [];
  }
}

function writeAll(members: Member[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function toPublic(m: Member): PublicMember {
  // remove o hash do PIN antes de entregar para a UI
  const { pinHash: _pinHash, ...rest } = m;
  void _pinHash;
  return rest;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const localMembersRepo: MembersRepository = {
  async register({ nickname, pin, classId }) {
    const nick = nickname.trim();
    if (!nick || pin.length !== 4 || !classId) {
      throw new AuthError("INVALID_INPUT", "Preencha nickname, classe e PIN.");
    }

    const all = readAll();
    const taken = all.some(
      (m) => m.nickname.toLowerCase() === nick.toLowerCase()
    );
    if (taken) {
      throw new AuthError(
        "NICK_TAKEN",
        `O nickname "${nick}" já está cadastrado.`
      );
    }

    const member: Member = {
      id: uid(),
      nickname: nick,
      pinHash: await hashPin(pin),
      classId,
      guildRole: "recruta", // todo novo cadastro entra como recruta
      createdAt: new Date().toISOString(),
    };
    writeAll([...all, member]);
    return toPublic(member);
  },

  async login({ nickname, pin }) {
    const nick = nickname.trim();
    const member = readAll().find(
      (m) => m.nickname.toLowerCase() === nick.toLowerCase()
    );
    if (!member) {
      throw new AuthError(
        "NOT_FOUND",
        "Nickname não encontrado. Faça seu cadastro primeiro."
      );
    }
    if (member.pinHash !== (await hashPin(pin))) {
      throw new AuthError("WRONG_PIN", "PIN incorreto. Tente novamente.");
    }
    return toPublic(member);
  },

  async list() {
    return readAll().map(toPublic);
  },
};
