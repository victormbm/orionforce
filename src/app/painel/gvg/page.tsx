"use client";

import { useLanguage } from "@/components/LanguageProvider";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassIcon } from "@/components/ClassIcon";
import { PanelTopbar } from "@/components/PanelTopbar";
import { getClass, ROLE_COLOR, type Role } from "@/data/classes";
import { characterRepo, type CharacterSummary } from "@/lib/character";
import { gvgRepo, type GvgGroup } from "@/lib/gvg";
import { membersRepo, type PublicMember } from "@/lib/members";
import { canLead } from "@/lib/permissions";
import { getSession } from "@/lib/session";

/** Referência: party de RO = até 12 jogadores. */
const PARTY_SIZE = 12;

type ColId = "disponiveis" | "elite" | "secundaria";
const COLUMNS: { id: ColId; title: string; color: string; group: GvgGroup | null }[] =
  [
    { id: "disponiveis", title: "Disponíveis", color: "#8fa0bd", group: null },
    { id: "elite", title: "Elite", color: "#e0a73a", group: "elite" },
    { id: "secundaria", title: "Secundária", color: "#2f6bff", group: "secundaria" },
  ];

const ROLE_ORDER: Role[] = ["DPS", "MDPS", "SUP", "TANK"];

export default function GvgPage() {
  const { t, formatNumber: formatValue } = useLanguage();
  const router = useRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [summaries, setSummaries] = useState<Record<string, CharacterSummary>>(
    {}
  );
  const [assignments, setAssignments] = useState<Record<string, GvgGroup>>({});
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColId | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    if (!canLead(session.guildRole)) {
      router.replace("/painel");
      return;
    }
    setMe(session);
    Promise.all([
      membersRepo.list(),
      characterRepo.summaries(),
      gvgRepo.getAssignments(),
    ])
      .then(([list, sums, assigns]) => {
        setMembers(list.filter((m) => m.status === "aprovado"));
        setSummaries(sums);
        setAssignments(assigns);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const groupOf = (id: string): GvgGroup | null => assignments[id] ?? null;

  const assign = async (memberId: string, group: GvgGroup | null) => {
    await gvgRepo.assign(memberId, group);
    setAssignments((prev) => {
      const next = { ...prev };
      if (group === null) delete next[memberId];
      else next[memberId] = group;
      return next;
    });
  };

  const membersIn = (group: GvgGroup | null) =>
    members.filter((m) => groupOf(m.id) === group);

  const statsOf = (group: GvgGroup | null) => {
    const list = membersIn(group);
    const byRole: Record<Role, number> = { DPS: 0, SUP: 0, MDPS: 0, TANK: 0 };
    let poder = 0;
    for (const m of list) {
      const role = getClass(m.classId)?.role;
      if (role) byRole[role] += 1;
      poder += summaries[m.id]?.poder ?? 0;
    }
    return { count: list.length, byRole, poder };
  };

  const handleClear = async () => {
    if (!confirm(t("Limpar toda a escalação de GvG?"))) return;
    await gvgRepo.clear();
    setAssignments({});
  };

  if (!me) return null;

  const totalPoder = statsOf("elite").poder + statsOf("secundaria").poder;

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />

      <main className="of-container pt-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              className="text-xl font-extrabold tracking-tight sm:text-2xl"
              style={{ color: "var(--of-text)" }}
            >{t("Escalação de GvG")} </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--of-text-soft)" }}>{t("Arraste os membros entre os grupos (ou use os botões no celular). Referência: party de RO = até")} {PARTY_SIZE} {t("por grupo.")} </p>
          </div>
          <button className="of-btn-ghost" onClick={handleClear}>{t("Limpar escalação")} </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm" style={{ color: "var(--of-text-muted)" }}>{t("Carregando...")} </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => {
              const s = statsOf(col.group);
              const list = membersIn(col.group);
              const over = overCol === col.id;
              const full = col.group !== null && s.count > PARTY_SIZE;
              return (
                <div
                  key={col.id}
                  className={`of-gvg-col ${over ? "of-gvg-col--over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverCol(col.id);
                  }}
                  onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                  onDrop={() => {
                    if (dragId) assign(dragId, col.group);
                    setDragId(null);
                    setOverCol(null);
                  }}
                >
                  {/* Cabeçalho do grupo */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: col.color }}
                      />
                      <h2
                        className="text-sm font-black uppercase tracking-wide"
                        style={{ color: "var(--of-text)" }}
                      >
                        {t(col.title)}
                      </h2>
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{ color: full ? "#e5484d" : "var(--of-text-soft)" }}
                    >
                      {col.group === null ? s.count : `${s.count}/${PARTY_SIZE}`}
                    </span>
                  </div>

                  {/* Resumo do grupo (poder + funções) */}
                  {col.group !== null && (
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--of-gold)" }}
                      >
                        ⚡ {formatValue(s.poder)}
                      </span>
                      {ROLE_ORDER.filter((r) => s.byRole[r] > 0).map((r) => (
                        <span
                          key={r}
                          className="of-mini-pill"
                          style={{ background: ROLE_COLOR[r] }}
                        >
                          {r} {s.byRole[r]}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Cards de membros */}
                  <div className="flex flex-col gap-2">
                    {list.length === 0 && (
                      <p
                        className="py-4 text-center text-xs"
                        style={{ color: "var(--of-text-muted)" }}
                      >
                        {col.group === null
                          ? t("Todos escalados.")
                          : t("Arraste membros para cá.")}
                      </p>
                    )}
                    {list.map((m) => {
                      const cls = getClass(m.classId);
                      const poder = summaries[m.id]?.poder ?? 0;
                      return (
                        <div
                          key={m.id}
                          draggable
                          onDragStart={() => setDragId(m.id)}
                          onDragEnd={() => setDragId(null)}
                          className={`of-member of-gvg-card ${
                            dragId === m.id ? "of-gvg-card--dragging" : ""
                          }`}
                        >
                          {cls && <ClassIcon gameClass={cls} size={38} />}
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-bold"
                              style={{ color: "var(--of-text)" }}
                            >
                              {m.nickname}
                            </p>
                            <p
                              className="truncate text-xs"
                              style={{ color: "var(--of-text-soft)" }}
                            >
                              {cls?.name ?? m.classId}
                              {poder > 0 && (
                                <span style={{ color: "var(--of-gold)" }}>
                                  {" "}
                                  · ⚡{formatValue(poder)}
                                </span>
                              )}
                            </p>
                            {/* Botões rápidos (mobile) */}
                            <div className="mt-1 flex gap-1">
                              <GroupBtn
                                active={col.group === "elite"}
                                color="#e0a73a"
                                label={t("Elite")}
                                onClick={() => assign(m.id, "elite")}
                              />
                              <GroupBtn
                                active={col.group === "secundaria"}
                                color="#2f6bff"
                                label={t("Sec.")}
                                onClick={() => assign(m.id, "secundaria")}
                              />
                              <GroupBtn
                                active={col.group === null}
                                color="#8fa0bd"
                                label={t("Tirar")}
                                onClick={() => assign(m.id, null)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && (
          <p className="mt-6 text-xs" style={{ color: "var(--of-text-muted)" }}>{t("Poder total escalado (Elite + Secundária):")}{" "}
            <b style={{ color: "var(--of-gold)" }}>{formatValue(totalPoder)}</b>{t(". Dica: equilibre frente (Knight/Paladin), dano (Wizard/Sniper/Assassin) e suporte (Priest) em cada grupo.")} </p>
        )}
      </main>
    </div>
  );
}

function GroupBtn({
  active,
  color,
  label,
  onClick,
}: {
  active: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={active}
      className="rounded px-1.5 py-0.5 text-[10px] font-bold"
      style={{
        border: `1px solid ${active ? color : "var(--of-border)"}`,
        background: active ? color : "transparent",
        color: active ? "#fff" : "var(--of-text-soft)",
        cursor: active ? "default" : "pointer",
        opacity: active ? 0.9 : 1,
      }}
    >
      {label}
    </button>
  );
}
