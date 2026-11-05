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

    const first = all.length === 0;
    const member: Member = {
      id: uid(),
      nickname: nick,
      pinHash: await hashPin(pin),
      classId,
      // Bootstrap: o primeiro cadastro vira líder já aprovado; os demais
      // entram como recruta pendente (precisam de aprovação).
      guildRole: first ? "lider" : "recruta",
      status: first ? "aprovado" : "pendente",
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
    if (member.status === "pendente") {
      throw new AuthError(
        "PENDING",
        "Seu cadastro está aguardando aprovação da liderança."
      );
    }
    return { member: toPublic(member), token: "local" };
  },

  async list() {
    return readAll().map(toPublic);
  },

  async setGuildRole(id, role) {
    const all = readAll();
    const member = all.find((m) => m.id === id);
    if (!member) throw new AuthError("NOT_FOUND", "Membro não encontrado.");
    member.guildRole = role;
    writeAll(all);
    return toPublic(member);
  },

  async setStatus(id, status) {
    const all = readAll();
    const member = all.find((m) => m.id === id);
    if (!member) throw new AuthError("NOT_FOUND", "Membro não encontrado.");
    member.status = status;
    writeAll(all);
    return toPublic(member);
  },

  async remove(id) {
    writeAll(readAll().filter((m) => m.id !== id));
  },

  async changePin(id, currentPin, newPin) {
    if (!/^\d{4}$/.test(newPin)) {
      throw new AuthError("INVALID_INPUT", "O novo PIN deve ter 4 dígitos.");
    }
    const all = readAll();
    const m = all.find((x) => x.id === id);
    if (!m) throw new AuthError("NOT_FOUND", "Membro não encontrado.");
    if (m.pinHash !== (await hashPin(currentPin))) {
      throw new AuthError("WRONG_PIN", "PIN atual incorreto.");
    }
    m.pinHash = await hashPin(newPin);
    writeAll(all);
  },

  async resetPin(id) {
    const all = readAll();
    const m = all.find((x) => x.id === id);
    if (!m) throw new AuthError("NOT_FOUND", "Membro não encontrado.");
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    m.pinHash = await hashPin(pin);
    writeAll(all);
    return pin;
  },

  async setDiscord(id, discord) {
    const all = readAll();
    const member = all.find((m) => m.id === id);
    if (!member) throw new AuthError("NOT_FOUND", "Membro não encontrado.");
    member.discord = discord.trim() || undefined;
    writeAll(all);
    return toPublic(member);
  },
};
