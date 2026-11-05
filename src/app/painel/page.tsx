"use client";

import { useLanguage } from "@/components/LanguageProvider";

import { useLoadingRouter as useRouter, PageLoading, LoadingIndicator } from "@/components/LoadingProvider";
import { useEffect, useMemo, useState } from "react";
import { ClassIcon } from "@/components/ClassIcon";
import { PanelTopbar } from "@/components/PanelTopbar";
import { getClass, ROLE_COLOR, type Role } from "@/data/classes";
import { GUILD_ROLE_INFO } from "@/data/roles";
import {
  characterRepo,
  type CharacterSummary,
} from "@/lib/character";
import { type PublicMember } from "@/lib/members";
import { membersRepo } from "@/lib/members";
import { getSession } from "@/lib/session";

const ROLE_ORDER: Role[] = ["DPS", "SUP", "MDPS", "TANK"];
const ROLE_LABEL: Record<Role, string> = {
  DPS: "DPS",
  SUP: "Suporte",
  MDPS: "Magic DPS",
  TANK: "Tank",
};

export default function PanelPage() {
  const { t, formatNumber: formatValue } = useLanguage();
  const router = useRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [summaries, setSummaries] = useState<Record<string, CharacterSummary>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setMe(session);
    Promise.all([membersRepo.list(), characterRepo.summaries()])
      .then(([list, sums]) => {
        setMembers(list);
        setSummaries(sums);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const approved = useMemo(
    () => members.filter((m) => m.status === "aprovado"),
    [members]
  );

  const stats = useMemo(() => {
    const byRole: Record<Role, number> = { DPS: 0, SUP: 0, MDPS: 0, TANK: 0 };
    let poderTotal = 0;
    for (const m of approved) {
      const role = getClass(m.classId)?.role;
      if (role) byRole[role] += 1;
      poderTotal += summaries[m.id]?.poder ?? 0;
    }
    return { total: approved.length, byRole, poderTotal };
  }, [approved, summaries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approved
      .filter((m) => {
        const cls = getClass(m.classId);
        const matchRole = roleFilter === "ALL" || cls?.role === roleFilter;
        const matchSearch =
          !q ||
          m.nickname.toLowerCase().includes(q) ||
          (cls?.name.toLowerCase().includes(q) ?? false);
        return matchRole && matchSearch;
      })
      .sort(
        (a, b) => (summaries[b.id]?.poder ?? 0) - (summaries[a.id]?.poder ?? 0)
      );
  }, [approved, search, roleFilter, summaries]);

  if (!me) return <PageLoading />;

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />

      <main className="of-container pt-7">
        <h1
          className="text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{ color: "var(--of-text)" }}
        >{t("Bem-vindo,")} {me.nickname}! 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--of-text-soft)" }}>{t("Visão geral e roster do clã Orion Force.")} </p>

        {/* Estatísticas */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="of-tile">
            <div className="of-tile-value">{stats.total}</div>
            <div className="of-tile-label">{t("Membros")}</div>
          </div>
          {ROLE_ORDER.map((role) => (
            <div key={role} className="of-tile">
              <div className="of-tile-value" style={{ color: ROLE_COLOR[role] }}>
                {stats.byRole[role]}
              </div>
              <div className="of-tile-label">{t(ROLE_LABEL[role])}</div>
            </div>
          ))}
          <div className="of-tile">
            <div
              className="of-tile-value"
              style={{ color: "var(--of-gold)", fontSize: "1.4rem" }}
            >
              {formatValue(stats.poderTotal)}
            </div>
            <div className="of-tile-label">{t("Poder total")}</div>
          </div>
        </section>

        {/* Composição */}
        <section className="of-section mt-6 p-5">
          <h2 className="of-label mb-4" style={{ color: "var(--of-primary)" }}>{t("Composição do clã")} </h2>
          {stats.total === 0 ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>{t("Ninguém cadastrado ainda.")} </p>
          ) : (
            <div className="flex flex-col gap-3">
              {ROLE_ORDER.map((role) => {
                const count = stats.byRole[role];
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={role}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span
                        className="font-bold"
                        style={{ color: "var(--of-text)" }}
                      >
                        {t(ROLE_LABEL[role])}
                      </span>
                      <span style={{ color: "var(--of-text-soft)" }}>
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="of-bar-track">
                      <div
                        className="of-bar-fill"
                        style={{ width: `${pct}%`, background: ROLE_COLOR[role] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Roster */}
        <section className="of-section mt-6 p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="of-label" style={{ color: "var(--of-primary)" }}>{t("Roster (")}{filtered.length})
            </h2>
            <input
              className="of-input sm:max-w-[260px]"
              placeholder={t("Buscar por nick ou classe...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              className={`of-chip ${roleFilter === "ALL" ? "of-chip--active" : ""}`}
              onClick={() => setRoleFilter("ALL")}
            >{t("Todos")} </button>
            {ROLE_ORDER.map((role) => (
              <button
                key={role}
                className={`of-chip ${roleFilter === role ? "of-chip--active" : ""}`}
                onClick={() => setRoleFilter(role)}
              >
                {t(ROLE_LABEL[role])}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}><LoadingIndicator /> </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>{t("Nenhum membro encontrado.")} </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => {
                const cls = getClass(m.classId);
                const roleInfo = GUILD_ROLE_INFO[m.guildRole];
                const poder = summaries[m.id]?.poder ?? 0;
                return (
                  <div key={m.id} className="of-member">
                    {cls && <ClassIcon gameClass={cls} size={46} />}
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
                      {poder > 0 && (
                        <p
                          className="mt-0.5 text-xs font-bold"
                          style={{ color: "var(--of-gold)" }}
                        >
                          ⚡ {formatValue(poder)}
                        </p>
                      )}
                      {m.discord && (
                        <p
                          className="truncate text-xs"
                          style={{ color: "#5865F2" }}
                        >
                          🎮 {m.discord}
                        </p>
                      )}
                    </div>
                    <span
                      className="of-role-pill shrink-0"
                      style={{ background: roleInfo.color }}
                    >
                      {t(roleInfo.label)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
