"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ClassIcon } from "@/components/ClassIcon";
import { PanelTopbar } from "@/components/PanelTopbar";
import { getClass } from "@/data/classes";
import {
  ATTR_FIELDS,
  ATTR_SECTIONS,
  isRequired,
  type AttrField,
} from "@/data/attributes";
import { characterRepo, type Snapshot } from "@/lib/character";
import { formatValue, parseNumber } from "@/lib/format";
import { membersRepo, type PublicMember } from "@/lib/members";
import { getSession, setSession } from "@/lib/session";

type Feedback = { type: "ok" | "error"; text: string } | null;

function toEditMap(attrs: Record<string, number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) out[k] = String(v);
  return out;
}

export default function CharacterPage() {
  const router = useRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const [discord, setDiscord] = useState("");
  const [pinCur, setPinCur] = useState("");
  const [pinNew, setPinNew] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setMe(session);
    setDiscord(session.discord ?? "");
    Promise.all([
      characterRepo.get(session.id),
      characterRepo.listSnapshots(session.id),
    ]).then(([sheet, snaps]) => {
      const attrs = sheet?.attributes ?? {};
      setSaved(attrs);
      setEdit(toEditMap(attrs));
      setSnapshots(snaps);
    });
  }, [router]);

  const role = me ? getClass(me.classId)?.role : undefined;

  const editNum = (id: string) => parseNumber(edit[id] ?? "");
  const isDirty = (id: string) => (editNum(id) ?? null) !== (saved[id] ?? null);
  const anyDirty = useMemo(
    () => ATTR_FIELDS.some((f) => (parseNumber(edit[f.id] ?? "") ?? null) !== (saved[f.id] ?? null)),
    [edit, saved]
  );

  const visible = (f: AttrField) =>
    showAll ||
    isRequired(f, role) ||
    saved[f.id] !== undefined ||
    (edit[f.id]?.trim() ?? "") !== "";

  const hiddenCount = ATTR_FIELDS.filter((f) => !visible(f)).length;

  const doSave = async (): Promise<boolean> => {
    if (!me) return false;
    // valida obrigatórios
    const missing = ATTR_FIELDS.filter(
      (f) => isRequired(f, role) && editNum(f.id) === null
    );
    if (missing.length) {
      setFeedback({
        type: "error",
        text: `Preencha os campos obrigatórios: ${missing
          .map((f) => f.label)
          .join(", ")}.`,
      });
      return false;
    }
    const attrs: Record<string, number> = {};
    for (const f of ATTR_FIELDS) {
      const n = editNum(f.id);
      if (n !== null) attrs[f.id] = n;
    }
    const sheet = await characterRepo.save(me.id, attrs);
    setSaved(sheet.attributes);
    setEdit(toEditMap(sheet.attributes));
    return true;
  };

  const handleSave = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      if (await doSave()) {
        setFeedback({ type: "ok", text: "Atributos salvos com sucesso!" });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setEdit(toEditMap(saved));
    setFeedback(null);
  };

  const handleSnapshot = async () => {
    if (!me) return;
    setBusy(true);
    setFeedback(null);
    try {
      if (!(await doSave())) return;
      await characterRepo.addSnapshot(me.id);
      setSnapshots(await characterRepo.listSnapshots(me.id));
      setFeedback({ type: "ok", text: "Snapshot salvo! 📸" });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!me) return;
    await characterRepo.deleteSnapshot(me.id, id);
    setSnapshots(await characterRepo.listSnapshots(me.id));
  };

  const handleSaveDiscord = async () => {
    if (!me) return;
    const updated = await membersRepo.setDiscord(me.id, discord);
    setSession(updated);
    setMe(updated);
    setFeedback({ type: "ok", text: "Discord atualizado!" });
  };

  const handleChangePin = async () => {
    if (!me) return;
    try {
      await membersRepo.changePin(me.id, pinCur, pinNew);
      setPinCur("");
      setPinNew("");
      setFeedback({ type: "ok", text: "PIN alterado com sucesso!" });
    } catch (e) {
      setFeedback({
        type: "error",
        text: e instanceof Error ? e.message : "Erro ao trocar o PIN.",
      });
    }
  };

  if (!me) return null;

  const myClass = getClass(me.classId);
  const currentPoder = editNum("poderGeral") ?? saved.poderGeral ?? 0;
  const currentHp = editNum("hpMax") ?? saved.hpMax ?? 0;

  // Comparativo com o último snapshot
  const lastSnap = snapshots[0];
  const deltaPoder = lastSnap
    ? currentPoder - (lastSnap.attributes.poderGeral ?? 0)
    : 0;

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />

      <main className="of-container pt-7">
        {/* Hero do personagem */}
        <section className="of-section flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {myClass && <ClassIcon gameClass={myClass} size={64} />}
            <div>
              <h1
                className="text-xl font-extrabold tracking-tight"
                style={{ color: "var(--of-text)" }}
              >
                {me.nickname}
              </h1>
              <p className="text-sm" style={{ color: "var(--of-text-soft)" }}>
                {myClass?.name} · {myClass?.role}
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="of-tile-label" style={{ marginTop: 0 }}>
                ⚡ Poder atual
              </p>
              <p
                className="text-2xl font-black"
                style={{ color: "var(--of-gold)" }}
              >
                {formatValue(currentPoder)}
              </p>
            </div>
            <div>
              <p className="of-tile-label" style={{ marginTop: 0 }}>
                ❤ HP máximo
              </p>
              <p
                className="text-2xl font-black"
                style={{ color: "var(--of-text)" }}
              >
                {formatValue(currentHp)}
              </p>
            </div>
          </div>
        </section>

        {/* Minha conta Discord */}
        <section className="of-section mt-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="of-label" style={{ color: "var(--of-primary)" }}>
                Minha conta Discord
              </h2>
              <p
                className="mt-1 text-xs"
                style={{ color: "var(--of-text-muted)" }}
              >
                Informe sua tag para a liderança te reconhecer. (A vinculação
                automática via OAuth entra numa fase futura.)
              </p>
            </div>
            <span
              className="of-role-pill"
              style={{
                background: me.discord ? "#30a46c" : "#8fa0bd",
              }}
            >
              {me.discord ? "Vinculada" : "Não vinculada"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              className="of-input"
              style={{ maxWidth: 280 }}
              placeholder="Ex: seunick ou seunick#0001"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
            />
            <button
              className="of-cta"
              style={{ width: "auto", marginTop: 0 }}
              onClick={handleSaveDiscord}
              disabled={(discord.trim() || "") === (me.discord ?? "")}
            >
              Salvar Discord
            </button>
          </div>
        </section>

        {/* Trocar PIN */}
        <section className="of-section mt-4 p-5">
          <h2 className="of-label" style={{ color: "var(--of-primary)" }}>
            Trocar PIN
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              className="of-input"
              style={{ maxWidth: 150 }}
              inputMode="numeric"
              maxLength={4}
              placeholder="PIN atual"
              value={pinCur}
              onChange={(e) => setPinCur(e.target.value.replace(/\D/g, ""))}
            />
            <input
              className="of-input"
              style={{ maxWidth: 150 }}
              inputMode="numeric"
              maxLength={4}
              placeholder="Novo PIN"
              value={pinNew}
              onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ""))}
            />
            <button
              className="of-cta"
              style={{ width: "auto", marginTop: 0 }}
              onClick={handleChangePin}
              disabled={pinCur.length !== 4 || pinNew.length !== 4}
            >
              Salvar PIN
            </button>
          </div>
        </section>

        {/* Barra de ações */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="of-cta"
            style={{ width: "auto", marginTop: 0 }}
            onClick={handleSave}
            disabled={busy || !anyDirty}
          >
            {busy ? "Salvando…" : "Salvar atributos"}
          </button>
          <button
            type="button"
            className="of-btn-ghost"
            onClick={handleReset}
            disabled={busy || !anyDirty}
          >
            Desfazer edição
          </button>
          <button
            type="button"
            className="of-btn-ghost"
            onClick={handleSnapshot}
            disabled={busy}
          >
            📸 Salvar snapshot
          </button>

          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-4 w-4 accent-[var(--of-primary)]"
            />
            <span style={{ color: "var(--of-text-soft)" }}>
              Mostrar todos os atributos
              {hiddenCount > 0 && !showAll ? ` (+${hiddenCount} ocultos)` : ""}
            </span>
          </label>
        </div>

        {feedback && (
          <p
            className="mt-4 rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              background: feedback.type === "error" ? "#fde8e8" : "#e6f6ee",
              color: feedback.type === "error" ? "#b42318" : "#1a7f4b",
            }}
          >
            {feedback.text}
          </p>
        )}

        <p className="mt-3 text-xs" style={{ color: "var(--of-text-muted)" }}>
          Regra: cidade, equipamentos/cartas PvP e nenhum buff. Digite números
          sem separadores de milhar. <span style={{ color: "var(--of-gold)" }}>*</span>{" "}
          indica campos obrigatórios para a classe.
        </p>

        {/* Seções de atributos */}
        {ATTR_SECTIONS.map((section) => {
          const fields = ATTR_FIELDS.filter(
            (f) => f.section === section.id && visible(f)
          );
          if (fields.length === 0) return null;
          return (
            <section key={section.id} className="of-section mt-6 p-5">
              <h2
                className="text-sm font-black uppercase tracking-wide"
                style={{ color: "var(--of-gold)" }}
              >
                {section.title}
              </h2>
              <p
                className="mb-4 text-xs"
                style={{ color: "var(--of-text-muted)" }}
              >
                {section.subtitle}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((f) => {
                  const req = isRequired(f, role);
                  const dirty = isDirty(f.id);
                  const e = editNum(f.id);
                  return (
                    <div
                      key={f.id}
                      className={`of-attr ${dirty ? "of-attr--dirty" : ""}`}
                    >
                      <div className="of-attr-label">
                        {f.label}
                        {req && (
                          <span style={{ color: "var(--of-gold)" }}> *</span>
                        )}
                      </div>
                      <div className="of-attr-input-wrap">
                        <input
                          className="of-input"
                          style={{ paddingRight: f.suffix ? "2rem" : undefined }}
                          inputMode="decimal"
                          placeholder="0"
                          value={edit[f.id] ?? ""}
                          onChange={(ev) =>
                            setEdit((prev) => ({
                              ...prev,
                              [f.id]: ev.target.value,
                            }))
                          }
                        />
                        {f.suffix && (
                          <span className="of-attr-suffix">{f.suffix}</span>
                        )}
                      </div>
                      <div className="of-attr-foot">
                        <span>
                          Salvo:{" "}
                          <b>
                            {saved[f.id] !== undefined
                              ? formatValue(saved[f.id], f.suffix)
                              : "—"}
                          </b>
                        </span>
                        <span className={dirty ? "dirty" : ""}>
                          Em edição:{" "}
                          <b className={dirty ? "dirty" : ""}>
                            {e !== null ? formatValue(e, f.suffix) : "—"}
                          </b>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Snapshots / Evolução */}
        <section className="of-section mt-6 p-5">
          <h2 className="of-label mb-1" style={{ color: "var(--of-primary)" }}>
            Snapshots &amp; Evolução ({snapshots.length})
          </h2>
          <p className="mb-4 text-xs" style={{ color: "var(--of-text-muted)" }}>
            Salve um snapshot a cada atualização semanal para acompanhar sua
            evolução.
          </p>

          {lastSnap && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-sm"
              style={{ background: "var(--of-surface-soft)" }}
            >
              Desde o último snapshot, seu Poder{" "}
              {deltaPoder === 0 ? (
                <b>não mudou</b>
              ) : (
                <b style={{ color: deltaPoder > 0 ? "#1a7f4b" : "#b42318" }}>
                  {deltaPoder > 0 ? "▲ +" : "▼ "}
                  {formatValue(deltaPoder)}
                </b>
              )}
              .
            </div>
          )}

          {snapshots.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>
              Nenhum snapshot ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {snapshots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-2.5"
                  style={{ borderColor: "var(--of-border)" }}
                >
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "var(--of-text)" }}
                    >
                      {new Date(s.createdAt).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs" style={{ color: "var(--of-text-soft)" }}>
                      ⚡ {formatValue(s.attributes.poderGeral ?? 0)} · ❤{" "}
                      {formatValue(s.attributes.hpMax ?? 0)}
                    </p>
                  </div>
                  <button
                    className="of-btn-ghost"
                    onClick={() => handleDeleteSnapshot(s.id)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
