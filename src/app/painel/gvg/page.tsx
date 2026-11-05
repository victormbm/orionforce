"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClassIcon } from "@/components/ClassIcon";
import { useLanguage } from "@/components/LanguageProvider";
import { PanelTopbar } from "@/components/PanelTopbar";
import { getClass, ROLE_COLOR, type Role } from "@/data/classes";
import { characterRepo, type CharacterSummary } from "@/lib/character";
import { gvgRepo, type GvgAssignment, type GvgAssignments, type GvgGroup } from "@/lib/gvg";
import { moveMember, PARTIES, PARTY_SIZE, TEAM_SIZE } from "@/lib/gvg/lineup";
import { membersRepo, type PublicMember } from "@/lib/members";
import { canLead } from "@/lib/permissions";
import { getSession } from "@/lib/session";

const TEAMS: { group: GvgGroup; label: string; color: string }[] = [
  { group: "elite", label: "Elite", color: "#c78d1f" },
  { group: "secundaria", label: "Secundária", color: "#2f6bff" },
];
const ROLE_ORDER: Role[] = ["TANK", "DPS", "MDPS", "SUP"];
const targetKey = (target: GvgAssignment | null) => target ? `${target.group}:${target.party}` : "available";

export default function GvgPage() {
  const { t, formatNumber } = useLanguage();
  const router = useRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [summaries, setSummaries] = useState<Record<string, CharacterSummary>>({});
  const [assignments, setAssignments] = useState<GvgAssignments>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const draggedMember = useRef<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<GvgGroup, number>>({ elite: 0, secundaria: 0 });

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace("/"); return; }
    if (!canLead(session.guildRole)) { router.replace("/painel"); return; }
    setMe(session);
    Promise.all([membersRepo.list(), characterRepo.summaries(), gvgRepo.getAssignments()])
      .then(([list, sums, lineup]) => {
        setMembers(list.filter(m => m.status === "aprovado"));
        setSummaries(sums);
        setAssignments(lineup);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Erro ao carregar a escalação."))
      .finally(() => setLoading(false));
  }, [router]);

  const membersAt = (group: GvgGroup | null, party?: number) => members.filter(member => {
    const placement = assignments[member.id];
    return group === null ? !placement : placement?.group === group && (party === undefined || placement.party === party);
  });
  const powerOf = (list: PublicMember[]) => list.reduce((total, m) => total + (summaries[m.id]?.poder ?? 0), 0);
  const occupancy = (target: GvgAssignment, memberId?: string) => Object.entries(assignments).filter(([id, a]) => id !== memberId && a.group === target.group && a.party === target.party).length;

  const assign = async (memberId: string, target: GvgAssignment | null) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      moveMember(assignments, memberId, target);
      await gvgRepo.assign(memberId, target);
      setAssignments(await gvgRepo.getAssignments());
      if (target) setPairs(previous => ({ ...previous, [target.group]: Math.floor((target.party - 1) / 2) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar a escalação.");
      // Refresh after a conflicting edit by another leader; keep the member in their saved party.
      try { setAssignments(await gvgRepo.getAssignments()); } catch { /* Keep last confirmed lineup. */ }
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const clear = async (target: GvgAssignment) => {
    const team = TEAMS.find(team => team.group === target.group)!;
    if (saving.current || !confirm(t("Limpar o Grupo {number} de {team}? Os jogadores voltarão para Disponíveis.", { number: target.party, team: t(team.label) }))) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await gvgRepo.clear(target);
      setAssignments(await gvgRepo.getAssignments());
    }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao salvar a escalação."); }
    finally { saving.current = false; setBusy(false); }
  };

  const dropZone = (target: GvgAssignment | null) => ({
    onDragOver: (event: React.DragEvent) => {
      if (saving.current || !draggedMember.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setOver(targetKey(target));
    },
    onDragLeave: (event: React.DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(null);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const id = draggedMember.current ?? event.dataTransfer.getData("text/plain");
      draggedMember.current = null;
      setDragId(null);
      setOver(null);
      if (members.some(member => member.id === id)) void assign(id, target);
    },
  });

  const memberCard = (member: PublicMember) => {
    const cls = getClass(member.classId);
    const current = assignments[member.id] ?? null;
    return (
      <div key={member.id} className={`of-gvg-player ${dragId === member.id ? "of-gvg-card--dragging" : ""}`}
        style={{ borderLeftColor: cls ? ROLE_COLOR[cls.role] : "var(--of-border)" }}
        draggable={!busy} onDragStart={event => {
          event.dataTransfer.setData("text/plain", member.id);
          event.dataTransfer.effectAllowed = "move";
          draggedMember.current = member.id;
          setDragId(member.id);
        }} onDragEnd={() => { draggedMember.current = null; setDragId(null); setOver(null); }}>
        <div className="flex min-w-0 items-center gap-2">
          {cls && <ClassIcon gameClass={cls} size={32} />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold" title={member.nickname}>{member.nickname}</p>
            <p className="truncate text-[10px]" style={{ color: "var(--of-text-soft)" }}>{cls?.name ?? member.classId}</p>
          </div>
          <span className="shrink-0 text-[10px] font-bold" style={{ color: "var(--of-gold-600)" }}>⚡ {formatNumber(summaries[member.id]?.poder ?? 0)}</span>
        </div>
        <select className="of-gvg-move" disabled={busy} value={targetKey(current)}
          aria-label={t("Mover {nickname}", { nickname: member.nickname })}
          onChange={event => {
            const value = event.target.value;
            if (value === "available") void assign(member.id, null);
            else {
              const [group, party] = value.split(":");
              void assign(member.id, { group: group as GvgGroup, party: Number(party) });
            }
          }}>
          <option value="available">{t("Disponíveis")}</option>
          {TEAMS.map(team => <optgroup key={team.group} label={t(team.label)}>
            {PARTIES.map(party => {
              const target = { group: team.group, party };
              const count = occupancy(target, member.id);
              return <option key={party} value={targetKey(target)} disabled={count >= PARTY_SIZE}>
                {t("Grupo {number}", { number: party })} · {count + (targetKey(current) === targetKey(target) ? 1 : 0)}/{PARTY_SIZE}
              </option>;
            })}
          </optgroup>)}
        </select>
      </div>
    );
  };

  if (!me) return null;
  const available = membersAt(null);
  const assigned = members.filter(member => assignments[member.id]);

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />
      <main className="of-container pt-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("Escalação de GvG")}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--of-text-soft)" }}>{t("Cada equipe tem 40 vagas: 8 grupos de 5 jogadores.")}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--of-text-muted)" }}>{t("Arraste para um grupo ou use o seletor no card do jogador.")}</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{t(error)}</p>}
        {loading ? <p className="mt-6 text-sm">{t("Carregando...")}</p> : (
          <div className="of-gvg-board mt-6" aria-busy={busy}>
            <aside className={`of-gvg-col of-gvg-available ${over === "available" ? "of-gvg-col--over" : ""}`} {...dropZone(null)}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-xs font-black uppercase tracking-wide">{t("Disponíveis")}</h2>
                <span className="of-gvg-count">{available.length}</span>
              </div>
              <div className="flex flex-col gap-2">{available.map(memberCard)}</div>
              {!available.length && <p className="py-3 text-center text-xs" style={{ color: "var(--of-text-muted)" }}>{t("Todos escalados.")}</p>}
              <div className="of-gvg-return">
                <span aria-hidden="true">↩</span>
                <p>{t("Solte aqui para voltar a Disponíveis")}</p>
              </div>
            </aside>
            {TEAMS.map(team => {
              const list = membersAt(team.group);
              const firstParty = pairs[team.group] * 2 + 1;
              return (
                <section key={team.group} className="of-gvg-team" style={{ borderTopColor: team.color }} aria-label={t(team.label)}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-black uppercase tracking-wide" style={{ color: team.color }}>{t(team.label)}</h2>
                    <span className="of-gvg-count">{list.length}/{TEAM_SIZE}</span>
                  </div>
                  <div className="my-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--of-gold-600)" }}>⚡ {formatNumber(powerOf(list))}</span>
                    {ROLE_ORDER.map(role => {
                      const count = list.filter(m => getClass(m.classId)?.role === role).length;
                      return count ? <span key={role} className="of-mini-pill" style={{ background: ROLE_COLOR[role] }}>{role} {count}</span> : null;
                    })}
                  </div>
                  <div className="of-gvg-tabs" role="group" aria-label={t("Grupos de {team}", { team: t(team.label) })}>
                    {[0, 1, 2, 3].map(pair => {
                      const count = membersAt(team.group, pair * 2 + 1).length + membersAt(team.group, pair * 2 + 2).length;
                      return <button key={pair} type="button" aria-pressed={pairs[team.group] === pair}
                        onClick={() => setPairs(previous => ({ ...previous, [team.group]: pair }))}>
                        {pair * 2 + 1}–{pair * 2 + 2}<span>{count}/10</span>
                      </button>;
                    })}
                  </div>
                  <div className="of-gvg-parties">
                    {[firstParty, firstParty + 1].map(party => {
                      const partyMembers = membersAt(team.group, party);
                      const target = { group: team.group, party };
                      return <section key={party} className={`of-gvg-party ${over === targetKey(target) ? "of-gvg-col--over" : ""}`}
                        aria-label={`${t(team.label)} · ${t("Grupo {number}", { number: party })}`} {...dropZone(target)}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-xs font-extrabold">{t("Grupo {number}", { number: party })}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold" style={{ color: partyMembers.length >= PARTY_SIZE ? team.color : "var(--of-text-muted)" }}>{partyMembers.length}/{PARTY_SIZE}</span>
                            <button type="button" className="of-gvg-clear" disabled={busy || !partyMembers.length}
                              aria-label={t("Limpar Grupo {number} de {team}", { number: party, team: t(team.label) })}
                              onClick={() => void clear(target)}>{t("Limpar")}</button>
                          </div>
                        </div>
                        <p className="mb-3 text-[10px] font-bold" style={{ color: "var(--of-text-soft)" }}>⚡ {formatNumber(powerOf(partyMembers))}</p>
                        <div className="flex flex-col gap-2">
                          {partyMembers.map(memberCard)}
                          {Array.from({ length: Math.max(0, PARTY_SIZE - partyMembers.length) }, (_, index) => (
                            <div key={`empty-${index}`} className="of-gvg-empty"><span aria-hidden="true">＋</span>{t("Vaga {number}", { number: partyMembers.length + index + 1 })}</div>
                          ))}
                        </div>
                      </section>;
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        {!loading && <p className="mt-5 text-xs" style={{ color: "var(--of-text-soft)" }}>{t("Poder total escalado (Elite + Secundária):")} <b style={{ color: "var(--of-gold-600)" }}>{formatNumber(powerOf(assigned))}</b></p>}
      </main>
    </div>
  );
}
