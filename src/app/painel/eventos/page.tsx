"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PanelTopbar } from "@/components/PanelTopbar";
import {
  eventsRepo,
  type Attendance,
  type EventType,
  type GuildEvent,
} from "@/lib/events";
import { membersRepo, type PublicMember } from "@/lib/members";
import { canLead } from "@/lib/permissions";
import { getSession } from "@/lib/session";

const EVENT_TYPES: EventType[] = ["WoE", "GvG", "MVP", "Outro"];
const TYPE_COLOR: Record<EventType, string> = {
  WoE: "#8e4ec6",
  GvG: "#2f6bff",
  MVP: "#e0a73a",
  Outro: "#8fa0bd",
};
const ATT_OPTIONS: { value: Attendance; label: string; color: string }[] = [
  { value: "vou", label: "Vou", color: "#30a46c" },
  { value: "talvez", label: "Talvez", color: "#e0a73a" },
  { value: "nao", label: "Não vou", color: "#e5484d" },
];

export default function EventsPage() {
  const router = useRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [events, setEvents] = useState<GuildEvent[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, Record<string, Attendance>>
  >({});
  const [loading, setLoading] = useState(true);

  // formulário de criação
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("WoE");
  const [startsAt, setStartsAt] = useState("");
  const [notes, setNotes] = useState("");

  const reload = async () => {
    const evs = await eventsRepo.list();
    setEvents(evs);
    const att: Record<string, Record<string, Attendance>> = {};
    for (const e of evs) att[e.id] = await eventsRepo.getAttendance(e.id);
    setAttendance(att);
  };

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setMe(session);
    Promise.all([membersRepo.list(), reload()])
      .then(([list]) => setMembers(list))
      .finally(() => setLoading(false));
  }, [router]);

  const nameOf = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) map[m.id] = m.nickname;
    return map;
  }, [members]);

  if (!me) return null;
  const manager = canLead(me.guildRole);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startsAt) return;
    await eventsRepo.create({
      title,
      type,
      startsAt: new Date(startsAt).toISOString(),
      notes,
      createdBy: me.id,
    });
    setTitle("");
    setNotes("");
    setStartsAt("");
    setType("WoE");
    await reload();
  };

  const handleDelete = async (id: string) => {
    await eventsRepo.remove(id);
    await reload();
  };

  const setMyAttendance = async (eventId: string, status: Attendance) => {
    await eventsRepo.setAttendance(eventId, me.id, status);
    setAttendance((prev) => ({
      ...prev,
      [eventId]: { ...(prev[eventId] ?? {}), [me.id]: status },
    }));
  };

  const countsOf = (eventId: string) => {
    const map = attendance[eventId] ?? {};
    const c = { vou: 0, talvez: 0, nao: 0 };
    for (const s of Object.values(map)) c[s] += 1;
    return c;
  };

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />

      <main className="of-container pt-7">
        <h1
          className="text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{ color: "var(--of-text)" }}
        >
          Eventos da Guild
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--of-text-soft)" }}>
          WoE, GvG, MVPs e mais. Confirme sua presença.
        </p>

        {/* Criação (apenas oficiais/líderes) */}
        {manager && (
          <form onSubmit={handleCreate} className="of-section mt-6 p-5">
            <h2 className="of-label mb-4" style={{ color: "var(--of-primary)" }}>
              Criar evento
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="of-label mb-2 block">Título</label>
                <input
                  className="of-input"
                  placeholder="Ex: WoE de Terça"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="of-label mb-2 block">Tipo</label>
                <div className="relative">
                  <select
                    className="of-input of-select cursor-pointer pr-9"
                    value={type}
                    onChange={(e) => setType(e.target.value as EventType)}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="of-select-arrow" aria-hidden>
                    ▾
                  </span>
                </div>
              </div>
              <div>
                <label className="of-label mb-2 block">Data e hora</label>
                <input
                  type="datetime-local"
                  className="of-input"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div>
                <label className="of-label mb-2 block">Observações</label>
                <input
                  className="of-input"
                  placeholder="Ponto de encontro, requisitos..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="of-cta mt-4"
              style={{ width: "auto" }}
              disabled={!title.trim() || !startsAt}
            >
              Criar evento
            </button>
          </form>
        )}

        {/* Lista de eventos */}
        <section className="mt-6 flex flex-col gap-4">
          {loading ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>
              Carregando...
            </p>
          ) : events.length === 0 ? (
            <div className="of-section p-6 text-center">
              <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>
                Nenhum evento agendado.
                {manager ? " Crie o primeiro acima! 👆" : ""}
              </p>
            </div>
          ) : (
            events.map((ev) => {
              const counts = countsOf(ev.id);
              const myStatus = attendance[ev.id]?.[me.id];
              const past = new Date(ev.startsAt).getTime() < Date.now();
              const goers = Object.entries(attendance[ev.id] ?? {})
                .filter(([, s]) => s === "vou")
                .map(([id]) => nameOf[id] ?? "?");
              return (
                <div
                  key={ev.id}
                  className="of-section p-5"
                  style={{ opacity: past ? 0.7 : 1 }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="of-role-pill"
                          style={{ background: TYPE_COLOR[ev.type] }}
                        >
                          {ev.type}
                        </span>
                        {past && (
                          <span
                            className="text-[11px] font-bold uppercase"
                            style={{ color: "var(--of-text-muted)" }}
                          >
                            Encerrado
                          </span>
                        )}
                      </div>
                      <h3
                        className="mt-1.5 text-lg font-bold"
                        style={{ color: "var(--of-text)" }}
                      >
                        {ev.title}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "var(--of-text-soft)" }}
                      >
                        🕒{" "}
                        {new Date(ev.startsAt).toLocaleString("pt-BR", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </p>
                      {ev.notes && (
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--of-text-muted)" }}
                        >
                          {ev.notes}
                        </p>
                      )}
                    </div>
                    {manager && (
                      <button
                        className="of-btn-ghost"
                        onClick={() => handleDelete(ev.id)}
                      >
                        Excluir
                      </button>
                    )}
                  </div>

                  {/* Presença */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: "var(--of-text-soft)" }}
                    >
                      Sua presença:
                    </span>
                    {ATT_OPTIONS.map((opt) => {
                      const active = myStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          className="of-chip"
                          style={
                            active
                              ? {
                                  background: opt.color,
                                  borderColor: opt.color,
                                  color: "#fff",
                                }
                              : undefined
                          }
                          onClick={() => setMyAttendance(ev.id, opt.value)}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Contagem */}
                  <div
                    className="mt-3 flex flex-wrap gap-4 text-xs"
                    style={{ color: "var(--of-text-soft)" }}
                  >
                    <span>
                      ✅ <b>{counts.vou}</b> vão
                    </span>
                    <span>
                      ❓ <b>{counts.talvez}</b> talvez
                    </span>
                    <span>
                      ❌ <b>{counts.nao}</b> não vão
                    </span>
                  </div>
                  {goers.length > 0 && (
                    <p
                      className="mt-2 text-xs"
                      style={{ color: "var(--of-text-muted)" }}
                    >
                      Confirmados: {goers.join(", ")}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
