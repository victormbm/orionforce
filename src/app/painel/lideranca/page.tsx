"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassIcon } from "@/components/ClassIcon";
import { PanelTopbar } from "@/components/PanelTopbar";
import { getClass } from "@/data/classes";
import { GUILD_ROLE_INFO } from "@/data/roles";
import { membersRepo, type GuildRole, type PublicMember } from "@/lib/members";
import { canManage } from "@/lib/permissions";
import { getSession } from "@/lib/session";

const ROLE_ORDER: GuildRole[] = ["recruta", "membro", "oficial", "lider"];

export default function LeadershipPage() {
  const router = useRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => membersRepo.list().then(setMembers);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    if (!canManage(session.guildRole)) {
      router.replace("/painel");
      return;
    }
    setMe(session);
    reload().finally(() => setLoading(false));
  }, [router]);

  if (!me) return null;

  const changeRole = async (id: string, role: GuildRole) => {
    await membersRepo.setGuildRole(id, role);
    await reload();
  };

  const approve = async (id: string) => {
    await membersRepo.setStatus(id, "aprovado");
    await reload();
  };

  const remove = async (id: string, nickname: string) => {
    if (!confirm(`Remover ${nickname} da guild?`)) return;
    await membersRepo.remove(id);
    await reload();
  };

  const resetPin = async (id: string, nickname: string) => {
    if (!confirm(`Resetar o PIN de ${nickname}?`)) return;
    try {
      const pin = await membersRepo.resetPin(id);
      alert(
        `PIN de ${nickname} resetado para: ${pin}\n\nPasse esse PIN temporário para a pessoa. Ela pode trocar depois em "Meu Personagem".`
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao resetar o PIN.");
    }
  };

  const pendings = members.filter((m) => m.status === "pendente");
  const approved = members.filter((m) => m.status === "aprovado");

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />

      <main className="of-container pt-7">
        <h1
          className="text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{ color: "var(--of-text)" }}
        >
          Área da Liderança
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--of-text-soft)" }}>
          Aprove cadastros, gerencie cargos e o quadro de membros.
        </p>

        {/* Cadastros pendentes de aprovação */}
        <section className="of-section mt-6 p-5">
          <h2 className="of-label mb-4" style={{ color: "var(--of-gold)" }}>
            Cadastros pendentes ({pendings.length})
          </h2>
          {loading ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>
              Carregando...
            </p>
          ) : pendings.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>
              Nenhum cadastro aguardando aprovação. 🎉
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendings.map((m) => {
                const cls = getClass(m.classId);
                return (
                  <div key={m.id} className="of-member">
                    {cls && <ClassIcon gameClass={cls} size={44} />}
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
                      </p>
                      <div className="mt-1.5 flex gap-2">
                        <button
                          className="of-btn-ghost"
                          style={{
                            borderColor: "#30a46c",
                            color: "#30a46c",
                          }}
                          onClick={() => approve(m.id)}
                        >
                          Aprovar
                        </button>
                        <button
                          className="of-btn-ghost"
                          style={{ borderColor: "#e5484d", color: "#e5484d" }}
                          onClick={() => remove(m.id, m.nickname)}
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quadro de membros aprovados */}
        <section className="of-section mt-6 p-5">
          <h2 className="of-label mb-4" style={{ color: "var(--of-primary)" }}>
            Quadro de membros ({approved.length})
          </h2>
          <div className="flex flex-col gap-3">
            {approved.map((m) => {
              const cls = getClass(m.classId);
              const isSelf = m.id === me.id;
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: "var(--of-border)" }}
                >
                  {cls && <ClassIcon gameClass={cls} size={42} />}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-bold"
                      style={{ color: "var(--of-text)" }}
                    >
                      {m.nickname}
                      {isSelf && (
                        <span
                          className="ml-2 text-[11px] font-normal"
                          style={{ color: "var(--of-text-muted)" }}
                        >
                          (você)
                        </span>
                      )}
                    </p>
                    <p
                      className="truncate text-xs"
                      style={{ color: "var(--of-text-soft)" }}
                    >
                      {cls?.name ?? m.classId}
                    </p>
                  </div>

                  <div className="relative">
                    <select
                      className="of-input of-select cursor-pointer pr-8 text-sm"
                      style={{ padding: "0.5rem 2rem 0.5rem 0.7rem" }}
                      value={m.guildRole}
                      disabled={isSelf}
                      onChange={(e) =>
                        changeRole(m.id, e.target.value as GuildRole)
                      }
                    >
                      {ROLE_ORDER.map((r) => (
                        <option key={r} value={r}>
                          {GUILD_ROLE_INFO[r].label}
                        </option>
                      ))}
                    </select>
                    <span className="of-select-arrow" aria-hidden>
                      ▾
                    </span>
                  </div>

                  {!isSelf && (
                    <button
                      className="of-btn-ghost shrink-0"
                      onClick={() => resetPin(m.id, m.nickname)}
                    >
                      Resetar PIN
                    </button>
                  )}
                  <button
                    className="of-btn-ghost shrink-0"
                    style={{ borderColor: "#e5484d", color: "#e5484d" }}
                    disabled={isSelf}
                    onClick={() => remove(m.id, m.nickname)}
                  >
                    Remover
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
