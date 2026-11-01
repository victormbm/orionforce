"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ClassIcon } from "@/components/ClassIcon";
import { CLASSES, getClass } from "@/data/classes";
import { AuthError, membersRepo } from "@/lib/members";
import { setSession } from "@/lib/session";

type Mode = "login" | "register";

const CREDENTIALS_KEY = "orionforce.credentials";

type Feedback = { type: "ok" | "error" | "info"; text: string };

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [classId, setClassId] = useState(CLASSES[0].id);
  const [save, setSave] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Recupera credenciais salvas no navegador (apenas para login)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CREDENTIALS_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { nickname?: string; pin?: string };
        if (data.nickname) setNickname(data.nickname);
        if (data.pin) setPin(data.pin);
        setSave(true);
      }
    } catch {
      /* ignora */
    }
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setFeedback(null);
    setPin("");
  };

  const addDigit = (d: string) => {
    setFeedback(null);
    setPin((p) => (p.length >= 4 ? p : p + d));
  };
  const removeDigit = () => setPin((p) => p.slice(0, -1));
  const clearPin = () => setPin("");

  const canSubmit =
    nickname.trim().length > 0 &&
    pin.length === 4 &&
    (mode === "login" || classId.length > 0);

  const handleRegister = async () => {
    const member = await membersRepo.register({ nickname, pin, classId });
    const approved = member.status === "aprovado";
    setFeedback({
      type: "ok",
      text: approved
        ? `Cadastro concluído, ${member.nickname}! Você já pode acessar.`
        : `Cadastro enviado, ${member.nickname}! Aguarde a aprovação da liderança para acessar.`,
    });
    setMode("login");
    setPin("");
  };

  const handleLogin = async () => {
    const member = await membersRepo.login({ nickname, pin });

    if (save) {
      localStorage.setItem(
        CREDENTIALS_KEY,
        JSON.stringify({ nickname: member.nickname, pin })
      );
    } else {
      localStorage.removeItem(CREDENTIALS_KEY);
    }

    setSession(member);
    setFeedback({ type: "ok", text: `Bem-vindo, ${member.nickname}!` });
    router.push("/painel");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy) {
      if (!canSubmit) {
        setFeedback({
          type: "error",
          text: "Preencha o nickname e os 4 dígitos do PIN.",
        });
      }
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      if (mode === "register") await handleRegister();
      else await handleLogin();
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof AuthError
            ? err.message
            : "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setBusy(false);
    }
  };

  const pinCells = useMemo(() => [0, 1, 2, 3], []);
  const selectedClass = getClass(classId) ?? CLASSES[0];

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[440px] rounded-[var(--of-radius)] border p-6 sm:p-8 md:max-w-[760px]"
        style={{
          background: "var(--of-surface)",
          borderColor: "var(--of-border)",
          boxShadow: "var(--of-shadow)",
        }}
      >
        {/* Cabeçalho / marca */}
        <div className="of-accent-bar" />
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="of-emblem">
            <Image
              src="/orion-badge.png"
              alt="Orion Force"
              width={176}
              height={176}
              priority
            />
          </div>
          <h1 className="mt-3 text-lg font-black tracking-tight" style={{ color: "var(--of-text)" }}>
            ORION <span style={{ color: "var(--of-primary)" }}>FORCE</span>
          </h1>
          <p className="of-label mt-0.5">Gestão &amp; Roster · Ragnarok Origin</p>
        </div>

        {/* Abas */}
        <div
          className="mx-auto mb-6 grid max-w-[420px] grid-cols-2 gap-2 rounded-xl p-1"
          style={{ background: "var(--of-surface-soft)" }}
        >
          <button
            type="button"
            className={`of-tab ${mode === "login" ? "of-tab--active" : ""}`}
            onClick={() => switchMode("login")}
          >
            <IconLogin /> Login
          </button>
          <button
            type="button"
            className={`of-tab ${mode === "register" ? "of-tab--active" : ""}`}
            onClick={() => switchMode("register")}
          >
            <IconUserPlus /> Cadastrar
          </button>
        </div>

        {/* Corpo: dados à esquerda, PIN à direita (empilha no mobile) */}
        <div className="grid items-start gap-x-8 gap-y-6 md:grid-cols-2">
          {/* ===== Coluna esquerda ===== */}
          <div>
            {/* Nickname */}
            <label className="of-label mb-2 block">Nickname em jogo</label>
        <input
          className="of-input"
          placeholder="Ex: Korutan, Marcelao"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />

        {mode === "register" ? (
          <>
            <p
              className="mt-3 text-xs leading-snug"
              style={{ color: "var(--of-text-muted)" }}
            >
              Após a aprovação da liderança, você poderá vincular sua conta
              Discord em <strong>Meu Personagem → Atributos</strong>.
            </p>

            {/* Classe do personagem */}
            <label className="of-label mt-5 mb-2 block">
              Classe do personagem
            </label>
            <div className="flex items-stretch gap-3">
              <ClassIcon gameClass={selectedClass} size={52} />
              <div className="relative flex-1">
                <select
                  className="of-input of-select h-full cursor-pointer pr-9"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} [{c.role}]
                    </option>
                  ))}
                </select>
                <span className="of-select-arrow" aria-hidden>
                  ▾
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Salvar credenciais (apenas no login) */
          <label className="mt-4 flex cursor-pointer items-start gap-3 select-none">
            <input
              type="checkbox"
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--of-primary)]"
            />
            <span>
              <span
                className="block text-sm font-semibold"
                style={{ color: "var(--of-text)" }}
              >
                Salvar Nick e PIN neste navegador
              </span>
              <span
                className="block text-xs leading-snug"
                style={{ color: "var(--of-text-muted)" }}
              >
                Somente as credenciais são lembradas; a sessão não fica logada.
              </span>
            </span>
          </label>
            )}
          </div>

          {/* ===== Coluna direita: PIN ===== */}
          <div>
        {/* PIN */}
        <div className="mb-3 flex items-center justify-between">
          <span
            className="of-label flex items-center gap-1.5"
            style={{ color: "var(--of-primary)" }}
          >
            <IconShield />{" "}
            {mode === "register"
              ? "Criar senha PIN (4 dígitos)"
              : "Digite sua senha PIN (4 dígitos)"}
          </span>
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: "var(--of-text-soft)" }}
          >
            <IconEye /> {reveal ? "Ocultar" : "Revelar"}
          </button>
        </div>

        {/* Visor do PIN */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {pinCells.map((i) => {
            const filled = i < pin.length;
            return (
              <div
                key={i}
                className={`of-pin-dot ${filled ? "of-pin-dot--filled" : ""}`}
              >
                {filled ? (reveal ? pin[i] : "•") : "–"}
              </div>
            );
          })}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              className="of-key"
              onClick={() => addDigit(d)}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className="of-key of-key--muted"
            onClick={clearPin}
          >
            <IconReset />
            Limpar
          </button>
          <button type="button" className="of-key" onClick={() => addDigit("0")}>
            0
          </button>
          <button
            type="button"
            className="of-key of-key--muted"
            onClick={removeDigit}
          >
            <IconBackspace />
            Apagar
          </button>
        </div>
          </div>
        </div>

        {feedback && (
          <p
            className="mx-auto mt-5 max-w-[560px] rounded-xl px-4 py-3 text-center text-sm font-medium"
            style={{
              background:
                feedback.type === "error"
                  ? "#fde8e8"
                  : feedback.type === "ok"
                    ? "#e6f6ee"
                    : "var(--of-primary-100)",
              color:
                feedback.type === "error"
                  ? "#b42318"
                  : feedback.type === "ok"
                    ? "#1a7f4b"
                    : "var(--of-primary-600)",
            }}
          >
            {feedback.text}
          </p>
        )}

        {/* CTA */}
        <button
          type="submit"
          className="of-cta mx-auto mt-6 block md:max-w-[440px]"
          disabled={!canSubmit || busy}
        >
          {busy ? (
            "Processando…"
          ) : (
            <>
              {mode === "register" ? <IconUserPlus /> : <IconLogin />}
              {mode === "login" ? "Acessar meu painel" : "Cadastrar e acessar"}
            </>
          )}
        </button>
      </form>
    </main>
  );
}

/* ===== Ícones inline (sem dependências) ===== */
function IconLogin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}
function IconUserPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconReset() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}
function IconBackspace() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  );
}
